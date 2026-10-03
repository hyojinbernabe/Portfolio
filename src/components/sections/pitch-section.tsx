"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Braces,
  Bug,
  Code,
  Cpu,
  Database,
  GitBranch,
  Heart,
  Keyboard,
  MousePointerClick,
  Music,
  PartyPopper,
  Rainbow,
  Rocket,
  Smile,
  Sparkles,
  Star,
  Sun,
  Terminal,
  ThumbsUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EMAIL_HREF } from "@/lib/site-nav";
import { Magnetic } from "@/components/motion/magnetic";
import { RollLink } from "@/components/ui/roll-link";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";

gsap.registerPlugin(ScrollTrigger);

/*
 * One pinned pitch section, two slides that hand over mid-pin:
 *
 *   A, "Built for Speed": scroll spawns big lucide icons (some brand-green,
 *       some foreground) that fall under a hand-rolled physics sim and pile
 *       up; the cursor shoves them around. Exiting opens the floor so the
 *       pile gravity-falls out; every fresh visit replays the falling
 *       entrance.
 *   B, "Delight Your Users": clicking bursts fun lucide icons (green/black)
 *       from the click point, ballistic, 1s fade, recycled sprite pool.
 *
 * Everything is DOM sprites with GSAP-applied transforms, no canvas, no
 * per-frame rasterization, transform/opacity-only compositing (phone-safe).
 * The A to B handover is a masked text roll on a scrubbed GSAP timeline (pure
 * translation, no fades), then the CLICK! pill pops.
 */

const PILE_ICONS = [
  Keyboard,
  Code,
  Terminal,
  Cpu,
  Braces,
  GitBranch,
  Zap,
  Rocket,
  Bug,
  Database,
];
const BURST_ICONS = [
  Sparkles,
  Star,
  Heart,
  PartyPopper,
  Smile,
  Rainbow,
  Rocket,
  Music,
  Sun,
  ThumbsUp,
];
const POOL = 18; // pile sprites rendered; phones use the first 10
const BURST_POOL = 24; // max simultaneous burst sprites, recycled
const G = 1800; // px/s²
const SETTLED = 20; // px/s, below this a sprite counts as asleep

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Sprite = {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  va: number;
  r: number;
};

export function PitchSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const iconLayerRef = useRef<HTMLDivElement>(null);
  const slideBRef = useRef<HTMLDivElement>(null);
  const burstLayerRef = useRef<HTMLDivElement>(null);
  const textARef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const slideCRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const hint = useCoarsePointer() ? "Tap!" : "Click!";

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const iconLayer = iconLayerRef.current;
    const slideB = slideBRef.current;
    const burstLayer = burstLayerRef.current;
    const textA = textARef.current;
    const pill = pillRef.current;
    const slideC = slideCRef.current;
    const cta = ctaRef.current;
    if (!section || !sticky || !iconLayer || !slideB || !burstLayer || !textA || !pill || !slideC || !cta)
      return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let W = 0;
    let H = 0;
    let total = POOL;
    let tb = { left: 0, top: 0, right: 0, bottom: 0 }; // text obstacle box
    const measure = () => {
      W = sticky.clientWidth;
      H = sticky.clientHeight;
      total = W < 768 ? 10 : POOL;
      const s = sticky.getBoundingClientRect();
      const t = textA.getBoundingClientRect();
      tb = {
        left: t.left - s.left,
        top: t.top - s.top,
        right: t.right - s.left,
        bottom: t.bottom - s.top,
      };
    };
    measure();

    const ctx = gsap.context(() => {
      /* ------------- the masked text-roll handover ------------- */

      const aLines = gsap.utils.toArray<HTMLElement>("[data-roll-a]", sticky);
      const bLines = gsap.utils.toArray<HTMLElement>("[data-roll-b]", sticky);
      const cLines = gsap.utils.toArray<HTMLElement>("[data-roll-c]", sticky);
      // Set here (not CSS/inline) so reduced-motion and no-JS render the
      // later slides' static text normally.
      gsap.set([...bLines, ...cLines], { yPercent: 110 });
      gsap.set([pill, cta], { autoAlpha: 0, scale: 0.4 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        })
        // A's lines roll up out of their masks, translation only, no fade.
        // (The icon pile is NOT tweened out, the physics floor opens and
        // the icons fall away under their own gravity, see onScroll.)
        .to(aLines, { yPercent: -110, duration: 0.12, stagger: 0.045, ease: "power1.in" }, 0.38)
        // B's lines roll up into place
        .to(bLines, { yPercent: 0, duration: 0.14, stagger: 0.055, ease: "power2.out" }, 0.5)
        // then the CLICK! pill pops on
        .to(pill, { autoAlpha: 1, scale: 1, duration: 0.05, ease: "back.out(2)" }, 0.64)
        // B hands over to the CTA slide the same way A handed to B
        .to(pill, { autoAlpha: 0, scale: 0.4, duration: 0.05, ease: "power1.in" }, 0.76)
        .to(bLines, { yPercent: -110, duration: 0.12, stagger: 0.045, ease: "power1.in" }, 0.76)
        .to(cLines, { yPercent: 0, duration: 0.14, stagger: 0.055, ease: "power2.out" }, 0.88)
        // the big footer-sized pill pops last
        .to(cta, { autoAlpha: 1, scale: 1, duration: 0.04, ease: "back.out(1.8)" }, 0.96);
    }, section);

    /* ------------- slide A: DOM icon physics, GSAP-applied ------------- */

    const pool = Array.from(
      iconLayer.querySelectorAll<HTMLElement>("[data-sprite]"),
    );
    const sprites: Sprite[] = [];
    const spawn = () => {
      const el = pool[sprites.length];
      if (!el) return;
      // about 120 to 200px across on desktop.
      const r = W < 768 ? 42 + Math.random() * 22 : 60 + Math.random() * 40;
      el.style.width = el.style.height = `${r * 2}px`;
      el.style.visibility = "visible";
      const s: Sprite = {
        el,
        x: r + Math.random() * (W - 2 * r),
        // vertical spread so bulk respawns rain in instead of clumping
        y: -r * 2 - Math.random() * H * 0.4,
        vx: (Math.random() - 0.5) * 120,
        vy: 0,
        a: Math.random() * 360,
        va: (Math.random() - 0.5) * 180,
        r,
      };
      gsap.set(el, { x: s.x - r, y: s.y - r, rotation: s.a });
      sprites.push(s);
    };

    const step = (dt: number) => {
      let moving = 0;
      for (const s of sprites) {
        s.vy += G * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.a += s.va * dt;
        if (s.x < s.r) {
          s.x = s.r;
          s.vx *= -0.5;
        }
        if (s.x > W - s.r) {
          s.x = W - s.r;
          s.vx *= -0.5;
        }
        // floorOpen: the ground disappears on exit and icons fall through
        if (!floorOpen && s.y > H - s.r) {
          s.y = H - s.r;
          s.vy *= -0.25;
          s.vx *= 0.9;
          s.va *= 0.9;
        }
        // text block behaves like an invisible obstacle (gone once the
        // text has rolled away and the icons are falling out)
        if (!floorOpen) {
          const cx = Math.max(tb.left, Math.min(s.x, tb.right));
          const cy = Math.max(tb.top, Math.min(s.y, tb.bottom));
          const dx = s.x - cx;
          const dy = s.y - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 < s.r * s.r) {
            const d = Math.sqrt(d2) || 0.01;
            const nx = d2 ? dx / d : 0;
            const ny = d2 ? dy / d : -1;
            s.x += nx * (s.r - d);
            s.y += ny * (s.r - d);
            const vn = s.vx * nx + s.vy * ny;
            if (vn < 0) {
              s.vx -= nx * vn * 1.25;
              s.vy -= ny * vn * 1.25;
              s.va *= 0.9;
            }
          }
        }
        if (s.vx * s.vx + s.vy * s.vy > SETTLED * SETTLED) moving++;
      }
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < sprites.length; i++) {
          for (let j = i + 1; j < sprites.length; j++) {
            const a = sprites[i];
            const b = sprites[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const min = a.r + b.r;
            const d2 = dx * dx + dy * dy;
            if (d2 >= min * min || !d2) continue;
            const d = Math.sqrt(d2);
            const nx = dx / d;
            const ny = dy / d;
            const ov = (min - d) / 2;
            a.x -= nx * ov;
            a.y -= ny * ov;
            b.x += nx * ov;
            b.y += ny * ov;
            const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rv < 0) {
              const imp = rv * 0.6;
              a.vx += nx * imp;
              a.vy += ny * imp;
              b.vx -= nx * imp;
              b.vy -= ny * imp;
            }
          }
        }
      }
      return moving;
    };

    const apply = () => {
      for (const s of sprites)
        gsap.set(s.el, { x: s.x - s.r, y: s.y - s.r, rotation: s.a });
    };

    // Self-sleeping loop: parks when the pile settles; scroll/pointer wake it.
    let raf = 0;
    let prev = 0;
    let idle = true;
    let visible = false;
    let target = 0;
    let phaseAActive = true;
    let floorOpen = false; // exit: ground opens, icons gravity-fall out
    let dumped = false; // pile has been dropped; re-entering phase A respawns
    const resetPile = () => {
      for (const s of sprites) s.el.style.visibility = "hidden";
      sprites.length = 0;
    };
    const loop = (now: number) => {
      const dt = Math.min(0.032, (now - prev) / 1000 || 0.016);
      prev = now;
      const moving = step(dt);
      if (floorOpen) {
        // cull icons once they've fallen past the bottom edge
        for (let i = sprites.length - 1; i >= 0; i--) {
          const s = sprites[i];
          if (s.y > H + s.r * 2) {
            s.el.style.visibility = "hidden";
            sprites.splice(i, 1);
          }
        }
      }
      apply();
      if (!moving && sprites.length >= target) {
        idle = true;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (!idle || !visible) return;
      if (!phaseAActive && sprites.length === 0) return;
      idle = false;
      prev = performance.now();
      raf = requestAnimationFrame(loop);
    };

    // The mouse shoves the pile: nearby sprites get pushed away, carrying
    // some of the pointer's own velocity.
    let lastMx = NaN;
    let lastMy = NaN;
    const onPointer = (e: PointerEvent) => {
      if (!phaseAActive || !visible) return;
      const rect = sticky.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const mvx = Number.isNaN(lastMx) ? 0 : mx - lastMx;
      const mvy = Number.isNaN(lastMy) ? 0 : my - lastMy;
      lastMx = mx;
      lastMy = my;
      let hit = false;
      for (const s of sprites) {
        const dx = s.x - mx;
        const dy = s.y - my;
        const reach = s.r + 60;
        const d2 = dx * dx + dy * dy;
        if (d2 >= reach * reach) continue;
        const d = Math.sqrt(d2) || 0.01;
        const f = (1 - d / reach) * 520;
        s.vx += (dx / d) * f + mvx * 14;
        s.vy += (dy / d) * f + mvy * 14;
        s.va += (Math.random() - 0.5) * 120;
        hit = true;
      }
      if (hit) wake();
    };
    sticky.addEventListener("pointermove", onPointer, { passive: true });

    /* ------------- scroll: spawn + phase gating ------------- */

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const p = clamp01(-rect.top / (rect.height - window.innerHeight));
      const wasA = phaseAActive;
      phaseAActive = p < 0.44;

      if (phaseAActive) {
        // Re-entering after the pile was dropped: clear and let the spawn
        // below rain the full set back in from the top, the entrance
        // replays instead of the pile teleporting back.
        if (dumped) {
          resetPile();
          dumped = false;
        }
        floorOpen = false;
        target = Math.min(total, Math.floor((p / 0.3) * total));
        if (sprites.length < target) {
          while (sprites.length < target) spawn();
          wake();
        }
      } else if (wasA && !dumped) {
        // Exiting: open the floor, icons fall out under gravity.
        dumped = true;
        floorOpen = true;
        target = 0;
        wake();
      }

      // B is interactive only while it owns the screen; then the CTA slide
      // takes the pointer.
      slideB.style.pointerEvents = p > 0.56 && p < 0.78 ? "auto" : "none";
      slideC.style.pointerEvents = p > 0.9 ? "auto" : "none";
      if (p > 0.6 && p < 0.78 && visible && !demoPlayed) {
        demoPlayed = true;
        playDemo();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        wake();
      } else {
        // Leaving the section entirely: clear the pile so the next visit
        // replays the falling entrance from scratch.
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
          idle = true;
        }
        resetPile();
        dumped = false;
        floorOpen = false;
        // next visit replays the quadrant demo too
        demoPlayed = false;
        clearDemo();
      }
    });
    io.observe(sticky);

    /* ------- slide B: click burst, ballistic DOM icons, recycled ------- */

    type P = {
      el: HTMLElement;
      x: number;
      y: number;
      vx: number;
      vy: number;
      a: number;
      va: number;
      life: number;
      size: number;
    };
    const bFree = Array.from(
      burstLayer.querySelectorAll<HTMLElement>("[data-burst]"),
    );
    const parts: P[] = [];
    let braf = 0;
    let bprev = 0;
    const bloop = (now: number) => {
      const dt = Math.min(0.032, (now - bprev) / 1000 || 0.016);
      bprev = now;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        p.vy += G * 0.8 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.a += p.va * dt;
        const alpha = 1 - Math.max(0, (p.life - 0.45) / 0.55);
        if (alpha <= 0) {
          p.el.style.visibility = "hidden";
          bFree.push(p.el);
          parts.splice(i, 1);
          continue;
        }
        gsap.set(p.el, {
          x: p.x - p.size / 2,
          y: p.y - p.size / 2,
          rotation: p.a,
          opacity: alpha,
        });
      }
      braf = parts.length ? requestAnimationFrame(bloop) : 0;
    };
    const burstAt = (x: number, y: number) => {
      const n = 10 + ((Math.random() * 5) | 0);
      for (let i = 0; i < n; i++) {
        // Recycle the oldest in-flight sprite when the free pool runs dry:
        // every click gets a full burst while the DOM pool stays capped.
        const el = bFree.pop() ?? parts.splice(0, 1)[0]?.el;
        if (!el) break;
        const ang = Math.random() * Math.PI * 2;
        const speed = 250 + Math.random() * 450;
        const size = 36 + Math.random() * 26;
        el.style.width = el.style.height = `${size}px`;
        el.style.visibility = "visible";
        parts.push({
          el,
          x,
          y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 250,
          a: Math.random() * 360,
          va: (Math.random() - 0.5) * 600,
          life: 0,
          size,
        });
      }
      if (!braf && parts.length) {
        bprev = performance.now();
        braf = requestAnimationFrame(bloop);
      }
    };
    const onBurst = (e: MouseEvent) => {
      const r = sticky.getBoundingClientRect();
      burstAt(e.clientX - r.left, e.clientY - r.top);
    };
    slideB.addEventListener("click", onBurst);

    // Demo bursts: when slide B arrives, four bursts fire on their own,
    // one per quadrant (TL, TR, BL, BR, random point within each),
    // sequentially, so visitors see what clicking does before they click.
    // Replays on the next visit to the section.
    let demoPlayed = false;
    const demoTimers: number[] = [];
    const playDemo = () => {
      const quads = [
        [0.08, 0.45, 0.15, 0.45],
        [0.55, 0.92, 0.15, 0.45],
        [0.08, 0.45, 0.55, 0.85],
        [0.55, 0.92, 0.55, 0.85],
      ];
      quads.forEach((q, i) => {
        demoTimers.push(
          window.setTimeout(() => {
            burstAt(
              (q[0] + Math.random() * (q[1] - q[0])) * W,
              (q[2] + Math.random() * (q[3] - q[2])) * H,
            );
          }, 400 * i),
        );
      });
    };
    const clearDemo = () => {
      demoTimers.forEach(clearTimeout);
      demoTimers.length = 0;
    };

    const onResize = () => {
      measure();
      onScroll();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(braf);
      clearDemo();
      io.disconnect();
      ctx.revert();
      sticky.removeEventListener("pointermove", onPointer);
      slideB.removeEventListener("click", onBurst);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const eyebrow = "text-sm tracking-[0.05em] uppercase sm:text-base";
  const headline =
    "font-display text-[clamp(3rem,13vw,12rem)] leading-[0.9] tracking-[-0.01em] uppercase";
  const body = "mx-auto max-w-xl text-lg sm:text-[22px]";
  // Roll masks: children translate within these to appear/disappear.
  const mask = "block overflow-hidden";

  return (
    <section
      ref={sectionRef}
      aria-label="Built for speed, made to delight"
      className="relative h-[650svh] lg:-mx-[125px] motion-reduce:h-auto"
    >
      <div
        ref={stickyRef}
        className="sticky top-0 h-svh overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible"
      >
        {/* Slide A, icon pile behind the pinned text */}
        <div className="absolute inset-0 flex items-center justify-center motion-reduce:static motion-reduce:py-24">
          <div
            ref={iconLayerRef}
            aria-hidden
            className="absolute inset-0 motion-reduce:hidden"
          >
            {Array.from({ length: POOL }, (_, i) => {
              const Icon = PILE_ICONS[i % PILE_ICONS.length];
              return (
                <span
                  key={i}
                  data-sprite
                  className={cn(
                    "invisible absolute top-0 left-0 drop-shadow-lg will-change-transform",
                    i % 3 === 0 ? "text-brand" : "text-foreground",
                  )}
                >
                  <Icon className="size-full" strokeWidth={1.4} />
                </span>
              );
            })}
          </div>
          <div ref={textARef} className="relative px-6 text-center">
            <span className={mask}>
              <p data-roll-a className={eyebrow}>
                Performance on autopilot
              </p>
            </span>
            <span className={cn(mask, "mt-4")}>
              <h2 data-roll-a className={headline}>
                Built for speed
              </h2>
            </span>
            <span className={cn(mask, "mt-10 sm:mt-20")}>
              <p data-roll-a className={body}>
                Small bundles, fast loads, nothing extra shipped to the
                browser. I treat speed as part of the job, not a bonus
                at the end.
              </p>
            </span>
          </div>
        </div>

        {/* Slide B, rolls in as A rolls out; pointer-events JS-gated */}
        <div
          ref={slideBRef}
          className="pointer-events-none absolute inset-0 flex cursor-pointer items-center justify-center motion-reduce:pointer-events-auto motion-reduce:static motion-reduce:py-24"
        >
          <div
            ref={burstLayerRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 motion-reduce:hidden"
          >
            {Array.from({ length: BURST_POOL }, (_, i) => {
              const Icon = BURST_ICONS[i % BURST_ICONS.length];
              return (
                <span
                  key={i}
                  data-burst
                  className={cn(
                    "invisible absolute top-0 left-0 drop-shadow-md will-change-transform",
                    i % 2 === 0 ? "text-brand" : "text-foreground",
                  )}
                >
                  <Icon className="size-full" strokeWidth={1.6} />
                </span>
              );
            })}
          </div>
          <div className="px-6 text-center">
            <span className={mask}>
              <p data-roll-b className={eyebrow}>
                User experience first
              </p>
            </span>
            <div className="relative mx-auto w-fit">
              <span className={cn(mask, "mt-4")}>
                <h2 data-roll-b className={headline}>
                  Delight your users
                </h2>
              </span>
              <span
                ref={pillRef}
                aria-hidden
                className="absolute -top-5 right-[8%] inline-flex -rotate-6 animate-pulse items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold tracking-widest text-brand-foreground uppercase shadow-md motion-reduce:hidden"
              >
                <MousePointerClick className="size-4" />
                {hint}
              </span>
            </div>
            <span className={cn(mask, "mt-10 sm:mt-20")}>
              <p data-roll-b className={body}>
                Fast isn't enough if it feels clunky. I keep adjusting the
                small interactions until clicking around is actually
                fun.
              </p>
            </span>
          </div>
        </div>

        {/* Slide C, the CTA: rolls in as B rolls out, same handover, with
            the footer-sized magnetic pill popping last. */}
        <div
          ref={slideCRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:pointer-events-auto motion-reduce:static motion-reduce:py-24"
        >
          <div className="px-6 text-center">
            <span className={mask}>
              <h2 data-roll-c className={headline}>
                Ready to build
                <span className="text-brand [--char-flash:var(--foreground)]">?</span>
              </h2>
            </span>
            <div ref={ctaRef} className="mt-12 flex justify-center sm:mt-16">
              <Magnetic className="w-fit max-sm:w-full">
                <RollLink
                  href={EMAIL_HREF}
                  label="Get in touch"
                  arrow
                  className="h-24 gap-4 px-12 text-3xl font-semibold max-sm:w-full max-sm:justify-center sm:h-32 sm:px-16 sm:text-4xl"
                />
              </Magnetic>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
