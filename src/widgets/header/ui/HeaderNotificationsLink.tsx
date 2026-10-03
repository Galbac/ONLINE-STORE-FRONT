"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { getStoredAccessToken } from "@/shared/ui";
import { useEffect, useState } from "react";

export const HeaderNotificationsLink = () => {
  const unreadCount = useUnreadNotifications();
  const [isAuth, setIsAuth] = useState(false);
  useEffect(() => {
    const update = () => setIsAuth(Boolean(getStoredAccessToken()));
    update();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, []);

  if (!isAuth) return null;
  return (
    <Link
      href="/profile/notifications"
      aria-label={unreadCount ? `Уведомления, непрочитанных: ${unreadCount}` : "Уведомления"}
      className="relative hidden flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 lg:flex"
    >
      <Bell size={20} className="mb-0.5" />
      <span>Уведомления</span>
      {unreadCount > 0 && <span className="absolute top-0.5 right-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </Link>
  );
};
