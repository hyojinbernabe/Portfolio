"use client";

import { useEffect, useRef } from "react";

/*
 * Scroll-scrubbed marquee band:
 * one row of huge display type repeated COPIES times, dragged left as the
 * page scrolls down and right as it scrolls up. Not an autoplaying ticker,
 * the offset is a pure function of scrollY (Lenis already smooths that), so
 * no rAF loop, no GSAP: one transform write per scroll event, wrapped modulo
 * one copy's width for the seamless infinite loop.
 */

const COPIES = 4; // enough that the row always overflows both edges
const SPEED = 0.4; // px of marquee travel per px of page scroll
const AUTOPLAY = 40; // px/s of ambient drift when the page is still

export function MarqueeBand({ label = "Hyojin" }: { label?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // One copy's stride (width + trailing margin) is the wrap length.
    let copyW = 0;
    const measure = () => {
      const kids = track.children;
      copyW =
        kids.length > 1
          ? (kids[1] as HTMLElement).offsetLeft -
            (kids[0] as HTMLElement).offsetLeft
          : track.offsetWidth;
    };
    // Ambient drift + scroll scrub. The band always creeps at AUTOPLAY px/s
    // in whichever direction the page last scrolled (down = left, up =
    // right); scrolling adds its own delta on top, so a scroll reads as the
    // drift surging and (on reversal) turning around.
    let offset = 0;
    let lastY = window.scrollY;
    let dir = 1; // 1 = leftward travel (the scroll-down direction)
    let pending = 0; // scroll scrub queued for the next frame
    const onScroll = () => {
      const y = window.scrollY;
      const d = y - lastY;
      lastY = y;
      if (!d) return;
      dir = d > 0 ? 1 : -1;
      pending += d * SPEED;
    };

    let raf = 0;
    let prev = 0;
    let running = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(64, now - prev || 16) / 1000;
      prev = now;
      offset += dir * AUTOPLAY * dt + pending;
      pending = 0;
      if (!copyW) return;
      const x = -(((offset % copyW) + copyW) % copyW);
      track.style.transform = `translate3d(${x}px,0,0)`;
    };

    // Only animate while the band is actually on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        prev = performance.now();
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(track);

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Decorative typographic texture, not content: hidden from the a11y tree,
  // no links, no hover states.
  return (
    // Negative margins cancel the layout's lg gutters: the band runs
    // edge-to-edge under the fixed side rails instead of clipping at them.
    <section aria-hidden className="overflow-hidden py-12 lg:-mx-[125px]">
      <div
        ref={trackRef}
        className="flex w-max font-display text-[13vw] leading-[0.85] tracking-[-0.01em] uppercase"
      >
        {Array.from({ length: COPIES }, (_, i) => (
          <span key={i} className="mr-[0.25em] whitespace-nowrap after:content-['.']">
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
