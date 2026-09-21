"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, CreditCard, PackageCheck, Truck } from "lucide-react";
import {
  notificationApi,
  type NotificationListParams,
  type NotificationListResponse,
  type NotificationResponse,
} from "@/entities/notification";
import { cn, ROUTES } from "@/shared/config";
import { Button, Container, getStoredAccessToken } from "@/shared/ui";
import {
  getPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/shared/lib/push-notifications";
import { toast } from "sonner";
import { BellRing, Smartphone } from "lucide-react";

type NotificationFilter = "all" | "unread" | "order" | "payment" | "delivery";

interface FilterOption {
  label: string;
  value: NotificationFilter;
}

const filterOptions: FilterOption[] = [
  { label: "Все", value: "all" },
  { label: "Непрочитанные", value: "unread" },
  { label: "Заказы", value: "order" },
  { label: "Оплата", value: "payment" },
  { label: "Доставка", value: "delivery" },
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
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [pendingNotificationId, setPendingNotificationId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [pushSubscribed, setPushSubscribed] = useState<boolean | null>(null);
  const [isPushToggling, setIsPushToggling] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  useEffect(() => {
    void checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    if (!isPushSupported()) {
      setPushSubscribed(false);
      return;
    }
    const sub = await getPushSubscription();
    setPushSubscribed(Boolean(sub));
  };

  const handleTogglePush = async () => {
    try {
      setIsPushToggling(true);
      if (pushSubscribed) {
        await unsubscribeFromPush();
        setPushSubscribed(false);
        toast.info("Push-уведомления отключены");
      } else {
        const res = await subscribeToPush();
        if (res.success) {
          setPushSubscribed(true);
          toast.success("Push-уведомления успешно подключены!");
        } else {
          toast.error(res.error || "Не удалось подключить уведомления");
        }
      }
    } finally {
      setIsPushToggling(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      setIsTestingPush(true);
      const accessToken = getStoredAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/notifications/push/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        body: JSON.stringify({
          title: "Проверка уведомлений 🔔",
          body: "Push-уведомления работают отлично! Вы будете узнавать о доставке первыми.",
          url: "/profile/notifications",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Тестовое уведомление отправлено!");
      } else {
        toast.error(data.detail || data.message || "Ошибка отправки тестового уведомления");
      }
    } catch {
      toast.error("Не удалось отправить тестовое уведомление");
    } finally {
      setIsTestingPush(false);
    }
  };

  useEffect(() => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const loadNotifications = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await notificationApi.getList(
          toNotificationParams(activeFilter),
          accessToken,
        );

        if (isMounted) {
          setNotifications(response.items);
          setUnreadCount(response.unread_count);
        }
      } catch {
        if (isMounted) {
          setNotifications(emptyNotifications.items);
          setUnreadCount(emptyNotifications.unread_count);
          setErrorMessage("Не удалось загрузить уведомления.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  const unreadVisibleCount = useMemo(() => {
    return notifications.filter((notification) => !notification.is_read).length;
  }, [notifications]);

  const handleMarkAsRead = (notification: NotificationResponse): void => {
    const accessToken = getStoredAccessToken();

    startTransition(async () => {
      try {
        setPendingNotificationId(notification.id);
        setErrorMessage(null);
        const updatedNotification = await notificationApi.markAsRead(notification.id, accessToken);

        setNotifications((currentNotifications) =>
          currentNotifications.map((currentNotification) =>
            currentNotification.id === updatedNotification.id
              ? updatedNotification
              : currentNotification,
          ),
        );
        setUnreadCount((currentCount) => Math.max(currentCount - 1, 0));
        setStatusMessage("Уведомление отмечено как прочитанное.");
      } catch {
        setStatusMessage(null);
        setErrorMessage("Не удалось отметить уведомление как прочитанное.");
      } finally {
        setPendingNotificationId(null);
      }
    });
  };

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span>/</span>
          <span>Уведомления</span>
        </nav>

        <header className="mb-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-text-primary text-3xl sm:text-4xl font-extrabold md:text-5xl tracking-tight">Уведомления</h1>
            <p className="text-text-secondary mt-2 sm:mt-4 text-sm sm:text-base">Заказы, оплата и доставка в одном списке.</p>
          </div>
          <div className="border-border bg-bg-secondary rounded-2xl border px-5 py-3 sm:py-4 self-start md:self-auto">
            <span className="text-text-secondary block text-xs sm:text-sm">Непрочитанные</span>
            <span className="text-text-primary mt-0.5 block text-2xl sm:text-3xl font-black">{unreadCount}</span>
          </div>
        </header>

        {/* Web Push Toggle Card */}
        <div className="mb-8 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
                <Smartphone size={22} />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  Push-уведомления на этом устройстве
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {pushSubscribed
                    ? "Уведомления активны. Вы получите оповещение о выезде курьера и статусе оплаты."
                    : "Включите пуши, чтобы моментально узнавать об изменении статуса заказа."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {pushSubscribed ? (
                <>
                  <Button
                    onClick={handleSendTestPush}
                    disabled={isTestingPush}
                    variant="ghost"
                    className="h-9 px-3 text-xs font-semibold text-emerald-800 bg-emerald-100/60 hover:bg-emerald-100"
                  >
                    <BellRing size={14} className="mr-1.5" />
                    {isTestingPush ? "Отправка..." : "Проверить"}
                  </Button>
                  <Button
                    onClick={handleTogglePush}
                    disabled={isPushToggling}
                    variant="ghost"
                    className="h-9 px-3 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {isPushToggling ? "Секунду..." : "Отключить"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleTogglePush}
                  disabled={isPushToggling}
                  className="h-9 px-4 text-xs font-bold gap-1.5 shadow-sm shadow-emerald-700/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Bell size={14} />
                  {isPushToggling ? "Подключение..." : "Включить пуши"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <section className="mb-6 flex flex-wrap gap-3">
          {filterOptions.map((option) => (
            <button
              className={cn(
                "border-border hover:border-accent-primary rounded-lg border px-4 py-2 text-sm font-bold transition",
                activeFilter === option.value &&
                  "border-accent-primary bg-accent-primary text-accent-contrast",
              )}
              key={option.value}
              type="button"
              onClick={() => {
                setActiveFilter(option.value);
                setStatusMessage(null);
              }}
            >
              {option.label}
            </button>
          ))}
        </section>

        {statusMessage ? (
          <p className="text-success mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm">
            {statusMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-error mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm">{errorMessage}</p>
        ) : null}

        <section className="border-border overflow-hidden rounded-lg border bg-white">
          {isLoading ? (
            <NotificationState title="Загружаем уведомления" text="Получаем актуальные события." />
          ) : notifications.length > 0 ? (
            <ul className="divide-border divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  pending={pendingNotificationId === notification.id && isPending}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </ul>
          ) : (
            <NotificationState
              title="Уведомлений нет"
              text={
                activeFilter === "unread"
                  ? "Все уведомления уже прочитаны."
                  : "Здесь появятся события по заказам, оплате и доставке."
              }
            />
          )}
        </section>

        {!isLoading && unreadVisibleCount > 0 ? (
          <p className="text-text-secondary mt-4 text-sm">
            В текущем списке непрочитанных уведомлений: {unreadVisibleCount}.
          </p>
        ) : null}
      </Container>
    </main>
  );
};

interface NotificationItemProps {
  notification: NotificationResponse;
  pending: boolean;
  onMarkAsRead: (notification: NotificationResponse) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, pending }: NotificationItemProps) => {
  const Icon = getNotificationIcon(notification.type);

  return (
    <li
      className={cn(
        "grid gap-4 p-5 md:grid-cols-[56px_minmax(0,1fr)_auto]",
        !notification.is_read && "bg-bg-hover",
      )}
    >
      <span className="bg-bg-primary text-accent-primary border-border grid size-12 place-items-center rounded-full border">
        <Icon size={24} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-text-primary text-lg font-bold">{notification.title}</h2>
          {!notification.is_read ? (
            <span className="bg-accent-primary text-accent-contrast rounded-md px-2 py-1 text-xs font-bold">
              Новое
            </span>
          ) : null}
        </div>
        <p className="text-text-secondary mt-2 leading-7">{notification.message}</p>
        <div className="text-text-muted mt-3 flex flex-wrap gap-3 text-sm">
          <span>{getNotificationTypeLabel(notification.type)}</span>
          <span>{formatDateTime(notification.created_at)}</span>
          {notification.read_at ? (
            <span>Прочитано {formatDateTime(notification.read_at)}</span>
          ) : null}
        </div>
      </div>
      {!notification.is_read ? (
        <Button
          className="h-11 gap-2 self-start"
          type="button"
          disabled={pending}
          onClick={() => onMarkAsRead(notification)}
        >
          <Check size={18} />
          Прочитано
        </Button>
      ) : (
        <span className="text-success inline-flex items-center gap-2 self-start text-sm font-bold">
          <CheckCheck size={18} />
          Прочитано
        </span>
      )}
    </li>
  );
};

interface NotificationStateProps {
  title: string;
  text: string;
}

const NotificationState = ({ text, title }: NotificationStateProps) => {
  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div>
        <Bell className="text-text-muted mx-auto mb-4" size={56} />
        <h2 className="text-text-primary text-xl font-bold">{title}</h2>
        <p className="text-text-secondary mt-2">{text}</p>
      </div>
    </div>
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

  return type;
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
