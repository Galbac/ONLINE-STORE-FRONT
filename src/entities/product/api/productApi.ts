import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  ProductDiscountedResponse,
  ProductFacetsResponse,
  ProductDetailParams,
  ProductDetailResponse,
  ProductListParams,
  ProductListResponse,
  ProductNewResponse,
  ProductPopularResponse,
  ProductReviewSummaryResponse,
  ProductSearchParams,
  ProductSearchResponse,
  ProductSimilarParams,
  ProductSimilarResponse,
} from "../types";

const getCurrentStoreId = (): number | undefined => {
  if (typeof document === "undefined") return undefined;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("current_store_id="))
    ?.split("=")[1];
  const storeId = Number(value);
  return Number.isInteger(storeId) && storeId > 0 ? storeId : undefined;
};

export const productApi = {
  getReviewSummary: async (productId: number): Promise<ProductReviewSummaryResponse> => {
    return apiClient.get<ProductReviewSummaryResponse>(API_ENDPOINTS.REVIEW.BY_PRODUCT(productId));
  },

  getFacets: async (params?: { category_id?: number | undefined; store_id?: number | undefined }): Promise<ProductFacetsResponse> => {
    return apiClient.get<ProductFacetsResponse>(API_ENDPOINTS.PRODUCT.FACETS, {
      category_id: params?.category_id,
      store_id: params?.store_id ?? getCurrentStoreId(),
    });
  },

  getList: async (params: ProductListParams = {}): Promise<ProductListResponse> => {
    return apiClient.get<ProductListResponse>(API_ENDPOINTS.PRODUCT.LIST, {
      page: params.page ?? 1,
      limit: params.limit ?? 24,
      category_id: params.category_id,
      category_slug: params.category_slug,
      in_stock: params.in_stock,
      min_price: params.min_price,
      max_price: params.max_price,
      has_discount: params.has_discount,
      product_type: params.product_type,
      store_id: params.store_id,
      sort: params.sort ?? "popular",
    });
  },

  getPopular: async (storeId?: number): Promise<ProductPopularResponse> => {
    return apiClient.get<ProductPopularResponse>(API_ENDPOINTS.PRODUCT.POPULAR, {
      limit: 8,
      period_days: 30,
      in_stock: true,
      store_id: storeId ?? getCurrentStoreId(),
    });
  },

  getDiscounted: async (): Promise<ProductDiscountedResponse> => {
    return apiClient.get<ProductDiscountedResponse>(API_ENDPOINTS.PRODUCT.DISCOUNTED, {
      page: 1,
      limit: 8,
      in_stock: true,
      sort: "discount_desc",
    });
  },

  getNew: async (storeId?: number): Promise<ProductNewResponse> => {
    return apiClient.get<ProductNewResponse>(API_ENDPOINTS.PRODUCT.NEW, {
      limit: 8,
      in_stock: true,
      days: 30,
      store_id: storeId ?? getCurrentStoreId(),
    });
  },

  search: async (params: ProductSearchParams = {}): Promise<ProductSearchResponse> => {
    return apiClient.get<ProductSearchResponse>(API_ENDPOINTS.PRODUCT.SEARCH, {
      q: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? 24,
      category_id: params.category_id,
      in_stock: params.in_stock,
      min_price: params.min_price,
      max_price: params.max_price,
      has_discount: params.has_discount,
      product_type: params.product_type,
      store_id: params.store_id,
      tag: params.tag,
      sort: params.sort ?? "relevance",
    });
  },

  getBySlug: async (
    slug: string,
    params: ProductDetailParams = {},
  ): Promise<ProductDetailResponse> => {
    return apiClient.get<ProductDetailResponse>(API_ENDPOINTS.PRODUCT.BY_SLUG(slug), {
      with_similar: params.with_similar ?? false,
      with_breadcrumbs: params.with_breadcrumbs ?? true,
    });
  },

  getById: async (
    productId: number,
    params: ProductDetailParams = {},
  ): Promise<ProductDetailResponse> => {
    return apiClient.get<ProductDetailResponse>(API_ENDPOINTS.PRODUCT.BY_ID(productId), {
      with_similar: params.with_similar ?? false,
      with_breadcrumbs: params.with_breadcrumbs ?? true,
    });
  },

  getSimilar: async (
    productId: number,
    params: ProductSimilarParams = {},
  ): Promise<ProductSimilarResponse> => {
    return apiClient.get<ProductSimilarResponse>(API_ENDPOINTS.PRODUCT.SIMILAR(productId), {
      limit: params.limit ?? 8,
      in_stock: params.in_stock ?? true,
    });
  },
};
