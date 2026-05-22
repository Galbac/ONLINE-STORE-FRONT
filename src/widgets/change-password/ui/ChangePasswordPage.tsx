import Link from "next/link";
import { BadgeCheck, Headphones, Percent, Truck } from "lucide-react";
import { ChangePasswordForm } from "@/features/change-password";
import { ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

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

export const ChangePasswordPage = () => {
  return (
    <>
      <Header />
      <main className="bg-bg-primary min-h-[70vh]">
        <Container className="py-6 md:py-8">
          <nav className="text-text-secondary mb-10 flex flex-wrap items-center gap-2 text-sm">
            <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <Link className="hover:text-accent-primary" href={ROUTES.PROFILE}>
              Профиль
            </Link>
            <span>/</span>
            <span>Смена пароля</span>
          </nav>

          <section>
            <h1 className="text-text-primary text-4xl font-bold md:text-5xl">Смена пароля</h1>
            <p className="text-text-secondary mt-4 text-base">
              Обновите пароль для защиты вашего аккаунта.
            </p>

            <div className="mt-12 md:mt-16">
              <ChangePasswordForm />
            </div>
          </section>

          <section className="border-border mt-16 grid gap-5 rounded-lg border bg-white p-6 shadow-[0_10px_28px_rgb(20_28_18/0.04)] md:grid-cols-2 lg:grid-cols-4">
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
