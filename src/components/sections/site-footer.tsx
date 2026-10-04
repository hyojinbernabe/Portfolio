"use client";

import { useEffect, useRef } from "react";
import { Mail } from "lucide-react";
import { SECTIONS, EMAIL_HREF } from "@/lib/site-nav";
import { BRAND_ICONS } from "@/lib/social-icons";
import { FxHeading } from "@/components/ui/fx-heading";
import { RollLink } from "@/components/ui/roll-link";
import { Magnetic } from "@/components/motion/magnetic";
import { Wordmark } from "@/components/ui/wordmark";

/*
 * Bottom-of-footer dot field:
 * a 14-row grid of dots that loops noise-cloud to shape to noise-cloud forever,
 * while dots near the cursor shrink.
 *
 * Rendered on a single <canvas>, the DOM version (728 dot divs, each with
 * will-change + its own GSAP tween) promoted every dot to a compositor layer
 * and tanked scroll FPS. Here there is no DOM per dot, no GSAP: one rAF loop
 * that only runs while the footer is on screen and skips drawing entirely on
 * frames where nothing changed.
 */

const ROWS = 14;
const REST = 0.15; // resting dot opacity
const CLOUD_RADIUS = 12; // grid cells
const CHAOS = 0.35; // noise amplitude in the cloud state
const GROUPS = 20; // stagger groups per formation
const TWEEN_MS = 1000; // formation duration
const HOVER_RADIUS = 200; // px
const MIN_SCALE = 0.25;
const TAU = Math.PI * 2;

// 18x18 bitmaps, centered on the grid (pattern rows 0-1/16-17 clip off the
// 14-row field). '1' = dot fully opaque, '-' = resting opacity.
const PATTERNS = [
  // bowtie / hourglass
  `------------------
------------------
------------------
--------11--------
-----1--11--1-----
----111-11-111----
-----11----11-----
------------------
---111------111---
---111------111---
------------------
-----11----11-----
----111-11-111----
-----1--11--1-----
--------11--------
------------------
------------------
------------------`,
  // heart / droplet
  `------------------
------------------
------------------
------------------
------11--11------
----1111111111----
---111111111111---
---111111111111---
---111111111111---
----1111111111----
-----11111111-----
------111111------
-------1111-------
--------11--------
------------------
------------------
------------------
------------------`,
  // infinity / interlocking blobs
  `------------------
------------------
------------------
--------1---------
--------11--------
--------11--------
-------1111-------
------111111------
----1111--11111---
---11111--1111----
------111111------
-------1111-------
--------11--------
--------11--------
---------1--------
------------------
------------------
------------------`,
  // rounded blob with two legs
  `------------------
------------------
------------------
-------1111-------
------111111------
-----11111111-----
-----11111111-----
-----11111111-----
------111111------
-------1111-------
------111111------
-----111--111-----
----11------11----
----11------11----
----1--------1----
------------------
------------------
------------------`,
].map((p) => p.split("\n"));

if (process.env.NODE_ENV !== "production") {
  console.assert(
    PATTERNS.every((p) => p.length === 18 && p.every((l) => l.length === 18)),
    "footer dot patterns must be 18x18",
  );
}

function DotsField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hoverable = window.matchMedia("(hover: hover)").matches;

    // Geometry + per-dot tween state (flat typed arrays, rebuilt on resize).
    let cols = 0;
    let s = 0; // dot diameter = gap, px
    let w = 0;
    let h = 0;
    let dpr = 1;
    let n = 0;
    let opStart = new Float32Array(0);
    let opTarget = new Float32Array(0);
    let opT0 = new Float64Array(0); // tween start timestamp (delay baked in)
    let scale = new Float32Array(0);
    let scaleT = new Float32Array(0);
    let order = new Uint16Array(0);
    let color = "#000";
    let animUntil = 0; // last opacity tween ends at this timestamp
    let dirty = true; // force one draw (init, theme change, settle frame)

    const readColor = () => {
      color = getComputedStyle(canvas).color;
    };

    // Opacity mid-tween, steps(2) easing: value jumps at 50% and 100% of the
    // duration, the chunky "materializing" flicker instead of a cross-fade.
    const curOp = (i: number, now: number) => {
      const t = (now - opT0[i]) / TWEEN_MS;
      if (t <= 0) return opStart[i];
      const e = t >= 1 ? 1 : Math.floor(t * 2) / 2;
      return opStart[i] + (opTarget[i] - opStart[i]) * e;
    };

    const render = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (let i = 0; i < n; i++) {
        ctx.globalAlpha = curOp(i, now);
        ctx.beginPath();
        ctx.arc(
          (i % cols) * 2 * s + s / 2,
          ((i / cols) | 0) * 2 * s + s / 2,
          (s / 2) * scale[i],
          0,
          TAU,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const init = () => {
      const vw = window.innerWidth;
      cols = vw >= 992 ? 52 : vw >= 768 ? 24 : 22;
      // gap == dot size, so a row spans (2*cols - 1) dot-widths; floor, not
      // round: rounding up overflows the host and clips edge columns.
      s = Math.min(16, Math.floor((host.clientWidth / (2 * cols - 1)) * 2) / 2);
      w = (2 * cols - 1) * s;
      h = (2 * ROWS - 1) * s;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      n = cols * ROWS;
      opStart = new Float32Array(n).fill(REST);
      opTarget = new Float32Array(n).fill(REST);
      opT0 = new Float64Array(n).fill(-TWEEN_MS);
      scale = new Float32Array(n).fill(1);
      scaleT = new Float32Array(n).fill(1);
      order = new Uint16Array(n);
      animUntil = 0;
      readColor();
      render(performance.now());
    };

    // Shuffled stagger groups: dot at shuffle position p starts after
    // (p % GROUPS) * 50ms (+ jitter), so dots appear in groups.
    const animateTo = (target: (col: number, row: number) => number) => {
      const now = performance.now();
      for (let i = 0; i < n; i++) order[i] = i;
      for (let i = n - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const t = order[i];
        order[i] = order[j];
        order[j] = t;
      }
      for (let p = 0; p < n; p++) {
        const i = order[p];
        const from = curOp(i, now); // read before overwriting tween state
        opStart[i] = from;
        opTarget[i] = target(i % cols, (i / cols) | 0);
        opT0[i] = now + (p % GROUPS) * 50 + Math.random() * 12.5;
      }
      animUntil = now + (GROUPS - 1) * 50 + 12.5 + TWEEN_MS;
    };

    const cloud = () => {
      const cx = (cols - 1) / 2;
      const cy = (ROWS - 1) / 2;
      animateTo((col, row) => {
        const core = Math.max(
          0,
          1 - Math.hypot(col - cx, row - cy) / CLOUD_RADIUS,
        );
        return Math.min(
          1,
          Math.max(REST, REST + core * 0.7 + (Math.random() - 0.5) * CHAOS),
        );
      });
    };

    const showPattern = (p: string[]) => {
      const colOff = Math.floor((cols - 18) / 2);
      const rowOff = Math.floor((ROWS - 18) / 2); // negative: vertical clip
      animateTo((col, row) =>
        p[row - rowOff]?.[col - colOff] === "1" ? 1 : REST,
      );
    };

    // noise to shape forms + holds to noise to next shape... while visible.
    let running = false;
    let timer = 0;
    let idx = 0;
    let patternNext = false;
    const cycle = () => {
      if (!running) return;
      if (patternNext) {
        showPattern(PATTERNS[idx]);
        idx = (idx + 1) % PATTERNS.length;
        timer = window.setTimeout(cycle, 2000); // 1s form + 1s hold
      } else {
        cloud();
        timer = window.setTimeout(cycle, 1000);
      }
      patternNext = !patternNext;
    };

    // Cursor proximity: dots within 200px shrink toward 25%, linear falloff,
    // smoothed per-frame (about0.2s ease-out feel). Pure math on the canvas rect.
    let mx = Infinity;
    let my = Infinity;
    let lastMx = NaN;
    let lastMy = NaN;
    let lastTop = NaN;
    let lastLeft = NaN;
    const retarget = () => {
      const r = canvas.getBoundingClientRect();
      if (
        mx === lastMx &&
        my === lastMy &&
        r.top === lastTop &&
        r.left === lastLeft
      )
        return;
      lastMx = mx;
      lastMy = my;
      lastTop = r.top;
      lastLeft = r.left;
      if (
        mx < r.left - HOVER_RADIUS ||
        mx > r.right + HOVER_RADIUS ||
        my < r.top - HOVER_RADIUS ||
        my > r.bottom + HOVER_RADIUS
      ) {
        scaleT.fill(1);
        return;
      }
      for (let i = 0; i < n; i++) {
        const x = r.left + (i % cols) * 2 * s + s / 2;
        const y = r.top + ((i / cols) | 0) * 2 * s + s / 2;
        const t = Math.min(
          1,
          Math.max(0, (HOVER_RADIUS - Math.hypot(mx - x, my - y)) / HOVER_RADIUS),
        );
        scaleT[i] = 1 - (1 - MIN_SCALE) * t;
      }
    };

    let raf = 0;
    let prev = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(64, now - prev || 16);
      prev = now;

      const opActive = now < animUntil;
      let scaleActive = false;
      if (hoverable) {
        retarget();
        const k = 1 - Math.exp(-dt / 60);
        for (let i = 0; i < n; i++) {
          const d = scaleT[i] - scale[i];
          if (d > 0.002 || d < -0.002) {
            scale[i] += d * k;
            scaleActive = true;
          } else if (scale[i] !== scaleT[i]) {
            scale[i] = scaleT[i];
            scaleActive = true;
          }
        }
      }

      if (opActive || scaleActive) {
        render(now);
        dirty = true; // one settle frame after activity ends
      } else if (dirty) {
        render(now);
        dirty = false;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      patternNext = false;
      readColor();
      cycle();
      prev = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };

    init();

    // Theme toggle swaps --foreground; recache and repaint.
    const mo = new MutationObserver(() => {
      readColor();
      dirty = true;
      if (!running) render(performance.now());
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let resizeT = 0;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = window.setTimeout(init, 150);
    };
    window.addEventListener("resize", onResize);

    if (reduced) {
      // Static resting grid only, no loop, no observers beyond theme/resize.
      return () => {
        mo.disconnect();
        clearTimeout(resizeT);
        window.removeEventListener("resize", onResize);
      };
    }

    // Everything animated is gated on visibility: off screen = zero work.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.1 },
    );
    io.observe(canvas);

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onLeave = () => {
      mx = Infinity;
      my = Infinity;
    };
    if (hoverable) {
      window.addEventListener("mousemove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    return () => {
      stop();
      io.disconnect();
      mo.disconnect();
      clearTimeout(resizeT);
      window.removeEventListener("resize", onResize);
      if (hoverable) {
        window.removeEventListener("mousemove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
    };
  }, []);

  return (
    <div ref={hostRef} className="overflow-hidden">
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none mx-auto block text-foreground"
      />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="px-6 pb-6 sm:px-12 lg:px-0">
      <div className="rounded-[2rem] bg-secondary p-6 sm:rounded-[3rem] sm:p-10 lg:p-14">
        {/* The closer: giant split-char CTA with the green period and
            the massive pill sharing one aligned row. */}
        <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-10">
          <FxHeading
            tag="h2"
            threshold={0.2}
            className="font-display text-[clamp(3rem,9vw,8.5rem)] leading-[0.85] tracking-[-0.01em] uppercase"
          >
            Let&apos;s Talk
            <span className="text-brand [--char-flash:var(--foreground)]">.</span>
          </FxHeading>
          <Magnetic className="w-fit max-sm:w-full">
            <RollLink
              href={EMAIL_HREF}
              label="Get in touch"
              arrow
              className="h-24 gap-4 px-12 text-3xl font-semibold max-sm:w-full max-sm:justify-center sm:h-32 sm:px-16 sm:text-4xl"
            />
          </Magnetic>
        </div>

        {/* Meta grid: wordmark, sitemap split across two columns, socials.
            One 3rem gap everywhere below here so the rows read as one rhythm. */}
        <div className="mt-12 mb-12 grid gap-10 border-t-2 border-foreground/10 pt-12 sm:grid-cols-3">
          <a href="#hero" className="block w-fit transition-colors hover:text-brand">
            <Wordmark className="block text-[26px]" />
          </a>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  {/* -my-2 py-2: grows the tap target to a coarse-pointer-safe
                      height without pushing the visible row spacing apart. */}
                  <a
                    href={`#${s.id}`}
                    className="-mx-1 -my-2 inline-block px-1 py-2 text-base text-muted-foreground transition-colors hover:text-brand focus-visible:text-brand"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {/* 3x2: five brands + email, three per row, reads balanced. */}
          <ul className="grid w-fit grid-cols-3 gap-x-7 gap-y-5 sm:justify-self-end">
            {BRAND_ICONS.map((b) => (
              <li key={b.slug}>
                {/* -m-2.5 p-2.5: 20px icon + 10px padding/side = a 40px tap
                    target; the matching negative margin keeps the icons'
                    visual spacing exactly as before. */}
                <a
                  href={b.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={b.label}
                  className="-m-2.5 block p-2.5 text-muted-foreground transition-[color,translate] duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-0.5 hover:text-brand focus-visible:-translate-y-0.5 focus-visible:text-brand"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
                    <path d={b.d} />
                  </svg>
                </a>
              </li>
            ))}
            <li>
              <a
                href={EMAIL_HREF}
                aria-label="Email"
                className="-m-2.5 block p-2.5 text-muted-foreground transition-[color,translate] duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-0.5 hover:text-brand focus-visible:-translate-y-0.5 focus-visible:text-brand"
              >
                <Mail className="size-5" strokeWidth={2} aria-hidden />
              </a>
            </li>
          </ul>
        </div>

        <DotsField />

        <div className="mt-12 flex flex-wrap items-baseline justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Hyojin Bernabe</span>
          <a
            href="#hero"
            className="-m-2.5 inline-block p-2.5 transition-colors hover:text-brand focus-visible:text-brand"
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
