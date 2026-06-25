"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

// True only after client hydration — lets portals/effects safely touch the DOM
// without a setState-in-effect or a server/client hydration mismatch.
export function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}
