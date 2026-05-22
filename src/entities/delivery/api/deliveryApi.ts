import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  DeliveryCalculateRequest,
  DeliveryCalculateResponse,
  DeliveryOptionsResponse,
  DeliveryTimeSlotsParams,
  DeliveryTimeSlotsResponse,
  PickupPointDetailResponse,
  PickupPointListParams,
  PickupPointListResponse,
} from "../types";

export const deliveryApi = {
  getOptions: async (): Promise<DeliveryOptionsResponse> => {
    return apiClient.get<DeliveryOptionsResponse>(API_ENDPOINTS.DELIVERY.OPTIONS);
  },

  calculate: async (data: DeliveryCalculateRequest): Promise<DeliveryCalculateResponse> => {
    return apiClient.post<DeliveryCalculateRequest, DeliveryCalculateResponse>(
      API_ENDPOINTS.DELIVERY.CALCULATE,
      data,
    );
  },

  getPickupPoints: async (params: PickupPointListParams = {}): Promise<PickupPointListResponse> => {
    return apiClient.get<PickupPointListResponse>(API_ENDPOINTS.DELIVERY.PICKUP_POINTS, {
      ...params,
    });
  },

  getPickupPoint: async (pointId: number): Promise<PickupPointDetailResponse> => {
    return apiClient.get<PickupPointDetailResponse>(
      API_ENDPOINTS.DELIVERY.PICKUP_POINT_BY_ID(pointId),
    );
  },

  getTimeSlots: async (params: DeliveryTimeSlotsParams): Promise<DeliveryTimeSlotsResponse> => {
    return apiClient.get<DeliveryTimeSlotsResponse>(API_ENDPOINTS.DELIVERY.TIME_SLOTS, {
      ...params,
    });
  },
};
