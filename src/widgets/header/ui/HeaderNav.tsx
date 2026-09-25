"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES, cn } from "@/shared/config";
import { apiClient } from "@/shared/api";

interface NavItem {
  href: string;
  label: string;
}

const baseNavItems: NavItem[] = [
  {
    href: `${ROUTES.CATALOG}?sort=popular`,
    label: "Популярное",
  },
  {
    href: `${ROUTES.CATALOG}?sort=newest`,
    label: "Новинки",
  },
  {
    href: ROUTES.CHECKOUT,
    label: "Доставка и оплата",
  },
  {
    href: ROUTES.PROFILE_ORDERS,
    label: "Мои заказы",
  },
];

export const HeaderNav = () => {
  const pathname = usePathname() || "";
  const [hasDiscounts, setHasDiscounts] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<{ total?: number; items?: unknown[] }>("/api/products", {
        has_discount: true,
        limit: 1,
      })
      .then((res) => {
        if (!isMounted) return;
        const count = typeof res?.total === "number" ? res.total : (res?.items?.length ?? 0);
        setHasDiscounts(count > 0);
      })
      .catch(() => {
        if (isMounted) setHasDiscounts(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const items: NavItem[] = hasDiscounts
    ? [
        { href: `${ROUTES.CATALOG}?has_discount=true`, label: "Акции %" },
        { href: `${ROUTES.CATALOG}?sort=popular`, label: "Популярное" },
        { href: `${ROUTES.CATALOG}?sort=newest`, label: "Новинки" },
        { href: ROUTES.CHECKOUT, label: "Доставка и оплата" },
        { href: ROUTES.PROFILE_ORDERS, label: "Мои заказы" },
      ]
    : baseNavItems;

  return (
    <nav className="mt-3 hidden items-center gap-6 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-600 lg:flex">
      {items.map((item) => {
        const isActive =
          item.href === ROUTES.PROFILE_ORDERS
            ? pathname.startsWith(ROUTES.PROFILE_ORDERS)
            : item.href === ROUTES.CHECKOUT
            ? pathname === ROUTES.CHECKOUT
            : false;

        return (
          <Link
            className={cn(
              "inline-flex items-center gap-1 py-1 transition-colors relative",
              isActive
                ? "text-emerald-700 font-bold border-b-2 border-emerald-600 -mb-[2px]"
                : "text-slate-600 hover:text-emerald-700 font-semibold"
            )}
            href={item.href}
            key={item.label}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
