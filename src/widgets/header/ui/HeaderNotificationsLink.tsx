"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { getStoredAccessToken } from "@/shared/ui";
import { ROUTES } from "@/shared/config";
import { useEffect, useState } from "react";

export const HeaderNotificationsLink = () => {
  const pathname = usePathname() || "";
  const unreadCount = useUnreadNotifications();
  const isActive = pathname.startsWith(ROUTES.PROFILE_NOTIFICATIONS);
  const [isAuth, setIsAuth] = useState(false);
  useEffect(() => {
    const update = () => setIsAuth(Boolean(getStoredAccessToken()));
    update();
    window.addEventListener("focus", update);
    return () => window.removeEventListener("focus", update);
  }, []);

  const linkClassName = `relative hidden w-[84px] shrink-0 flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold transition active:scale-95 lg:flex ${
    isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
  }`;

  if (!isAuth) {
    return (
      <div aria-hidden="true" className={`${linkClassName} invisible pointer-events-none`}>
        <Bell size={20} className="mb-0.5" />
        <span>Уведомления</span>
      </div>
    );
  }

  return (
    <Link
      href={ROUTES.PROFILE_NOTIFICATIONS}
      aria-current={isActive ? "page" : undefined}
      aria-label={unreadCount ? `Уведомления, непрочитанных: ${unreadCount}` : "Уведомления"}
      className={linkClassName}
    >
      <Bell size={20} className="mb-0.5" />
      <span>Уведомления</span>
      {unreadCount > 0 && <span className="absolute top-0.5 right-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </Link>
  );
};
