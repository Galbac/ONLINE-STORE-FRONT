"use client";

import Link from "next/link";
import { Flame, Sparkles, Sprout, Utensils, Gift, Clock } from "lucide-react";
import { ROUTES } from "@/shared/config";

interface StoryItem {
  id: string;
  title: string;
  badge?: string;
  href: string;
  icon: React.ReactNode;
  gradient: string;
}

const STORIES: StoryItem[] = [
  {
    id: "discounts",
    title: "Скидки недели",
    badge: "-40%",
    href: `${ROUTES.CATALOG}?has_discount=true`,
    icon: <Flame size={22} className="text-rose-500" />,
    gradient: "from-rose-500/20 to-orange-500/20 border-rose-300",
  },
  {
    id: "new",
    title: "Новинки",
    badge: "NEW",
    href: `${ROUTES.CATALOG}?sort=newest`,
    icon: <Sparkles size={22} className="text-amber-500" />,
    gradient: "from-amber-500/20 to-yellow-500/20 border-amber-300",
  },
  {
    id: "farm",
    title: "Фермерское",
    href: `${ROUTES.CATALOG}?q=фермер`,
    icon: <Sprout size={22} className="text-emerald-600" />,
    gradient: "from-emerald-500/20 to-teal-500/20 border-emerald-300",
  },
  {
    id: "fast",
    title: "За 15 минут",
    href: ROUTES.CATALOG,
    icon: <Clock size={22} className="text-blue-500" />,
    gradient: "from-blue-500/20 to-cyan-500/20 border-blue-300",
  },
  {
    id: "recipes",
    title: "Рецепты",
    href: `${ROUTES.CATALOG}?q=набор`,
    icon: <Utensils size={22} className="text-purple-500" />,
    gradient: "from-purple-500/20 to-pink-500/20 border-purple-300",
  },
  {
    id: "loyalty",
    title: "Бонусы",
    badge: "+5%",
    href: ROUTES.PROFILE_LOYALTY,
    icon: <Gift size={22} className="text-emerald-500" />,
    gradient: "from-emerald-500/20 to-lime-500/20 border-emerald-300",
  },
];

export const StoriesBar = () => {
  return (
    <section className="py-2">
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STORIES.map((story) => (
          <Link
            key={story.id}
            href={story.href}
            className="group flex flex-col items-center gap-1.5 shrink-0 text-center transition active:scale-95"
          >
            <div
              className={`relative flex size-15 sm:size-17 items-center justify-center rounded-2xl sm:rounded-3xl border-2 bg-gradient-to-tr ${story.gradient} p-0.5 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}
            >
              <div className="flex size-full items-center justify-center rounded-[18px] sm:rounded-[22px] bg-white shadow-2xs">
                {story.icon}
              </div>
              {story.badge ? (
                <span className="absolute -bottom-1.5 rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-tight text-white shadow-xs">
                  {story.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-tight line-clamp-1 max-w-[72px] sm:max-w-[80px]">
              {story.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
