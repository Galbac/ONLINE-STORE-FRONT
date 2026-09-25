"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Package,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  X,
} from "lucide-react";
import {
  notificationApi,
  type NotificationListParams,
  type NotificationListResponse,
  type NotificationResponse,
} from "@/entities/notification";
import { cn, ROUTES } from "@/shared/config";
import { Button, Container, getStoredAccessToken } from "@/shared/ui";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

type NotificationFilter = "all" | "unread" | "order" | "payment" | "delivery";

interface FilterOption {
  label: string;
  value: NotificationFilter;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const filterOptions: FilterOption[] = [
  { label: "Все", value: "all", icon: Bell },
  { label: "Непрочитанные", value: "unread", icon: BellRing },
  { label: "Заказы", value: "order", icon: ShoppingBag },
  { label: "Оплата", value: "payment", icon: CreditCard },
  { label: "Доставка", value: "delivery", icon: Truck },
];

const emptyNotifications: NotificationListResponse = {
  items: [],
  total: 0,
  unread_count: 0,
  page: 1,
  limit: 20,
  pages: 0,
};

export const ProfileNotificationsView = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [pendingNotificationId, setPendingNotificationId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const {
    permission,
    isSubscribed,
    isLoading: isPushLoading,
    isTesting: isPushTesting,
    isBannerDismissed,
    requestPermission,
    sendTestPush,
    dismissBanner,
  } = usePushNotifications();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadNotifications = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await notificationApi.getList(
          toNotificationParams(activeFilter),
          accessToken,
        );

        if (active) {
          setNotifications(response.items);
          setUnreadCount(response.unread_count);
        }
      } catch {
        if (active) {
          setNotifications(emptyNotifications.items);
          setUnreadCount(emptyNotifications.unread_count);
          setErrorMessage("Не удалось загрузить уведомления.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      active = false;
    };
  }, [activeFilter]);

  const handleMarkAsRead = (notification: NotificationResponse): void => {
    const accessToken = getStoredAccessToken();

    startTransition(async () => {
      try {
        setPendingNotificationId(notification.id);
        setErrorMessage(null);
        const updatedNotification = await notificationApi.markAsRead(notification.id, accessToken);

        setNotifications((current) =>
          current.map((item) =>
            item.id === updatedNotification.id ? updatedNotification : item,
          ),
        );
        setUnreadCount((current) => Math.max(current - 1, 0));
        toast.success("Уведомление отмечено как прочитанное");
      } catch {
        toast.error("Не удалось отметить уведомление как прочитанное");
      } finally {
        setPendingNotificationId(null);
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    const accessToken = getStoredAccessToken();
    const unreadItems = notifications.filter((item) => !item.is_read);
    if (unreadItems.length === 0) return;

    startTransition(async () => {
      try {
        for (const item of unreadItems) {
          await notificationApi.markAsRead(item.id, accessToken);
        }
        setNotifications((current) =>
          current.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() })),
        );
        setUnreadCount(0);
        toast.success("Все уведомления прочитаны");
      } catch {
        toast.error("Часть уведомлений не удалось обновить");
      }
    });
  };

  // Показываем промо-баннер только если статус браузера 'default' и баннер не закрыт
  const showPushBanner = isMounted && permission === "default" && !isBannerDismissed;

  return (
    <main className="bg-bg-primary min-h-[75vh]">
      <Container className="py-6 md:py-8">
        {/* Хлебные крошки */}
        <nav aria-label="Навигация" className="text-text-secondary mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary transition-colors" href={ROUTES.HOME}>
            Главная
          </Link>
          <span aria-hidden="true">/</span>
          <Link className="hover:text-accent-primary transition-colors" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-text-primary font-medium" aria-current="page">Уведомления</span>
        </nav>

        {/* Заголовок страницы (H1) со счетчиком и действием */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-text-primary text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                Уведомления
              </h1>
              {isMounted && unreadCount > 0 && (
                <span
                  role="status"
                  aria-live="polite"
                  className="inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  {unreadCount} новых
                </span>
              )}
            </div>
            <p className="text-text-secondary mt-1 text-sm sm:text-base">
              Заказы, оплата и доставка в одном списке.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {isMounted && permission === "granted" && isSubscribed && (
              <Button
                variant="secondary"
                onClick={sendTestPush}
                disabled={isPushTesting}
                className="min-h-[44px] px-3.5 text-xs font-semibold gap-1.5"
                title="Проверить работу Push-уведомлений"
              >
                <BellRing size={15} className="text-emerald-600" />
                <span>{isPushTesting ? "Отправка..." : "Тест пуша"}</span>
              </Button>
            )}

            {isMounted && unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="min-h-[44px] px-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors rounded-xl hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <CheckCircle2 size={16} />
                <span>Прочитать все</span>
              </button>
            )}
          </div>
        </header>

        {/* Баннер Push-уведомлений (H2) - отображается безопасно и только когда статус 'default' */}
        {showPushBanner && (
          <section
            aria-labelledby="push-banner-heading"
            className="mb-8 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-teal-50/30 p-4 sm:p-6 shadow-sm transition-all duration-300"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
                  <Smartphone size={22} />
                </span>
                <div>
                  <h2
                    id="push-banner-heading"
                    className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
                  >
                    Включите push-уведомления
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-600 max-w-xl">
                    Моментально узнавайте о статусе доставки, выезде курьера и персональных спецпредложениях.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0 self-end sm:self-center">
                <Button
                  onClick={requestPermission}
                  disabled={isPushLoading}
                  className="min-h-[44px] px-5 text-sm font-bold gap-2 shadow-sm shadow-emerald-700/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <BellRing size={16} />
                  <span>{isPushLoading ? "Подключение..." : "Включить пуши"}</span>
                </Button>
                <button
                  type="button"
                  onClick={dismissBanner}
                  aria-label="Закрыть предложение push-уведомлений"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Группа табов с доступностью (ARIA tablist + горизонтальный скролл на мобильных) */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-6 border-b border-border/60">
          <nav
            role="tablist"
            aria-label="Фильтры уведомлений"
            className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none"
          >
            {filterOptions.map((option) => {
              const Icon = option.icon;
              const isActive = activeFilter === option.value;
              const showBadge = option.value === "unread" && isMounted && unreadCount > 0;

              return (
                <button
                  key={option.value}
                  id={`tab-${option.value}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${option.value}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveFilter(option.value)}
                  className={cn(
                    "min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all duration-200 active:scale-[0.98] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    isActive
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10"
                      : "border-border bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-700",
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{option.label}</span>
                  {showBadge && (
                    <span
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "ml-1 px-1.5 py-0.5 text-xs rounded-full font-extrabold",
                        isActive
                          ? "bg-emerald-800 text-white"
                          : "bg-emerald-100 text-emerald-800",
                      )}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {errorMessage && (
          <p className="text-error mb-4 rounded-xl bg-red-50 p-4 text-sm border border-red-200">
            {errorMessage}
          </p>
        )}

        {/* Панель таба (ARIA tabpanel) */}
        <section
          role="tabpanel"
          id={`tabpanel-${activeFilter}`}
          aria-labelledby={`tab-${activeFilter}`}
          className="space-y-4"
        >
          {/* Скелетоны загрузки */}
          {isLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Загрузка уведомлений">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-white p-5 animate-pulse flex items-start gap-4 shadow-sm"
                >
                  <div className="size-12 rounded-2xl bg-slate-200 shrink-0" />
                  <div className="space-y-2.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                    <div className="h-3 bg-slate-200 rounded w-1/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            /* Список уведомлений */
            <ul className="space-y-3" role="list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isMounted={isMounted}
                  pending={pendingNotificationId === notification.id && isPending}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </ul>
          ) : (
            /* Конверсионный Empty State с 2 кнопками */
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
              <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <BellOff size={32} />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h2 className="text-xl font-bold text-slate-900">
                  {activeFilter === "unread"
                    ? "Все уведомления прочитаны"
                    : "Уведомлений пока нет"}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {activeFilter === "unread"
                    ? "У вас нет непрочитанных сообщений. Новые оповещения о доставке появятся здесь."
                    : "Здесь будут отображаться этапы доставки ваших заказов, чеки оплаты и персональные скидки."}
                </p>
              </div>

              {/* Две конверсионные CTA кнопки */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 w-full sm:w-auto">
                <Link
                  href={ROUTES.CATALOG}
                  className="min-h-[44px] w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm shadow-emerald-700/20 hover:shadow transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  <ShoppingBag size={18} />
                  <span>Перейти в каталог</span>
                </Link>

                <Link
                  href={ROUTES.PROFILE_ORDERS}
                  className="min-h-[44px] w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 font-bold text-sm shadow-sm transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Package size={18} />
                  <span>Мои заказы</span>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Блок доверия и настроек (H3) */}
        <footer className="mt-10 pt-6 border-t border-border/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-border flex items-start gap-3.5 shadow-sm">
              <ShieldCheck className="size-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Безопасность данных
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Мы отправляем только важную информацию о заказах и доставке, надежно защищая ваши персональные данные.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-border flex items-start gap-3.5 shadow-sm">
              <RotateCcw className="size-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Управление уведомлениями
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Вы всегда можете отключить или настроить push-уведомления в настройках вашего браузера в любое время.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </Container>
    </main>
  );
};

interface NotificationItemProps {
  notification: NotificationResponse;
  isMounted: boolean;
  pending: boolean;
  onMarkAsRead: (notification: NotificationResponse) => void;
}

const NotificationItem = ({
  notification,
  isMounted,
  onMarkAsRead,
  pending,
}: NotificationItemProps) => {
  const Icon = getNotificationIcon(notification.type);

  return (
    <li
      className={cn(
        "group relative rounded-2xl border p-4 sm:p-5 flex items-start gap-4 transition-all duration-200",
        !notification.is_read
          ? "bg-emerald-50/30 border-emerald-500/30 shadow-sm"
          : "bg-white border-border hover:border-slate-300",
      )}
    >
      <span className="size-11 sm:size-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
        <Icon size={22} />
      </span>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 truncate">
              {notification.title}
            </h3>
            {!notification.is_read && (
              <span
                title="Не прочитано"
                className="size-2.5 rounded-full bg-emerald-500 shrink-0"
              />
            )}
          </div>
          <time
            dateTime={notification.created_at}
            suppressHydrationWarning
            className="text-xs text-slate-400 shrink-0"
          >
            {isMounted ? formatDateTime(notification.created_at) : ""}
          </time>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {notification.message}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
          <span className="font-medium text-slate-500">
            {getNotificationTypeLabel(notification.type)}
          </span>
          {notification.read_at && isMounted && (
            <span>• Прочитано {formatDateTime(notification.read_at)}</span>
          )}
          {notification.type.includes("order") && (
            <Link
              href={ROUTES.PROFILE_ORDERS}
              className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 min-h-[32px]"
            >
              <span>К заказам</span>
              <ChevronRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {!notification.is_read && (
        <button
          type="button"
          onClick={() => onMarkAsRead(notification)}
          disabled={pending}
          title="Отметить как прочитанное"
          aria-label="Отметить как прочитанное"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0 self-center disabled:opacity-50"
        >
          <CheckCircle2 size={20} />
        </button>
      )}
    </li>
  );
};

const toNotificationParams = (filter: NotificationFilter): NotificationListParams => {
  if (filter === "unread") {
    return { unread_only: true, page: 1, limit: 20 };
  }

  if (filter === "all") {
    return { page: 1, limit: 20 };
  }

  return { type: filter, page: 1, limit: 20 };
};

const getNotificationIcon = (type: string): typeof Bell => {
  if (type.includes("order")) return PackageCheck;
  if (type.includes("payment")) return CreditCard;
  if (type.includes("delivery")) return Truck;

  return Bell;
};

const getNotificationTypeLabel = (type: string): string => {
  if (type.includes("order")) return "Заказ";
  if (type.includes("payment")) return "Оплата";
  if (type.includes("delivery")) return "Доставка";

  return "Уведомление";
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
