import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AddressCreateRequest,
  AddressListResponse,
  AddressResponse,
  AddressUpdateRequest,
  ProfileSummaryResponse,
} from "../types";

export const profileApi = {
  getSummary: async (): Promise<ProfileSummaryResponse> => {
    return apiClient.get<ProfileSummaryResponse>(API_ENDPOINTS.PROFILE.SUMMARY);
  },

  getAddresses: async (): Promise<AddressListResponse> => {
    return apiClient.get<AddressListResponse>(API_ENDPOINTS.PROFILE.ADDRESSES);
  },

  createAddress: async (data: AddressCreateRequest): Promise<AddressResponse> => {
    return apiClient.post<AddressCreateRequest, AddressResponse>(
      API_ENDPOINTS.PROFILE.ADDRESSES,
      data,
    );
  },

  updateAddress: async (
    addressId: number,
    data: AddressUpdateRequest,
  ): Promise<AddressResponse> => {
    return apiClient.patch<AddressUpdateRequest, AddressResponse>(
      API_ENDPOINTS.PROFILE.ADDRESS_BY_ID(addressId),
      data,
    );
  },
};
