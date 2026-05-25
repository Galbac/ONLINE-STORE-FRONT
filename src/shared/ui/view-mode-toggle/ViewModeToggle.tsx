import type { ReactNode } from "react";
import Link from "next/link";
import { Grid2X2, List } from "lucide-react";

import { cn } from "@/shared/config";

export type ProductViewMode = "grid" | "list";

interface ViewModeToggleProps {
  gridHref: string;
  listHref: string;
  viewMode: ProductViewMode;
}

export const ViewModeToggle = ({ gridHref, listHref, viewMode }: ViewModeToggleProps) => {
  return (
    <div className="border-border bg-bg-primary flex h-12 items-center gap-1 rounded-lg border p-1">
      <ViewModeLink
        active={viewMode === "grid"}
        ariaLabel="Показать товары сеткой"
        href={gridHref}
        icon={<Grid2X2 size={22} />}
      />
      <ViewModeLink
        active={viewMode === "list"}
        ariaLabel="Показать товары списком"
        href={listHref}
        icon={<List size={22} />}
      />
    </div>
  );
};

interface ViewModeLinkProps {
  active: boolean;
  ariaLabel: string;
  href: string;
  icon: ReactNode;
}

const ViewModeLink = ({ active, ariaLabel, href, icon }: ViewModeLinkProps) => {
  return (
    <Link
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "grid size-10 place-items-center rounded-md transition",
        active
          ? "bg-accent-primary/15 text-accent-primary"
          : "text-text-muted hover:bg-bg-hover hover:text-text-primary",
      )}
      href={href}
    >
      {icon}
    </Link>
  );
};
