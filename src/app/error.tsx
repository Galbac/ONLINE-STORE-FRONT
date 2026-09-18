"use client";

import { captureClientException } from "@/shared/lib/sentry";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { ROUTES } from "@/shared/config";
import { Button, Container } from "@/shared/ui";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Application runtime error:", error);
    captureClientException(error, { digest: error.digest });
  }, [error]);

  return (
    <main className="bg-bg-primary flex min-h-[70vh] items-center justify-center py-16">
      <Container className="max-w-xl text-center">
        <div className="bg-amber-500/10 text-amber-600 mx-auto mb-6 grid size-16 place-items-center rounded-full">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-text-primary text-3xl font-bold md:text-4xl">
          Что-то пошло не так
        </h1>
        <p className="text-text-secondary mt-4 text-base leading-relaxed">
          Произошла непредвиденная ошибка при загрузке страницы. Пожалуйста, попробуйте обновить страницу или вернитесь на главную.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            className="gap-2"
            type="button"
            onClick={() => reset()}
          >
            <RefreshCw size={18} />
            Попробовать снова
          </Button>
          <Link href={ROUTES.HOME}>
            <Button className="gap-2" variant="secondary" type="button">
              <Home size={18} />
              На главную
            </Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}
