import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminUploadDeleteResponse,
  AdminUploadFileResponse,
  AdminUploadImageRequest,
} from "../types";

export const adminUploadApi = {
  uploadImage: async (
    data: AdminUploadImageRequest,
    accessToken?: string | null,
  ): Promise<AdminUploadFileResponse> => {
    const formData = new FormData();
    formData.set("file", data.file);

    if (data.entity_type) {
      formData.set("entity_type", data.entity_type);
    }

    return adminApiClient.postForm<AdminUploadFileResponse>(
      API_ENDPOINTS.ADMIN.UPLOAD_IMAGE,
      formData,
      getAuthHeaders(accessToken),
    );
  },

  getById: async (
    fileId: number,
    accessToken?: string | null,
  ): Promise<AdminUploadFileResponse> => {
    return adminApiClient.get<AdminUploadFileResponse>(
      API_ENDPOINTS.UPLOAD.BY_ID(fileId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  deleteById: async (
    fileId: number,
    accessToken?: string | null,
  ): Promise<AdminUploadDeleteResponse> => {
    return adminApiClient.delete<AdminUploadDeleteResponse>(
      API_ENDPOINTS.ADMIN.UPLOAD_BY_ID(fileId),
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};
