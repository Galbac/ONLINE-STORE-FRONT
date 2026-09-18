import Link from "next/link";
import { Package, Scale } from "lucide-react";
import { cn } from "@/shared/config";

interface ProductTypeFilterProps {
  currentType?: string | undefined;
  buildHref: (type?: string) => string;
}

export const ProductTypeFilter = ({ currentType, buildHref }: ProductTypeFilterProps) => {
  const options = [
    { value: undefined, label: "Все товары" },
    { value: "piece", label: "Штучные", icon: <Package size={14} /> },
    { value: "weight", label: "На развес", icon: <Scale size={14} /> },
  ];

  return (
    <div className="space-y-1.5">
      {options.map((option) => {
        const isActive = currentType === option.value;
        return (
          <Link
            key={option.label}
            href={buildHref(option.value)}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
              isActive
                ? "bg-emerald-50 text-emerald-800 font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            <span className="flex items-center gap-2">
              {option.icon}
              {option.label}
            </span>
            {isActive && <span className="size-1.5 rounded-full bg-emerald-600" />}
          </Link>
        );
      })}
    </div>
  );
};
