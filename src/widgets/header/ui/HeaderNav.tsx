"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/shared/config";
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
        // Upon error keep default visible
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
      {items.map((item) => (
        <Link
          className="inline-flex items-center gap-1 py-1 transition-colors hover:text-emerald-700"
          href={item.href}
          key={item.label}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};
