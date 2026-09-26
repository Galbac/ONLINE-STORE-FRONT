"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

import { favoriteApi } from "@/entities/favorite";
import { ROUTES } from "@/shared/config";
import { isAccessTokenValid } from "@/shared/lib/auth-token";
import {
  FAVORITES_CHANGED_EVENT,
  type FavoritesChangedDetail,
} from "@/shared/lib/favorite-events";

export const HeaderFavoritesLink = () => {
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
        const favorites = await favoriteApi.getList({ page: 1, limit: 1 });

        if (isMounted) {
          setItemsCount(favorites.total);
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
      className="group relative hidden md:flex flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
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
  if (typeof window === "undefined") {
    return false;
  }

  const accessToken =
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token");

  return accessToken ? isAccessTokenValid(accessToken) : false;
};

const formatFavoritesCount = (count: number): string => {
  if (count > 99) {
    return "99+";
  }

  return String(count);
};
