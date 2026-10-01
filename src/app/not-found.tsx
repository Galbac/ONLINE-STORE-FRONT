import Link from "next/link";
import { ROUTES } from "@/shared/config";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-black text-emerald-600 sm:text-8xl">404</h1>
      <h2 className="mt-4 text-xl font-bold text-slate-800 sm:text-2xl">Страница не найдена</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Возможно, страница была удалена, переименована или временно недоступна.
      </p>
      <Link
        href={ROUTES.HOME}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
      >
        На главную
      </Link>
    </div>
  );
}
