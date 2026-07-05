import type { ActivityLogEntry, GameState } from "../types";
import type { SaveService } from "./SaveService";

/**
 * Volatile fallback used when localStorage is unavailable (private
 * browsing, storage disabled) and handy for tests. State lives for the
 * duration of the page session only.
 */
export class InMemorySaveService implements SaveService {
  private states = new Map<string, GameState>();
  private logs = new Map<string, ActivityLogEntry[]>();

  async getState(userId: string): Promise<GameState | null> {
    return this.states.get(userId) ?? null;
  }

  async setState(state: GameState): Promise<void> {
    this.states.set(state.userId, state);
  }

  async logActivity(entry: ActivityLogEntry): Promise<void> {
    const log = this.logs.get(entry.userId) ?? [];
    log.push(entry);
    this.logs.set(entry.userId, log);
  }

  async getActivityLog(userId: string): Promise<ActivityLogEntry[]> {
    return this.logs.get(userId) ?? [];
  }

  async reset(userId: string): Promise<void> {
    this.states.delete(userId);
    this.logs.delete(userId);
  }
}
