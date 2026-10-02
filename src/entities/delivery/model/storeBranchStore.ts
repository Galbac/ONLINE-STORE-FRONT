"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJsonStorage } from "@/shared/lib/safe-storage";
import type { PickupPointResponse } from "../types";

interface StoreBranchState {
  selectedStore: PickupPointResponse | null;
  setSelectedStore: (store: PickupPointResponse) => void;
  clearSelectedStore: () => void;
}

export const useStoreBranch = create<StoreBranchState>()(
  persist(
    (set) => ({
      selectedStore: null,
      setSelectedStore: (store: PickupPointResponse) => {
        set({ selectedStore: store });
        if (typeof document !== "undefined") {
          document.cookie = `current_store_id=${store.id}; path=/; max-age=31536000; SameSite=Lax`;
        }
      },
      clearSelectedStore: () => {
        set({ selectedStore: null });
        if (typeof document !== "undefined") {
          document.cookie = "current_store_id=; path=/; max-age=0";
        }
      },
    }),
    {
      name: "grocery_selected_store_branch",
      storage: safeJsonStorage(),
    },
  ),
);
