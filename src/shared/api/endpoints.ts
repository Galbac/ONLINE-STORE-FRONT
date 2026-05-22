const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_URL || PUBLIC_API_BASE_URL
    : PUBLIC_API_BASE_URL;

export const API_ENDPOINTS = {
  AUTH: {
    CHANGE_PASSWORD: "/api/auth/change-password",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
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
    CALCULATE: "/api/delivery/calculate",
    PICKUP_POINTS: "/api/delivery/pickup-points",
    PICKUP_POINT_BY_ID: (pointId: number): string => `/api/delivery/pickup-points/${pointId}`,
    TIME_SLOTS: "/api/delivery/time-slots",
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
  PROFILE: {
    SUMMARY: "/api/profile",
    ADDRESSES: "/api/profile/addresses",
    ADDRESS_BY_ID: (addressId: number): string => `/api/profile/addresses/${addressId}`,
    ORDERS: "/api/profile/orders",
    ORDER_REPEAT: (orderId: number): string => `/api/profile/orders/${orderId}/repeat`,
  },
  USER: {
    ME: "/api/users/me",
  },
  ORDER: {
    CREATE: "/api/orders",
    MY: "/api/orders/my",
    BY_ID: (orderId: number): string => `/api/orders/${orderId}`,
    CANCEL: (orderId: number): string => `/api/orders/${orderId}/cancel`,
    REPEAT: (orderId: number): string => `/api/orders/${orderId}/repeat`,
    STATUS: (orderId: number): string => `/api/orders/${orderId}/status`,
  },
  PAYMENT: {
    CREATE: "/api/payments/create",
    BY_ID: (paymentId: number): string => `/api/payments/${paymentId}`,
    CANCEL: (paymentId: number): string => `/api/payments/${paymentId}/cancel`,
    CONFIRM: (paymentId: number): string => `/api/payments/${paymentId}/confirm`,
  },
  NOTIFICATION: {
    LIST: "/api/notifications",
    READ_BY_ID: (notificationId: number): string => `/api/notifications/${notificationId}/read`,
  },
  UPLOAD: {
    IMAGE: "/api/uploads/image",
    BY_ID: (fileId: number): string => `/api/uploads/${fileId}`,
  },
} as const;
