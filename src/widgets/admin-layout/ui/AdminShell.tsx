"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";

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

export const AdminShell = ({ children, currentUser, roles }: AdminShellProps) => {
  const pathname = usePathname();
  const roleLabel = getAdminRoleLabel(currentUser, roles);
  const permissions = getEffectiveAdminPermissions(currentUser, roles);

  // Grouped items with permission filter
  const visibleGroups = adminNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessAdminItem(item, currentUser, permissions)),
    }))
    .filter((group) => group.items.length > 0);

  const currentNavigationItem = adminNavigationItems.find((item) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
  const canAccessCurrentRoute = currentNavigationItem
    ? canAccessAdminItem(currentNavigationItem, currentUser, permissions)
    : true;

  // Format user name and avoid repeating e.g. "Администратор Администратор"
  const cleanUserName = (() => {
    if (!currentUser.name) return "Сотрудник";
    const words = currentUser.name.trim().split(/\s+/);
    return Array.from(new Set(words)).join(" ");
  })();

  return (
    <div className="bg-bg-secondary text-text-primary min-h-screen overflow-x-hidden">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-border bg-bg-primary max-w-full overflow-hidden border-b lg:border-r lg:border-b-0">
          <div className="flex h-full flex-col">
            <div className="border-border flex items-center gap-3 border-b px-4 py-4 lg:px-5">
              <Link className="flex min-w-0 items-center gap-3" href={ROUTES.ADMIN_DASHBOARD}>
                <span className="bg-emerald-600 text-white grid size-10 shrink-0 place-items-center rounded-xl shadow-xs">
                  <Store size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-slate-900">Админ-панель</span>
                  <span className="text-slate-400 block truncate text-[11px] font-semibold">{STORE_INFO.name}</span>
                </span>
              </Link>
            </div>

            {/* Structured Grouped Sidebar Navigation */}
            <nav className="flex w-full max-w-full flex-wrap gap-4 px-4 py-3 lg:flex-1 lg:flex-col lg:flex-nowrap lg:px-3 lg:py-4 overflow-y-auto">
              {visibleGroups.map((group) => (
                <div key={group.id} className="w-full space-y-1">
                  <div className="hidden lg:block px-3 pt-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.title}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        className={cn(
                          "inline-flex h-9 shrink-0 items-center gap-2.5 rounded-xl px-3 text-xs font-bold transition-all",
                          isActive
                            ? "bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200/80 shadow-2xs"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                          "lg:w-full",
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
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-border bg-bg-primary sticky top-0 z-20 border-b px-4 py-3 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
              <AdminLogoutButton />
            </div>
          </header>

          <main className="min-w-0 overflow-x-hidden px-4 py-5 lg:px-6 lg:py-7">
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
