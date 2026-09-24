"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Computed styles come back as oklch() strings, which GSAP can't reliably
// interpolate (the flash tween drifts through junk hues, e.g. yellow).
// A canvas context resolves any CSS color to plain hex/rgba first.
let colorCtx: CanvasRenderingContext2D | null | undefined;
const resolveColor = (c: string) => {
  if (!c) return c;
  colorCtx ??= document.createElement("canvas").getContext("2d");
  if (!colorCtx) return c;
  colorCtx.fillStyle = "#000";
  try {
    colorCtx.fillStyle = c;
  } catch {
    return c;
  }
  return colorCtx.fillStyle;
};

// The hero heading treatment, shared across sections: SplitText chars pop in
// staggered when the element enters view, then each letter dips + elastically
// settles under the pointer (nearest-center hit test, same as
// use-hero-intro.ts). `delay` staggers sibling headings against each other.
// `threshold` is the IntersectionObserver ratio, lower it for elements that
// deliberately bleed off-viewport (their box can never be 50% visible).
export function useHeadingFx<T extends HTMLElement>(
  ref: RefObject<T | null>,
  delay = 0,
  threshold = 0.5,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;

    const split = SplitText.create(el, { type: "chars" });
    gsap.set(split.chars, { opacity: 0, yPercent: 100 });

    let ready = false; // hover stays inert until the entrance finishes
    // No disconnect: leaving the viewport re-arms the chars so the pop
    // replays every time the heading scrolls back in, in either direction.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(split.chars, {
            opacity: 1,
            yPercent: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.05,
            delay,
            overwrite: true,
            onComplete: () => {
              ready = true;
            },
          });
        } else {
          ready = false;
          gsap.killTweensOf(split.chars);
          gsap.set(split.chars, { opacity: 0, yPercent: 100 });
        }
      },
      { threshold },
    );
    io.observe(el);

    let active: Element | null = null;
    const dip = (char: Element) => {
      gsap.killTweensOf(char);
      // Flash the char brand green, then fade back while it settles. Colors are
      // sampled from the cascade each dip (after clearing any inline color a
      // prior dip left) so the char returns to whatever it normally wears,
      // including the green "?", and theme flips stay correct.
      gsap.set(char, { clearProps: "color" });
      const cs = getComputedStyle(char as HTMLElement);
      const base = resolveColor(cs.color);
      // Chars that already rest in an accent color can override the flash
      // via --char-flash (e.g. the green "?" flashes foreground instead).
      const brand = resolveColor(
        cs.getPropertyValue("--char-flash").trim() ||
          cs.getPropertyValue("--brand").trim(),
      );
      const tl = gsap
        .timeline()
        .to(char, { yPercent: 12, duration: 0.2, ease: "power2.out" }, 0)
        .to(char, { yPercent: 0, duration: 1, ease: "elastic.out(1, 0.5)" }, 0.2);
      if (brand)
        tl.set(char, { color: brand }, 0).to(
          char,
          {
            color: base,
            duration: 0.7,
            ease: "power2.out",
            onComplete: () => gsap.set(char, { clearProps: "color" }),
          },
          0.3,
        );
    };
    const onMove = (e: PointerEvent) => {
      if (!ready) return;
      let hit: Element | null = null;
      let best = Infinity;
      for (const char of split.chars) {
        const r = char.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          continue;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = dx * dx + dy * dy;
        if (d < best) {
          best = d;
          hit = char;
        }
      }
      if (hit && hit !== active) dip(hit);
      active = hit;
    };
    const onLeave = () => {
      active = null;
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      split.revert();
    };
  }, [ref, delay, threshold]);
}
