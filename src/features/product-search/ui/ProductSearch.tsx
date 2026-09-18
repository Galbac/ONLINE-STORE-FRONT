import { Search } from "lucide-react";
import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui";

interface ProductSearchProps {
  defaultValue?: string | undefined;
}

export const ProductSearch = ({ defaultValue }: ProductSearchProps) => {
  return (
    <form
      className="group relative flex min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-xs transition-all duration-200 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-emerald-500/15"
      action={ROUTES.SEARCH}
    >
      <label className="sr-only" htmlFor="site-search">
        Поиск товаров
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3.5">
        <Search className="shrink-0 text-slate-400 transition-colors group-focus-within:text-emerald-600" size={19} />
        <input
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          id="site-search"
          name="q"
          placeholder="Найти среди 5000+ свежих продуктов..."
          defaultValue={defaultValue}
          type="search"
        />
      </div>
      <Button className="h-11 rounded-none px-6 text-xs uppercase tracking-wider font-bold" type="submit">
        Найти
      </Button>
    </form>
  );
};
