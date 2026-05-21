import Link from "next/link";
import { Heart, MapPin, Menu, Phone, ShoppingCart, UserRound } from "lucide-react";
import { ProductSearch } from "@/features/product-search";
import { ROUTES } from "@/shared/config";
import { Button, Container, Logo } from "@/shared/ui";

const navItems = ["О компании", "Доставка и оплата", "Акции", "Магазины", "Карьера", "Контакты"];

export const Header = () => {
  return (
    <header className="border-border bg-bg-primary border-b">
      <Container className="py-4">
        <div className="mb-4 flex items-center justify-between gap-6 text-sm">
          <span className="text-text-secondary inline-flex items-center gap-2">
            <MapPin size={16} className="text-accent-primary" />
            Москва и область
          </span>
          <nav className="text-text-primary hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <Link className="hover:text-accent-primary transition" href="#" key={item}>
                {item}
              </Link>
            ))}
          </nav>
          <a className="inline-flex items-center gap-2 font-bold" href="tel:88005555555">
            <Phone size={16} className="text-accent-primary" />8 (800) 555-55-55
          </a>
        </div>

        <div className="grid grid-cols-[auto_auto_minmax(260px,1fr)_auto] items-center gap-5 max-lg:grid-cols-[1fr_auto]">
          <Logo />
          <Button className="gap-2 px-6 max-lg:order-3 max-lg:w-full" type="button">
            <Menu size={20} />
            Каталог
          </Button>
          <div className="max-lg:order-4 max-lg:col-span-2">
            <ProductSearch />
          </div>
          <div className="flex items-center gap-4 max-lg:justify-end">
            <Link className="hidden text-center text-sm font-semibold md:block" href={ROUTES.LOGIN}>
              <UserRound className="mx-auto mb-1" size={22} />
              Войти
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
              <span className="bg-warning absolute -top-2 -right-2 grid size-5 place-items-center rounded-full text-xs text-white">
                3
              </span>
              Корзина
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
};
