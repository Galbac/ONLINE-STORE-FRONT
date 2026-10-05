"use client";

import { useStoreBranch } from "@/entities/delivery";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ReceiptText, ShoppingBag, User } from "lucide-react";

import { cartApi } from "@/entities/cart";
import { orderApi } from "@/entities/order";
import { ROUTES } from "@/shared/config";
import { isAccessTokenValid } from "@/shared/lib/auth-token";
import { CART_CHANGED_EVENT, type CartChangedDetail } from "@/shared/lib/cart-events";
import { getStoredAccessToken } from "@/shared/ui";

export const BottomNav = () => {
  const selectedStoreId = useStoreBranch((state) => state.selectedStore?.id);
  const rawPathname = usePathname();
  const pathname = rawPathname || "";
  const [cartCount, setCartCount] = useState<number>(0);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [ordersCount, setOrdersCount] = useState<number>(0);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    let cancelled = false;
    let loading = false;

    const fetchOrdersCount = async () => {
      if (loading || document.visibilityState === "hidden") return;
      const token = getStoredAccessToken();
      if (!token) {
        setOrdersCount(0);
        return;
      }

      loading = true;
      try {
        let count = 0;
        let offset = 0;
        while (!cancelled) {
          const response = await orderApi.getProfileOrders({ limit: 100, offset }, token);
          count += response.items.filter(
            (order) => !["delivered", "completed", "done", "cancelled", "canceled"].includes(
              order.status.toLowerCase(),
            ),
          ).length;
          offset += response.items.length;
          if (count > 99 || offset >= response.total || response.items.length === 0) break;
        }
        if (!cancelled && token === getStoredAccessToken()) setOrdersCount(count);
      } catch {
        if (!cancelled) setOrdersCount(0);
      } finally {
        loading = false;
      }
    };

    void fetchOrdersCount();
    const interval = window.setInterval(fetchOrdersCount, 60_000);
    window.addEventListener("focus", fetchOrdersCount);
    document.addEventListener("visibilitychange", fetchOrdersCount);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", fetchOrdersCount);
      document.removeEventListener("visibilitychange", fetchOrdersCount);
    };
  }, [pathname, selectedStoreId]);

  useEffect(() => {
    let cancelled = false;
    const updateAuth = () => {
      const token = getStoredAccessToken();
      setIsAuth(Boolean(token && isAccessTokenValid(token)));
    };

    updateAuth();

    const fetchCartCount = async () => {
      try {
        const token = getStoredAccessToken();
        if (token && isAccessTokenValid(token)) {
          const summary = await cartApi.getSummary();
          if (!cancelled) setCartCount(summary.items_count);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    };

    fetchCartCount();

    const handleCartChanged = (event: Event) => {
      const customEvent = event as CustomEvent<CartChangedDetail>;
      if (typeof customEvent.detail?.itemsCount === "number") {
        setCartCount(customEvent.detail.itemsCount);
      } else {
        void fetchCartCount();
      }
    };

    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [pathname, selectedStoreId]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isOrdersActive =
    pathname === ROUTES.PROFILE_ORDERS || pathname.startsWith(`${ROUTES.PROFILE_ORDERS}/`);

  const isProfileActive =
    (pathname.startsWith("/profile") && !isOrdersActive) ||
    pathname === ROUTES.LOGIN ||
    pathname === "/favorites";

  const items = [
    {
      href: ROUTES.HOME,
      label: "Главная",
      icon: Home,
      isActive: pathname === ROUTES.HOME,
    },
    {
      href: ROUTES.CATALOG,
      label: "Каталог",
      icon: LayoutGrid,
      isActive: pathname.startsWith("/catalog") || pathname.startsWith("/category"),
    },
    {
      href: ROUTES.CART,
      label: "Корзина",
      icon: ShoppingBag,
      badge: cartCount > 0 ? (cartCount > 99 ? "99+" : String(cartCount)) : null,
      isActive: pathname === ROUTES.CART,
    },
    {
      href: ROUTES.PROFILE_ORDERS,
      label: "Заказы",
      icon: ReceiptText,
      badge: ordersCount > 0 ? (ordersCount > 99 ? "99+" : String(ordersCount)) : null,
      isActive: isOrdersActive,
    },
    {
      href: isAuth ? ROUTES.PROFILE : ROUTES.LOGIN,
      label: isAuth ? "Профиль" : "Войти",
      icon: User,
      isActive: isProfileActive,
    },
  ];

  return (
    <nav
      aria-label="Мобильная навигация"
      className="border-border/80 bg-bg-primary/95 supports-[backdrop-filter]:bg-bg-primary/80 fixed right-0 bottom-0 left-0 z-50 border-t backdrop-blur-md lg:hidden"
      style={{
        paddingBottom: "max(var(--sab, 0px), 8px)",
        paddingLeft: "max(var(--sal, 0px), 4px)",
        paddingRight: "max(var(--sar, 0px), 4px)",
      }}
    >
      <div className="grid w-full min-w-0 grid-cols-5 items-center pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (typeof window !== "undefined" && "vibrate" in navigator) {
                  try { navigator.vibrate(12); } catch (_) {}
                }
              }}
              className={`relative flex w-full min-w-0 flex-col items-center justify-center py-1 text-center transition active:scale-95 ${
                item.isActive
                  ? "text-emerald-600 font-bold"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              <div className="relative">
                <Icon size={20} className={`sm:w-[22px] sm:h-[22px] ${item.isActive ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
                {item.badge ? (
                  <span
                    className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white shadow-xs"
                  >
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="mt-1 text-[10px] sm:text-[11px] leading-tight tracking-tight truncate max-w-full px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
