"use client";

import { useLenis } from "@/lib/use-lenis";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useLenis();
  return <>{children}</>;
}
