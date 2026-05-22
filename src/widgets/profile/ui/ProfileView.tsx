import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Headphones,
  Heart,
  MapPin,
  Package,
  Pencil,
  Percent,
  ReceiptText,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { ProfileSummaryResponse } from "@/entities/profile";
import type { UserMeResponse } from "@/entities/user";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Container } from "@/shared/ui";
import { ProfileLogoutButton } from "./ProfileLogoutButton";

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

export const ProfileView = ({ profile, user }: ProfileViewProps) => {
  const recentOrdersTotal = profile.recent_orders.reduce((total, order) => {
    return total + Number(order.final_price);
  }, 0);
  const averageRecentOrder =
    profile.recent_orders.length > 0 ? recentOrdersTotal / profile.recent_orders.length : 0;
  const lastOrder = profile.recent_orders[0] ?? profile.active_order ?? null;
  const displayEmail = user.email ?? profile.user.email ?? "Не указан";

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
          <ProfileCard user={user} email={displayEmail} />
          <StatsCard
            ordersCount={profile.stats.orders_count}
            addressesCount={profile.stats.addresses_count}
            recentOrdersTotal={recentOrdersTotal}
            averageRecentOrder={averageRecentOrder}
            lastOrderDate={lastOrder?.created_at ?? null}
          />
        </section>

        <section className="mt-12">
          <h2 className="text-text-primary text-2xl font-bold">Быстрые ссылки</h2>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <QuickLink
              href={ROUTES.PROFILE_ADDRESSES}
              icon={<MapPin size={30} />}
              title="Адреса"
              text={`${profile.stats.addresses_count} адреса доставки`}
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
              text="Любимые товары и бренды"
            />
            <QuickLink
              href={ROUTES.PROFILE_NOTIFICATIONS}
              icon={<Bell size={30} />}
              title="Уведомления"
              text="Настройки уведомлений"
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
}

const ProfileCard = ({ email, user }: ProfileCardProps) => {
  return (
    <section className="border-border rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9">
      <div className="grid gap-8 md:grid-cols-[112px_minmax(0,1fr)]">
        <span className="bg-accent-primary text-accent-contrast grid size-24 place-items-center rounded-full md:size-28">
          <UserRound size={58} />
        </span>
        <div className="grid gap-7 sm:grid-cols-[minmax(120px,0.55fr)_minmax(0,1fr)]">
          <ProfileField label="Имя" value={user.name} />
          <ProfileField label="Телефон" value={user.phone} />
          <ProfileField label="Email" value={email} />
          <ProfileField label="Дата регистрации" value={formatDateTime(user.created_at)} />
        </div>
      </div>

      <Link
        className="border-accent-primary text-accent-primary hover:bg-bg-hover mt-10 inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg border px-6 text-base font-bold transition"
        href={ROUTES.PROFILE_ADDRESSES}
      >
        <Pencil size={20} />
        Управлять адресами доставки
      </Link>
    </section>
  );
};

interface ProfileFieldProps {
  label: string;
  value: string;
}

const ProfileField = ({ label, value }: ProfileFieldProps) => {
  return (
    <>
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-bold break-words">{value}</span>
    </>
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
    <section className="border-border rounded-lg border bg-white p-6 shadow-[0_14px_40px_rgb(20_28_18/0.06)] md:p-9">
      <h2 className="text-text-primary text-2xl font-bold">Статистика заказов</h2>
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

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};
