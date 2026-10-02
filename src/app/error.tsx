"use client";

import { captureClientException } from "@/shared/lib/sentry";
import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronUp, Home, RefreshCw, Trash2 } from "lucide-react";

import { ROUTES } from "@/shared/config";
import { Button, Container } from "@/shared/ui";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";

  useEffect(() => {
    console.error("Application runtime error:", error);
    captureClientException(error, { digest: error.digest });
  }, [error]);

  const handleRetry = () => {
    try {
      startTransition(() => {
        router.refresh();
        reset();
      });
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } catch {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  const handleResetCacheAndReload = () => {
    try {
      if (typeof window !== "undefined") {
        // Clear storages to eliminate corrupted state
        try { window.localStorage.clear(); } catch (_) {}
        try { window.sessionStorage.clear(); } catch (_) {}

        // Unregister service workers if any
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister();
            }
          }).catch(() => {});
        }

        window.location.href = ROUTES.HOME;
      }
    } catch {
      if (typeof window !== "undefined") {
        window.location.href = ROUTES.HOME;
      }
    }
  };

  return (
    <main className="bg-bg-primary flex min-h-[70vh] items-center justify-center py-16 px-4">
      <Container className="max-w-xl text-center">
        <div className="bg-amber-500/10 text-amber-600 mx-auto mb-6 grid size-16 place-items-center rounded-full">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-text-primary text-2xl font-bold md:text-3xl">
          Что-то пошло не так
        </h1>
        <p className="text-text-secondary mt-3 text-sm leading-relaxed">
          Произошла ошибка при загрузке страницы. Попробуйте обновить страницу или сбросить сохранённый кэш приложения.
        </p>

        {isDev && error?.message && (
          <div className="mt-5 text-left">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <span>{showDetails ? "Скрыть технические детали" : "Показать технические детали"}</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetails && (
              <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900 font-mono overflow-x-auto text-left shadow-2xs">
                <p className="font-bold text-rose-950 mb-1">{error.name}: {error.message}</p>
                {error.digest && <p className="text-[11px] text-rose-700 mb-1">Digest: {error.digest}</p>}
                {error.stack && (
                  <pre className="text-[10px] leading-tight text-rose-800 mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            className="gap-2 cursor-pointer h-10 px-4 text-xs font-bold"
            type="button"
            onClick={handleRetry}
          >
            <RefreshCw size={16} />
            Попробовать снова
          </Button>

          <Button
            className="gap-2 cursor-pointer h-10 px-4 text-xs font-semibold"
            variant="secondary"
            type="button"
            onClick={handleResetCacheAndReload}
          >
            <Trash2 size={16} />
            Сбросить кэш и данные
          </Button>

          <a href={ROUTES.HOME}>
            <Button className="gap-2 cursor-pointer h-10 px-4 text-xs font-semibold" variant="secondary" type="button">
              <Home size={16} />
              На главную
            </Button>
          </a>
        </div>
      </Container>
    </main>
  );
}
