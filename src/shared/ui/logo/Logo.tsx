import Link from "next/link";

import { ROUTES, STORE_INFO } from "@/shared/config";

export const Logo = () => {
  return (
    <Link className="flex items-center gap-3" href={ROUTES.HOME} aria-label={STORE_INFO.name}>
      <span className="grid size-10 grid-cols-2 gap-1">
        <span className="bg-accent-primary rounded-full" />
        <span className="bg-accent-primary rounded-full" />
        <span className="bg-accent-primary rounded-full" />
        <span className="bg-accent-primary rounded-full" />
      </span>
      <span className="leading-tight">
        <span className="text-accent-primary block text-2xl font-bold">{STORE_INFO.name}</span>
        <span className="text-text-secondary block text-xs">{STORE_INFO.tagline}</span>
      </span>
    </Link>
  );
};
