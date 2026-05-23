import { adminApiClient, API_ENDPOINTS } from "@/shared/api";

import type {
  AdminProductCreateRequest,
  AdminProductDetailResponse,
  AdminProductAvailabilityRequest,
  AdminProductImageCreateRequest,
  AdminProductImageResponse,
  AdminProductImagesSortRequest,
  AdminProductImagesSortResponse,
  AdminProductListParams,
  AdminProductListResponse,
  AdminProductStockRequest,
  AdminProductUpdateRequest,
  AdminProductUpdateResponse,
  AdminUploadImageRequest,
  AdminUploadImageResponse,
  AdminMessageResponse,
  ProductAvailabilityResponse,
  ProductStockResponse,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminProductApi = {
  create: async (
    data: AdminProductCreateRequest,
    accessToken?: string | null,
  ): Promise<AdminProductDetailResponse> => {
    return adminApiClient.post<AdminProductCreateRequest, AdminProductDetailResponse>(
      API_ENDPOINTS.ADMIN.PRODUCTS,
      data,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  getList: async (
    params: AdminProductListParams,
    accessToken?: string | null,
  ): Promise<AdminProductListResponse> => {
    return adminApiClient.get<AdminProductListResponse>(
      API_ENDPOINTS.ADMIN.PRODUCTS,
      toQueryParams(params),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  getById: async (
    productId: number,
    accessToken?: string | null,
  ): Promise<AdminProductDetailResponse> => {
    return adminApiClient.get<AdminProductDetailResponse>(
      API_ENDPOINTS.ADMIN.PRODUCT_BY_ID(productId),
      undefined,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  update: async (
    productId: number,
    data: AdminProductUpdateRequest,
    accessToken?: string | null,
  ): Promise<AdminProductUpdateResponse> => {
    return adminApiClient.patch<AdminProductUpdateRequest, AdminProductUpdateResponse>(
      API_ENDPOINTS.ADMIN.PRODUCT_BY_ID(productId),
      data,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  deleteById: async (
    productId: number,
    accessToken?: string | null,
  ): Promise<AdminMessageResponse> => {
    return adminApiClient.delete<AdminMessageResponse>(
      API_ENDPOINTS.ADMIN.PRODUCT_BY_ID(productId),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  updateStock: async (
    productId: number,
    data: AdminProductStockRequest,
    accessToken?: string | null,
  ): Promise<ProductStockResponse> => {
    return adminApiClient.patch<AdminProductStockRequest, ProductStockResponse>(
      API_ENDPOINTS.ADMIN.PRODUCT_STOCK(productId),
      data,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  updateAvailability: async (
    productId: number,
    data: AdminProductAvailabilityRequest,
    accessToken?: string | null,
  ): Promise<ProductAvailabilityResponse> => {
    return adminApiClient.patch<AdminProductAvailabilityRequest, ProductAvailabilityResponse>(
      API_ENDPOINTS.ADMIN.PRODUCT_AVAILABILITY(productId),
      data,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  uploadImage: async (
    data: AdminUploadImageRequest,
    accessToken?: string | null,
  ): Promise<AdminUploadImageResponse> => {
    const formData = new FormData();
    formData.set("file", data.file);

    if (data.entity_type) {
      formData.set("entity_type", data.entity_type);
    }

    return adminApiClient.postForm<AdminUploadImageResponse>(
      API_ENDPOINTS.ADMIN.UPLOAD_IMAGE,
      formData,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  addImage: async (
    productId: number,
    data: AdminProductImageCreateRequest,
    accessToken?: string | null,
  ): Promise<AdminProductImageResponse> => {
    const formData = new FormData();
    formData.set("file", data.file);
    formData.set("is_main", String(data.is_main));
    formData.set("sort_order", String(data.sort_order));

    return adminApiClient.postForm<AdminProductImageResponse>(
      API_ENDPOINTS.ADMIN.PRODUCT_IMAGES(productId),
      formData,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  deleteImage: async (
    productId: number,
    imageId: number,
    accessToken?: string | null,
  ): Promise<AdminMessageResponse> => {
    return adminApiClient.delete<AdminMessageResponse>(
      API_ENDPOINTS.ADMIN.PRODUCT_IMAGE_BY_ID(productId, imageId),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  sortImages: async (
    productId: number,
    data: AdminProductImagesSortRequest,
    accessToken?: string | null,
  ): Promise<AdminProductImagesSortResponse> => {
    return adminApiClient.patch<AdminProductImagesSortRequest, AdminProductImagesSortResponse>(
      API_ENDPOINTS.ADMIN.PRODUCT_IMAGES_SORT(productId),
      data,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  deleteUpload: async (fileId: number, accessToken?: string | null): Promise<AdminMessageResponse> => {
    return adminApiClient.delete<AdminMessageResponse>(
      API_ENDPOINTS.ADMIN.UPLOAD_BY_ID(fileId),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },
};

const toQueryParams = (params: AdminProductListParams): QueryParams => {
  return {
    category_id: params.category_id,
    in_stock: params.in_stock,
    is_active: params.is_active,
    is_available: params.is_available,
    limit: params.limit,
    low_stock: params.low_stock,
    page: params.page,
    product_type: params.product_type,
    q: params.q,
    sort: params.sort,
    sync_status: params.sync_status,
  };
};
