export const ROUTES = {
  HOME: "/",
  CATALOG: "/catalog",
  CATEGORY: (slug: string): string => `/catalog/${slug}`,
  PRODUCT: (slug: string): string => `/product/${slug}`,
  SEARCH: "/search",
  CART: "/cart",
  FAVORITES: "/favorites",
  FORGOT_PASSWORD: "/forgot-password",
  LOGIN: "/login",
  REGISTER: "/register",
  RESET_PASSWORD: "/reset-password",
} as const;
