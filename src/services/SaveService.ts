import type { ActivityLogEntry, GameState } from "../types";

/**
 * SaveService — the persistence boundary between game logic and storage.
 *
 * The whole game reads and writes state exclusively through this interface.
 * Today it is backed by localStorage (LocalStorageSaveService) with an
 * in-memory fallback (InMemorySaveService) for private-browsing modes and
 * tests. Swapping in a real backend later means writing one new class
 * (e.g. RestSaveService hitting GET/PUT /users/:id/state and
 * POST /users/:id/activities) and changing one line in services/index.ts.
 * No game logic or UI component touches the storage mechanism directly.
 *
 * All methods are async even though the local implementations are
 * synchronous under the hood — that keeps call sites ready for network
 * latency and failure handling from day one.
 */
export interface SaveService {
  /** Load the persisted state for a user, or null when none exists yet. */
  getState(userId: string): Promise<GameState | null>;

  /** Persist the full state blob. Last write wins. */
  setState(state: GameState): Promise<void>;

  /**
   * Append one activity to the durable, append-only activity stream.
   * GameState also carries a capped rolling window of recent entries for
   * the UI; this stream is the full record a backend would ingest for
   * analytics, streak validation, and (later) anti-abuse review.
   */
  logActivity(entry: ActivityLogEntry): Promise<void>;

  /** Read back the full activity stream (most recent last). */
  getActivityLog(userId: string): Promise<ActivityLogEntry[]>;

  /** Wipe everything for a user (the "reset save" debug action). */
  reset(userId: string): Promise<void>;
}
