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
    href: ROUTES.CATALOG,
    label: "Каталог",
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
  const [hasDiscounts, setHasDiscounts] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<{ total?: number }>("/api/discounts/products", { in_stock: true, limit: 1 })
      .then((res) => {
        if (isMounted && typeof res?.total === "number" && res.total > 0) {
          setHasDiscounts(true);
        }
      })
      .catch(() => {
        apiClient
          .get<{ total?: number }>("/api/products", { has_discount: true, in_stock: true, limit: 1 })
          .then((pRes) => {
            if (isMounted && typeof pRes?.total === "number" && pRes.total > 0) {
              setHasDiscounts(true);
            }
          })
          .catch(() => {});
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const items: NavItem[] = hasDiscounts
    ? [
        { href: ROUTES.CATALOG, label: "Каталог" },
        { href: `${ROUTES.CATALOG}?has_discount=true`, label: "Акции %" },
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
