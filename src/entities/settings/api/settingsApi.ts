import { apiClient } from "@/shared/api";
import type { PublicStoreSettingsResponse } from "../types";

export const settingsApi = {
  getPublicSettings: async (): Promise<PublicStoreSettingsResponse> => {
    return apiClient.get<PublicStoreSettingsResponse>("/api/settings");
  },
};
