export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  CATEGORY: {
    TREE: "/api/categories/tree",
    LIST: "/api/categories",
  },
  PRODUCT: {
    POPULAR: "/api/products/popular",
    DISCOUNTED: "/api/products/discounted",
    NEW: "/api/products/new",
  },
  DISCOUNT: {
    ACTIVE: "/api/discounts/active",
  },
  DELIVERY: {
    OPTIONS: "/api/delivery/options",
  },
} as const;
