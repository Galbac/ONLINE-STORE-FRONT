"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, LayoutGrid, Loader2, Search, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { apiClient, API_ENDPOINTS } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

interface SuggestionCategory {
  id: number;
  name: string;
  slug: string;
}

interface SuggestionProduct {
  id: number;
  name: string;
  slug: string;
  article?: string | null;
  price: string | number;
  preview_image_url?: string | null;
}

interface SearchSuggestionsResponse {
  query: string;
  categories: SuggestionCategory[];
  products: SuggestionProduct[];
}

interface ProductSearchProps {
  defaultValue?: string | undefined;
}

const POPULAR_SEARCHES = [
  "Фрукты и ягоды",
  "Молоко фермерское",
  "Сыр твердый",
  "Свежий хлеб",
  "Мясо и птица",
  "Кофе зерновой",
  "Авокадо Хасс",
  "Без сахара",
];

const RECENT_SEARCHES_STORAGE_KEY = "grocery_recent_searches";

const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (index === -1) return text;
  const before = text.slice(0, index);
  const match = text.slice(index, index + query.trim().length);
  const after = text.slice(index + query.trim().length);
  return (
    <>
      {before}
      <span className="font-extrabold text-emerald-600 underline decoration-emerald-500/40">{match}</span>
      {after}
    </>
  );
};

export const ProductSearch = ({ defaultValue }: ProductSearchProps) => {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [dynamicPopularSearches, setDynamicPopularSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {}

    apiClient
      .get<{ items: Array<{ name: string }> }>("/api/categories")
      .then((res) => {
        if (res.items && Array.isArray(res.items) && res.items.length > 0) {
          setDynamicPopularSearches(res.items.slice(0, 8).map((c) => c.name));
        }
      })
      .catch(() => {});
  }, []);

  // Горячая клавиша Cmd/Ctrl + K для мгновенного фокуса поиска
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveRecentSearch = (term: string) => {
    try {
      const cleanTerm = term.trim();
      if (!cleanTerm) return;
      const updated = [cleanTerm, ...recentSearches.filter((item) => item.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = () => {
    try {
      setRecentSearches([]);
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {}
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.get<SearchSuggestionsResponse>(
          API_ENDPOINTS.PRODUCT.SEARCH_SUGGESTIONS(trimmed),
        );
        setSuggestions(data);
        if (data.categories.length > 0 || data.products.length > 0) {
          setIsOpen(true);
        }
      } catch {
        setSuggestions(null);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      setIsOpen(false);
      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectSearch = (term: string) => {
    saveRecentSearch(term);
    setQuery(term);
    router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(term)}`);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <form
        className="group relative flex w-full items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs transition-all duration-200 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-emerald-500/15"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="site-search">
          Поиск товаров
        </label>
        
        {/* Иконка лупы внутри инпута слева */}
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600 shrink-0"
          size={18}
        />

        <input
          ref={inputRef}
          autoComplete="off"
          className="h-11 w-full bg-transparent pl-10 pr-20 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          id="site-search"
          name="q"
          placeholder="Найти свежие продукты, мясо, молоко..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          type="search"
        />

        {/* Правая панель: Индикатор загрузки / очистка / хоткей Cmd+K */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-emerald-600" />
          ) : query ? (
            <button
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/50 transition cursor-pointer"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              type="button"
              aria-label="Очистить поиск"
            >
              <X size={15} />
            </button>
          ) : null}

          {/* Хоткей бейдж на десктопе */}
          <div className="hidden lg:flex items-center gap-0.5 rounded-md border border-slate-200 bg-white/90 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 select-none shadow-2xs">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </form>

      {/* Popular and recent searches dropdown */}
      {isOpen && !query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
          {recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  Вы недавно искали
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <Trash2 size={11} />
                  Очистить
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelectSearch(item)}
                    className="rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition border border-transparent cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Sparkles size={12} className="text-amber-500" />
              Часто ищут
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(dynamicPopularSearches.length > 0 ? dynamicPopularSearches : POPULAR_SEARCHES).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelectSearch(item)}
                  className="rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
          {suggestions.categories.length > 0 && (
            <div className="mb-3">
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Категории
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {suggestions.categories.map((c) => (
                  <Link
                    key={c.id}
                    href={ROUTES.CATEGORY(c.slug)}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <LayoutGrid size={13} className="text-emerald-600" />
                    {highlightMatch(c.name, query)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {suggestions.products.length > 0 && (
            <div>
              <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Товары
              </span>
              <div className="mt-1.5 divide-y divide-slate-100">
                {suggestions.products.map((p) => (
                  <Link
                    key={p.id}
                    href={ROUTES.PRODUCT(p.slug)}
                    onClick={() => {
                      saveRecentSearch(p.name);
                      setIsOpen(false);
                    }}
                    className="group flex items-center justify-between gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                        {p.preview_image_url ? (
                          <Image
                            alt={p.name}
                            className="object-contain"
                            height={40}
                            src={p.preview_image_url}
                            width={40}
                          />
                        ) : (
                          <ShoppingBag size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="line-clamp-1 text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition">
                          {highlightMatch(p.name, query)}
                        </span>
                        {p.article ? (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Арт. {highlightMatch(p.article, query)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-extrabold text-slate-900">
                      {toPriceFormat(p.price)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 border-t border-slate-100 pt-2 text-center">
            <button
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
              onClick={handleSubmit}
              type="button"
            >
              Все результаты по запросу «{query}»
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
