"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Code, Fingerprint, Globe, MessageSquareText } from "lucide-react";
import { ABOUT_BIO, ABOUT_CHAPTERS } from "@/lib/about";
import { EMAIL_HREF } from "@/lib/site-nav";
import { Magnetic } from "@/components/motion/magnetic";
import { RollLink } from "@/components/ui/roll-link";
import { useHeadingFx } from "@/hooks/use-heading-fx";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fixed card angles instead of random ones: TOSS is
// the exaggerated "thrown down" entry rotation, REST the slight angle each
// card settles at so the finished pile reads as a fanned stack of notes.
// Baked constants (not Math.random) so server and client render identically.
const TOSS = [-14, 8, -10, 12];
const REST = [-2, 1.5, -1, 2.5];

// The section is a 550svh scroll runway: a 100svh sticky text layer, then one
// card arriving per 100svh of scroll (offsets 100–400svh), then 50svh of
// "settled stack" during which the background text blurs away. Card wrappers
// are absolute + padding-top so each card's own position:sticky does the
// pinning, no JS pin, and the layout still works scrubless (reduced motion /
// no JS: cards simply arrive and pile up as you scroll).
const CARD_SPAN = 100; // svh of scroll each card claims

// Icon "sticker" per chapter: circle badge (site motif) with a die-cut ring,
// tilted a few degrees like a slapped-on sticker. Order matches ABOUT_CHAPTERS.
const STICKER_ICONS = [Fingerprint, Code, MessageSquareText, Globe];
const STICKER_TILT = [-6, 4, -3, 5];

// Position, rotation, and font size come in via className (font-size set on
// the wrapper inherits to the inner span, where SplitText needs it). No
// overflow mask: chars fade as they rise on entrance, and the hover dip
// needs room to travel below the baseline without getting clipped. Low IO
// threshold because these words deliberately bleed off the viewport.
function GiantWord({
  children,
  delay = 0,
  className,
}: {
  children: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useHeadingFx(ref, delay, 0.3);
  return (
    <span className={cn("block", className)}>
      <span
        ref={ref}
        aria-hidden
        className="block font-display leading-none uppercase"
      >
        {children}
      </span>
    </span>
  );
}

// Card heading with the same split-char treatment as the giant words:
// staggered entrance when the card scrolls in, letter dip + green flash on
// hover. Chars split across the <br /> fine, SplitText keeps it in place.
function ChapterTitle({ lines }: { lines: [string, string] }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useHeadingFx(ref, 0, 0.3);
  return (
    <h3
      ref={ref}
      className="font-display-wide font-black [font-stretch:125%] text-[clamp(1.5rem,4vw,2.75rem)] leading-none uppercase"
    >
      {lines[0]}
      <br />
      {lines[1]}
    </h3>
  );
}

function ContactCta() {
  return (
    <Magnetic className="pointer-events-auto w-fit">
      <RollLink href={EMAIL_HREF} label="Get in touch" arrow />
    </Magnetic>
  );
}

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const textLayer = textRef.current;
    if (!section || !textLayer || reducedMotion()) return;

    const vh = () => window.innerHeight;
    let io: IntersectionObserver | undefined;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(
        "[data-about-card]",
        section,
      );
      cards.forEach((card, i) => gsap.set(card, { rotation: REST[i] }));

      // Giant-word entrances live in each GiantWord (shared useHeadingFx);
      // here only the bio + CTA get a soft rise. Initial state set in JS
      // (not CSS) so no-JS keeps everything visible.
      const intro = textLayer.querySelector<HTMLElement>("[data-intro]");
      if (intro) {
        gsap.set(intro, { opacity: 0, y: 24 });
        // Toggle, not one-shot: re-arms off screen, replays on re-entry.
        io = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              gsap.to(intro, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: 0.35,
                overwrite: true,
              });
            } else {
              gsap.killTweensOf(intro);
              gsap.set(intro, { opacity: 0, y: 24 });
            }
          },
          { threshold: 0.2 },
        );
        io.observe(textLayer);
      }

      // Scrubbed toss-in: each card scales/rotates down from an exaggerated
      // state as its sticky slot carries it up the viewport, while the card
      // before it recedes slightly, the "peeking sticky note" edge.
      cards.forEach((card, i) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: () => `top+=${i * vh()} top`,
            end: () => `top+=${(i + 1) * vh()} top`,
            // Generous scrub lag: the tween glides toward the scroll position
            // instead of snapping to it, this is where the "fluid" feel
            // comes from. Gentler back.out so reversing scroll direction
            // mid-toss doesn't wobble the overshoot.
            scrub: 1,
          },
        });
        tl.from(card, {
          scale: 1.25,
          yPercent: 15,
          rotation: TOSS[i],
          ease: "back.out(1.2)",
        });
        if (i > 0)
          tl.to(
            cards[i - 1],
            { rotation: "+=1.5", scale: 0.975, yPercent: -1.5, ease: "power1.out" },
            0,
          );
      });

      // The text layer blurs and dims as the first card arrives, so every
      // card reads crisp against a soft ghosted background from the start.
      gsap.to(textLayer, {
        filter: "blur(16px)",
        opacity: 0.5,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `top+=${vh()} top`,
          scrub: 1,
        },
      });
    }, section);

    return () => {
      io?.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative h-[550svh]"
      aria-label="About Hyojin Bernabe"
    >
      <h2 className="sr-only">Who am I?</h2>

      {/* Text layer: pinned for the whole runway, blurred away at the end.
          Angled poster composition, words rotate and bleed off the viewport
          edges, bio sits straight in the pocket they leave open. */}
      <div
        ref={textRef}
        className="sticky top-0 z-0 h-svh overflow-hidden will-change-[filter,opacity]"
      >
        <GiantWord className="absolute top-[7%] left-[6%] -rotate-[24deg] text-[clamp(5rem,21vw,38vh)]">
          Who
        </GiantWord>
        <GiantWord
          delay={0.2}
          className="absolute top-[16%] right-[2%] rotate-[15deg] text-[clamp(6rem,22vw,42vh)]"
        >
          Am
        </GiantWord>
        <GiantWord
          delay={0.4}
          className="absolute bottom-[10%] left-[34%] -rotate-[10deg] text-[clamp(4.5rem,16vw,30vh)] [&>span>div:last-child]:text-brand [&>span>div:last-child]:[--char-flash:var(--foreground)]"
        >
          I?
        </GiantWord>
        {/* pointer-events: the intro's box overlaps I?, only the actual
            paragraph and button may catch the pointer, so the word behind
            keeps its letter-dip hover. */}
        <div
          data-intro
          className="pointer-events-none absolute top-[42%] right-[8%] left-[8%] max-w-xl space-y-6 text-left sm:top-[38%] sm:left-[34%] sm:right-auto"
        >
          <p className="pointer-events-auto text-base font-medium text-muted-foreground sm:text-lg">
            {ABOUT_BIO}
          </p>
          <ContactCta />
        </div>
      </div>

      {/* Card layers: each wrapper's padding-top staggers when its sticky
          child reaches the viewport, so cards arrive one per 100svh of
          scroll and stay pinned until the section releases. */}
      {ABOUT_CHAPTERS.map((chapter, i) => {
        const Icon = STICKER_ICONS[i];
        return (
        <div
          key={chapter.title.join(" ")}
          className="pointer-events-none absolute inset-0 z-10"
          style={{ paddingTop: `${(i + 1) * CARD_SPAN}svh` }}
        >
          <div className="sticky top-0 flex h-svh items-center justify-center">
            <article
              data-about-card
              className="pointer-events-auto flex aspect-square w-[min(85vw,60svh,34rem)] flex-col rounded-[2rem] bg-secondary p-6 will-change-transform sm:p-8"
            >
              <ChapterTitle lines={chapter.title} />
              <p className="mt-4 max-w-[36ch] text-sm font-medium text-muted-foreground sm:text-base">
                {chapter.description}
              </p>
              <span
                aria-hidden
                className="my-auto grid size-24 place-items-center self-center rounded-full border-4 border-background bg-brand text-brand-foreground shadow-md sm:size-28"
                style={{ transform: `rotate(${STICKER_TILT[i]}deg)` }}
              >
                <Icon className="size-10 sm:size-12" strokeWidth={1.8} />
              </span>
              <div className="mt-auto flex items-end justify-between gap-4">
                <ul className="space-y-1 text-base font-semibold sm:text-xl">
                  {chapter.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <span
                  aria-hidden
                  className="font-display-wide font-black [font-stretch:125%] text-[clamp(2.5rem,7vw,4.5rem)] leading-none text-muted-foreground/50"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </article>
          </div>
        </div>
        );
      })}
    </section>
  );
}
