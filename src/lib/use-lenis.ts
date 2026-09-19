"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useLenis() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({ lerp: 0.1 });
    document.documentElement.classList.add("lenis");
    // Keep scrubbed ScrollTriggers in lockstep with Lenis' smoothed scroll
    // instead of the browser's raw scroll events.
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (one shared rAF loop) so scrubbed tweens
    // render on the same frame as the scroll update, two independent rAF
    // loops are one frame apart and read as jitter. lagSmoothing off because
    // scroll-linked animation must never time-shift after a dropped frame.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      document.documentElement.classList.remove("lenis");
    };
  }, []);
}
