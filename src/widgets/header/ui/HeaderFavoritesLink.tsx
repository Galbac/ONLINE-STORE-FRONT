"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

import { useFavoritesStore } from "@/entities/favorite";
import { ROUTES } from "@/shared/config";
import {
  FAVORITES_CHANGED_EVENT,
  type FavoritesChangedDetail,
} from "@/shared/lib/favorite-events";
import { getStoredAccessToken, getStoredRefreshToken } from "@/shared/ui";

export const HeaderFavoritesLink = () => {
  const pathname = usePathname() || "";
  const isActive = pathname === ROUTES.FAVORITES || pathname.startsWith(`${ROUTES.FAVORITES}/`);
  const [itemsCount, setItemsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadFavoritesCount = async (): Promise<void> => {
      if (!hasValidStoredAccessToken()) {
        if (isMounted) {
          setItemsCount(0);
        }
        return;
      }

      try {
        await useFavoritesStore.getState().fetchFavorites();
        const count = useFavoritesStore.getState().items.length;
        if (isMounted) {
          setItemsCount(count);
        }
      } catch {
        if (isMounted) {
          setItemsCount(0);
        }
      }
    };

    const handleFavoritesChanged = (event: Event): void => {
      const detail = (event as CustomEvent<FavoritesChangedDetail>).detail;

      if (typeof detail?.itemsCount === "number") {
        setItemsCount(detail.itemsCount);
        return;
      }

      void loadFavoritesCount();
    };

    void loadFavoritesCount();
    window.addEventListener(FAVORITES_CHANGED_EVENT, handleFavoritesChanged);
    window.addEventListener("focus", loadFavoritesCount);

    return () => {
      isMounted = false;
      window.removeEventListener(FAVORITES_CHANGED_EVENT, handleFavoritesChanged);
      window.removeEventListener("focus", loadFavoritesCount);
    };
  }, []);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`group relative hidden lg:flex flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold transition active:scale-95 ${
        isActive ? "bg-rose-50 text-rose-600" : "text-slate-700 hover:bg-rose-50 hover:text-rose-600"
      }`}
      href={ROUTES.FAVORITES}
    >
      <span className="relative mb-0.5 block">
        <Heart size={20} className="transition-transform group-hover:scale-110" />
        {itemsCount > 0 ? (
          <span className="absolute -top-1.5 -right-2.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white shadow-sm ring-2 ring-white">
            {formatFavoritesCount(itemsCount)}
          </span>
        ) : null}
      </span>
      <span>Избранное</span>
    </Link>
  );
};

const hasValidStoredAccessToken = (): boolean => {
  return Boolean(getStoredAccessToken() || getStoredRefreshToken());
};

const formatFavoritesCount = (count: number): string => {
  if (count > 99) {
    return "99+";
  }

  return String(count);
};
