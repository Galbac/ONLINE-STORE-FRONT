export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
    REFRESH: "/api/auth/refresh",
    REGISTER: "/api/auth/register",
  },
  CATEGORY: {
    TREE: "/api/categories/tree",
    LIST: "/api/categories",
    BY_SLUG: (slug: string): string => `/api/categories/slug/${slug}`,
    BY_ID: (categoryId: number): string => `/api/categories/${categoryId}`,
  },
  PRODUCT: {
    POPULAR: "/api/products/popular",
    DISCOUNTED: "/api/products/discounted",
    NEW: "/api/products/new",
    LIST: "/api/products",
    SEARCH: "/api/products/search",
    BY_ID: (productId: number): string => `/api/products/${productId}`,
    BY_SLUG: (slug: string): string => `/api/products/slug/${slug}`,
    SIMILAR: (productId: number): string => `/api/products/${productId}/similar`,
  },
  DISCOUNT: {
    ACTIVE: "/api/discounts/active",
  },
  DELIVERY: {
    OPTIONS: "/api/delivery/options",
  },
  CART: {
    DETAIL: "/api/cart",
    SUMMARY: "/api/cart/summary",
    ITEMS: "/api/cart/items",
  },
  FAVORITE: {
    LIST: "/api/favorites",
    BY_PRODUCT_ID: (productId: number): string => `/api/favorites/${productId}`,
  },
} as const;
