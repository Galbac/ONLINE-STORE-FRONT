import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { UploadDeleteResponse, UploadFileResponse, UploadImageRequest } from "../types";

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export const uploadApi = {
  uploadImage: async (
    data: UploadImageRequest,
    accessToken?: string | null,
  ): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.set("file", data.file);

    if (data.entity_type) {
      formData.set("entity_type", data.entity_type);
    }

    return apiClient.postForm<UploadFileResponse>(
      API_ENDPOINTS.UPLOAD.IMAGE,
      formData,
      getAuthHeaders(accessToken),
    );
  },

  getById: async (fileId: number, accessToken?: string | null): Promise<UploadFileResponse> => {
    return apiClient.get<UploadFileResponse>(
      API_ENDPOINTS.UPLOAD.BY_ID(fileId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  deleteById: async (
    fileId: number,
    accessToken?: string | null,
  ): Promise<UploadDeleteResponse> => {
    return apiClient.delete<UploadDeleteResponse>(
      API_ENDPOINTS.UPLOAD.BY_ID(fileId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },
};
