import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { DeliveryOptionsResponse } from "../types";

export const deliveryApi = {
  getOptions: async (): Promise<DeliveryOptionsResponse> => {
    return apiClient.get<DeliveryOptionsResponse>(API_ENDPOINTS.DELIVERY.OPTIONS);
  },
};
