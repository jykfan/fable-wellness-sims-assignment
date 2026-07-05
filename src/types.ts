// ---------------------------------------------------------------------------
// Core data model. Everything the game persists lives in a single
// serializable GameState blob (see spec §3). Keep this file free of any
// browser APIs so it can be shared verbatim with a future backend.
// ---------------------------------------------------------------------------

export const SCHEMA_VERSION = 1;

export type ActivityKind =
  | "meditation"
  | "breathing"
  | "meal"
  | "exercise"
  | "gratitude"
  | "worry"
  | "custom";

export interface ActivityLogEntry {
  id: string;
  userId: string;
  kind: ActivityKind;
  /** Human-readable label, e.g. "6-min meditation" or a custom task name. */
  label: string;
  sparks: number;
  xp: number;
  /** Epoch millis. */
  at: number;
  /** Kind-specific payload (journal text, meal category, duration, ...). */
  meta?: Record<string, unknown>;
}

export interface CustomTask {
  id: string;
  name: string;
  description: string;
  /** Suggested duration in minutes; informational only. */
  minutes: number | null;
  /** Self-assigned payout, clamped to CUSTOM_TASK_MAX_SPARKS at creation. */
  sparks: number;
  createdAt: number;
}

export interface AvatarState {
  name: string;
  skinTone: string;
  hairColor: string;
  /** Item ids from the catalog, keyed by cosmetic slot. null = default look. */
  equipped: {
    top: string | null;
    hat: string | null;
    accessory: string | null;
  };
}

export interface SubscriptionState {
  active: boolean;
  /** Epoch millis of the (mock) next renewal, when active. */
  renewsAt: number | null;
  startedAt: number | null;
}

export interface MockPurchaseRecord {
  id: string;
  /** Premium item or bundle id. */
  sku: string;
  usdCents: number;
  at: number;
}

export interface GameState {
  schemaVersion: number;
  /** Single local user for now; real accounts swap this for a server id. */
  userId: string;
  createdAt: number;
  updatedAt: number;

  sparks: number;
  xp: number;

  /** Owned catalog item ids (both spark-bought and premium). */
  inventory: string[];
  /** Premium item/bundle ids acquired via mocked real-money checkout. */
  premiumPurchases: MockPurchaseRecord[];
  /** World ids the player has claimed after reaching the required level. */
  unlockedWorlds: string[];
  activeWorld: string;
  /** Per-world decor placement: ordered item ids filling that world's slots. */
  placements: Record<string, string[]>;

  avatar: AvatarState;
  subscription: SubscriptionState;
  customTasks: CustomTask[];

  /** Rolling window of recent activity (full stream lives in SaveService). */
  activityLog: ActivityLogEntry[];

  /** ISO date (YYYY-MM-DD) of the last meal log + current streak length. */
  mealStreak: { lastDate: string | null; days: number };
}

// --- Catalog shapes (loaded from editable JSON in src/data) ---------------

export type ItemSlot = "top" | "hat" | "accessory";

export interface CatalogItem {
  id: string;
  name: string;
  emoji: string;
  category: "decor" | "clothing" | "upgrade";
  /** Present for clothing so the avatar knows where it goes. */
  slot?: ItemSlot;
  /** For "top" clothing: the shirt color painted onto the avatar. */
  color?: string;
  /** Price in Sparks (earned currency). */
  sparks: number;
  description: string;
}

export interface PremiumItem {
  id: string;
  name: string;
  emoji: string;
  category: "decor" | "clothing" | "upgrade";
  slot?: ItemSlot;
  color?: string;
  usdCents: number;
  description: string;
}

export interface PremiumBundle {
  id: string;
  name: string;
  usdCents: number;
  itemIds: string[];
  description: string;
}

export interface WorldDef {
  id: string;
  name: string;
  emoji: string;
  /** Player level required before the world can be unlocked. */
  requiredLevel: number;
  /** CSS gradient for the scene backdrop. */
  sky: string;
  ground: string;
  /** Decor slot positions, percentages within the scene. */
  slots: { x: number; y: number }[];
  description: string;
}

export interface DefaultTaskDef {
  id: string;
  kind: Exclude<ActivityKind, "custom">;
  name: string;
  emoji: string;
  blurb: string;
}
