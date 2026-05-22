import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AddressCreateRequest,
  AddressListResponse,
  AddressResponse,
  AddressUpdateRequest,
} from "../types";

export const profileApi = {
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
