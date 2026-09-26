"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FlaskConical, Keyboard, Rocket, ScanSearch } from "lucide-react";
import { useHeadingFx } from "@/hooks/use-heading-fx";
import { FxHeading } from "@/components/ui/fx-heading";

gsap.registerPlugin(ScrollTrigger);

/*
 * Pinned horizontal process deck. It opens directly on panel 01, then the
 * section pins and vertical scroll drags
 * four full-viewport panels sideways with a lagged scrub. Pinning is CSS
 * sticky + a tall runway (same trick as the About section), GSAP only
 * scrubs the transform. Type is the About section's wide display cut;
 * colors are theme tokens following the page theme (light band on the light
 * theme). Headings use the shared useHeadingFx effect.
 */

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// How a project goes, start to finish.
// Icons are lucide, same family as the About stickers.
const STAGES = [
  {
    title: "Read",
    body: "Before any code: read the brief, the existing code, and the docs. Most bugs I've avoided, I avoided here.",
    Icon: ScanSearch,
  },
  {
    title: "Type",
    body: "Small commits, one change at a time, pushed often so nobody waits a week to see progress.",
    Icon: Keyboard,
  },
];

// Sticker tilts, same trick as the About cards' icon badges.
const STICKER_TILT = [-6, 4, -3, 5];

// About-section heading treatment on each stage name: wide display cut,
// char pop-in as the panel slides into view, letter dip + green flash on hover.
function StageHeading({ children }: { children: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useHeadingFx(ref, 0, 0.3);
  return (
    <h3
      ref={ref}
      className="font-display-wide font-black [font-stretch:125%] text-[clamp(2.8rem,7vw,6rem)] leading-[0.95] uppercase"
    >
      {children}
      <span className="text-brand [--char-flash:var(--foreground)]">.</span>
    </h3>
  );
}

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const row = rowRef.current;
    const title = titleRef.current;
    if (!section || !row || !title || reducedMotion()) return;

    let io: IntersectionObserver | undefined;
    let itemIO: IntersectionObserver | undefined;
    let speedIO: IntersectionObserver | undefined;
    let tickerCleanup: (() => void) | undefined;

    const ctx = gsap.context(() => {
      // Title ENTRANCE: one-shot soft rise when the section scrolls into
      // view (the site's usual section-arrival language). Initial state set
      // in JS so no-JS keeps it visible.
      gsap.set(title, { y: 40, autoAlpha: 0 });
      // Toggle, not one-shot: re-arms off screen, replays on re-entry.
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            gsap.to(title, {
              y: 0,
              autoAlpha: 1,
              duration: 0.8,
              ease: "power3.out",
              overwrite: true,
            });
          } else {
            gsap.killTweensOf(title);
            gsap.set(title, { y: 40, autoAlpha: 0 });
          }
        },
        { threshold: 0.1 },
      );
      io.observe(section);

      // Title EXIT: scrubbed and reversible, right before the pin releases.
      // The leading filler keeps this timeline inert everywhere else, so it
      // can never fight the entrance above.
      const titleTl = gsap
        .timeline({ paused: true })
        .to({}, { duration: 0.93 })
        .to(title, { y: -40, autoAlpha: 0, duration: 0.07, ease: "power2.in" });

      // Numerals, bodies, and icon badges get the same treatment the stage
      // titles already have: animate when they scroll into view, animate
      // back out when they leave. An observer per item (works fine on the
      // horizontally translated row) toggles a rise/fall tween both ways,
      // with a small per-item stagger via data-order.
      const items = gsap.utils.toArray<HTMLElement>("[data-stage-item]", row);
      gsap.set(items, { y: 30, autoAlpha: 0 });
      // Hysteresis: reveal as soon as a sliver (8%) is visible, re-arm only
      // once fully off screen. Stopping the scroll mid-crossing can no
      // longer strand a visible-but-hidden item.
      itemIO = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const el = entry.target as HTMLElement;
            if (entry.intersectionRatio >= 0.08) {
              gsap.to(el, {
                y: 0,
                autoAlpha: 1,
                duration: 0.7,
                ease: "power3.out",
                delay: Number(el.dataset.order ?? 0) * 0.08,
                overwrite: true,
              });
            } else if (!entry.isIntersecting) {
              gsap.to(el, {
                y: 30,
                autoAlpha: 0,
                duration: 0.4,
                ease: "power2.in",
                overwrite: true,
              });
            }
          }
        },
        { threshold: [0, 0.08] },
      );
      items.forEach((el) => itemIO?.observe(el));

      // One scrubbed tween across the whole runway: the horizontal drag,
      // starting right on panel 01, no entry curtain.
      gsap.fromTo(
        row,
        { x: 0 },
        {
          x: () => -(row.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5, // a bit of lag feels smoother
            invalidateOnRefresh: true,
            onUpdate: (self) => titleTl.progress(self.progress),
          },
        },
      );

      // Same speed blur as the hero keyboard, on the sliding deck (the pinned title
      // lives outside the filtered wrapper and stays crisp):
      // one speed value (from the row's actual velocity, so it agrees with
      // the scrub lag) drives an x-only feGaussianBlur smear, a slight lean
      // into the direction of travel, and a touch of vertical squash.
      // Perf: the filter sits on the viewport-sized wrapper (not the 400vw
      // row), the blur value is quantized so the filter only recomputes on
      // real changes, and everything detaches at rest.
      const wrap = wrapRef.current;
      const MAX_BLUR = 10;
      const MAX_LEAN = 2.5; // deg
      const MAX_SQUASH = 0.025;
      const NORM = 3000; // px/s of row travel that counts as "full speed"
      let lastX = NaN;
      let speed = 0;
      let dir = 1;
      let lastBlur = 0;
      let resting = true;
      const tick = (_t: number, dt: number) => {
        if (!wrap) return;
        const x = Number(gsap.getProperty(row, "x"));
        const vx = Number.isNaN(lastX) || !dt ? 0 : ((x - lastX) / dt) * 1000;
        lastX = x;
        if (vx) dir = Math.sign(vx);
        const target = Math.min(1, Math.abs(vx) / NORM);
        speed += (target - speed) * 0.18;
        if (speed < 0.01) speed = 0;

        const blur = Math.round(speed * MAX_BLUR * 2) / 2; // 0.5px steps
        if (blur !== lastBlur) {
          lastBlur = blur;
          if (blur === 0) {
            wrap.style.filter = "";
          } else {
            if (!wrap.style.filter)
              wrap.style.filter = "url(#process-speed-blur)";
            blurRef.current?.setAttribute("stdDeviation", `${blur} 0`);
          }
        }
        if (speed === 0) {
          if (!resting) {
            resting = true;
            gsap.set(wrap, { skewX: 0, scaleY: 1 });
          }
          return;
        }
        resting = false;
        gsap.set(wrap, {
          skewX: -dir * speed * MAX_LEAN,
          scaleY: 1 - speed * MAX_SQUASH,
        });
      };
      speedIO = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          lastX = NaN;
          gsap.ticker.add(tick);
        } else {
          gsap.ticker.remove(tick);
        }
      });
      speedIO.observe(section);
      tickerCleanup = () => gsap.ticker.remove(tick);
    }, section);
    return () => {
      io?.disconnect();
      itemIO?.disconnect();
      speedIO?.disconnect();
      tickerCleanup?.();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="process"
      aria-label="How I work"
      className="relative h-[400svh] lg:-mx-[125px] motion-reduce:h-auto"
    >
      <div className="sticky top-0 h-svh overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible">
        {/* Directional-blur rig, same setup as the hero keyboard: x-only
            stdDeviation so the smear follows the travel axis. */}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <filter id="process-speed-blur" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
            </filter>
          </defs>
        </svg>
        {/* Pinned title: sits OUTSIDE the filtered wrapper so the speed blur
            and lean never touch it, it isn't the thing moving. */}
        <div
          ref={titleRef}
          className="absolute inset-x-0 top-10 z-10 px-6 text-center motion-reduce:static motion-reduce:pt-24"
        >
          <FxHeading
            tag="h2"
            threshold={0.2}
            className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-none tracking-[-0.01em] uppercase"
          >
            How I Work
            <span className="text-brand [--char-flash:var(--foreground)]">.</span>
          </FxHeading>
        </div>
        <div ref={wrapRef} className="relative h-full bg-background">
          <div
            ref={rowRef}
            className="flex h-full w-max will-change-transform motion-reduce:h-auto motion-reduce:w-full motion-reduce:flex-col"
          >
            {STAGES.map((stage, i) => (
              <article
                key={stage.title}
                className="h-full w-screen motion-reduce:h-auto motion-reduce:w-full"
              >
                <div className="relative mx-auto flex h-full w-full max-w-[1200px] flex-col items-center justify-center gap-5 px-6 pt-36 pb-24 text-center text-foreground sm:px-12">
                  {/* The About-card numeral treatment for the 01–04 */}
                  <span
                    aria-hidden
                    data-stage-item
                    data-order="0"
                    className="font-display-wide font-black [font-stretch:125%] text-[clamp(3.5rem,9vw,7rem)] leading-none text-brand"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <StageHeading>{stage.title}</StageHeading>
                  <p
                    data-stage-item
                    data-order="1"
                    className="max-w-[460px] text-base font-light leading-relaxed text-foreground/70 sm:text-lg"
                  >
                    {stage.body}
                  </p>
                  <span
                    aria-hidden
                    data-stage-item
                    data-order="2"
                    className="pointer-events-none mt-6 grid size-28 place-items-center rounded-full border-4 border-background bg-brand text-brand-foreground shadow-md sm:size-36"
                    style={{ transform: `rotate(${STICKER_TILT[i]}deg)` }}
                  >
                    <stage.Icon className="size-12 sm:size-16" strokeWidth={1.8} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
