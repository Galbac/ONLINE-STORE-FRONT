import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/features/login-admin";
import { ROUTES } from "@/shared/config";

export const AdminLoginPage = () => {
  return (
    <main className="bg-bg-secondary min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 py-2">
          <Link
            className="text-text-secondary hover:text-accent-primary inline-flex items-center gap-2 text-sm font-bold transition"
            href={ROUTES.HOME}
          >
            <ArrowLeft size={18} />
            На сайт
          </Link>
          <span className="text-text-muted text-sm">Админ-панель</span>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,520px)] lg:gap-14">
          <div className="max-w-xl">
            <span className="border-border bg-bg-primary text-accent-primary inline-flex size-14 items-center justify-center rounded-lg border shadow-soft">
              <KeyRound size={28} />
            </span>
            <h2 className="mt-7 text-3xl font-bold leading-tight text-text-primary sm:text-4xl lg:text-5xl">
              Управление магазином
            </h2>
            <p className="text-text-secondary mt-5 max-w-lg text-base leading-7">
              Войдите под учетной записью сотрудника, чтобы перейти к рабочим разделам панели.
            </p>
            <div className="border-border mt-8 flex max-w-md gap-4 rounded-lg border bg-bg-primary p-4">
              <span className="bg-bg-hover text-accent-primary grid size-11 shrink-0 place-items-center rounded-lg">
                <ShieldCheck size={22} />
              </span>
              <p className="text-text-secondary text-sm leading-6">
                Доступ открыт только активным сотрудникам с правами для работы в панели.
              </p>
            </div>
          </div>

          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
};
