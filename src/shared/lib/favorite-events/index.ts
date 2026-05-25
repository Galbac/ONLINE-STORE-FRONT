export const FAVORITES_CHANGED_EVENT = "favorites-changed";

export interface FavoritesChangedDetail {
  itemsCount?: number;
}

export const notifyFavoritesChanged = (detail: FavoritesChangedDetail = {}): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<FavoritesChangedDetail>(FAVORITES_CHANGED_EVENT, { detail }),
  );
};
