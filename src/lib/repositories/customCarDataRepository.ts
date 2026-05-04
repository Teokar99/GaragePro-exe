import { invoke } from "@tauri-apps/api/tauri";

export interface CustomCarEntry {
  id: string;
  make: string;
  model: string | null;
  created_at: string;
}

export const customCarDataRepository = {
  async getAllCustomMakes(): Promise<string[]> {
    return invoke<string[]>("get_all_custom_makes");
  },

  async getCustomModelsForMake(make: string): Promise<string[]> {
    return invoke<string[]>("get_custom_models_for_make", { make });
  },

  async addCustomEntry(make: string, model?: string | null): Promise<CustomCarEntry> {
    return invoke<CustomCarEntry>("add_custom_entry", {
      make,
      model: model ?? null,
    });
  },

  async listAllCustomEntries(): Promise<CustomCarEntry[]> {
    return invoke<CustomCarEntry[]>("list_all_custom_entries");
  },

  async deleteCustomEntry(id: string): Promise<void> {
    return invoke<void>("delete_custom_entry", { id });
  },
};
