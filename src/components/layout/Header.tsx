"use client";

import { StoreBranchSelector } from "@/widgets/header/ui/StoreBranchSelector";
import Link from "next/link";
import { LayoutGrid, MapPin, Phone } from "lucide-react";
import { HeaderSearch } from "./HeaderSearch";
import { ROUTES } from "@/shared/config";
import { useDynamicStoreInfo } from "@/entities/settings";
import { Container, Logo, PwaInstallButton } from "@/shared/ui";
import { HeaderCartLink } from "@/widgets/header/ui/HeaderCartLink";
import { HeaderFavoritesLink } from "@/widgets/header/ui/HeaderFavoritesLink";
import { HeaderNav } from "@/widgets/header/ui/HeaderNav";
import { HeaderUserLink } from "@/widgets/header/ui/HeaderUserLink";

export const Header = () => {
  const { city, phone, phoneHref } = useDynamicStoreInfo();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      {/* 1. Верхний микро-бар (стабильно зафиксирован, без прыжков) */}
      <div className="hidden sm:block border-b border-slate-100 bg-slate-50/70 text-xs text-slate-500 py-1.5">
        <Container className="flex items-center justify-between gap-4">
          {/* Город и выбор филиала */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <MapPin size={13} className="text-emerald-600 shrink-0" />
              <span>{city}</span>
            </span>
            <StoreBranchSelector />

            {/* Часы работы и статус доставки */}
            <div className="hidden lg:inline-flex items-center gap-2.5 shrink-0">
              <span className="text-slate-300 select-none">|</span>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-950 shadow-2xs">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                </span>
                <span className="font-bold text-emerald-900">Заказы онлайн 24/7</span>
                <span className="text-emerald-300 select-none">•</span>
                <span className="text-emerald-800 font-medium">Доставка 08:00–22:00</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block">
              <PwaInstallButton variant="header" />
            </div>
            <a
              className="inline-flex items-center gap-1.5 font-bold text-slate-700 transition hover:text-emerald-700 text-xs shrink-0"
              href={phoneHref}
            >
              <Phone size={13} className="text-emerald-600 shrink-0" />
              <span>{phone}</span>
            </a>
          </div>
        </Container>
      </div>

      {/* 2. Главная навигационная полоса */}
      <Container className="py-2.5 sm:py-3">
        <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[auto_auto_minmax(200px,1fr)_auto] lg:items-center lg:gap-5">
          <div className="flex items-center justify-between gap-3">
            <Logo />
            <div className="flex items-center gap-2 sm:hidden">
              <StoreBranchSelector />
            </div>
          </div>

          <Link
            className="hidden h-11 items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition-all duration-200 hover:scale-102 hover:bg-emerald-700 active:scale-95 lg:inline-flex shrink-0"
            href={ROUTES.CATALOG}
          >
            <LayoutGrid size={18} />
            Каталог
          </Link>

          {/* Строка поиска */}
          <div className="w-full">
            <HeaderSearch />
          </div>

          {/* Панель пользователя: скрыта на мобилках и планшетах (< lg), т.к. корзина и избранное есть в BottomNav */}
          <div className="hidden lg:flex items-center gap-1 sm:gap-2 shrink-0">
            <HeaderUserLink />
            <HeaderFavoritesLink />
            <HeaderCartLink />
          </div>
        </div>

        {/* 3. Подменю категорий товаров */}
        <div className="mt-2 pt-2 border-t border-slate-100/80">
          <HeaderNav />
        </div>
      </Container>
    </header>
  );
};
