import { create } from "zustand";
import { saveService } from "../services";
import {
  CUSTOM_TASK_MAX_SPARKS,
  CUSTOM_TASK_XP,
  WORLDS,
  breathingReward,
  exerciseReward,
  journalReward,
  levelForXp,
  mealReward,
  meditationReward,
  nextMealStreak,
} from "../game/economy";
import catalogData from "../data/catalog.json";
import premiumData from "../data/premium.json";
import {
  SCHEMA_VERSION,
  type ActivityKind,
  type ActivityLogEntry,
  type CatalogItem,
  type CustomTask,
  type GameState,
  type ItemSlot,
  type PremiumBundle,
  type PremiumItem,
} from "../types";

export const CATALOG = catalogData as CatalogItem[];
export const PREMIUM_ITEMS = (premiumData as { items: PremiumItem[] }).items;
export const PREMIUM_BUNDLES = (premiumData as { bundles: PremiumBundle[] })
  .bundles;

const LOCAL_USER_ID = "local-user";

/** Rolling window of activity kept inside GameState for the UI. The full
 *  stream is persisted separately via saveService.logActivity(). */
const RECENT_LOG_CAP = 100;

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function freshState(now = Date.now()): GameState {
  return {
    schemaVersion: SCHEMA_VERSION,
    userId: LOCAL_USER_ID,
    createdAt: now,
    updatedAt: now,
    sparks: 0,
    xp: 0,
    inventory: [],
    premiumPurchases: [],
    unlockedWorlds: ["cozy-cabin"],
    activeWorld: "cozy-cabin",
    placements: {},
    avatar: {
      name: "You",
      skinTone: "#e8b98a",
      hairColor: "#4a3728",
      equipped: { top: null, hat: null, accessory: null },
    },
    subscription: { active: false, renewsAt: null, startedAt: null },
    customTasks: [],
    activityLog: [],
    mealStreak: { lastDate: null, days: 0 },
  };
}

/** Versioned-migration hook. When SCHEMA_VERSION bumps, add a step here
 *  (the same steps would run server-side against a real DB later). */
function migrate(state: GameState): GameState {
  if (state.schemaVersion === SCHEMA_VERSION) return state;
  // e.g. if (state.schemaVersion === 1) { ...transform...; state.schemaVersion = 2; }
  return { ...state, schemaVersion: SCHEMA_VERSION };
}

interface GameStore {
  state: GameState;
  loaded: boolean;

  init: () => Promise<void>;

  completeMeditation: (minutes: number) => void;
  completeBreathing: (sets: number) => void;
  logMeal: (description: string, category: string) => void;
  logExercise: (type: string, minutes: number) => void;
  addJournalEntry: (
    kind: "gratitude" | "worry",
    text: string,
    reframe?: string
  ) => void;
  completeCustomTask: (taskId: string) => void;

  buyItem: (itemId: string) => boolean;
  mockPurchaseItem: (sku: string) => void;
  mockPurchaseBundle: (sku: string) => void;

  unlockWorld: (worldId: string) => void;
  setActiveWorld: (worldId: string) => void;
  togglePlacement: (worldId: string, itemId: string) => void;

  setAvatarName: (name: string) => void;
  setAvatarColors: (skinTone: string, hairColor: string) => void;
  equip: (slot: ItemSlot, itemId: string | null) => void;

  subscribe: () => void;
  cancelSubscription: () => void;
  addCustomTask: (
    name: string,
    description: string,
    minutes: number | null,
    sparks: number
  ) => void;
  deleteCustomTask: (taskId: string) => void;

  grantDemoResources: () => void;
  resetSave: () => Promise<void>;
}

export const useGame = create<GameStore>((set, get) => {
  /** Apply a state transform, stamp updatedAt, persist via SaveService. */
  function update(fn: (s: GameState) => GameState) {
    const next = { ...fn(get().state), updatedAt: Date.now() };
    set({ state: next });
    void saveService.setState(next);
  }

  /** Award a completed activity: currency + XP + both activity logs. */
  function award(
    kind: ActivityKind,
    label: string,
    sparks: number,
    xp: number,
    meta?: Record<string, unknown>
  ) {
    const entry: ActivityLogEntry = {
      id: uid(),
      userId: get().state.userId,
      kind,
      label,
      sparks,
      xp,
      at: Date.now(),
      meta,
    };
    void saveService.logActivity(entry);
    update((s) => ({
      ...s,
      sparks: s.sparks + sparks,
      xp: s.xp + xp,
      activityLog: [...s.activityLog, entry].slice(-RECENT_LOG_CAP),
    }));
  }

  return {
    state: freshState(),
    loaded: false,

    init: async () => {
      const persisted = await saveService.getState(LOCAL_USER_ID);
      const state = persisted ? migrate(persisted) : freshState();
      if (!persisted) await saveService.setState(state);
      set({ state, loaded: true });
    },

    completeMeditation: (minutes) => {
      const { sparks, xp } = meditationReward(minutes);
      award("meditation", `${Math.round(minutes)}-min meditation`, sparks, xp, {
        minutes,
      });
    },

    completeBreathing: (sets) => {
      const { sparks, xp } = breathingReward(sets);
      award(
        "breathing",
        `Breathing: ${sets} ${sets === 1 ? "set" : "sets"}`,
        sparks,
        xp,
        { sets }
      );
    },

    logMeal: (description, category) => {
      const now = Date.now();
      const streak = nextMealStreak(get().state.mealStreak, now);
      const { sparks, xp } = mealReward(streak.days);
      update((s) => ({ ...s, mealStreak: streak }));
      award("meal", `Meal: ${category}`, sparks, xp, {
        description,
        category,
        streakDays: streak.days,
      });
    },

    logExercise: (type, minutes) => {
      const { sparks, xp } = exerciseReward(minutes);
      award("exercise", `${type} · ${Math.round(minutes)} min`, sparks, xp, {
        type,
        minutes,
      });
    },

    addJournalEntry: (kind, text, reframe) => {
      const { sparks, xp } = journalReward();
      award(
        kind,
        kind === "gratitude" ? "Gratitude entry" : "Worry entry",
        sparks,
        xp,
        { text, reframe }
      );
    },

    completeCustomTask: (taskId) => {
      const task = get().state.customTasks.find((t) => t.id === taskId);
      if (!task) return;
      // Player-set Spark payout, but standardized XP (see DECISIONS.md).
      award("custom", task.name, task.sparks, CUSTOM_TASK_XP, { taskId });
    },

    buyItem: (itemId) => {
      const s = get().state;
      const item = CATALOG.find((i) => i.id === itemId);
      if (!item || s.inventory.includes(itemId) || s.sparks < item.sparks) {
        return false;
      }
      update((st) => ({
        ...st,
        sparks: st.sparks - item.sparks,
        inventory: [...st.inventory, itemId],
      }));
      return true;
    },

    mockPurchaseItem: (sku) => {
      const item = PREMIUM_ITEMS.find((i) => i.id === sku);
      const s = get().state;
      if (!item || s.inventory.includes(sku)) return;
      update((st) => ({
        ...st,
        inventory: [...st.inventory, sku],
        premiumPurchases: [
          ...st.premiumPurchases,
          { id: uid(), sku, usdCents: item.usdCents, at: Date.now() },
        ],
      }));
    },

    mockPurchaseBundle: (sku) => {
      const bundle = PREMIUM_BUNDLES.find((b) => b.id === sku);
      if (!bundle) return;
      update((st) => ({
        ...st,
        inventory: [
          ...st.inventory,
          ...bundle.itemIds.filter((id) => !st.inventory.includes(id)),
        ],
        premiumPurchases: [
          ...st.premiumPurchases,
          { id: uid(), sku, usdCents: bundle.usdCents, at: Date.now() },
        ],
      }));
    },

    unlockWorld: (worldId) => {
      const world = WORLDS.find((w) => w.id === worldId);
      const s = get().state;
      if (
        !world ||
        s.unlockedWorlds.includes(worldId) ||
        levelForXp(s.xp) < world.requiredLevel
      ) {
        return;
      }
      update((st) => ({
        ...st,
        unlockedWorlds: [...st.unlockedWorlds, worldId],
        activeWorld: worldId,
      }));
    },

    setActiveWorld: (worldId) => {
      if (!get().state.unlockedWorlds.includes(worldId)) return;
      update((st) => ({ ...st, activeWorld: worldId }));
    },

    togglePlacement: (worldId, itemId) => {
      update((st) => {
        const placed = st.placements[worldId] ?? [];
        const world = WORLDS.find((w) => w.id === worldId);
        const maxSlots = world ? world.slots.length : 6;
        const next = placed.includes(itemId)
          ? placed.filter((id) => id !== itemId)
          : placed.length < maxSlots
            ? [...placed, itemId]
            : placed;
        return { ...st, placements: { ...st.placements, [worldId]: next } };
      });
    },

    setAvatarName: (name) => {
      update((st) => ({ ...st, avatar: { ...st.avatar, name } }));
    },

    setAvatarColors: (skinTone, hairColor) => {
      update((st) => ({ ...st, avatar: { ...st.avatar, skinTone, hairColor } }));
    },

    equip: (slot, itemId) => {
      if (itemId !== null && !get().state.inventory.includes(itemId)) return;
      update((st) => ({
        ...st,
        avatar: {
          ...st.avatar,
          equipped: { ...st.avatar.equipped, [slot]: itemId },
        },
      }));
    },

    subscribe: () => {
      const now = Date.now();
      update((st) => ({
        ...st,
        subscription: {
          active: true,
          startedAt: now,
          renewsAt: now + 30 * 24 * 60 * 60 * 1000,
        },
      }));
    },

    cancelSubscription: () => {
      // Existing custom tasks are kept but gated until re-subscribing.
      update((st) => ({
        ...st,
        subscription: { ...st.subscription, active: false, renewsAt: null },
      }));
    },

    addCustomTask: (name, description, minutes, sparks) => {
      if (!get().state.subscription.active) return;
      const task: CustomTask = {
        id: uid(),
        name: name.trim(),
        description: description.trim(),
        minutes,
        sparks: Math.max(1, Math.min(CUSTOM_TASK_MAX_SPARKS, Math.round(sparks))),
        createdAt: Date.now(),
      };
      if (!task.name) return;
      update((st) => ({ ...st, customTasks: [...st.customTasks, task] }));
    },

    deleteCustomTask: (taskId) => {
      update((st) => ({
        ...st,
        customTasks: st.customTasks.filter((t) => t.id !== taskId),
      }));
    },

    grantDemoResources: () => {
      update((st) => ({ ...st, sparks: st.sparks + 100, xp: st.xp + 100 }));
    },

    resetSave: async () => {
      await saveService.reset(LOCAL_USER_ID);
      const state = freshState();
      await saveService.setState(state);
      set({ state });
    },
  };
});
