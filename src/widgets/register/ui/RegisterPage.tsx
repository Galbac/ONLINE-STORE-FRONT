import Link from "next/link";
import { RegisterForm } from "@/features/register-user";
import { ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { Sparkles, Gift, ShieldCheck } from "lucide-react";

export const RegisterPage = () => {
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
            <span className="text-slate-700">Регистрация</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <RegisterForm />

            <aside className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50/30 p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-700/20">
                  <Gift size={22} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Бонусы при регистрации</h2>
                  <p className="text-xs text-slate-500">Начните покупки с приятной выгодой</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200/70 text-emerald-700 shadow-2xs">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">100 приветственных бонусов</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Автоматически зачисляются на ваш счет сразу после создания аккаунта.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white border border-emerald-200/70 text-emerald-700 shadow-2xs">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">5% кэшбэк на каждый заказ</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Возвращайте часть стоимости покупок баллами и оплачивайте ими до 50% чека.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};
