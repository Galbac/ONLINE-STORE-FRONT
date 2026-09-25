import {
  Activity,
  BadgePercent,
  Bell,
  ClipboardList,
  FileText,
  FolderTree,
  Headphones,
  Images,
  LayoutDashboard,
  MessageSquare,
  Package,
  PackageCheck,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  TicketPercent,
  Truck,
  Users,
} from "lucide-react";
import { ROUTES } from "@/shared/config";

export interface AdminNavigationItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  requiredPermissions: string[];
}

export interface AdminNavigationGroup {
  id: string;
  title: string;
  items: AdminNavigationItem[];
}

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    id: "operations",
    title: "Операции",
    items: [
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
        href: ROUTES.ADMIN_ORDERS_ASSEMBLY,
        icon: PackageCheck,
        label: "Сборка",
        requiredPermissions: ["admin.orders.pick", "orders.pick", "admin:orders:pick"],
      },
      {
        href: ROUTES.ADMIN_ORDERS_COURIER,
        icon: Truck,
        label: "Курьер",
        requiredPermissions: ["admin.orders.deliver", "orders.deliver", "admin:orders:deliver"],
      },
      {
        href: ROUTES.ADMIN_FEEDBACK,
        icon: Headphones,
        label: "Поддержка",
        requiredPermissions: ["admin.settings.read", "settings.read", "settings:view"],
      },
      {
        href: ROUTES.ADMIN_REVIEWS,
        icon: MessageSquare,
        label: "Отзывы",
        requiredPermissions: ["admin.settings.read", "settings.read", "settings:view"],
      },
    ],
  },
  {
    id: "catalog_marketing",
    title: "Каталог и маркетинг",
    items: [
      {
        href: ROUTES.ADMIN_PRODUCTS,
        icon: Package,
        label: "Товары",
        requiredPermissions: ["admin.products.read", "products.read", "products:view"],
      },
      {
        href: ROUTES.ADMIN_CATEGORIES,
        icon: FolderTree,
        label: "Категории",
        requiredPermissions: ["admin.categories.read", "categories.read", "categories:view"],
      },
      {
        href: ROUTES.ADMIN_DELIVERY,
        icon: Truck,
        label: "Доставка",
        requiredPermissions: ["admin.delivery.read", "delivery.read", "delivery:view"],
      },
      {
        href: ROUTES.ADMIN_DISCOUNTS,
        icon: BadgePercent,
        label: "Скидки",
        requiredPermissions: ["admin.discounts.read", "discounts.read", "discounts:view"],
      },
      {
        href: ROUTES.ADMIN_PROMO_CODES,
        icon: TicketPercent,
        label: "Промокоды",
        requiredPermissions: ["admin.promo_codes.read", "promo_codes.read", "promo-codes:view"],
      },
      {
        href: ROUTES.ADMIN_BANNERS,
        icon: Sparkles,
        label: "Баннеры",
        requiredPermissions: ["admin.settings.read", "settings.read", "settings:view"],
      },
    ],
  },
  {
    id: "system",
    title: "Система",
    items: [
      {
        href: ROUTES.ADMIN_USERS,
        icon: Users,
        label: "Пользователи",
        requiredPermissions: ["admin.users.read", "users.read", "users:view"],
      },
      {
        href: ROUTES.ADMIN_STAFF,
        icon: Shield,
        label: "Сотрудники",
        requiredPermissions: ["admin.staff.read", "staff.read", "staff:view"],
      },
      {
        href: ROUTES.ADMIN_INTEGRATION_1C,
        icon: RefreshCw,
        label: "1С Синхронизация",
        requiredPermissions: ["admin.integration.read", "integration.read", "integration:view"],
      },
      {
        href: ROUTES.ADMIN_NOTIFICATIONS,
        icon: Bell,
        label: "Уведомления",
        requiredPermissions: ["admin.notifications.read", "notifications.read", "notifications:view"],
      },
      {
        href: ROUTES.ADMIN_UPLOADS,
        icon: Images,
        label: "Файлы",
        requiredPermissions: ["admin.uploads.read", "uploads.read", "uploads:view"],
      },
      {
        href: ROUTES.ADMIN_LEGAL_DOCUMENTS,
        icon: FileText,
        label: "Оферта и документы",
        requiredPermissions: ["admin.settings.read", "settings.read", "settings:view"],
      },
      {
        href: ROUTES.ADMIN_SYSTEM_HEALTH,
        icon: Activity,
        label: "Состояние (Health)",
        requiredPermissions: ["admin.system.health.read", "system.health.read", "system-health:view"],
      },
      {
        href: ROUTES.ADMIN_SETTINGS,
        icon: Settings,
        label: "Настройки",
        requiredPermissions: ["admin.settings.read", "settings.read", "settings:view"],
      },
    ],
  },
];

// Flat export for backwards compatibility
export const adminNavigationItems = adminNavigationGroups.flatMap((g) => g.items);
