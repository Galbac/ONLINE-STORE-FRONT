"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Store, X } from "lucide-react";

import type { AdminMeResponse, AdminRoleResponse } from "@/entities/admin-auth";
import { AdminLogoutButton } from "@/features/logout-admin";
import { cn, ROUTES, STORE_INFO } from "@/shared/config";
import { adminNavigationGroups, adminNavigationItems } from "../config/navigation";
import {
  canAccessAdminItem,
  getAdminRoleLabel,
  getEffectiveAdminPermissions,
} from "../lib/permissions";

interface AdminShellProps {
  children: React.ReactNode;
  currentUser: AdminMeResponse;
  roles: AdminRoleResponse[];
}

const getActiveAdminNavigationItem = (
  items: typeof adminNavigationItems,
  pathname: string,
) => {
  // 1. Exact match takes highest priority
  const exact = items.find((item) => item.href === pathname);
  if (exact) return exact;

  // 2. Longest matching prefix for subroutes (e.g., /admin/orders/assembly vs /admin/orders)
  const matches = items.filter(
    (item) => item.href !== ROUTES.ADMIN_DASHBOARD && pathname.startsWith(`${item.href}/`),
  );

  if (matches.length === 0) return null;

  return matches.sort((a, b) => b.href.length - a.href.length)[0];
};

export const AdminShell = ({ children, currentUser, roles }: AdminShellProps) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const roleLabel = getAdminRoleLabel(currentUser, roles);
  const permissions = getEffectiveAdminPermissions(currentUser, roles);

  // Close mobile menu upon navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Grouped items with permission filter
  const visibleGroups = adminNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessAdminItem(item, currentUser, permissions)),
    }))
    .filter((group) => group.items.length > 0);

  const activeNavigationItem = getActiveAdminNavigationItem(adminNavigationItems, pathname);
  const currentNavigationItem = activeNavigationItem;
  const canAccessCurrentRoute = currentNavigationItem
    ? canAccessAdminItem(currentNavigationItem, currentUser, permissions)
    : true;

  // Format user name cleanly
  const cleanUserName = (() => {
    if (!currentUser.name) return "Сотрудник";
    const words = currentUser.name.trim().split(/\s+/);
    return Array.from(new Set(words)).join(" ");
  })();

  const isDashboardActive = pathname === ROUTES.ADMIN_DASHBOARD;

  return (
    <div className="bg-bg-secondary text-text-primary min-h-screen">
      {/* Mobile Sticky Header (всегда зафиксирован на планшетах и смартфонах) */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню навигации"}
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Всегда видимая кнопка Дашборд на мобильных при любом скролле */}
          <Link
            href={ROUTES.ADMIN_DASHBOARD}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition shadow-2xs shrink-0",
              isDashboardActive
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80",
            )}
            title="Перейти в дашборд"
          >
            <LayoutDashboard size={14} className={isDashboardActive ? "text-white" : "text-emerald-600"} />
            <span>Дашборд</span>
          </Link>

          <Link href={ROUTES.ADMIN_DASHBOARD} className="truncate text-xs font-black text-slate-800 hidden sm:block">
            {STORE_INFO.name}
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 hidden sm:inline-block">
            {roleLabel}
          </span>
          <AdminLogoutButton />
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="lg:flex lg:min-h-screen">
        {/* Desktop & Mobile Sidebar (на десктопе всегда зафиксирован sticky top-0 h-screen, на мобилках выезжает по кнопке) */}
        <aside
          className={cn(
            "border-border bg-white border-r flex flex-col z-50 transition-transform duration-200 ease-in-out",
            // Desktop: Permanently fixed on the left
            "lg:translate-x-0 lg:w-[270px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:z-30",
            // Mobile: Slide-over drawer
            "fixed inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl lg:shadow-none",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* Sidebar Header */}
          <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-4 lg:px-5 shrink-0 bg-white">
            <Link className="flex min-w-0 items-center gap-3 group" href={ROUTES.ADMIN_DASHBOARD}>
              <span className="bg-emerald-600 text-white grid size-10 shrink-0 place-items-center rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                <Store size={20} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Админ-панель
                </span>
                <span className="text-slate-400 block truncate text-[11px] font-semibold">
                  {STORE_INFO.name}
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden cursor-pointer"
              aria-label="Закрыть меню"
            >
              <X size={18} />
            </button>
          </div>

          {/* Grouped Sidebar Navigation с плавным внутренним скроллом */}
          <nav className="flex-1 w-full space-y-4 px-3 py-3 overflow-y-auto overscroll-contain">
            {visibleGroups.map((group) => (
              <div key={group.id} className="w-full space-y-1">
                <div className="px-3 pt-1.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavigationItem?.href === item.href;

                  return (
                    <Link
                      onClick={() => setIsMobileMenuOpen(false)}
                      prefetch={true}
                      className={cn(
                        "flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-xs font-bold transition-all",
                        isActive
                          ? "bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200/80 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                      href={item.href}
                      key={item.href}
                    >
                      <Icon size={16} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Desktop Header: всегда зафиксирован вверху со ссылкой на Дашборд */}
          <header className="border-border bg-white/95 backdrop-blur-md sticky top-0 z-20 border-b px-4 py-3 lg:px-6 shadow-2xs hidden lg:block">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Всегда видимая кнопка Дашборд на десктопе */}
                <Link
                  href={ROUTES.ADMIN_DASHBOARD}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs",
                    isDashboardActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80",
                  )}
                  title="Перейти в дашборд"
                >
                  <LayoutDashboard size={14} className={isDashboardActive ? "text-white" : "text-emerald-600"} />
                  <span>Дашборд</span>
                </Link>

                <div className="h-4 w-px bg-slate-200" />

                <div className="min-w-0">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Сотрудник</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="truncate text-xs sm:text-sm font-black text-slate-900">
                      {cleanUserName}
                    </span>
                    <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  title="Открыть витрину магазина"
                >
                  <Store size={14} className="text-emerald-600" />
                  <span>В магазин</span>
                </Link>
                <AdminLogoutButton />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 lg:px-6 lg:py-7">
            {canAccessCurrentRoute ? children : <AdminAccessDenied />}
          </main>
        </div>
      </div>
    </div>
  );
};

const AdminAccessDenied = () => {
  return (
    <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
      <h1 className="text-text-primary text-2xl font-bold">Недостаточно прав</h1>
      <p className="text-text-secondary mt-3 leading-7">
        У текущего сотрудника нет доступа к этому разделу.
      </p>
    </section>
  );
};
