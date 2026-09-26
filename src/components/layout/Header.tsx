"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, LayoutGrid, MapPin, Phone } from "lucide-react";
import { ProductSearch } from "@/features/product-search";
import { ROUTES, STORE_INFO } from "@/shared/config";
import { Container, Logo, PwaInstallButton } from "@/shared/ui";
import { HeaderCartLink } from "@/widgets/header/ui/HeaderCartLink";
import { HeaderFavoritesLink } from "@/widgets/header/ui/HeaderFavoritesLink";
import { HeaderNav } from "@/widgets/header/ui/HeaderNav";
import { HeaderUserLink } from "@/widgets/header/ui/HeaderUserLink";

export const Header = () => {
  const [isScrolledCompact, setIsScrolledCompact] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (currentScrollY > 70) {
            // Если прокрутили вниз более 70px
            if (currentScrollY > lastScrollYRef.current) {
              // Скролл вниз — сжимаем хедер
              setIsScrolledCompact(true);
            } else if (lastScrollYRef.current - currentScrollY > 10) {
              // Заметный скролл вверх — возвращаем навигацию
              setIsScrolledCompact(false);
            }
          } else {
            // В самом верху страницы всегда полный вид
            setIsScrolledCompact(false);
          }
          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 shadow-xs">
      {/* 1. Верхний микро-бар (с интеллектуальным скрытием при скролле) */}
      <div
        className={`border-b border-slate-100 bg-slate-50/70 text-xs text-slate-500 transition-all duration-300 overflow-hidden ${
          isScrolledCompact ? "max-h-0 py-0 opacity-0 border-transparent" : "max-h-12 py-1.5 opacity-100"
        }`}
      >
        <Container className="flex items-center justify-between gap-4">
          {/* На мобилках: только город («Кизляр») и телефон в одну строку */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <MapPin size={13} className="text-emerald-600 shrink-0" />
              <span>{STORE_INFO.city}</span>
            </span>

            {/* Скрываем длинный текст на мобильных устройствах (< md) */}
            <span className="hidden md:inline-flex items-center gap-3">
              <span className="text-slate-300 select-none">|</span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Clock size={12} className="text-emerald-600 shrink-0" />
                <span>Заказы онлайн 24/7 • Доставка курьером 08:00–22:00</span>
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <PwaInstallButton variant="header" />
            </div>
            <a
              className="inline-flex items-center gap-1.5 font-bold text-slate-700 transition hover:text-emerald-700 text-xs shrink-0"
              href={STORE_INFO.phoneHref}
            >
              <Phone size={13} className="text-emerald-600 shrink-0" />
              <span>{STORE_INFO.phone}</span>
            </a>
          </div>
        </Container>
      </div>

      {/* 2. Главная навигационная полоса: компактная (64px) при скролле */}
      <Container
        className={`transition-all duration-300 ${
          isScrolledCompact ? "py-2 sm:h-16 flex flex-col justify-center" : "py-3 sm:py-3.5"
        }`}
      >
        <div className="grid grid-cols-[auto_auto_minmax(200px,1fr)_auto] items-center gap-3 max-lg:grid-cols-[1fr_auto] lg:gap-5">
          <Logo />

          <Link
            className="hidden h-11 items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition-all duration-200 hover:scale-102 hover:bg-emerald-700 active:scale-95 lg:inline-flex shrink-0"
            href={ROUTES.CATALOG}
          >
            <LayoutGrid size={18} />
            Каталог
          </Link>

          {/* Строка поиска: на мобилках занимает полную ширину */}
          <div className="max-lg:order-3 max-lg:col-span-2 w-full">
            <ProductSearch />
          </div>

          {/* Панель пользователя: Избранное и Корзина скрыты на мобилках (< md), т.к. они в BottomNav */}
          <div className="flex items-center gap-1 max-lg:justify-end sm:gap-2 shrink-0">
            <HeaderUserLink />
            <HeaderFavoritesLink />
            <HeaderCartLink />
          </div>
        </div>

        {/* 3. Подменю категорий: плавно сворачивается при скролле вниз */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            isScrolledCompact ? "max-h-0 opacity-0 mt-0" : "max-h-16 opacity-100"
          }`}
        >
          <HeaderNav />
        </div>
      </Container>
    </header>
  );
};
