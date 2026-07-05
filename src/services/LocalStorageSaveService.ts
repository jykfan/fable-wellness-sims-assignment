import type { ActivityLogEntry, GameState } from "../types";
import type { SaveService } from "./SaveService";

const STATE_KEY = (userId: string) => `thriveworld:v1:state:${userId}`;
const LOG_KEY = (userId: string) => `thriveworld:v1:log:${userId}`;

/** Cap the durable log in localStorage so we never hit quota. A real
 *  backend keeps the full stream; 1000 entries is plenty for a prototype. */
const MAX_LOG_ENTRIES = 1000;

export class LocalStorageSaveService implements SaveService {
  async getState(userId: string): Promise<GameState | null> {
    const raw = localStorage.getItem(STATE_KEY(userId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GameState;
    } catch {
      // Corrupt save: treat as missing rather than crashing the app.
      return null;
    }
  }

  async setState(state: GameState): Promise<void> {
    localStorage.setItem(STATE_KEY(state.userId), JSON.stringify(state));
  }

  async logActivity(entry: ActivityLogEntry): Promise<void> {
    const log = await this.getActivityLog(entry.userId);
    log.push(entry);
    const trimmed = log.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(LOG_KEY(entry.userId), JSON.stringify(trimmed));
  }

  async getActivityLog(userId: string): Promise<ActivityLogEntry[]> {
    const raw = localStorage.getItem(LOG_KEY(userId));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ActivityLogEntry[];
    } catch {
      return [];
    }
  }

  async reset(userId: string): Promise<void> {
    localStorage.removeItem(STATE_KEY(userId));
    localStorage.removeItem(LOG_KEY(userId));
  }
}
