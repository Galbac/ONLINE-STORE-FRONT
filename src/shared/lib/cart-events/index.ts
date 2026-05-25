export const CART_CHANGED_EVENT = "cart-changed";

export interface CartChangedDetail {
  itemsCount?: number;
}

export const notifyCartChanged = (detail: CartChangedDetail = {}): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<CartChangedDetail>(CART_CHANGED_EVENT, { detail }));
};
