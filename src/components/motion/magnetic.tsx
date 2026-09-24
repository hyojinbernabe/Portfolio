"use client";

import { useRef } from "react";
import gsap from "gsap";

export function Magnetic({
  children,
  className,
  pull = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  pull?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(ref.current, { x: x * pull, y: y * pull, duration: 0.2, ease: "power2.out" });
  }

  function handleLeave() {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  }

  return (
    <div ref={ref} className={className} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  );
}
