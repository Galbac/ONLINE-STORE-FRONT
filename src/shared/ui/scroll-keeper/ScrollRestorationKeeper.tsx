"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const ScrollRestorationKeeper = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    let timer: any = null;
    const saveScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("scroll_pos_" + window.location.pathname, String(window.scrollY));
        }
      }, 100);
    };

    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("beforeunload", saveScroll);

    const saved = sessionStorage.getItem("scroll_pos_" + pathname);
    if (saved) {
      const top = Number(saved);
      if (Number.isFinite(top) && top > 0) {
        window.scrollTo({ top, behavior: "instant" });
        requestAnimationFrame(() => {
          window.scrollTo({ top, behavior: "instant" });
        });
      }
    }

    return () => {
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("beforeunload", saveScroll);
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  return null;
};
