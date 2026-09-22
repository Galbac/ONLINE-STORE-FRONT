"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { openCartDrawer } from "@/widgets/cart-drawer";

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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasValidStoredAccessToken()) {
      window.location.href = `${ROUTES.LOGIN}?next=${encodeURIComponent(ROUTES.CART)}`;
      return;
    }
    openCartDrawer();
  };

  return (
    <Link
      onClick={handleClick}
      className="group relative flex flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
      href={ROUTES.CART}
    >
      <span className="relative mb-0.5 block">
        <ShoppingBag size={20} className="transition-transform group-hover:scale-110" />
        {itemsCount > 0 ? (
          <span className="absolute -top-1.5 -right-2.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold leading-none text-white shadow-sm ring-2 ring-white">
            {formatCartCount(itemsCount)}
          </span>
        ) : null}
      </span>
      <span>Корзина</span>
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
