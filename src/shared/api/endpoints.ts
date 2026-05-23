const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BROWSER_API_BASE_URL = process.env.NEXT_PUBLIC_BROWSER_API_URL || "";

export const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_URL || PUBLIC_API_BASE_URL
    : BROWSER_API_BASE_URL;

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
  ADMIN_AUTH: {
    LOGIN: "/api/admin/auth/login",
    LOGOUT: "/api/admin/auth/logout",
    ME: "/api/admin/auth/me",
  },
  ADMIN: {
    CATEGORIES: "/api/admin/categories",
    CATEGORIES_SORT: "/api/admin/categories/sort",
    CATEGORY_BY_ID: (categoryId: number): string => `/api/admin/categories/${categoryId}`,
    DASHBOARD: "/api/admin/dashboard",
    DASHBOARD_LOW_STOCK: "/api/admin/dashboard/low-stock",
    DASHBOARD_SALES: "/api/admin/dashboard/sales",
    ORDERS: "/api/admin/orders",
    ORDER_BY_ID: (orderId: number): string => `/api/admin/orders/${orderId}`,
    ORDER_CANCEL: (orderId: number): string => `/api/admin/orders/${orderId}/cancel`,
    ORDER_CONFIRM: (orderId: number): string => `/api/admin/orders/${orderId}/confirm`,
    ORDER_PRINT: (orderId: number): string => `/api/admin/orders/${orderId}/print`,
    ORDER_STATUS: (orderId: number): string => `/api/admin/orders/${orderId}/status`,
    ORDER_SYNC_1C: (orderId: number): string => `/api/admin/orders/${orderId}/sync-1c`,
    PRODUCTS: "/api/admin/products",
    PRODUCT_AVAILABILITY: (productId: number): string =>
      `/api/admin/products/${productId}/availability`,
    PRODUCT_BY_ID: (productId: number): string => `/api/admin/products/${productId}`,
    PRODUCT_IMAGE_BY_ID: (productId: number, imageId: number): string =>
      `/api/admin/products/${productId}/images/${imageId}`,
    PRODUCT_IMAGES: (productId: number): string => `/api/admin/products/${productId}/images`,
    PRODUCT_IMAGES_SORT: (productId: number): string =>
      `/api/admin/products/${productId}/images/sort`,
    PRODUCT_STOCK: (productId: number): string => `/api/admin/products/${productId}/stock`,
    ROLES: "/api/admin/roles",
    UPLOAD_BY_ID: (fileId: number): string => `/api/admin/uploads/${fileId}`,
    UPLOAD_IMAGE: "/api/admin/uploads/image",
    USERS: "/api/admin/users",
    USER_BY_ID: (userId: number): string => `/api/admin/users/${userId}`,
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
    REFUND: (paymentId: number): string => `/api/payments/${paymentId}/refund`,
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
