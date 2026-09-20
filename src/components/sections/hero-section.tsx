"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { KeyboardEntrance } from "@/components/hero/keyboard-entrance";
import { Magnetic } from "@/components/motion/magnetic";
import { RollLink } from "@/components/ui/roll-link";
import { useHeroIntro } from "@/hooks/use-hero-intro";

// WebGL only exists in the browser.
const KeyboardModel = dynamic(() => import("@/components/hero/keyboard-model"), { ssr: false });

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  useHeroIntro(heroRef, keyboardRef, blurRef);

  return (
    <section
      id="hero"
      ref={heroRef}
      // overflow visible on purpose: the splatter backdrop bleeds past the
      // hero into neighboring sections (their content still paints above it).
      className="relative flex min-h-svh flex-col justify-center overflow-visible px-6 sm:px-12"
    >
      <div className="relative mx-auto flex w-fit max-w-[92vw] flex-col justify-center">
        {/* Paint-splatter backdrop (client-approved): the splatter PNG's
            alpha is used as a MASK over a brand fill, so the shape
            renders in brand green and tracks the theme token. */}
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 h-[165%] w-[172%] -translate-x-1/2 -translate-y-1/2 -rotate-2 bg-brand"
          style={{
            WebkitMaskImage: "url(/hero-splatter.webp)",
            maskImage: "url(/hero-splatter.webp)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
        <h1
          aria-label="Hyojin Bernabe"
          className="hero-word relative flex select-none flex-col items-center gap-[clamp(0.25rem,1.5vw,1.5rem)] text-center leading-[0.85] font-display tracking-tight uppercase"
        >
          <span className="block text-[20vw] lg:text-[clamp(3.25rem,19vw,25rem)]">Hyojin</span>
          <span className="block text-[26vw] lg:text-[clamp(3.25rem,19vw,25rem)]">Bernabe</span>
        </h1>

        <div className="relative z-10 mt-10 flex w-full flex-col items-center gap-6 lg:flex-row lg:items-end lg:justify-between">
          <p className="hero-tagline max-w-xl text-center text-lg text-muted-foreground lg:text-left">
            {`Full stack developer from Baguio, Philippines. I build things for the web.`}
          </p>

          <div className="hero-cta flex shrink-0 flex-col gap-3 sm:flex-row">
            <Magnetic>
              <RollLink href="#work" label="View work" />
            </Magnetic>
            <Magnetic>
              <RollLink href="#contact" label="Get in touch" variant="outline" />
            </Magnetic>
          </div>
        </div>
      </div>

      <KeyboardEntrance keyboardRef={keyboardRef} blurRef={blurRef}>
        <KeyboardModel />
      </KeyboardEntrance>
    </section>
  );
}
