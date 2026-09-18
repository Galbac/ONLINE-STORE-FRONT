import Link from "next/link";
import { LayoutGrid, MapPin, Phone, UserRound } from "lucide-react";

import { ProductSearch } from "@/features/product-search";
import { ROUTES, STORE_INFO } from "@/shared/config";
import { Container, Logo } from "@/shared/ui";

import { HeaderCartLink } from "./HeaderCartLink";
import { HeaderFavoritesLink } from "./HeaderFavoritesLink";

const navItems = [
  {
    href: ROUTES.CATALOG,
    label: "Каталог",
  },
  {
    href: `${ROUTES.CATALOG}?has_discount=true`,
    label: "Акции %",
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
] as const;

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      {/* Top micro bar */}
      <div className="border-b border-slate-100 bg-slate-50/60 text-xs text-slate-500 py-1.5 hidden sm:block">
        <Container className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <MapPin size={13} className="text-emerald-600" />
              {STORE_INFO.city}
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline text-slate-500">
              Ежедневная доставка с 08:00 до 22:00
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-emerald-700 transition"
              href={STORE_INFO.phoneHref}
            >
              <Phone size={13} className="text-emerald-600" />
              {STORE_INFO.phone}
            </a>
          </div>
        </Container>
      </div>

      {/* Main navigation */}
      <Container className="py-3.5">
        <div className="grid grid-cols-[auto_auto_minmax(240px,1fr)_auto] items-center gap-3 lg:gap-5 max-lg:grid-cols-[1fr_auto]">
          <Logo />

          <Link
            className="hidden lg:inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition-all duration-200 hover:scale-102 hover:bg-emerald-700 active:scale-95"
            href={ROUTES.CATALOG}
          >
            <LayoutGrid size={18} />
            Каталог
          </Link>

          <div className="max-lg:col-span-2 max-lg:order-3">
            <ProductSearch />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 max-lg:justify-end">
            <Link
              className="hidden lg:flex flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              href={ROUTES.PROFILE}
            >
              <UserRound size={20} className="mb-0.5" />
              Профиль
            </Link>
            <HeaderFavoritesLink />
            <HeaderCartLink />
          </div>
        </div>

        {/* Categories / Quick Links Sub-bar on desktop */}
        <nav className="hidden lg:flex items-center gap-6 border-t border-slate-100 mt-3 pt-2 text-xs font-semibold text-slate-600">
          {navItems.map((item) => (
            <Link
              className="hover:text-emerald-700 transition-colors py-1 inline-flex items-center gap-1"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
};
