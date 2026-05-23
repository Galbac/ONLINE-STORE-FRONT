import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminDeliveryListParams,
  AdminDeliveryMessageResponse,
  AdminDeliveryPayload,
  AdminDeliverySettingsResponse,
  AdminDeliveryZoneListResponse,
  AdminDeliveryZoneResponse,
  AdminPickupPointListResponse,
  AdminPickupPointResponse,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminDeliveryApi = {
  createPickupPoint: async (
    data: AdminDeliveryPayload,
    accessToken?: string | null,
  ): Promise<AdminPickupPointResponse> => {
    return adminApiClient.post<AdminDeliveryPayload, AdminPickupPointResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_PICKUP_POINTS,
      data,
      getAuthHeaders(accessToken),
    );
  },

  createZone: async (
    data: AdminDeliveryPayload,
    accessToken?: string | null,
  ): Promise<AdminDeliveryZoneResponse> => {
    return adminApiClient.post<AdminDeliveryPayload, AdminDeliveryZoneResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_ZONES,
      data,
      getAuthHeaders(accessToken),
    );
  },

  deletePickupPoint: async (
    pointId: number,
    accessToken?: string | null,
  ): Promise<AdminDeliveryMessageResponse> => {
    return adminApiClient.delete<AdminDeliveryMessageResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_PICKUP_POINT_BY_ID(pointId),
      getAuthHeaders(accessToken),
    );
  },

  deleteZone: async (
    zoneId: number,
    accessToken?: string | null,
  ): Promise<AdminDeliveryMessageResponse> => {
    return adminApiClient.delete<AdminDeliveryMessageResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_ZONE_BY_ID(zoneId),
      getAuthHeaders(accessToken),
    );
  },

  getPickupPoints: async (
    params: AdminDeliveryListParams,
    accessToken?: string | null,
  ): Promise<AdminPickupPointListResponse> => {
    return adminApiClient.get<AdminPickupPointListResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_PICKUP_POINTS,
      toQueryParams(params),
      getAuthHeaders(accessToken),
    );
  },

  getSettings: async (accessToken?: string | null): Promise<AdminDeliverySettingsResponse> => {
    return adminApiClient.get<AdminDeliverySettingsResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_SETTINGS,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getZones: async (
    params: AdminDeliveryListParams,
    accessToken?: string | null,
  ): Promise<AdminDeliveryZoneListResponse> => {
    return adminApiClient.get<AdminDeliveryZoneListResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_ZONES,
      toQueryParams(params),
      getAuthHeaders(accessToken),
    );
  },

  updatePickupPoint: async (
    pointId: number,
    data: AdminDeliveryPayload,
    accessToken?: string | null,
  ): Promise<AdminPickupPointResponse> => {
    return adminApiClient.patch<AdminDeliveryPayload, AdminPickupPointResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_PICKUP_POINT_BY_ID(pointId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  updateSettings: async (
    data: AdminDeliveryPayload,
    accessToken?: string | null,
  ): Promise<AdminDeliverySettingsResponse> => {
    return adminApiClient.patch<AdminDeliveryPayload, AdminDeliverySettingsResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_SETTINGS,
      data,
      getAuthHeaders(accessToken),
    );
  },

  updateZone: async (
    zoneId: number,
    data: AdminDeliveryPayload,
    accessToken?: string | null,
  ): Promise<AdminDeliveryZoneResponse> => {
    return adminApiClient.patch<AdminDeliveryPayload, AdminDeliveryZoneResponse>(
      API_ENDPOINTS.ADMIN.DELIVERY_ZONE_BY_ID(zoneId),
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

const toQueryParams = (params: AdminDeliveryListParams): QueryParams => {
  return {
    city: params.city,
    include_deleted: params.include_deleted,
    is_active: params.is_active,
    limit: params.limit,
    page: params.page,
    q: params.q,
  };
};
