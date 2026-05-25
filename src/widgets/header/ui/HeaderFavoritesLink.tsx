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
    <Link className="hidden text-center text-sm font-semibold md:block" href={ROUTES.FAVORITES}>
      <span className="relative mx-auto mb-1 block w-fit">
        <Heart size={22} />
        <span className="bg-accent-primary text-accent-contrast absolute -top-2 -right-3 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] leading-none font-bold">
          {formatFavoritesCount(itemsCount)}
        </span>
      </span>
      Избранное
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
