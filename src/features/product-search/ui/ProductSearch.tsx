import { Search } from "lucide-react";
import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui";

interface ProductSearchProps {
  defaultValue?: string | undefined;
}

export const ProductSearch = ({ defaultValue }: ProductSearchProps) => {
  return (
    <form
      className="border-border bg-bg-primary flex min-w-0 flex-1 overflow-hidden rounded-lg border shadow-[0_8px_24px_rgb(22_145_13/0.08)]"
      action={ROUTES.SEARCH}
    >
      <label className="sr-only" htmlFor="site-search">
        Поиск товаров
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
        <Search className="text-text-muted shrink-0" size={20} />
        <input
          className="placeholder:text-text-muted h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
          id="site-search"
          name="q"
          placeholder="Поиск по товарам, категориям, брендам..."
          defaultValue={defaultValue}
          type="search"
        />
      </div>
      <Button className="h-12 rounded-none px-7" type="submit">
        Найти
      </Button>
    </form>
  );
};
