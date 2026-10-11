"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { PROJECTS, type Project } from "@/lib/projects";
import { BRAND_ICONS } from "@/lib/social-icons";
import { useHeadingFx } from "@/hooks/use-heading-fx";
import { useCoarsePointer } from "@/hooks/use-coarse-pointer";

// "See All" points at the same GitHub profile as the social
// rail, so changing it in social-icons.ts updates both.
const GITHUB_PROFILE =
  BRAND_ICONS.find((b) => b.slug === "github")?.href ?? "https://github.com";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hover-expand only makes sense with a real pointer; on touch, tapping a row
// simply follows the link.
const canHover = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

// The panel sits centered behind an overflow-hidden wrapper that matches the
// row bounds, so the row-height tween IS the reveal: the image's middle band
// grows outward from the centerline, swallowing the giant label, and can never
// paint over neighboring rows.
const IMG_ZOOM = 1.15; // image settles from this scale as the panel opens

function ProjectRow({ project }: { project: Project }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isCoarse = useCoarsePointer();

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    // clearProps first: hot-reload can leave stale GSAP inline styles behind.
    gsap.set(panel, { clearProps: "all" });
    gsap.set(panel, { autoAlpha: 0 });
    gsap.set(panel.querySelector("img"), { scale: IMG_ZOOM });
  }, []);

  const animateOpen = () => {
    const row = rowRef.current;
    const panel = panelRef.current;
    if (!row || !panel) return;
    const dur = reducedMotion() ? 0 : 0.65;
    const ease = "power4.out";
    gsap.to(row, {
      height: panel.offsetHeight, // row grows to the IMAGE's height
      duration: dur,
      ease,
      overwrite: true,
    });
    gsap.to(panel, { autoAlpha: 1, duration: dur / 2, ease, overwrite: true });
    // Slow settle out of the zoom while the row opens, reads as depth.
    gsap.to(panel.querySelector("img"), {
      scale: 1,
      duration: dur,
      ease,
      overwrite: true,
    });
  };

  const animateClose = () => {
    const row = rowRef.current;
    const panel = panelRef.current;
    if (!row || !panel) return;
    const dur = reducedMotion() ? 0 : 0.45;
    const ease = "power3.out";
    gsap.to(row, {
      height: "auto", // back to the label's natural height
      duration: dur,
      ease,
      overwrite: true,
      onComplete: () => gsap.set(row, { clearProps: "height" }),
    });
    gsap.to(panel, { autoAlpha: 0, duration: dur, ease, overwrite: true });
    gsap.to(panel.querySelector("img"), {
      scale: IMG_ZOOM,
      duration: dur,
      ease,
      overwrite: true,
    });
  };

  // Hover/focus only fire meaningfully with a real pointer; guard so a
  // touch-triggered focus event can't also open the panel (touch gets its
  // own reveal below instead).
  const open = () => canHover() && animateOpen();
  const close = () => canHover() && animateClose();

  // Touch equivalent for hover: as the row crosses the viewport's center
  // band while scrolling, the preview auto-opens, then closes once the row
  // moves on, no tap required, and only one row is ever centered at a time.
  useEffect(() => {
    if (!isCoarse) return;
    const row = rowRef.current;
    if (!row) return;
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? animateOpen() : animateClose()),
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    io.observe(row);
    return () => io.disconnect();
  }, [isCoarse]);

  return (
    <div
      ref={rowRef}
      tabIndex={project.href ? undefined : 0}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      className="group relative flex w-full flex-col items-center justify-center overflow-visible"
    >
      {/* Mask for the scroll-in wipe; py keeps descenders un-clipped. */}
      <span className="block overflow-hidden px-2 py-2">
        <span
          data-word
          className="block text-center font-display text-[clamp(3rem,8.5vw,8.5rem)] leading-none uppercase text-muted-foreground"
        >
          {project.title}
        </span>
      </span>

      {/* Stretched link over the whole row, above the preview panel. */}
      {project.href && (
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${project.title} on GitHub`}
          className="absolute inset-0 z-20"
        />
      )}

      {/* Preview centered behind an overflow-hidden window matching the row:
          the row-height tween reveals the image center-out and swallows the
          label (z-order, no fade). Radius on the WINDOW so the visible band
          keeps rounded corners mid-expansion, not just at full size. */}
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-hidden rounded-lg">
        <div
          ref={panelRef}
          className="relative aspect-[1170/460] w-full overflow-hidden rounded-lg bg-[#35363a]"
        >
          <Image
            src={project.image}
            alt={project.alt}
            fill
            sizes="(max-width: 1024px) 94vw, 88vw"
            className="object-cover"
          />
          {/* Always white + difference blend: auto-adapts over any image. */}
          <span className="absolute top-6 right-8 font-display text-[clamp(1.5rem,3vw,3rem)] uppercase text-white mix-blend-difference">
            {project.title}
          </span>
        </div>
      </div>
    </div>
  );
}

function SeeAll() {
  return (
    <a
      href={GITHUB_PROFILE}
      target="_blank"
      rel="noreferrer"
      className="group relative mt-10 block"
    >
      <span
        aria-hidden
        className="absolute top-1/2 -left-8 size-[18px] -translate-y-1/2 scale-0 rounded-full bg-brand opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      />
      <span className="block overflow-hidden py-1">
        <span
          data-word
          className="block font-display text-[clamp(2rem,4.5vw,4rem)] leading-none uppercase"
        >
          See All
        </span>
      </span>
      <span
        aria-hidden
        className="absolute right-0 -bottom-1 left-0 h-[3px] origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </a>
  );
}

export function ProjectsShowcase() {
  const listRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useHeadingFx(headingRef);

  // Staggered mask-wipe of the row names the first time the card scrolls into
  // view. Initial hidden state is set here (not CSS) so no-JS keeps text
  // visible; reduced-motion skips the whole thing.
  useEffect(() => {
    const list = listRef.current;
    const words = list?.querySelectorAll<HTMLElement>("[data-word]");
    if (!list || !words?.length || reducedMotion()) return;

    gsap.set(words, { yPercent: 110 });
    // Toggle, not one-shot: the wipe re-arms when the card leaves the
    // viewport and replays on every return, in either scroll direction.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(words, {
            yPercent: 0,
            duration: 0.8,
            ease: "power4.out",
            stagger: 0.08,
            overwrite: true,
          });
        } else {
          gsap.killTweensOf(words);
          gsap.set(words, { yPercent: 110 });
        }
      },
      { threshold: 0.15 },
    );
    io.observe(list);
    return () => io.disconnect();
  }, []);

  return (
    // No bottom padding: the marquee band below carries its own symmetric
    // py-12, keeping the card equidistant from band and footer.
    <section id="work" className="px-6 pt-32 sm:px-12 lg:px-0">
      <div
        ref={listRef}
        className="mx-auto flex w-full flex-col items-center rounded-[2rem] bg-secondary px-4 py-16 sm:rounded-[3rem] sm:px-8"
      >
        {/* Heading lives inside the card so the section reads as one piece. */}
        <h2
          ref={headingRef}
          className="mb-12 text-center font-display text-[clamp(2.5rem,5vw,4.5rem)] tracking-tight uppercase"
        >
          Selected Work
        </h2>
        {PROJECTS.map((project) => (
          <ProjectRow key={project.title} project={project} />
        ))}
        <SeeAll />
      </div>
    </section>
  );
}
