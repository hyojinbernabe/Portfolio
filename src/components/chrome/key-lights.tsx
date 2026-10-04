"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

/*
 * Keyboard boot loading screen + route transition.
 *
 *   landing page ("/"): the full ceremony. The rig drops in, the six keycaps
 *   spelling HYOJIN press and light up one per beat (the ceremony waits on
 *   fonts so it doubles as a real loader), a short hold, then every key goes
 *   dark at once and a green scan beam sweeps left to right, dragging the
 *   page reveal behind it (clip-path tracks the beam's center).
 *   any other route: just the beam pass.
 *
 * The overlay is a lid over the normally-rendered page (SSR'd opaque, so no
 * flash before hydration) and unmounts when done. It fires `loader:done` +
 * <html data-loader-done>, which the hero keyboard entrance waits for.
 */

const KEYS = ["H", "Y", "O", "J", "I", "N"];

// LED texture punched over the board, same dark material in both themes.
const LED_OVERLAY = {
  backgroundImage:
    "radial-gradient(circle at center, transparent 1.3px, #0c0c0c 1.65px)",
  backgroundSize: "8px 8px",
} as const;

const LOGO_MASK = {
  WebkitMaskImage: "url(/hyojin-bernabe-logo.svg)",
  maskImage: "url(/hyojin-bernabe-logo.svg)",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
} as const;

// rAF-based pause on the gsap ticker, so the whole sequence shares one clock.
const wait = (ms: number) =>
  new Promise((r) => gsap.delayedCall(ms / 1000, r));

export function KeyLights() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const [phase, setPhase] = useState<"show" | "idle">("show");
  const firstPath = useRef(true);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    setPhase("show");
  }, [pathname]);

  useEffect(() => {
    if (phase !== "show") return;
    const root = rootRef.current;
    const panel = panelRef.current;
    const rig = rigRef.current;
    const beam = beamRef.current;
    if (!root || !panel || !rig || !beam) return;

    const full = pathname === "/";

    const finish = () => {
      document.documentElement.style.overflow = "";
      document.documentElement.dataset.loaderDone = "1";
      window.dispatchEvent(new Event("loader:done"));
      setPhase("idle");
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    document.documentElement.style.overflow = "hidden";
    panel.style.clipPath = "";

    let cancelled = false;
    const ctx = gsap.context(() => {
      const caps = gsap.utils.toArray<HTMLElement>("[data-cap]", root);
      const glows = gsap.utils.toArray<HTMLElement>("[data-cap-glow]", root);
      gsap.set(glows, { opacity: 0 });
      gsap.set(beam, { xPercent: -50, autoAlpha: 0 });

      const run = async () => {
        if (full) {
          delete document.documentElement.dataset.loaderDone;

          gsap.set(rig, { y: "-70vh", autoAlpha: 1 });
          await gsap.to(rig, { y: 0, duration: 0.85, ease: "power4.out" });
          if (cancelled) return;

          await Promise.race([document.fonts.ready, wait(1500)]);
          if (cancelled) return;

          // One key per beat: press down, light up, spring back.
          for (let i = 0; i < KEYS.length; i++) {
            gsap
              .timeline()
              .to(caps[i], { y: 6, duration: 0.07, ease: "power2.in" })
              .to(caps[i], { y: 0, duration: 0.3, ease: "back.out(3)" });
            gsap.to(glows[i], { opacity: 1, duration: 0.12 });
            await wait(450);
            if (cancelled) return;
          }

          await wait(250 + Math.random() * 400);
          if (cancelled) return;

          // Enter: every key goes dark in a single frame.
          gsap.set(glows, { opacity: 0 });
          await wait(160);
          if (cancelled) return;
        } else {
          await Promise.race([document.fonts.ready, wait(700)]);
          if (cancelled) return;
        }

        // Beam pass: one progress value drives position, blur, stretch, and
        // the clip-path reveal pinned to the beam's center.
        gsap.set(beam, { autoAlpha: 1 });
        const wipe = { p: 0 };
        const vw = window.innerWidth;
        const beamW = beam.offsetWidth;
        const startC = -0.6 * beamW;
        const endC = vw + 0.6 * beamW;
        gsap.set(beam, { x: startC });
        gsap.to(wipe, {
          p: 1,
          duration: 1.05,
          ease: "power2.inOut",
          onUpdate: () => {
            const c = startC + wipe.p * (endC - startC);
            const speed = Math.sin(Math.PI * wipe.p);
            gsap.set(beam, { x: c, scaleX: 1 + speed * 0.6 });
            blurRef.current?.setAttribute("stdDeviation", `${speed * 26} 0`);
            const r = beam.getBoundingClientRect();
            const edge = r.left + r.width * 0.5;
            const cut = Math.max(0, Math.min(100, (edge / vw) * 100));
            panel.style.clipPath = `inset(0 0 0 ${cut}%)`;
          },
        });
        await wait(1150);
        if (!cancelled) finish();
      };
      run();
    }, root);

    return () => {
      cancelled = true;
      document.documentElement.style.overflow = "";
      panel.style.clipPath = "";
      ctx.revert();
    };
  }, [phase, pathname]);

  if (phase === "idle") return null;

  return (
    <div ref={rootRef} data-key-lights aria-hidden className="fixed inset-0 z-[100]">
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="loader-beam-blur" colorInterpolationFilters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>

      {/* The lid: everything except the beam, so the clip-path reveal slices
          it away behind the passing beam. */}
      <div
        ref={panelRef}
        className="absolute inset-0 flex items-center justify-center bg-background"
      >
        <div ref={rigRef} className="flex flex-col items-center opacity-0">
          {/* LED board with the HB mark. */}
          <div className="relative grid h-[clamp(5.5rem,20vw,12rem)] w-[clamp(15rem,68vw,36rem)] place-items-center rounded-lg bg-[#161616] shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
            <span className="h-[clamp(2.6rem,8vw,5.6rem)] w-[clamp(4.4rem,13.3vw,9.3rem)] bg-brand" style={LOGO_MASK} />
            <span className="absolute inset-0 rounded-md" style={LED_OVERLAY} />
          </div>
          {/* Keyboard case holding the six caps. */}
          <div className="mt-[clamp(0.75rem,2.5vw,1.5rem)] flex gap-[clamp(0.3rem,1.2vw,0.75rem)] rounded-2xl bg-[#1a1a1a] p-[clamp(0.45rem,1.6vw,1rem)] shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
            {KEYS.map((key) => (
              <div key={key} className="relative">
                {/* RGB underglow leaking around the cap. */}
                <span
                  data-cap-glow
                  className="absolute inset-0 rounded-xl bg-brand shadow-[0_0_24px_6px_var(--brand),0_0_70px_22px_color-mix(in_oklab,var(--brand)_45%,transparent)]"
                />
                <span
                  data-cap
                  className="relative grid size-[clamp(2.4rem,9vw,5.25rem)] place-items-center rounded-xl border-b-[clamp(3px,0.8vw,6px)] border-[#050505] bg-[#262626] font-display text-[clamp(1.1rem,4vw,2.4rem)] text-[#e5e5e5] shadow-[inset_0_2px_0_rgba(255,255,255,0.08)]"
                >
                  {key}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The scan beam rides above the lid, dragging the reveal behind it. */}
      <div
        ref={beamRef}
        className="absolute top-0 left-0 h-svh w-[clamp(6rem,14vw,14rem)] opacity-0"
        style={{
          filter: "url(#loader-beam-blur)",
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--brand) 55%, transparent) 30%, #f0fff4 50%, color-mix(in oklab, var(--brand) 55%, transparent) 70%, transparent)",
        }}
      />
    </div>
  );
}
