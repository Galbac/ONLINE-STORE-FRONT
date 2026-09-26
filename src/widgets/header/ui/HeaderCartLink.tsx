"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { openCartDrawer } from "@/widgets/cart-drawer";
import { cartApi } from "@/entities/cart";
import { ROUTES } from "@/shared/config";
import { isAccessTokenValid } from "@/shared/lib/auth-token";
import { CART_CHANGED_EVENT } from "@/shared/lib/cart-events";
import { toPriceFormat } from "@/shared/lib/format";

export const HeaderCartLink = () => {
  const [itemsCount, setItemsCount] = useState(0);
  const [cartTotal, setCartTotal] = useState<string | number>("0");

  useEffect(() => {
    let isMounted = true;

    const loadCartSummary = async (): Promise<void> => {
      if (!hasValidStoredAccessToken()) {
        if (isMounted) {
          setItemsCount(0);
          setCartTotal("0");
        }
        return;
      }

      try {
        const summary = await cartApi.getSummary();
        if (isMounted) {
          setItemsCount(summary.items_count);
          setCartTotal(summary.final_price || summary.subtotal || "0");
        }
      } catch {
        if (isMounted) {
          setItemsCount(0);
          setCartTotal("0");
        }
      }
    };

    const handleCartChanged = (): void => {
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

  const isAuth = hasValidStoredAccessToken();

  const handleClick = (e: React.MouseEvent) => {
    if (isAuth) {
      e.preventDefault();
      openCartDrawer();
    }
  };

  const hasItems = itemsCount > 0;

  return (
    <Link
      onClick={handleClick}
      className={`group relative hidden md:inline-flex items-center gap-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
        hasItems
          ? "border border-emerald-500/30 bg-emerald-50/80 px-3 py-2 text-emerald-900 hover:border-emerald-500 hover:bg-emerald-100/90 shadow-2xs"
          : "p-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
      href={isAuth ? ROUTES.CART : `${ROUTES.LOGIN}?next=${encodeURIComponent(ROUTES.CART)}`}
      aria-label={hasItems ? `Корзина: ${itemsCount} товаров на ${toPriceFormat(cartTotal)}` : "Корзина"}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        <ShoppingBag
          size={20}
          className={`transition-transform duration-200 group-hover:scale-110 ${
            hasItems ? "text-emerald-700" : "text-slate-700 group-hover:text-emerald-700"
          }`}
        />
        {hasItems ? (
          <span className="absolute -top-2 -right-2 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-black leading-none text-white shadow-sm ring-2 ring-white">
            {formatCartCount(itemsCount)}
          </span>
        ) : null}
      </span>

      {hasItems ? (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[11px] font-medium text-emerald-700">
            {itemsCount} {formatItemsCount(itemsCount)}
          </span>
          <span className="text-xs font-black text-slate-900 tracking-tight">
            {toPriceFormat(cartTotal)}
          </span>
        </div>
      ) : (
        <span className="text-xs font-semibold">Корзина</span>
      )}
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

const formatItemsCount = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "товаров";
  if (mod10 === 1) return "товар";
  if (mod10 >= 2 && mod10 <= 4) return "товара";
  return "товаров";
};
