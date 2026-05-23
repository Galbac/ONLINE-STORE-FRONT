import { adminApiClient, API_ENDPOINTS } from "@/shared/api";

import type {
  AdminCategoryDetailResponse,
  AdminCategoryListParams,
  AdminCategoryListResponse,
  AdminCategoryMessageResponse,
  AdminCategoryPayload,
  AdminCategorySortPayload,
  AdminCategoryUpdatePayload,
  AdminCategoryUploadImageRequest,
  AdminCategoryUploadImageResponse,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminCategoryApi = {
  create: async (
    data: AdminCategoryPayload,
    accessToken?: string | null,
  ): Promise<AdminCategoryDetailResponse> => {
    return adminApiClient.post<AdminCategoryPayload, AdminCategoryDetailResponse>(
      API_ENDPOINTS.ADMIN.CATEGORIES,
      data,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  getList: async (
    params: AdminCategoryListParams,
    accessToken?: string | null,
  ): Promise<AdminCategoryListResponse> => {
    return adminApiClient.get<AdminCategoryListResponse>(
      API_ENDPOINTS.ADMIN.CATEGORIES,
      toQueryParams(params),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  getById: async (
    categoryId: number,
    accessToken?: string | null,
  ): Promise<AdminCategoryDetailResponse> => {
    return adminApiClient.get<AdminCategoryDetailResponse>(
      API_ENDPOINTS.ADMIN.CATEGORY_BY_ID(categoryId),
      undefined,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  update: async (
    categoryId: number,
    data: AdminCategoryUpdatePayload,
    accessToken?: string | null,
  ): Promise<AdminCategoryDetailResponse> => {
    return adminApiClient.patch<AdminCategoryUpdatePayload, AdminCategoryDetailResponse>(
      API_ENDPOINTS.ADMIN.CATEGORY_BY_ID(categoryId),
      data,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  deleteById: async (
    categoryId: number,
    accessToken?: string | null,
  ): Promise<AdminCategoryMessageResponse> => {
    return adminApiClient.delete<AdminCategoryMessageResponse>(
      API_ENDPOINTS.ADMIN.CATEGORY_BY_ID(categoryId),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  sort: async (
    data: AdminCategorySortPayload,
    accessToken?: string | null,
  ): Promise<AdminCategoryMessageResponse> => {
    return adminApiClient.patch<AdminCategorySortPayload, AdminCategoryMessageResponse>(
      API_ENDPOINTS.ADMIN.CATEGORIES_SORT,
      data,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  uploadImage: async (
    data: AdminCategoryUploadImageRequest,
    accessToken?: string | null,
  ): Promise<AdminCategoryUploadImageResponse> => {
    const formData = new FormData();
    formData.set("file", data.file);

    if (data.entity_type) {
      formData.set("entity_type", data.entity_type);
    }

    return adminApiClient.postForm<AdminCategoryUploadImageResponse>(
      API_ENDPOINTS.ADMIN.UPLOAD_IMAGE,
      formData,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  deleteUpload: async (
    fileId: number,
    accessToken?: string | null,
  ): Promise<AdminCategoryMessageResponse> => {
    return adminApiClient.delete<AdminCategoryMessageResponse>(
      API_ENDPOINTS.ADMIN.UPLOAD_BY_ID(fileId),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },
};

const toQueryParams = (params: AdminCategoryListParams): QueryParams => {
  return {
    include_deleted: params.include_deleted,
    is_active: params.is_active,
    limit: params.limit,
    page: params.page,
    parent_id: params.parent_id,
    q: params.q,
  };
};
