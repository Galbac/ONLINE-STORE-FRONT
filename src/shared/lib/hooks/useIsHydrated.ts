"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns true only after React hydration has succeeded on the client.
 * Server snapshot is always false.
 * During initial client hydration, server snapshot (false) is rendered,
 * completely eliminating Next.js Hydration Mismatch issues.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Safe wrapper around a Zustand store selector that prevents SSR hydration mismatches.
 * Returns fallbackValue on the server and during the initial hydration render,
 * then returns the live store value once hydrated on the client.
 */
export function useHydratedStore<T, F>(
  useStore: (selector: (state: T) => unknown) => unknown,
  selector: (state: T) => F,
  fallbackValue: F,
): F {
  const isHydrated = useIsHydrated();
  const storeValue = useStore(selector) as F;
  return isHydrated ? storeValue : fallbackValue;
}
