"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Set at module eval (before the browser restores scroll on refresh) so a
// reload always starts at the hero. Doing this in an effect is too late: the
// restore has already happened.
if (typeof history !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Keyboard entrance tuning.
const KEYBOARD_START_X = "170vw";
const KEYBOARD_POSITION_DURATION = 1.2; // expo.out: fast start, hard stop, the "speed ramp"
const KEYBOARD_SPEED_DECAY_DURATION = 0.85; // blur + speed stretch resolve before the stop lands
const KEYBOARD_MAX_BLUR = 22; // feGaussianBlur stdDeviation (x-axis) at full speed
const KEYBOARD_MAX_STRETCH = 0.22; // scaleX = 1 + this at full speed (elongate along travel axis)
const KEYBOARD_MAX_SQUASH = 0.08; // scaleY = 1 - this at full speed (thin perpendicular to travel)

/**
 * Hero entrance: the keyboard is the only thing that animates in. All text is
 * visible from the first frame.
 *
 *  t=0     keyboard position tween starts (x: KEYBOARD_START_X -> 0, expo.out) AND a
 *          "speed" driver (1 -> 0) starts in parallel, whose onUpdate sets
 *          blur stdDeviation and speed stretch/squash together, one number
 *          controls both so the smear and the elongation always agree, and
 *          both resolve to neutral (0 blur, no stretch) before the stop.
 *  t=1.2   keyboard arrives, immediately followed by a small impact-squash
 *          (compress, then settle), then the idle float.
 *
 * The timeline waits for the keyboard loader's `loader:done` handoff.
 * Skipped entirely under reduced-motion: everything renders at rest.
 * The .hero-word chars are still SplitText-split, but only to power the
 * per-letter pointer dip, not for any entrance.
 */
export function useHeroIntro(
  scopeRef: RefObject<HTMLElement | null>,
  keyboardRef?: RefObject<HTMLDivElement | null>,
  blurRef?: RefObject<SVGFEGaussianBlurElement | null>
) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    window.scrollTo(0, 0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let tl: gsap.core.Timeline | undefined;
    let floatTween: gsap.core.Tween | undefined;

    const ctx = gsap.context(() => {
      // Chars are split ONLY for the pointer dip interaction, the text has
      // no entrance animation and is fully visible from the first frame;
      // the keyboard is the only thing that enters.
      const word = SplitText.create(".hero-word", { type: "chars" });

      const ready = true; // hover live immediately (no text entrance to wait on)

      tl = gsap.timeline({
        paused: true,
        defaults: { ease: "back.out(1.7)" },
        onComplete: () => {
          // Idle float once parked, a gentle vertical bob so it isn't static.
          const c = keyboardRef?.current;
          if (c) {
            floatTween = gsap.to(c, {
              y: -14,
              duration: 2.6,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
        },
      });

      const keyboard = keyboardRef?.current;
      if (keyboard) {
        gsap.set(keyboard, { x: KEYBOARD_START_X });

        const speed = { v: 1 };
        tl.to(
          speed,
          {
            v: 0,
            duration: KEYBOARD_SPEED_DECAY_DURATION,
            ease: "power2.out",
            onUpdate: () => {
              blurRef?.current?.setAttribute("stdDeviation", `${speed.v * KEYBOARD_MAX_BLUR} 0`);
              gsap.set(keyboard, {
                scaleX: 1 + speed.v * KEYBOARD_MAX_STRETCH,
                scaleY: 1 - speed.v * KEYBOARD_MAX_SQUASH,
              });
            },
          },
          0
        )
          .to(keyboard, { x: 0, duration: KEYBOARD_POSITION_DURATION, ease: "expo.out" }, 0)
          .to(
            keyboard,
            { scaleX: 0.95, scaleY: 1.05, duration: 0.1, ease: "power2.in" },
            KEYBOARD_POSITION_DURATION
          )
          .to(keyboard, { scaleX: 1, scaleY: 1, duration: 0.35, ease: "back.out(1.4)" }, ">");
      }

      // Per-letter hover: quick dip, then elastic settle.
      // Delegated from the <h1>, not per-letter mouseenter: with leading-[0.85]
      // the tall letter boxes of one row bleed into the other, so a plain
      // mouseenter fires on the wrong line. Instead pick the letter whose box is under the pointer and nearest
      // its center, overlapping boxes resolve deterministically. yPercent (not
      // px) so the dip scales with the responsive clamp font size.
      const heading = scope.querySelector<HTMLElement>(".hero-word");
      let active: Element | null = null;

      const dip = (char: Element) => {
        gsap.killTweensOf(char);
        // Brand green flash on touch, fading back during the elastic settle.
        // Colors sampled from the cascade per dip (inline color cleared
        // first) so repeat dips and theme flips both resolve correctly.
        gsap.set(char, { clearProps: "color" });
        const cs = getComputedStyle(char as HTMLElement);
        const base = cs.color;
        const brand = cs.getPropertyValue("--brand").trim();
        const tl = gsap
          .timeline()
          .to(char, { yPercent: 12, duration: 0.2, ease: "power2.out" }, 0)
          .to(char, { yPercent: 0, duration: 1, ease: "elastic.out(1, 0.5)" }, 0.2);
        if (brand)
          tl.set(char, { color: brand }, 0).to(
            char,
            {
              color: base,
              duration: 0.7,
              ease: "power2.out",
              onComplete: () => gsap.set(char, { clearProps: "color" }),
            },
            0.3,
          );
      };

      const onMove = (e: PointerEvent) => {
        if (!ready) return; // entrance still playing, hover disabled
        let hit: Element | null = null;
        let best = Infinity;
        for (const char of word.chars) {
          const r = char.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            continue;
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const d = dx * dx + dy * dy;
          if (d < best) {
            best = d;
            hit = char;
          }
        }
        if (hit && hit !== active) dip(hit);
        active = hit;
      };
      const onLeave = () => {
        active = null;
      };

      heading?.addEventListener("pointermove", onMove);
      heading?.addEventListener("pointerleave", onLeave);

      // gsap.context runs a returned cleanup on revert(), tears the delegated
      // listeners down with everything else on unmount.
      return () => {
        heading?.removeEventListener("pointermove", onMove);
        heading?.removeEventListener("pointerleave", onLeave);
      };
    }, scope);

    // Wait for the keyboard loader to hand over. A
    // mounted overlay always wins over a stale done-flag: navigating back
    // to the landing page replays the loader, so the hero must wait for
    // THIS run, not the flag a previous page set.
    const begin = () => {
      Promise.race([document.fonts.ready, wait(500)]).then(() => {
        if (cancelled) return;
        setTimeout(() => tl?.play(), 180);
      });
    };
    const loaderRunning = document.querySelector("[data-key-lights]");
    if (document.documentElement.dataset.loaderDone && !loaderRunning) begin();
    else window.addEventListener("loader:done", begin, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("loader:done", begin);
      floatTween?.kill();
      ctx.revert();
    };
  }, [scopeRef, keyboardRef, blurRef]);
}
