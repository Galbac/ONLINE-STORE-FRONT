export const ROUTES = {
  HOME: "/",
  CATALOG: "/catalog",
  CATEGORY: (slug: string): string => `/catalog/${slug}`,
  PRODUCT: (slug: string): string => `/product/${slug}`,
  SEARCH: "/search",
  CART: "/cart",
  FAVORITES: "/favorites",
  LOGIN: "/login",
} as const;
