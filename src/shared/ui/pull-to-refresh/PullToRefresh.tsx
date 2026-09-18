"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export const PullToRefresh = ({ children }: PullToRefreshProps) => {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== "undefined" && window.scrollY === 0) {
      const touch = e.touches[0]; if (!touch) return; startYRef.current = touch.clientY;
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || isRefreshing) return;
    const touch = e.touches[0]; if (!touch) return; const currentY = touch.clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0 && typeof window !== "undefined" && window.scrollY === 0) {
      setPullDistance(Math.min(75, diff * 0.45));
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (pullDistance > 55) {
      setIsRefreshing(true);
      setPullDistance(50);
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {pullDistance > 0 ? (
        <div
          className="flex items-center justify-center transition-all overflow-hidden"
          style={{ height: `${pullDistance}px` }}
        >
          <div className="flex items-center gap-2 rounded-full bg-white/90 border border-slate-200 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
            <Loader2 size={15} className="animate-spin text-emerald-600" />
            <span>{isRefreshing ? "Обновление..." : "Потяните для обновления"}</span>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
};
