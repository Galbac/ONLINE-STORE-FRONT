import { AdminLoginForm } from "@/features/login-admin";

export const AdminLoginPage = () => {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 px-4 py-8 sm:px-6">
      {/* Мягкие декоративные ауры для глубины и современного вида */}
      <div className="pointer-events-none absolute -left-28 -top-28 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/10 blur-[120px]" />

      {/* Центрированная форма входа */}
      <div className="relative z-10 w-full max-w-[440px]">
        <AdminLoginForm />
      </div>
    </main>
  );
};
