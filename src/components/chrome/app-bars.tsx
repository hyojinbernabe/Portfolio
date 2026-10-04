"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, FileDown, Home, Mail } from "lucide-react";
import gsap from "gsap";
import { SECTIONS, EMAIL_HREF, type NavSection } from "@/lib/site-nav";
import { BRAND_ICONS, RAIL_ICONS } from "@/lib/social-icons";
import { Magnetic } from "@/components/motion/magnetic";
import { Wordmark } from "@/components/ui/wordmark";

// Social rail / menu links: real brand glyphs + an email link.
const SOCIAL_LINKS = [
  ...BRAND_ICONS.map((b) => ({ label: b.label, href: b.href })),
  { label: "Email", href: EMAIL_HREF },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

// Subscribe to the `dark` class on <html> (set by the inline <head> script and
// by toggleTheme) as an external store, server snapshot is false so hydration
// matches, then it corrects on the client without a setState-in-effect.
function subscribeTheme(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}
function useIsDark() {
  return useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

// "HB" badge that crossfades to a home icon on hover, with a vertical
// wordmark beneath (60px badge + about 180px wordmark).
const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// GSAP hover-scale used across the bars' icons for a consistent springy feel.
function hoverScale(el: Element, scale: number) {
  gsap.to(el, {
    scale,
    duration: reducedMotion() ? 0 : 0.25,
    ease: "power3.out",
    overwrite: true,
  });
}

// GSAP hover-nudge for the menu links (animates x only, so it never fights the
// reveal tween which owns y/scale).
function hoverX(el: Element, x: number) {
  gsap.to(el, {
    x,
    duration: reducedMotion() ? 0 : 0.3,
    ease: "power3.out",
    overwrite: "auto",
  });
}

// Recolor the HB monogram (black-on-transparent SVG in /public) to the badge's
// contrast color via a CSS mask + bg-current,
// so it inverts cleanly with the theme instead of needing a second asset.
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

// --- Blob (blobmaker.app style): a smooth closed curve through a FIXED number of
// evenly-spaced polar points; only the radii vary, so every shape is a new blob
// with the same point count. Catmull-Rom to cubic bezier gives the organic edges.
const BLOB_POINTS = 10;
// Control-handle length as a fraction of the chord between neighbours. Higher =
// curvier arcs between points, which (with more points) reads as near-circular.
const BLOB_SMOOTH = 0.22;
const round1 = (n: number) => Math.round(n * 10) / 10;

function randomRadii() {
  // Tight range = closer to a circle; high floor keeps the badge content inside.
  return Array.from({ length: BLOB_POINTS }, () => 86 + Math.random() * 10); // 86..96
}

function blobPath(radii: number[]) {
  const n = radii.length;
  const pts = radii.map((r, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  });
  let d = `M${round1(pts[0][0])},${round1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) * BLOB_SMOOTH;
    const c1y = p1[1] + (p2[1] - p0[1]) * BLOB_SMOOTH;
    const c2x = p2[0] - (p3[0] - p1[0]) * BLOB_SMOOTH;
    const c2y = p2[1] - (p3[1] - p1[1]) * BLOB_SMOOTH;
    d += `C${round1(c1x)},${round1(c1y)},${round1(c2x)},${round1(c2y)},${round1(p2[0])},${round1(p2[1])}`;
  }
  return `${d}Z`;
}

// Deterministic seed so SSR and the first client render agree (randomized on mount).
const DEFAULT_RADII = [92, 88, 94, 89, 93, 90, 92, 88, 91, 90];
const DEFAULT_BLOB = blobPath(DEFAULT_RADII);

// The blob morphs forever; only its playback speed changes. timeScale on the live
// tween makes hover/idle transitions instant without snapping to a new shape.
const BLOB_IDLE_DUR = 3.2;
const BLOB_HOVER_TIMESCALE = 8;

function Logo({ onClick }: { onClick: () => void }) {
  const badgeRef = useRef<HTMLSpanElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const homeRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const radiiRef = useRef<number[]>([...DEFAULT_RADII]);
  const blobTween = useRef<gsap.core.Tween | null>(null);
  const speedRef = useRef(1);

  const drawBlob = () => pathRef.current?.setAttribute("d", blobPath(radiiRef.current));

  // Endless morph to fresh random blobs; each tween chains the next. Playback
  // speed is set by timeScale (1 = slow idle, higher = fast on hover).
  const morphLoop = () => {
    blobTween.current = gsap
      .to(radiiRef.current, {
        endArray: randomRadii(),
        duration: BLOB_IDLE_DUR,
        ease: "sine.inOut",
        onUpdate: drawBlob,
        onComplete: morphLoop,
      })
      .timeScale(speedRef.current);
  };

  useEffect(() => {
    // GSAP owns the transform outright (no CSS translate to parse into a stray
    // px offset); autoAlpha clears the initial `invisible` guard once parked below.
    gsap.set(markRef.current, { yPercent: 0, autoAlpha: 1 });
    gsap.set(homeRef.current, { yPercent: 120, autoAlpha: 1 });

    if (reducedMotion()) {
      radiiRef.current = randomRadii();
      drawBlob();
      return;
    }
    morphLoop(); // slow idle morph from load; hover speeds it up
    return () => {
      blobTween.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Slot swap: the two faces slide together on the vertical axis (clipped by the
  // badge), so HB leaves as Home arrives, a real transition, not a crossfade.
  const swap = (toHome: boolean) => {
    const dur = reducedMotion() ? 0 : 0.45;
    gsap.to(markRef.current, {
      yPercent: toHome ? -120 : 0,
      duration: dur,
      ease: "power3.inOut",
      overwrite: true,
    });
    gsap.to(homeRef.current, {
      yPercent: toHome ? 0 : 120,
      duration: dur,
      ease: "power3.inOut",
      overwrite: true,
    });
  };

  const enter = () => {
    swap(true);
    // Bouncy scale-up so the blob reads as a pressable button, not just faster.
    gsap.to(badgeRef.current, {
      scale: 1.14,
      duration: reducedMotion() ? 0 : 0.4,
      ease: "back.out(3)",
      overwrite: true,
    });
    if (reducedMotion()) return;
    speedRef.current = BLOB_HOVER_TIMESCALE;
    blobTween.current?.timeScale(BLOB_HOVER_TIMESCALE); // speed up the in-flight morph now
  };
  const leave = () => {
    swap(false);
    gsap.to(badgeRef.current, {
      scale: 1,
      duration: reducedMotion() ? 0 : 0.35,
      ease: "power3.out",
      overwrite: true,
    });
    if (reducedMotion()) return;
    speedRef.current = 1;
    blobTween.current?.timeScale(1); // ease back to the slow idle morph
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
      aria-label="Back to top"
      className="flex flex-col items-center gap-4"
    >
      <span ref={badgeRef} className="relative grid size-[60px] place-items-center text-brand">
        <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 size-full">
          <path ref={pathRef} d={DEFAULT_BLOB} fill="currentColor" transform="translate(100 100)" />
        </svg>
        <span className="relative size-[60px] overflow-hidden text-background">
          <span ref={markRef} aria-hidden className="absolute inset-0 grid place-items-center">
            <span className="size-7 bg-current" style={LOGO_MASK} />
          </span>
          <span
            ref={homeRef}
            aria-hidden
            className="invisible absolute inset-0 grid place-items-center"
          >
            <Home className="size-6" />
          </span>
        </span>
      </span>
      <Wordmark
        vertical
        className="flex items-start gap-[2px] text-[26px]"
      />
    </button>
  );
}

// The theme toggle is a normal 60x34 horizontal switch rotated 90 degrees so
// the dot slides vertically, that reading only makes sense next to the
// vertical desktop rail. Below lg, the chrome collapses to a horizontal top
// bar, so the switch stays unrotated there (dot slides left/right instead)
// and only picks up the -rotate-90 at lg to match the rail's vertical flow.
function ThemeSwitch({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  // Reserve the footprint for layout (unrotated below lg, rotated at lg),
  // but the tappable button is a full 44x44 hit box centered over it
  // (coarse-pointer minimum) so the visual pill can stay slim without
  // shrinking the touch target.
  return (
    <div className="relative mx-auto h-[34px] w-[60px] lg:h-[60px] lg:w-[34px]">
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
        onClick={onToggle}
        className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
      >
        <span className="relative h-[34px] w-[60px] rounded-full border-[3px] border-foreground bg-background transition-colors duration-300 lg:-rotate-90">
          <span
            className={`absolute top-[3px] left-[3px] size-[22px] rounded-full bg-brand transition-transform duration-300 ease-[cubic-bezier(.645,.045,.355,1)] ${
              isDark ? "translate-x-[25px]" : ""
            }`}
          />
        </span>
      </button>
    </div>
  );
}

function Hamburger({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={onToggle}
      className="hover-bubble grid size-16 place-items-center"
    >
      {open ? <X className="size-7 text-brand" /> : <Menu className="size-7" />}
    </button>
  );
}

function BrandGlyph({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d={d} />
    </svg>
  );
}

// Right-rail nav item: resting state is just the dot (filled when active). The
// label pill only appears on hover/focus, tweened in/out with GSAP for a fluid,
// interruptible feel (grabbing the tween mid-flight rather than snapping).
function NavItem({
  section,
  active,
  onSelect,
}: {
  section: NavSection;
  active: boolean;
  onSelect: () => void;
}) {
  const pillRef = useRef<HTMLSpanElement>(null);

  // transform-origin is pinned at the dot's center (via CSS below), so scaling
  // grows the pill straight out of the circle instead of sliding toward it.
  useEffect(() => {
    if (pillRef.current) gsap.set(pillRef.current, { autoAlpha: 0, scale: 0.4 });
  }, []);

  const show = () =>
    pillRef.current &&
    gsap.to(pillRef.current, {
      autoAlpha: 1,
      scale: 1,
      duration: reducedMotion() ? 0 : 0.25,
      ease: "back.out(2)",
      overwrite: true,
    });

  const hide = () =>
    pillRef.current &&
    gsap.to(pillRef.current, {
      autoAlpha: 0,
      scale: 0.4,
      duration: reducedMotion() ? 0 : 0.15,
      ease: "power3.in",
      overwrite: true,
    });

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-current={active ? "true" : undefined}
      className="group relative flex size-10 items-center justify-center"
    >
      <span
        ref={pillRef}
        className="pointer-events-none invisible absolute inset-y-[3px] right-[-10px] flex items-center rounded-full border-[3px] border-foreground bg-background pr-[34px] pl-[18px] font-display text-sm tracking-[0.08em] whitespace-nowrap uppercase opacity-0 [-webkit-text-stroke:0.4px_currentColor] [transform-origin:calc(100%_-_17px)_center]"
      >
        {section.label}
      </span>
      <span
        className={`relative z-10 size-[15px] rounded-full border-[3px] transition-colors ${
          active ? "border-brand bg-brand" : "border-foreground bg-background"
        }`}
      />
    </button>
  );
}

export function AppBars() {
  const isDark = useIsDark();
  const [activeId, setActiveId] = useState(SECTIONS[0]?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  // Stagger the menu links in/out with GSAP whenever the overlay toggles.
  useEffect(() => {
    const items = menuRef.current?.querySelectorAll<HTMLElement>("[data-menu-item]");
    if (!items?.length) return;

    if (reducedMotion()) {
      gsap.set(items, { autoAlpha: menuOpen ? 1 : 0, x: 0, y: 0 });
      return;
    }
    if (menuOpen) {
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 42, scale: 0.92 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: "power4.out",
          stagger: 0.07,
          overwrite: true,
        },
      );
    } else {
      gsap.to(items, {
        autoAlpha: 0,
        y: 18,
        duration: 0.25,
        ease: "power2.in",
        stagger: { each: 0.03, from: "end" },
        overwrite: true,
      });
    }
  }, [menuOpen]);

  // Scroll-spy: light the dot for whichever section owns the viewport middle.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el != null,
    );
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) setActiveId(top.target.id);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.5, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Lock body scroll and wire Esc-to-close while the overlay is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // Lenis scrolls the window, so locking body is enough here
    // Signal the hero keyboard to drop behind the overlay while the menu is open.
    document.documentElement.classList.add("menu-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.classList.remove("menu-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }, []);

  const go = useCallback((id: string) => {
    setMenuOpen(false);
    scrollToId(id);
  }, []);

  const homeId = SECTIONS[0]?.id ?? "";

  // Logo = home button. On the landing page it scrolls to the hero; from
  // any other route (like the 404) it navigates back to the landing
  // page, which also replays the loader.
  const pathname = usePathname();
  const router = useRouter();
  const goHome = useCallback(() => {
    setMenuOpen(false);
    if (pathname === "/") scrollToId(homeId);
    else router.push("/");
  }, [pathname, homeId, router]);

  return (
    <>
      {/* Left desktop bar. Top/bottom pinned via space-between; the hamburger is
          absolutely centered on the VIEWPORT (not the column). */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[125px] px-8 py-10 select-none lg:block">
        <div className="flex h-full flex-col items-center justify-between">
          <Logo onClick={goHome} />
          <ThemeSwitch isDark={isDark} onToggle={toggleTheme} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Hamburger open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
        </div>
      </aside>

      {/* Right desktop bar. Nav dots absolutely centered on the viewport. */}
      <aside className="fixed inset-y-0 right-0 z-50 hidden w-[125px] px-8 py-10 select-none lg:block">
        <div className="flex h-full flex-col items-center justify-between">
          <div className="flex flex-col items-center gap-5">
            {/* -m-2.5 p-2.5: 28px icon + 10px padding/side = a 48px tap
                target on touch-capable laptops/tablets that hit this lg
                rail; the matching negative margin keeps the icon spacing
                identical to before. */}
            {RAIL_ICONS.map((s) => (
              <a
                key={s.slug}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                title={s.label}
                onMouseEnter={(e) => hoverScale(e.currentTarget, 1.18)}
                onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
                className="-m-2.5 block p-2.5 text-foreground"
              >
                <BrandGlyph d={s.d} className="size-[28px]" />
              </a>
            ))}
            <a
              href={EMAIL_HREF}
              aria-label="Email"
              title="Email"
              onMouseEnter={(e) => hoverScale(e.currentTarget, 1.18)}
              onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
              className="-m-2.5 block p-2.5 text-foreground"
            >
              <Mail className="size-[28px]" strokeWidth={2.25} />
            </a>
          </div>

          {/* Bottom slot: vertical brand pill (site pill language, rotated)
              balancing the icon stack up top, with the full house button
              treatment: magnetic pull + roll-text hover + hover scale.
              Resume file itself lands later; the link is wired now. */}
          <Magnetic className="w-fit">
            <a
              href="/resume.pdf"
              download
              aria-label="Resume"
              title="Resume"
              onMouseEnter={(e) => hoverScale(e.currentTarget, 1.08)}
              onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
              className="group flex flex-col items-center gap-2.5 rounded-full bg-brand px-3 py-5 text-brand-foreground shadow-md transition-colors hover:bg-brand/90"
            >
              <FileDown className="size-4" strokeWidth={2.25} aria-hidden />
              {/* RollLink's mask trick, running along the vertical text axis */}
              <span className="relative block overflow-hidden">
                <span className="block text-[13px] leading-none font-semibold tracking-[0.18em] uppercase transition-transform duration-300 ease-out [writing-mode:vertical-rl] group-hover:-translate-y-full group-focus-visible:-translate-y-full">
                  Resume
                </span>
                <span
                  aria-hidden
                  className="absolute top-full left-0 block text-[13px] leading-none font-semibold tracking-[0.18em] uppercase transition-transform duration-300 ease-out [writing-mode:vertical-rl] group-hover:-translate-y-full group-focus-visible:-translate-y-full"
                >
                  Resume
                </span>
              </span>
            </a>
          </Magnetic>
        </div>

        <nav
          aria-label="Page sections"
          className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
        >
          {SECTIONS.map((s) => (
            <NavItem
              key={s.id}
              section={s}
              active={activeId === s.id}
              onSelect={() => go(s.id)}
            />
          ))}
        </nav>
      </aside>

      {/* Mobile top bar: the sidebars collapse to this below lg. */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-6 select-none lg:hidden">
        <button
          type="button"
          onClick={goHome}
          aria-label="Home"
          className="grid size-11 place-items-center rounded-full bg-foreground font-display text-base text-background"
        >
          HB
        </button>
        <div className="flex items-center gap-3">
          <ThemeSwitch isDark={isDark} onToggle={toggleTheme} />
          <Hamburger open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
        </div>
      </div>

      {/* Menu overlay: circle grows from the LEFT-CENTER anchor (inner edge of the
          left bar), covering the content area but not the bars (bars z-50, this
          z-40; inset 125px each side on desktop). */}
      <div
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-40 bg-background transition-[clip-path] duration-500 ease-in-out lg:inset-y-0 lg:right-[125px] lg:left-[125px] ${
          menuOpen
            ? "pointer-events-auto [clip-path:circle(150%_at_0%_50%)]"
            : "pointer-events-none [clip-path:circle(0%_at_0%_50%)]"
        }`}
      >
        <nav ref={menuRef} className="flex h-full flex-col items-center justify-center gap-1">
          {/* Primary links (GSAP-staggered via the menuOpen effect above) */}
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              data-menu-item
              onClick={() => go(s.id)}
              onMouseEnter={(e) => hoverX(e.currentTarget, 14)}
              onMouseLeave={(e) => hoverX(e.currentTarget, 0)}
              className="invisible font-display text-5xl tracking-[0.02em] uppercase opacity-0 transition-colors hover:text-brand sm:text-7xl"
            >
              {s.label}
            </button>
          ))}
          {/* Secondary links (socials) */}
          <div className="mt-12 flex flex-col items-center gap-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                data-menu-item
                aria-label={s.label}
                onClick={() => setMenuOpen(false)}
                onMouseEnter={(e) => hoverX(e.currentTarget, 10)}
                onMouseLeave={(e) => hoverX(e.currentTarget, 0)}
                className="invisible text-sm font-semibold tracking-[0.28em] uppercase opacity-0 transition-colors hover:text-brand"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
