import { createJSONStorage } from "zustand/middleware";

const dummyStorage = {
  getItem: (_key: string): string | null => null,
  setItem: (_key: string, _value: string): void => {},
  removeItem: (_key: string): void => {},
};

export const getSafeLocalStorage = () => {
  if (typeof window === "undefined") {
    return dummyStorage;
  }
  try {
    return window.localStorage || dummyStorage;
  } catch {
    return dummyStorage;
  }
};

export const safeJsonStorage = <T>() => createJSONStorage<T>(() => getSafeLocalStorage());
