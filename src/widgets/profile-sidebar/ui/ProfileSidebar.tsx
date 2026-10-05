"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, MapPin, Package, User } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";
import { clearStoredAuth, getStoredRefreshToken } from "@/shared/ui";

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
    const refreshToken = getStoredRefreshToken();

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
    <aside className={cn("w-full shrink-0 lg:w-64", className)}>
      {/* Mobile horizontal pill navigation */}
      <div className="mb-6 flex scrollbar-none items-center gap-2 overflow-x-auto pb-3 lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrent(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-all duration-200",
                active
                  ? "bg-emerald-600 font-semibold text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
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
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap text-rose-600 transition hover:bg-rose-100"
        >
          <LogOut size={15} />
          <span>Выход</span>
        </button>
      </div>

      {/* Desktop vertical sidebar card */}
      <div className="sticky top-24 hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:p-4 lg:block">
        <div className="mb-2 px-3 py-2">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
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
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-200",
                  active
                    ? "border border-emerald-200/60 bg-emerald-50 font-semibold text-emerald-700 shadow-xs"
                    : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
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
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50/80 hover:text-rose-700"
        >
          <LogOut size={19} className="text-rose-500" />
          <span>Выход</span>
        </button>
      </div>
    </aside>
  );
};
