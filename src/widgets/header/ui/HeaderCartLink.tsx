"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cartApi } from "@/entities/cart";
import { ROUTES } from "@/shared/config";
import { CART_CHANGED_EVENT } from "@/shared/lib/cart-events";
import { toPriceFormat } from "@/shared/lib/format";
import { getStoredAccessToken, getStoredRefreshToken } from "@/shared/ui";

export const HeaderCartLink = () => {
  const pathname = usePathname() || "";
  const isActive = pathname === ROUTES.CART;
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

  const hasItems = itemsCount > 0;
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`group relative hidden flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold transition active:scale-95 lg:flex ${
        isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
      href={isAuth ? ROUTES.CART : `${ROUTES.LOGIN}?next=${encodeURIComponent(ROUTES.CART)}`}
      aria-label={hasItems ? `Корзина: ${itemsCount} товаров на ${toPriceFormat(cartTotal)}` : "Корзина"}
    >
      <span className="relative mb-0.5 block">
        <ShoppingBag size={20} className="transition-transform group-hover:scale-110" />
        {hasItems ? (
          <span className="absolute -top-1.5 -right-2.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold leading-none text-white shadow-sm ring-2 ring-white">
            {formatCartCount(itemsCount)}
          </span>
        ) : null}
      </span>
      <span>Корзина</span>
    </Link>
  );
};

const hasValidStoredAccessToken = (): boolean =>
  Boolean(getStoredAccessToken() || getStoredRefreshToken());

const formatCartCount = (count: number): string => {
  if (count > 99) {
    return "99+";
  }
  return String(count);
};
