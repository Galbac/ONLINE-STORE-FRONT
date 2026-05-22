import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AddressCreateRequest,
  AddressListResponse,
  AddressResponse,
  AddressUpdateRequest,
  ProfileMessageResponse,
  ProfileSummaryResponse,
} from "../types";

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export const profileApi = {
  getSummary: async (accessToken?: string | null): Promise<ProfileSummaryResponse> => {
    return apiClient.get<ProfileSummaryResponse>(
      API_ENDPOINTS.PROFILE.SUMMARY,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getAddresses: async (accessToken?: string | null): Promise<AddressListResponse> => {
    return apiClient.get<AddressListResponse>(
      API_ENDPOINTS.PROFILE.ADDRESSES,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  createAddress: async (
    data: AddressCreateRequest,
    accessToken?: string | null,
  ): Promise<AddressResponse> => {
    return apiClient.post<AddressCreateRequest, AddressResponse>(
      API_ENDPOINTS.PROFILE.ADDRESSES,
      data,
      getAuthHeaders(accessToken),
    );
  },

  updateAddress: async (
    addressId: number,
    data: AddressUpdateRequest,
    accessToken?: string | null,
  ): Promise<AddressResponse> => {
    return apiClient.patch<AddressUpdateRequest, AddressResponse>(
      API_ENDPOINTS.PROFILE.ADDRESS_BY_ID(addressId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  deleteAddress: async (
    addressId: number,
    accessToken?: string | null,
  ): Promise<ProfileMessageResponse> => {
    return apiClient.delete<ProfileMessageResponse>(
      API_ENDPOINTS.PROFILE.ADDRESS_BY_ID(addressId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },
};
