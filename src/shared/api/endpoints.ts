export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  AUTH: {
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
    REFRESH: "/api/auth/refresh",
    REGISTER: "/api/auth/register",
    RESET_PASSWORD: "/api/auth/reset-password",
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
    ITEM_BY_ID: (cartItemId: number): string => `/api/cart/items/${cartItemId}`,
    APPLY_PROMO_CODE: "/api/cart/apply-promo-code",
    PROMO_CODE: "/api/cart/promo-code",
  },
  PROMO_CODE: {
    CHECK: "/api/promo-codes/check",
    APPLY: "/api/promo-codes/apply",
  },
  FAVORITE: {
    LIST: "/api/favorites",
    BY_PRODUCT_ID: (productId: number): string => `/api/favorites/${productId}`,
  },
} as const;
