import Link from "next/link";
import { Heart, MapPin, Menu, Phone, ShoppingCart, UserRound } from "lucide-react";

import { ProductSearch } from "@/features/product-search";
import { ROUTES, STORE_INFO } from "@/shared/config";
import { Container, Logo } from "@/shared/ui";

const navItems = [
  {
    href: ROUTES.CATALOG,
    label: "Каталог",
  },
  {
    href: `${ROUTES.CATALOG}?has_discount=true`,
    label: "Акции",
  },
  {
    href: `${ROUTES.CATALOG}?sort=newest`,
    label: "Новинки",
  },
  {
    href: ROUTES.CHECKOUT,
    label: "Доставка",
  },
  {
    href: ROUTES.PROFILE_ORDERS,
    label: "Мои заказы",
  },
] as const;

export const Header = () => {
  return (
    <header className="border-border bg-bg-primary border-b">
      <Container className="py-4">
        <div className="mb-4 flex items-center justify-between gap-6 text-sm">
          <span className="text-text-secondary inline-flex items-center gap-2">
            <MapPin size={16} className="text-accent-primary" />
            {STORE_INFO.city}
          </span>
          <nav className="text-text-primary hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <Link
                className="hover:text-accent-primary transition"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <a className="inline-flex items-center gap-2 font-bold" href={STORE_INFO.phoneHref}>
            <Phone size={16} className="text-accent-primary" />
            {STORE_INFO.phone}
          </a>
        </div>

        <div className="grid grid-cols-[auto_auto_minmax(260px,1fr)_auto] items-center gap-5 max-lg:grid-cols-[1fr_auto]">
          <Logo />
          <Link
            className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold transition max-lg:order-3 max-lg:w-full"
            href={ROUTES.CATALOG}
          >
            <Menu size={20} />
            Каталог
          </Link>
          <div className="max-lg:order-4 max-lg:col-span-2">
            <ProductSearch />
          </div>
          <div className="flex items-center gap-4 max-lg:justify-end">
            <Link
              className="hidden text-center text-sm font-semibold md:block"
              href={ROUTES.PROFILE}
            >
              <UserRound className="mx-auto mb-1" size={22} />
              Профиль
            </Link>
            <Link
              className="hidden text-center text-sm font-semibold md:block"
              href={ROUTES.FAVORITES}
            >
              <Heart className="mx-auto mb-1" size={22} />
              Избранное
            </Link>
            <Link className="relative text-center text-sm font-semibold" href={ROUTES.CART}>
              <ShoppingCart className="mx-auto mb-1" size={22} />
              Корзина
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
};
