import Link from "next/link";
import {
  ClipboardList,
  Heart,
  Percent,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";
import { LoginForm } from "@/features/login-user";
import { ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

const accountBenefits = [
  {
    title: "Быстрый заказ",
    text: "Оформляйте заказы за 30 секунд с сохранёнными адресами",
    icon: ShoppingBasket,
  },
  {
    title: "Избранное и списки",
    text: "Сохраняйте любимые товары и повторяйте корзину в 1 клик",
    icon: Heart,
  },
  {
    title: "История и статус",
    text: "Отслеживайте статус курьера в реальном времени",
    icon: ClipboardList,
  },
  {
    title: "Бонусы и кэшбэк 5%",
    text: "Копите бонусные баллы с каждой покупки и списывайте на заказы",
    icon: Percent,
  },
] as const;

export const LoginPage = () => {
  return (
    <>
      <Header />
      <main className="min-h-[75vh] py-10 bg-gradient-to-b from-slate-50 to-white">
        <Container className="max-w-5xl">
          <nav className="text-slate-400 mb-8 flex items-center gap-2 text-xs font-semibold">
            <Link className="hover:text-emerald-700 transition" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <span className="text-slate-700">Вход</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <LoginForm />

            <aside className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50/30 p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-700/20">
                  <Sparkles size={20} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Возможности покупателя</h2>
                  <p className="text-xs text-slate-500">Покупайте комфортно и с выгодой</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {accountBenefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div className="flex items-start gap-3.5" key={benefit.title}>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200/70 text-emerald-700 shadow-2xs">
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{benefit.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{benefit.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};
