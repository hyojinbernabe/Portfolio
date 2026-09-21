"use client";

import type { RefObject } from "react";

/**
 * Positioning + directional-blur rig for the hero's keyboard entrance. Purely
 * structural, all motion (position/stretch/squash/blur amount) is driven
 * imperatively by useHeroIntro via keyboardRef/blurRef.
 *
 * feGaussianBlur's stdDeviation takes "x y": we only ever set the x (travel
 * axis) component, keeping y at 0, so the blur smears horizontally only,
 * real directional motion blur, not CSS filter: blur()'s uniform smear.
 */
export function KeyboardEntrance({
  keyboardRef,
  blurRef,
  children,
}: {
  keyboardRef: RefObject<HTMLDivElement | null>;
  blurRef: RefObject<SVGFEGaussianBlurElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      /* Full-bleed over the fixed sidebars: escape the layout's lg:px-[125px]
         padding with matching negative insets, and sit above the bars (z-50).
         Below lg the tagline/CTA stack under the heading instead of beside
         it, growing the content block taller and pushing the heading's own
         center upward; nudge the keyboard up to match so it still parks over
         the name instead of drifting onto the tagline. */
      className="pointer-events-none absolute inset-x-0 inset-y-0 z-[60] flex -translate-y-[13%] items-center justify-center overflow-x-clip transition-opacity duration-500 [html.menu-open_&]:z-30 [html.menu-open_&]:opacity-0 sm:-translate-y-[8%] lg:-left-[125px] lg:-right-[125px] lg:translate-y-0"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="hero-kb-blur" colorInterpolationFilters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>
      <div
        ref={keyboardRef}
        className="hero-keyboard relative aspect-[2.4/1] w-[118vw] sm:w-[min(82vw,1290px)]"
        style={{ filter: "url(#hero-kb-blur)" }}
      >
        {children}
      </div>
    </div>
  );
}
