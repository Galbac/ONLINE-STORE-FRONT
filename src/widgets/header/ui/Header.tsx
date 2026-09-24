import Link from "next/link";
import { Clock, LayoutGrid, MapPin, Phone } from "lucide-react";
import { ProductSearch } from "@/features/product-search";
import { ROUTES, STORE_INFO } from "@/shared/config";
import { Container, Logo, PwaInstallButton } from "@/shared/ui";
import { HeaderCartLink } from "./HeaderCartLink";
import { HeaderUserLink } from "./HeaderUserLink";
import { HeaderNav } from "./HeaderNav";
import { HeaderFavoritesLink } from "./HeaderFavoritesLink";



export const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      {/* Top micro bar */}
      <div className="hidden border-b border-slate-100 bg-slate-50/60 py-1.5 text-xs text-slate-500 sm:block">
        <Container className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <MapPin size={13} className="text-emerald-600" />
              {STORE_INFO.city}
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <Clock size={12} className="text-emerald-600" />
              <span>
                {STORE_INFO.workingHours.toLowerCase().includes("круглосут")
                  ? "Круглосуточная доставка 24/7"
                  : `Доставка: ${STORE_INFO.workingHours}`}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <PwaInstallButton variant="header" />
            <a
              className="inline-flex items-center gap-1.5 font-bold text-slate-700 transition hover:text-emerald-700"
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
        <div className="grid grid-cols-[auto_auto_minmax(240px,1fr)_auto] items-center gap-3 max-lg:grid-cols-[1fr_auto] lg:gap-5">
          <Logo />

          <Link
            className="hidden h-11 items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition-all duration-200 hover:scale-102 hover:bg-emerald-700 active:scale-95 lg:inline-flex"
            href={ROUTES.CATALOG}
          >
            <LayoutGrid size={18} />
            Каталог
          </Link>

          <div className="max-lg:order-3 max-lg:col-span-2">
            <ProductSearch />
          </div>

          <div className="flex items-center gap-1 max-lg:justify-end sm:gap-2">
            <HeaderUserLink />
            <HeaderFavoritesLink />
            <HeaderCartLink />
          </div>
        </div>

        <HeaderNav />
      </Container>
    </header>
  );
};
