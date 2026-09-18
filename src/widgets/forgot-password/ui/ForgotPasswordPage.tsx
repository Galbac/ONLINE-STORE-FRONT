import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/features/forgot-password";
import { ROUTES } from "@/shared/config";
import { Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

export const ForgotPasswordPage = () => {
  return (
    <>
      <Header />
      <main className="min-h-[75vh] py-10 bg-gradient-to-b from-slate-50 to-white">
        <Container className="max-w-4xl">
          <nav className="text-slate-400 mb-8 flex items-center gap-2 text-xs font-semibold">
            <Link className="hover:text-emerald-700 transition" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <span className="text-slate-700">Восстановление пароля</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <ForgotPasswordForm />

            <aside className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50/30 p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-700/20">
                  <KeyRound size={22} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Безопасный доступ</h2>
                  <p className="text-xs text-slate-500">Защита аккаунта 256-bit SSL</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-600 leading-relaxed pt-2">
                <p>
                  Ссылка для сброса пароля будет действительна в течение <strong>24 часов</strong>.
                </p>
                <p>
                  Если вы не получили письмо, проверьте папку «Спам» или повторите отправку запроса.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};
