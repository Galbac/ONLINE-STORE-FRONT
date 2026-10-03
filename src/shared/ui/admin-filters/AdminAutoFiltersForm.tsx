"use client";

import { useEffect, useRef, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/shared/config/cn";

export interface AdminAutoFiltersFormProps {
  action: string;
  resetHref?: string;
  children: ReactNode;
  className?: string;
  showReset?: boolean;
  debounceMs?: number;
}

export const AdminAutoFiltersForm = ({
  action,
  resetHref,
  children,
  className,
  showReset = true,
  debounceMs = 300,
}: AdminAutoFiltersFormProps) => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPending, startTransition] = useTransition();

  // Функция автоматического сбора и применения параметров
  const applyFilters = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const params = new URLSearchParams();

    formData.forEach((value, key) => {
      const strVal = String(value).trim();
      // Игнорируем пустые поля
      if (strVal !== "") {
        // При смене фильтров всегда сбрасываем страницу на 1
        if (key === "page") {
          params.set("page", "1");
        } else {
          params.set(key, strVal);
        }
      }
    });

    const query = params.toString();
    const newUrl = query ? `${action}?${query}` : action;

    startTransition(() => {
      router.push(newUrl, { scroll: false });
    });
  };

  // Мгновенная отправка по нажатию Enter
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    applyFilters();
  };

  // Мгновенная реакция на селекты, даты, радио и чекбоксы
  const handleChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const target = e.target;
    const tagName = target.tagName.toLowerCase();
    const type = (target as unknown as HTMLInputElement).type?.toLowerCase();

    if (tagName === "select" || type === "date" || type === "checkbox" || type === "radio") {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      applyFilters();
    }
  };

  // Реакция на текстовые поля (поиск по совпадению) с debounce 300 мс
  const handleInput = (e: React.FormEvent<HTMLFormElement>) => {
    const target = e.target as unknown as HTMLInputElement;
    const tagName = target.tagName.toLowerCase();
    const type = target.type?.toLowerCase();

    if (tagName === "input" && (type === "search" || type === "text" || !type)) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        applyFilters();
      }, debounceMs);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={handleChange}
      onInput={handleInput}
      className={cn(
        "border-border bg-bg-primary rounded-xl border p-4 shadow-soft relative transition-opacity",
        isPending && "opacity-85",
        className,
      )}
      method="get"
    >
      <input name="page" type="hidden" value="1" />

      {children}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            {isPending ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                <Loader2 className="animate-spin" size={13} />
                Обновление списка...
              </span>
            ) : null}
          </div>

        {showReset && resetHref && (
          <Link
            className="border-border hover:bg-bg-hover inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition text-slate-600 hover:text-slate-900"
            href={resetHref}
          >
            <RotateCcw size={12} />
            Сбросить фильтры
          </Link>
        )}
      </div>
    </form>
  );
};
