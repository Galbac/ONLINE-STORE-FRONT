"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Heart, LogOut, MapPin, Package, User } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";
import { clearStoredAuth } from "@/shared/ui";

interface ProfileSidebarProps {
  activeItem?: "profile" | "orders" | "addresses" | "favorites";
  className?: string;
}

interface NavItem {
  id: "profile" | "orders" | "addresses" | "favorites";
  label: string;
  href: string;
  icon: typeof User;
}

const navItems: NavItem[] = [
  { id: "profile", label: "Личные данные", href: ROUTES.PROFILE, icon: User },
  { id: "orders", label: "Мои заказы", href: ROUTES.PROFILE_ORDERS, icon: Package },
  { id: "addresses", label: "Адреса доставки", href: ROUTES.PROFILE_ADDRESSES, icon: MapPin },
  { id: "favorites", label: "Избранное", href: ROUTES.PROFILE_FAVORITES, icon: Heart },
];

export const ProfileSidebar = ({ activeItem, className }: ProfileSidebarProps) => {
  const pathname = usePathname();

  const handleLogout = async (): Promise<void> => {
    const refreshToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem("refresh_token") ??
          window.sessionStorage.getItem("refresh_token")
        : null;

    try {
      if (refreshToken) {
        await authApi.logout({ refresh_token: refreshToken });
      }
    } catch {
      // Local logout fallback
    } finally {
      clearStoredAuth();
      if (typeof window !== "undefined") {
        window.location.href = ROUTES.LOGIN;
      }
    }
  };

  const isCurrent = (item: NavItem): boolean => {
    if (activeItem) {
      return activeItem === item.id;
    }
    return pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false);
  };

  return (
    <aside className={cn("w-full lg:w-64 shrink-0", className)}>
      {/* Mobile horizontal pill navigation */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrent(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                active
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
              )}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 shrink-0 transition cursor-pointer"
        >
          <LogOut size={15} />
          <span>Выход</span>
        </button>
      </div>

      {/* Desktop vertical sidebar card */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs sticky top-24">
        <div className="px-3 py-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Личный кабинет
          </span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-200",
                  active
                    ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium",
                )}
              >
                <Icon size={19} className={active ? "text-emerald-600" : "text-slate-400"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="my-3 border-t border-slate-100" />

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={19} className="text-rose-500" />
          <span>Выход</span>
        </button>
      </div>
    </aside>
  );
};
