"use client";

import { useSyncExternalStore } from "react";

// True on touch-primary devices (phones/tablets); false for mouse/trackpad.
// Server snapshot is false so hydration matches, then corrects on the client.
export function useCoarsePointer() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}
