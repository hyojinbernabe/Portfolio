"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useHeadingFx } from "@/hooks/use-heading-fx";

// The brand wordmark with the full site text treatment: char pop-in on view,
// letter dip + green flash under the pointer, outlined display caps.
// `vertical` is the left rail's rotated form (columns read right-to-left in
// vertical-rl, so Bernabe is listed first); default is the horizontal
// two-line stack.
export function Wordmark({
  vertical = false,
  className,
}: {
  vertical?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useHeadingFx(ref, 0, 0.1);
  return (
    <span
      ref={ref}
      className={cn(
        "font-display leading-none tracking-[0.18em] uppercase [-webkit-text-stroke:0.5px_currentColor]",
        className,
      )}
    >
      {vertical ? (
        <>
          <span className="[writing-mode:vertical-rl]">Bernabe</span>
          <span className="[writing-mode:vertical-rl]">Hyojin</span>
        </>
      ) : (
        <>
          <span className="block">Hyojin</span>
          <span className="block">Bernabe</span>
        </>
      )}
    </span>
  );
}
