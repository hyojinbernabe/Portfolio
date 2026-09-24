"use client";

import { useRef } from "react";
import { useHeadingFx } from "@/hooks/use-heading-fx";

// Shared split-char display heading: chars pop in staggered on first view,
// letters dip + flash green under the pointer (site-standard useHeadingFx).
// Client wrapper so server components can give any heading the treatment.
export function FxHeading({
  tag: Tag = "h3",
  className,
  children,
  delay = 0,
  threshold = 0.3,
}: {
  tag?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useHeadingFx(ref, delay, threshold);
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
