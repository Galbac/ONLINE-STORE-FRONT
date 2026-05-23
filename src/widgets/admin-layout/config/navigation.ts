import {
  BadgePercent,
  Bell,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  TicketPercent,
  Truck,
} from "lucide-react";
import { ROUTES } from "@/shared/config";

export interface AdminNavigationItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  requiredPermissions: string[];
}

export const adminNavigationItems: AdminNavigationItem[] = [
  {
    href: ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
    label: "Dashboard",
    requiredPermissions: ["admin.dashboard.read", "dashboard.read", "dashboard:view"],
  },
  {
    href: ROUTES.ADMIN_ORDERS,
    icon: ClipboardList,
    label: "Заказы",
    requiredPermissions: ["admin.orders.read", "orders.read", "orders:view"],
  },
  {
    href: ROUTES.ADMIN_PRODUCTS,
    icon: Package,
    label: "Товары",
    requiredPermissions: ["admin.products.read", "products.read", "products:view"],
  },
  {
    href: ROUTES.ADMIN_DELIVERY,
    icon: Truck,
    label: "Доставка",
    requiredPermissions: ["admin.delivery.read", "delivery.read", "delivery:view"],
  },
  {
    href: ROUTES.ADMIN_PROMO_CODES,
    icon: TicketPercent,
    label: "Промокоды",
    requiredPermissions: ["admin.promo_codes.read", "promo_codes.read", "promo-codes:view"],
  },
  {
    href: ROUTES.ADMIN_DISCOUNTS,
    icon: BadgePercent,
    label: "Скидки",
    requiredPermissions: ["admin.discounts.read", "discounts.read", "discounts:view"],
  },
  {
    href: ROUTES.ADMIN_STAFF,
    icon: Shield,
    label: "Сотрудники",
    requiredPermissions: ["admin.staff.read", "staff.read", "staff:view"],
  },
  {
    href: ROUTES.ADMIN_NOTIFICATIONS,
    icon: Bell,
    label: "Уведомления",
    requiredPermissions: ["admin.notifications.read", "notifications.read", "notifications:view"],
  },
  {
    href: ROUTES.ADMIN_SETTINGS,
    icon: Settings,
    label: "Настройки",
    requiredPermissions: ["admin.settings.read", "settings.read", "settings:view"],
  },
];
