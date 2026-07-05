import type { SaveService } from "./SaveService";
import { LocalStorageSaveService } from "./LocalStorageSaveService";
import { InMemorySaveService } from "./InMemorySaveService";

function storageAvailable(): boolean {
  try {
    const probe = "__thriveworld_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * The single place the storage backend is chosen. To move to a real
 * backend, export `new RestSaveService(apiBaseUrl)` here instead.
 */
export const saveService: SaveService = storageAvailable()
  ? new LocalStorageSaveService()
  : new InMemorySaveService();

export type { SaveService } from "./SaveService";
