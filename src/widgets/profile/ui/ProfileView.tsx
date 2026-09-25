"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Eye,
  EyeOff,
  Headphones,
  Heart,
  KeyRound,
  MapPin,
  Package,
  Percent,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { ProfileSummaryResponse } from "@/entities/profile";
import type { UserMeResponse } from "@/entities/user";
import { userApi } from "@/entities/user";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Container } from "@/shared/ui";
import { toast } from "sonner";
import { ProfileLogoutButton } from "./ProfileLogoutButton";
import { PhoneVerificationModal } from "./PhoneVerificationModal";
import { DeleteAccountModal } from "./DeleteAccountModal";

interface ProfileViewProps {
  profile: ProfileSummaryResponse;
  user: UserMeResponse;
}

const serviceBenefits = [
  {
    title: "Качество продуктов",
    text: "Только свежие и проверенные товары каждый день",
    icon: BadgeCheck,
  },
  {
    title: "Доставка",
    text: "Быстрая доставка на дом и в удобное время",
    icon: Truck,
  },
  {
    title: "Выгодные цены",
    text: "Лучшие предложения и акции для вас",
    icon: Percent,
  },
  {
    title: "Поддержка 24/7",
    text: "Мы всегда на связи и готовы помочь",
    icon: Headphones,
  },
] as const;

export const ProfileView = ({ profile, user: initialUser }: ProfileViewProps) => {
  const [currentUser, setCurrentUser] = useState<UserMeResponse>(initialUser);
  const recentOrdersTotal = profile.recent_orders.reduce((total, order) => {
    return total + Number(order.final_price);
  }, 0);
  const averageRecentOrder =
    profile.recent_orders.length > 0 ? recentOrdersTotal / profile.recent_orders.length : 0;
  const lastOrder = profile.recent_orders[0] ?? profile.active_order ?? null;
  const displayEmail = currentUser.email ?? profile.user.email ?? "";

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-8 flex items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <span>Профиль</span>
        </nav>

        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <h1 className="text-text-primary text-4xl font-bold md:text-5xl">Мой профиль</h1>
          <ProfileLogoutButton />
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.9fr)]">
          <ProfileCard
            user={currentUser}
            email={displayEmail}
            onUserUpdated={(updated) => setCurrentUser(updated)}
          />
          <StatsCard
            ordersCount={profile.stats.orders_count}
            addressesCount={profile.stats.addresses_count}
            recentOrdersTotal={recentOrdersTotal}
            averageRecentOrder={averageRecentOrder}
            lastOrderDate={lastOrder?.created_at ?? null}
          />
        </section>

        {/* Мои регулярные покупки */}
        {profile.stats.orders_count > 0 || profile.recent_orders.length > 0 ? (
          <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <Sparkles size={28} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Мои регулярные покупки</h3>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
                  Соберите вашу привычную недельную продуктовую корзину в 1 клик на основе ваших прошлых заказов!
                </p>
              </div>
            </div>
            <Link
              href={ROUTES.CART}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              Собрать корзину ⚡
            </Link>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="text-text-primary text-2xl font-bold">Быстрые ссылки</h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              href={ROUTES.PROFILE_LOYALTY}
              icon={<Sparkles size={30} className="text-emerald-600" />}
              title="Бонусы и лояльность"
              text="Баланс и кэшбэк"
            />
            <QuickLink
              href={ROUTES.PROFILE_ADDRESSES}
              icon={<MapPin size={30} />}
              title="Адреса"
              text={pluralizeAddresses(profile.stats.addresses_count)}
            />
            <QuickLink
              href={ROUTES.PROFILE_ORDERS}
              icon={<Package size={30} />}
              title="Заказы"
              text="История и статус заказов"
            />
            <QuickLink
              href={ROUTES.PROFILE_FAVORITES}
              icon={<Heart size={30} />}
              title="Избранное"
              text="Любимые товары"
            />
            <QuickLink
              href={ROUTES.PROFILE_NOTIFICATIONS}
              icon={<Bell size={30} />}
              title="Уведомления"
              text="Настройки уведомлений"
            />
            <QuickLink
              href={ROUTES.PROFILE_CHANGE_PASSWORD}
              icon={<KeyRound size={30} />}
              title="Безопасность"
              text="Смена пароля аккаунта"
            />
          </div>
        </section>

        <section className="border-border mt-12 grid gap-5 rounded-lg border bg-white p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)] md:grid-cols-2 xl:grid-cols-4">
          {serviceBenefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div className="flex items-start gap-4" key={benefit.title}>
                <span className="bg-bg-hover text-accent-primary grid size-12 shrink-0 place-items-center rounded-full">
                  <Icon size={28} />
                </span>
                <div>
                  <p className="font-bold">{benefit.title}</p>
                  <p className="text-text-secondary mt-2 text-sm leading-6">{benefit.text}</p>
                </div>
              </div>
            );
          })}
        </section>
      </Container>
    </main>
  );
};

interface ProfileCardProps {
  email: string;
  user: UserMeResponse;
  onUserUpdated: (user: UserMeResponse) => void;
}

const ProfileCard = ({ email, user, onUserUpdated }: ProfileCardProps) => {
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(user.marketing_consent ?? false);
  const [isUpdatingMarketing, setIsUpdatingMarketing] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isPhoneVerified = Boolean(user.is_phone_verified ?? user.is_verified);

  const handleToggleMarketing = async (checked: boolean) => {
    setIsUpdatingMarketing(true);
    try {
      await userApi.updateMarketingConsent(checked);
      setMarketingConsent(checked);
      onUserUpdated({ ...user, marketing_consent: checked });
      toast.success(checked ? "Рассылки и акции подключены" : "Рассылки отключены");
    } catch {
      toast.error("Не удалось обновить согласие на рассылки");
    } finally {
      setIsUpdatingMarketing(false);
    }
  };

  return (
    <section className="border-border rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9">
      <div className="grid gap-8 md:grid-cols-[112px_minmax(0,1fr)]">
        <span className="bg-accent-primary text-accent-contrast grid size-24 place-items-center rounded-full md:size-28 shrink-0">
          <UserRound size={58} />
        </span>
        <div className="space-y-4">
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 text-sm">
            <span className="text-text-secondary">Имя:</span>
            <span className="text-text-primary font-bold break-words">{user.name}</span>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-2 text-sm">
            <span className="text-text-secondary">Телефон:</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-text-primary font-bold font-mono text-xs sm:text-sm">
                {showPhone ? user.phone : maskPhone(user.phone)}
              </span>
              <button
                type="button"
                onClick={() => setShowPhone(!showPhone)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
                title={showPhone ? "Скрыть номер" : "Показать номер"}
              >
                {showPhone ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-2 text-sm">
            <span className="text-text-secondary">Email:</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-text-primary font-bold break-all text-xs sm:text-sm">
                {email ? (showEmail ? email : maskEmail(email)) : "Не указан"}
              </span>
              {email ? (
                <button
                  type="button"
                  onClick={() => setShowEmail(!showEmail)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
                  title={showEmail ? "Скрыть email" : "Показать email"}
                >
                  {showEmail ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-2 text-sm">
            <span className="text-text-secondary">Дата регистрации:</span>
            <span className="text-text-primary font-medium text-xs sm:text-sm">
              {formatDateTime(user.created_at)}
            </span>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-2 text-sm">
            <span className="text-text-secondary">Подтвержден:</span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {isPhoneVerified ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200/60">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Да (телефон подтвержден)
                </span>
              ) : (
                <>
                  <span className="font-bold text-rose-600 text-xs">Нет</span>
                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="inline-flex h-7 items-center justify-center rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                  >
                    Подтвердить телефон по SMS
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-2 text-sm">
            <span className="text-text-secondary">Статус:</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span className={`size-2 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
              {user.is_active ? "Активен" : "Неактивен"}
            </span>
          </div>

          {/* Маркетинговые рассылки с интерактивным переключателем 38-ФЗ */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-center justify-between gap-4 cursor-pointer select-none group">
              <div>
                <span className="block text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  Рассылки и акции (38-ФЗ «О рекламе»)
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  {marketingConsent
                    ? "Вы получаете персональные скидки и закрытые спецпредложения"
                    : "Рекламные сообщения и промо-рассылки отключены"}
                </span>
              </div>
              <input
                type="checkbox"
                disabled={isUpdatingMarketing}
                checked={marketingConsent}
                onChange={(e) => handleToggleMarketing(e.target.checked)}
                className="size-4.5 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Настройки безопасности и смена пароля */}
      <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
              <KeyRound size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Безопасность аккаунта</p>
              <p className="text-xs text-slate-500">Изменение текущего пароля</p>
            </div>
          </div>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95"
            href={ROUTES.PROFILE_CHANGE_PASSWORD}
          >
            Сменить пароль
          </Link>
        </div>
      </div>

      {/* Удаление аккаунта и персональных данных (152-ФЗ РФ) */}
      <div className="mt-4 rounded-xl border border-rose-200/70 bg-rose-50/30 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Trash2 size={20} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Удаление персональных данных (152-ФЗ)</p>
              <p className="text-xs text-slate-500">Отзыв согласий и полное обезличивание аккаунта</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-300 bg-white px-3.5 text-xs font-bold text-rose-700 shadow-2xs transition hover:bg-rose-50 cursor-pointer"
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      {/* Модалки верификации и удаления */}
      <PhoneVerificationModal
        isOpen={isVerifyModalOpen}
        phone={user.phone}
        onClose={() => setIsVerifyModalOpen(false)}
        onSuccess={() => {
          onUserUpdated({ ...user, is_phone_verified: true, is_verified: true });
        }}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </section>
  );
};

interface StatsCardProps {
  addressesCount: number;
  averageRecentOrder: number;
  lastOrderDate: string | null;
  ordersCount: number;
  recentOrdersTotal: number;
}

const StatsCard = ({
  addressesCount,
  averageRecentOrder,
  lastOrderDate,
  ordersCount,
  recentOrdersTotal,
}: StatsCardProps) => {
  return (
    <section className="border-border rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9 flex flex-col">
      <h2 className="text-text-primary text-2xl font-bold">Статистика заказов</h2>

      {ordersCount === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-6 sm:p-8 text-center mt-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-xs">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Вы еще не совершали покупок</h3>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-600">
            Дарим скидку 10% на ваш первый заказ свежих фермерских продуктов с быстрой доставкой!
          </p>
          <Link
            href={ROUTES.CATALOG}
            className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-700 active:scale-95 transition"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="mt-9 space-y-8">
          <StatRow
            icon={<ReceiptText size={28} />}
            label="Всего заказов"
            value={String(ordersCount)}
          />
          <StatRow
            icon={<WalletCards size={28} />}
            label="Сумма последних заказов"
            value={toPriceFormat(recentOrdersTotal)}
          />
          <StatRow
            icon={<ClipboardList size={28} />}
            label="Средний чек"
            value={toPriceFormat(averageRecentOrder)}
          />
          <StatRow
            icon={<CalendarClock size={28} />}
            label="Последний заказ"
            value={lastOrderDate ? formatDate(lastOrderDate) : "Пока нет"}
          />
          <StatRow
            icon={<MapPin size={28} />}
            label="Сохранено адресов"
            value={String(addressesCount)}
          />
        </div>
      )}
    </section>
  );
};

interface StatRowProps {
  icon: ReactNode;
  label: string;
  value: string;
}

const StatRow = ({ icon, label, value }: StatRowProps) => {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-5">
      <span className="bg-bg-hover text-accent-primary grid size-14 place-items-center rounded-full border border-green-100">
        {icon}
      </span>
      <span>
        <span className="text-text-secondary block text-sm">{label}</span>
        <span className="text-text-primary mt-2 block text-2xl font-bold break-words">{value}</span>
      </span>
    </div>
  );
};

interface QuickLinkProps {
  href: string;
  icon: ReactNode;
  text: string;
  title: string;
}

const QuickLink = ({ href, icon, text, title }: QuickLinkProps) => {
  return (
    <Link
      className="border-border group min-h-48 rounded-lg border bg-white p-7 shadow-[0_10px_28px_rgb(20_28_18/0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgb(20_28_18/0.08)]"
      href={href}
    >
      <span className="flex items-start justify-between gap-4">
        <span className="bg-bg-hover text-accent-primary grid size-14 place-items-center rounded-full border border-green-100">
          {icon}
        </span>
        <ChevronRight
          className="text-text-muted group-hover:text-accent-primary transition"
          size={30}
        />
      </span>
      <span className="text-text-primary mt-8 block text-xl font-bold">{title}</span>
      <span className="text-text-secondary mt-3 block leading-7">{text}</span>
    </Link>
  );
};

const maskPhone = (phone: string): string => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  const start = digits.slice(-10, -7);
  const end = digits.slice(-2);
  return `+7 (${start}) ***-**-${end}`;
};

const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return email;
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  return `${first}***${last}@${domain}`;
};

const pluralizeAddresses = (count: number): string => {
  if (count === 0) return "Нет сохраненных адресов";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${count} адресов доставки`;
  if (mod10 === 1) return `${count} адрес доставки`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} адреса доставки`;
  return `${count} адресов доставки`;
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};
