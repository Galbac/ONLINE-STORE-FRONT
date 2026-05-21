import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  ClipboardList,
  Headphones,
  Heart,
  Percent,
  ShoppingBasket,
  Truck,
} from "lucide-react";
import { LoginForm } from "@/features/login-user";
import { ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

const accountBenefits = [
  {
    title: "Быстрый заказ",
    text: "Оформляйте заказы быстрее с сохранёнными данными",
    icon: ShoppingBasket,
  },
  {
    title: "Избранное",
    text: "Сохраняйте любимые товары и находите их в один клик",
    icon: Heart,
  },
  {
    title: "История заказов",
    text: "Отслеживайте статусы заказов и просматривайте историю покупок",
    icon: ClipboardList,
  },
  {
    title: "Акции и скидки",
    text: "Получайте персональные предложения и специальные скидки",
    icon: Percent,
  },
  {
    title: "Уведомления",
    text: "Будьте в курсе статусов заказов, акций и новинок",
    icon: Bell,
  },
] as const;

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

export const LoginPage = () => {
  return (
    <>
      <Header />
      <main>
        <Container className="py-6">
          <nav className="text-text-secondary mb-10 flex items-center gap-2 text-sm">
            <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <span>Вход</span>
          </nav>

          <section>
            <h1 className="text-text-primary text-4xl font-bold">Вход в аккаунт</h1>
            <p className="text-text-secondary mt-4 text-base">
              Добро пожаловать! Войдите, чтобы продолжить покупки.
            </p>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.82fr)]">
              <LoginForm />
              <AccountBenefits />
            </div>
          </section>

          <section className="border-border mt-12 grid gap-5 rounded-lg border p-6 shadow-[0_10px_28px_rgb(20_28_18/0.04)] md:grid-cols-2 lg:grid-cols-4">
            {serviceBenefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div className="flex gap-4" key={benefit.title}>
                  <span className="bg-bg-hover text-accent-primary grid size-14 shrink-0 place-items-center rounded-full border border-green-100">
                    <Icon size={28} />
                  </span>
                  <span>
                    <span className="block font-bold">{benefit.title}</span>
                    <span className="text-text-secondary mt-2 block text-sm leading-6">
                      {benefit.text}
                    </span>
                  </span>
                </div>
              );
            })}
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
};

const AccountBenefits = () => {
  return (
    <aside className="border-border bg-bg-secondary rounded-lg border p-8">
      <h2 className="mb-8 text-2xl font-bold">Преимущества аккаунта</h2>
      <div className="space-y-8">
        {accountBenefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-5" key={benefit.title}>
              <span className="border-border bg-bg-primary text-accent-primary grid size-16 place-items-center rounded-full border shadow-[0_8px_20px_rgb(20_28_18/0.05)]">
                <Icon size={30} />
              </span>
              <span>
                <span className="block font-bold">{benefit.title}</span>
                <span className="text-text-secondary mt-2 block leading-7">{benefit.text}</span>
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
