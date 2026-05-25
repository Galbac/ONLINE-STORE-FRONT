"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { cartApi } from "@/entities/cart";
import { ROUTES } from "@/shared/config";
import { isAccessTokenValid } from "@/shared/lib/auth-token";
import { CART_CHANGED_EVENT, type CartChangedDetail } from "@/shared/lib/cart-events";

export const HeaderCartLink = () => {
  const [itemsCount, setItemsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadCartSummary = async (): Promise<void> => {
      if (!hasValidStoredAccessToken()) {
        if (isMounted) {
          setItemsCount(0);
        }
        return;
      }

      try {
        const summary = await cartApi.getSummary();

        if (isMounted) {
          setItemsCount(summary.items_count);
        }
      } catch {
        if (isMounted) {
          setItemsCount(0);
        }
      }
    };

    const handleCartChanged = (event: Event): void => {
      const detail = (event as CustomEvent<CartChangedDetail>).detail;

      if (typeof detail?.itemsCount === "number") {
        setItemsCount(detail.itemsCount);
        return;
      }

      void loadCartSummary();
    };

    void loadCartSummary();
    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);
    window.addEventListener("focus", loadCartSummary);

    return () => {
      isMounted = false;
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
      window.removeEventListener("focus", loadCartSummary);
    };
  }, []);

  return (
    <Link className="relative text-center text-sm font-semibold" href={ROUTES.CART}>
      <span className="relative mx-auto mb-1 block w-fit">
        <ShoppingCart size={22} />
        {itemsCount > 0 ? (
          <span className="bg-accent-primary text-accent-contrast absolute -top-2 -right-3 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] leading-none font-bold">
            {formatCartCount(itemsCount)}
          </span>
        ) : null}
      </span>
      Корзина
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

const formatCartCount = (count: number): string => {
  if (count > 99) {
    return "99+";
  }

  return String(count);
};
