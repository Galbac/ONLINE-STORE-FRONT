"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";
import type { AdminMeResponse, AdminRoleResponse } from "@/entities/admin-auth";
import { AdminLogoutButton } from "@/features/logout-admin";
import { cn, ROUTES } from "@/shared/config";
import { adminNavigationItems } from "../config/navigation";
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
  const visibleNavigationItems = adminNavigationItems.filter((item) =>
    canAccessAdminItem(item, currentUser, permissions),
  );
  const currentNavigationItem = adminNavigationItems.find((item) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
  const canAccessCurrentRoute = currentNavigationItem
    ? canAccessAdminItem(currentNavigationItem, currentUser, permissions)
    : true;

  return (
    <div className="bg-bg-secondary min-h-screen text-text-primary">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-border bg-bg-primary border-b lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <div className="border-border flex items-center gap-3 border-b px-4 py-4 lg:px-5">
              <Link className="flex min-w-0 items-center gap-3" href={ROUTES.ADMIN_DASHBOARD}>
                <span className="bg-accent-primary text-accent-contrast grid size-11 shrink-0 place-items-center rounded-lg">
                  <Store size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-bold">Админ-панель</span>
                  <span className="text-text-muted block truncate text-xs">СуперМаркет</span>
                </span>
              </Link>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3 lg:py-4">
              {visibleNavigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    className={cn(
                      "text-text-secondary hover:bg-bg-hover hover:text-text-primary inline-flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-bold transition",
                      (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
                        "bg-bg-hover text-text-primary",
                      "lg:w-full",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-border bg-bg-primary sticky top-0 z-20 border-b px-4 py-3 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-text-muted text-xs font-bold uppercase">Сотрудник</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-bold sm:text-base">{currentUser.name}</span>
                  <span className="border-border bg-bg-secondary text-text-secondary rounded-lg border px-2 py-1 text-xs font-bold">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <AdminLogoutButton />
            </div>
          </header>

          <main className="px-4 py-5 lg:px-6 lg:py-7">
            {canAccessCurrentRoute ? children : <AdminAccessDenied />}
          </main>
        </div>
      </div>
    </div>
  );
};

const AdminAccessDenied = () => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
      <h1 className="text-2xl font-bold text-text-primary">Недостаточно прав</h1>
      <p className="text-text-secondary mt-3 leading-7">
        У текущего сотрудника нет доступа к этому разделу.
      </p>
    </section>
  );
};
