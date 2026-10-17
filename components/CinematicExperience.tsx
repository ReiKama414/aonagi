"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PictureImg from "./PictureImg";
import Cat, { CatHandle } from "./Cat";
import Preloader from "./Preloader";
import StageChrome from "./StageChrome";
import "./cinematic.css";
import { CRITICAL_PRELOAD, EFFECTS, HERO, PLANTS, SECONDARY_PRELOAD } from "@/lib/assets";
import {
  CAT,
  PARTICLES,
  SCENES,
  TIMING,
  localProgress,
  sceneRange,
} from "@/lib/animationConfig";
import {
  usePrefersReducedMotion,
  useViewportTier,
  useImagePreloader,
  useIsomorphicLayoutEffect,
} from "@/lib/hooks";
import { acquireAmbientPlayer } from "@/lib/ambientAudio";
import { createAutoScroll } from "@/lib/autoScroll";

gsap.registerPlugin(ScrollTrigger);

interface LeafSpec {
  id: number;
  src: { webp: string; png: string };
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
}

interface DropSpec {
  id: number;
  src: { webp: string; png: string };
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
}

function seededLeaves(count: number): LeafSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const src = EFFECTS.fallingLeaves[i % EFFECTS.fallingLeaves.length];
    const rand = (n: number) => {
      const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    return {
      id: i,
      src,
      left: 8 + rand(1) * 84,
      size: 26 + rand(2) * 30,
      duration: 22 + rand(3) * 18,
      delay: -rand(4) * 30,
      drift: rand(5) > 0.5 ? 1 : -1,
      spin: rand(6) > 0.5 ? 1 : -1,
    };
  });
}

function seededDrops(count: number): DropSpec[] {
  return Array.from({ length: count }, (_, i) => {
    const src = EFFECTS.waterDrops[i % EFFECTS.waterDrops.length];
    const rand = (n: number) => {
      const x = Math.sin(i * 37.719 + n * 91.345) * 24634.634;
      return x - Math.floor(x);
    };
    return {
      id: i,
      src,
      left: 6 + rand(1) * 30 + (i % 2) * 55,
      top: 4 + rand(2) * 14,
      size: 10 + rand(3) * 8,
      duration: 5 + rand(4) * 4,
      delay: rand(5) * 8,
    };
  });
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothIn = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

export default function CinematicExperience() {
  const reducedMotion = usePrefersReducedMotion();
  const tier = useViewportTier();
  const isMobile = tier === "mobile";

  const [criticalDone, setCriticalDone] = useState(false);
  const preload = useImagePreloader(CRITICAL_PRELOAD);
  const [dismissPreloader, setDismissPreloader] = useState(false);
  const [autoplaying, setAutoplaying] = useState(false);
  // Particle positions use a float-precision pseudo-random spread that can
  // differ by a few ULPs between the server and browser JS engines, so they
  // mount client-only rather than risk a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const autoScrollRef = useRef<ReturnType<typeof createAutoScroll> | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const skyRef = useRef<HTMLDivElement | null>(null);
  const moonRaysWrapRef = useRef<HTMLDivElement | null>(null);
  const moonRaysRef = useRef<HTMLImageElement | null>(null);
  const waterWrapRef = useRef<HTMLDivElement | null>(null);
  const waterImgRef = useRef<HTMLImageElement | null>(null);
  const shimmerRef = useRef<HTMLDivElement | null>(null);
  const moonGlowRef = useRef<HTMLDivElement | null>(null);
  const midgroundRef = useRef<HTMLDivElement | null>(null);
  const mistOverlayRef = useRef<HTMLDivElement | null>(null);

  const fogARef = useRef<HTMLImageElement | null>(null);
  const fogWrapRef = useRef<HTMLDivElement | null>(null);

  const bambooLeftFarRef = useRef<HTMLDivElement | null>(null);
  const bambooRightFarRef = useRef<HTMLDivElement | null>(null);
  const fernLeftRef = useRef<HTMLDivElement | null>(null);
  const fernRightRef = useRef<HTMLDivElement | null>(null);

  const catStageRef = useRef<HTMLDivElement | null>(null);
  const catPosRef = useRef<HTMLDivElement | null>(null);
  const catMirrorRef = useRef<HTMLDivElement | null>(null);
  const catRef = useRef<CatHandle | null>(null);

  const lightParticlesRef = useRef<HTMLImageElement | null>(null);
  const foregroundRef = useRef<HTMLDivElement | null>(null);
  const finaleDimRef = useRef<HTMLDivElement | null>(null);

  const captionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollCueRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);

  const leaves = useRef(seededLeaves(isMobile ? PARTICLES.fallingLeaves.mobile : PARTICLES.fallingLeaves.desktop));
  const drops = useRef(seededDrops(isMobile ? PARTICLES.waterDrops.mobile : PARTICLES.waterDrops.desktop));

  // Re-seed particle counts when the viewport tier actually changes tier
  // (desktop <-> mobile), not on every resize pixel.
  useIsomorphicLayoutEffect(() => {
    leaves.current = seededLeaves(isMobile ? PARTICLES.fallingLeaves.mobile : PARTICLES.fallingLeaves.desktop);
    drops.current = seededDrops(isMobile ? PARTICLES.waterDrops.mobile : PARTICLES.waterDrops.desktop);
  }, [isMobile]);

  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (preload.done) setCriticalDone(true);
  }, [preload.done]);

  useIsomorphicLayoutEffect(() => {
    if (!criticalDone) return;
    const t = window.setTimeout(() => setDismissPreloader(true), 500);
    return () => window.clearTimeout(t);
  }, [criticalDone]);

  // Ambient loop: once the scene is entered, wait 500ms then settle at 25%.
  // Uses a module singleton so React Strict Mode remounts cannot kill playback.
  useIsomorphicLayoutEffect(() => {
    if (!dismissPreloader) return;
    const player = acquireAmbientPlayer();
    player.startOnEnter();
    return () => player.release();
  }, [dismissPreloader]);

  useEffect(() => {
    const auto = createAutoScroll({ onChange: setAutoplaying });
    autoScrollRef.current = auto;
    return () => {
      auto.dispose();
      autoScrollRef.current = null;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!criticalDone) return;
    // Secondary assets (leaves/drops) can stream in after first paint.
    SECONDARY_PRELOAD.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [criticalDone]);

  useIsomorphicLayoutEffect(() => {
    if (!criticalDone) return;
    const root = rootRef.current;
    if (!root) return;

    let stopCatTicker: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const pinVh = isMobile ? TIMING.pinVhMobile : TIMING.pinVhDesktop;
      if (trackRef.current) trackRef.current.style.height = `${pinVh}vh`;

      // ---- Ambient / idle loops (independent of scroll) -------------------
      if (!reducedMotion) {
        // Fog drift: two identical tiles inside a 200%-wide track, looping
        // seamlessly because tile A and tile B are the same image.
        if (fogWrapRef.current) {
          gsap.to(fogWrapRef.current, {
            xPercent: -50,
            duration: isMobile ? 70 : 100,
            ease: "none",
            repeat: -1,
          });
        }

        if (moonRaysRef.current) {
          // Ambient flicker lives on the inner image; the scroll timeline
          // separately drives the outer wrapper's opacity/scale, so the two
          // never fight over the same property on the same element.
          gsap.to(moonRaysRef.current, {
            opacity: 0.7,
            duration: 7,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }

        if (waterImgRef.current) {
          gsap.to(waterImgRef.current, {
            xPercent: 1.2,
            scale: 1.015,
            duration: 14,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }
        if (shimmerRef.current) {
          gsap.to(shimmerRef.current, {
            opacity: 0.55,
            duration: 5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }

        if (lightParticlesRef.current) {
          gsap.to(lightParticlesRef.current, {
            yPercent: -3,
            xPercent: 1.5,
            opacity: 0.32,
            duration: 10,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }

        [bambooLeftFarRef, bambooRightFarRef, fernLeftRef, fernRightRef, foregroundRef].forEach(
          (r, i) => {
            if (!r.current) return;
            gsap.to(r.current, {
              rotate: i % 2 === 0 ? 1.1 : -1.1,
              duration: 6 + i * 0.8,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              delay: i * 0.4,
            });
          }
        );

        // Falling leaves: independent infinite drift-and-fall per leaf.
        leaves.current.forEach((leaf) => {
          const el = document.getElementById(`leaf-${leaf.id}`);
          if (!el) return;
          gsap.set(el, { top: "-8%", left: `${leaf.left}%`, opacity: 0 });
          const tl = gsap.timeline({ repeat: -1, delay: leaf.delay });
          tl.to(el, { opacity: 0.85, duration: leaf.duration * 0.08, ease: "sine.out" }, 0);
          tl.to(
            el,
            { top: "108%", duration: leaf.duration, ease: "sine.inOut" },
            0
          );
          tl.to(
            el,
            {
              xPercent: leaf.drift * 60,
              rotate: leaf.spin * 200,
              duration: leaf.duration,
              ease: "sine.inOut",
            },
            0
          );
          tl.to(el, { opacity: 0, duration: leaf.duration * 0.1, ease: "sine.in" }, leaf.duration * 0.9);
        });

        // Water drops: sparse, occasional drips — never rain-like.
        drops.current.forEach((drop) => {
          const el = document.getElementById(`drop-${drop.id}`);
          if (!el) return;
          gsap.set(el, { opacity: 0 });
          const tl = gsap.timeline({ repeat: -1, delay: drop.delay, repeatDelay: 4 + drop.duration });
          tl.set(el, { top: `${drop.top}%`, opacity: 0 });
          tl.to(el, { opacity: 0.8, duration: drop.duration * 0.15 });
          tl.to(el, { top: `${drop.top + 9}%`, opacity: 0, duration: drop.duration * 0.85, ease: "power1.in" });
        });
      }

      // ---- Scroll-driven master timeline -----------------------------------
      const pos = (t: number) => t * 100;

      const [forestS, forestE] = sceneRange("forest");
      const [descendS, descendE] = sceneRange("descend");
      const [mistS, mistE] = sceneRange("mist");
      const [windS, windE] = sceneRange("wind");
      const [catS, catE] = sceneRange("cat");
      const [moonS, moonE] = sceneRange("moonlight");
      const [aonagiS, aonagiE] = sceneRange("aonagi");

      const master = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: stageRef.current,
          anticipatePin: 1,
          onUpdate: (self) => handleFrame(self.progress),
        },
      });

      const cap = (id: string) => captionRefs.current[id];
      const revealCaption = (id: string, start: number, end: number, opts?: { hold?: boolean }) => {
        const el = cap(id);
        if (!el) return;
        const span = end - start;
        const revealDur = opts?.hold ? span * 0.45 : span * 0.5;
        master.fromTo(
          el,
          { clipPath: "inset(0 100% 0 0)", opacity: 0, filter: "blur(6px)" },
          { clipPath: "inset(0 0% 0 0)", opacity: 1, filter: "blur(0px)", duration: pos(revealDur), ease: "power2.out" },
          pos(start)
        );
        // Final scene stays; earlier scenes dissolve before the next one arrives.
        if (!opts?.hold) {
          const fadeStart = end - span * 0.35;
          master.to(
            el,
            { opacity: 0, filter: "blur(4px)", duration: pos(end - fadeStart) },
            pos(fadeStart)
          );
        }
      };

      // Scroll cue fades almost immediately once the journey begins.
      if (scrollCueRef.current) {
        master.to(scrollCueRef.current, { opacity: 0, y: -10, duration: pos(0.05) }, pos(0));
      }

      // Scene 1 — the hero title is already visible at first paint (see CSS
      // default state); it only needs to recede as the camera starts pushing in.
      const forestFadeStart = forestE - (forestE - forestS) * 0.3;
      if (cap("forest")) {
        master.to(
          cap("forest"),
          { opacity: 0, filter: "blur(4px)", duration: pos(forestE - forestFadeStart) },
          pos(forestFadeStart)
        );
      }

      // Scene 2 — camera push, foreground bamboo passes by, deep plants settle in.
      master.to(skyRef.current, { scale: 1.1, yPercent: -1.5, duration: pos(descendE - descendS) }, pos(descendS));
      master.to(midgroundRef.current, { scale: 1.22, yPercent: -3.5, duration: pos(descendE - descendS) }, pos(descendS));
      master.to(waterWrapRef.current, { scale: 1.16, duration: pos(descendE - descendS) }, pos(descendS));
      if (foregroundRef.current) {
        master.to(
          foregroundRef.current,
          { scale: 2.4, opacity: 0, duration: pos(descendE - descendS), ease: "power1.in" },
          pos(descendS)
        );
      }
      master.fromTo(
        [bambooLeftFarRef.current, bambooRightFarRef.current],
        { opacity: 0, scale: 1.08 },
        { opacity: 1, scale: 1, duration: pos(descendE - descendS) * 0.7 },
        pos(descendS + (descendE - descendS) * 0.35)
      );
      revealCaption("descend", descendS + (descendE - descendS) * 0.25, descendE);

      // Scene 3 — the camera settles lower, framing the misted waterline
      // rather than repeating scene 2's wide establishing shot; the moon and
      // canopy drift mostly out of frame so this genuinely reads as a new
      // composition, not the same picture zoomed further in.
      master.to(skyRef.current, { yPercent: -5, duration: pos(mistE - mistS) }, pos(mistS));
      master.to(midgroundRef.current, { yPercent: -6.5, scale: 1.3, duration: pos(mistE - mistS) }, pos(mistS));
      master.to(waterWrapRef.current, { scale: 1.3, duration: pos(mistE - mistS) }, pos(mistS));
      master.to(fogWrapRef.current, { opacity: 0.85, duration: pos(mistE - mistS) }, pos(mistS));
      if (mistOverlayRef.current) {
        master.to(mistOverlayRef.current, { opacity: 0.55, duration: pos(mistE - mistS) }, pos(mistS));
      }
      revealCaption("mist", mistS + (mistE - mistS) * 0.2, mistE);

      // Scene 4 — wind moves the leaves and plants; fog thins slightly as wind clears it.
      // Uses xPercent (not rotate) so it never fights the ambient sway loop,
      // which already owns rotation on these two elements.
      master.to(
        [fernLeftRef.current, fernRightRef.current],
        { xPercent: 1.5, duration: pos((windE - windS) / 2), yoyo: true, repeat: 1 },
        pos(windS)
      );
      master.to(fogWrapRef.current, { opacity: 0.5, duration: pos(windE - windS) }, pos(windS));
      revealCaption("wind", windS + (windE - windS) * 0.2, windE);

      // Scene 5 caption — appears once the cat has settled at the shore.
      revealCaption("cat", catS + (catE - catS) * 0.62, catE);

      // Scene 6 — the camera rises back toward the moon (reversing scene 3's
      // downward settle), a third distinct framing for the same journey.
      master.to(skyRef.current, { yPercent: -0.5, duration: pos(moonE - moonS) }, pos(moonS));
      master.to(midgroundRef.current, { yPercent: -2, scale: 1.16, duration: pos(moonE - moonS) }, pos(moonS));
      master.to(waterWrapRef.current, { scale: 1.16, duration: pos(moonE - moonS) }, pos(moonS));
      master.to(moonRaysWrapRef.current, { opacity: 1, scale: 1.08, duration: pos(moonE - moonS) }, pos(moonS));
      if (moonGlowRef.current) {
        master.to(moonGlowRef.current, { opacity: 0.75, duration: pos(moonE - moonS) }, pos(moonS));
      }
      master.to(fogWrapRef.current, { opacity: 0.3, duration: pos(moonE - moonS) }, pos(moonS));
      revealCaption("moonlight", moonS + (moonE - moonS) * 0.15, moonE);

      // Scene 7 — everything settles; final brand line + CTA. The
      // photographic layers dim well below full brightness so the closing
      // text sits in genuine negative space rather than fighting a busy
      // image, echoing the card-style breathing room of the reference site.
      master.to(
        [skyRef.current, midgroundRef.current, waterWrapRef.current],
        { scale: 1, yPercent: 0, duration: pos(aonagiE - aonagiS) * 0.6, ease: "sine.inOut" },
        pos(aonagiS)
      );
      if (finaleDimRef.current) {
        // Spans almost the entire scene so it reads as a slow settle, not a
        // discrete "lights out" cut, and stays gentle enough that it adds
        // to — rather than fights — the already-present vignette.
        master.to(
          finaleDimRef.current,
          { opacity: 0.3, duration: pos(aonagiE - aonagiS) * 0.85, ease: "sine.in" },
          pos(aonagiS + (aonagiE - aonagiS) * 0.1)
        );
      }
      // Hold through progress=1 — SCENE 07 is the journey's end, not a fade-out.
      revealCaption("aonagi", aonagiS + (aonagiE - aonagiS) * 0.12, aonagiE, { hold: true });

      // ---- Cat state machine ---------------------------------------------
      // Scroll position only decides WHICH zone we're in (and therefore the
      // cat's *target* x / mode); it never sets the cat's position directly.
      // A capped-speed ticker below eases the displayed position toward that
      // target and steps the walk cycle from actual distance covered, so
      // scrolling fast vs. slow only changes when the walk is triggered —
      // never how fast the legs move — and the cat never "marches in place"
      // when the target stops changing (frames only advance with distance).
      const exitWindow = (aonagiE - aonagiS) * 0.4;
      const exitEnd = aonagiS + exitWindow;

      type Zone = "before" | "active" | "exiting" | "after";
      let zone: Zone = "before";
      // Sentinel (not a boolean) so the very first call — even when it
      // wants the same value the variable "defaults" to — still applies the
      // transform instead of being skipped by the change check.
      let mirrored: boolean | null = null;
      let targetX = CAT.entryXPercent;
      let targetOpacity = 0;
      let lookRotate = 0;
      let currentX = CAT.entryXPercent;
      let currentOpacity = 0;
      let lastMode: "hidden" | "walk" | "idle" = "hidden";

      function setMirror(v: boolean) {
        if (v === mirrored) return;
        mirrored = v;
        if (catMirrorRef.current) gsap.set(catMirrorRef.current, { scaleX: v ? -1 : 1 });
      }

      function handleFrame(p: number) {
        if (progressFillRef.current) {
          progressFillRef.current.style.transform = `scaleY(${p})`;
        }

        if (p < catS) {
          zone = "before";
          targetX = CAT.entryXPercent;
          targetOpacity = 0;
          lookRotate = 0;
          setMirror(true);
        } else if (p <= moonE) {
          zone = "active";
          targetX = CAT.stopXPercent;
          targetOpacity = 1;
          setMirror(true);
          const lookT = smoothIn(localProgress(p, [moonS, moonE]), 0.4, 1);
          lookRotate = -lookT * 5;
        } else if (p <= exitEnd) {
          zone = "exiting";
          targetX = CAT.entryXPercent;
          targetOpacity = 0;
          lookRotate = 0;
          setMirror(false);
        } else {
          zone = "after";
          targetX = CAT.entryXPercent;
          targetOpacity = 0;
          lookRotate = 0;
          setMirror(false);
        }
      }

      handleFrame(0);

      // Cache the stage's pixel width so the per-frame position update can
      // use `transform: translateX(px)` (compositor-only) instead of
      // animating `left` (a percentage, which is layout-triggering). Doing
      // the latter at 60fps — across a cat built from 7 stacked, opacity-
      // crossfading images — was the actual cause of the visible flicker.
      let stageWidthPx = stageRef.current?.getBoundingClientRect().width ?? 0;
      const updateStageWidth = () => {
        stageWidthPx = stageRef.current?.getBoundingClientRect().width ?? stageWidthPx;
      };
      window.addEventListener("resize", updateStageWidth);

      let lastTick = performance.now();
      let appliedX: number | null = null;
      let appliedOpacity: number | null = null;
      let appliedRotate: number | null = null;

      function tick() {
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastTick) / 1000);
        lastTick = now;

        const dx = targetX - currentX;
        const maxStep = CAT.followSpeedPercentPerSec * dt;
        const moveStep = Math.abs(dx) <= maxStep ? dx : Math.sign(dx) * maxStep;
        currentX += moveStep;

        const arrived = Math.abs(targetX - currentX) < CAT.arriveEpsilonPercent;
        const moving = Math.abs(moveStep) > 0.0008;

        let mode: "hidden" | "walk" | "idle" = "hidden";
        if (zone === "active") mode = moving && !arrived ? "walk" : "idle";
        else if (zone === "exiting") mode = moving && !arrived ? "walk" : "hidden";

        if (mode !== lastMode) {
          catRef.current?.setMode(mode);
          lastMode = mode;
        }
        if (mode === "walk") catRef.current?.advanceWalk(Math.abs(moveStep));

        const dOpacity = targetOpacity - currentOpacity;
        const opacityStep = dt * 1.6;
        currentOpacity += Math.abs(dOpacity) <= opacityStep ? dOpacity : Math.sign(dOpacity) * opacityStep;

        // Skip redundant writes once settled — nothing changed, so nothing
        // needs to be re-applied (also avoids forcing style recalculation
        // every single frame for a value that's already correct).
        if (catPosRef.current && (appliedX !== currentX || appliedOpacity !== currentOpacity)) {
          const xPx = (currentX / 100) * stageWidthPx;
          gsap.set(catPosRef.current, { x: xPx, opacity: currentOpacity });
          appliedX = currentX;
          appliedOpacity = currentOpacity;
        }
        if (catMirrorRef.current && appliedRotate !== lookRotate) {
          gsap.set(catMirrorRef.current, { rotate: lookRotate });
          appliedRotate = lookRotate;
        }
      }

      gsap.ticker.add(tick);
      stopCatTicker = () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("resize", updateStageWidth);
      };
    }, root);

    return () => {
      stopCatTicker?.();
      ctx.revert();
    };
  }, [criticalDone, isMobile, reducedMotion]);

  return (
    <>
      <Preloader progress={preload.total === 0 ? 1 : preload.loaded / preload.total} visible={!dismissPreloader} />
      <StageChrome
        visible={dismissPreloader}
        progressFillRef={progressFillRef}
        autoplaying={autoplaying}
        onToggleAutoplay={() => autoScrollRef.current?.toggle()}
        onBackToTop={() => {
          autoScrollRef.current?.stop();
          window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
        }}
      />

      <main className={`stage-root ${criticalDone ? "is-ready" : ""}`} ref={rootRef}>
        <div className="scroll-track" ref={trackRef}>
          <section className="stage" ref={stageRef} aria-label="AONAGI 青凪 — 沉浸式視覺故事">
            <div className="layer layer--sky" ref={skyRef}>
              <PictureImg src={HERO.forestSky} className="fill-img" />
            </div>

            <div className="layer layer--moonrays" ref={moonRaysWrapRef}>
              <PictureImg src={EFFECTS.moonRays} ref={moonRaysRef} className="fill-img" style={{ mixBlendMode: "screen" }} />
            </div>

            <div className="layer layer--water" ref={waterWrapRef}>
              <PictureImg src={HERO.water} ref={waterImgRef} className="fill-img" />
              <div className="water-shimmer" ref={shimmerRef} />
              <div className="moon-glow" ref={moonGlowRef} />
              <div className="mist-overlay" ref={mistOverlayRef} />
            </div>

            <div className="layer layer--midground" ref={midgroundRef}>
              <PictureImg src={HERO.midground} className="fill-img" />
            </div>

            <div className="layer layer--fog-wrap" ref={fogWrapRef}>
              <PictureImg src={EFFECTS.fogLow} ref={fogARef} className="fog-tile fog-tile--a" />
              <PictureImg src={EFFECTS.fogLow} className="fog-tile fog-tile--b" />
            </div>

            <div className="plant plant--bamboo-left-far" ref={bambooLeftFarRef}>
              <PictureImg src={PLANTS.bambooLeft} className="fill-img" />
            </div>

            <div className="cat-stage" ref={catStageRef}>
              <div className="cat-pos" ref={catPosRef}>
                <div className="cat-mirror" ref={catMirrorRef}>
                  <Cat ref={catRef} reducedMotion={reducedMotion} />
                </div>
              </div>
            </div>

            <div className="plant plant--bamboo-right-far" ref={bambooRightFarRef}>
              <PictureImg src={PLANTS.bambooRight} className="fill-img" />
            </div>

            <div className="particle-layer" aria-hidden="true">
              {mounted &&
                leaves.current.map((leaf) => (
                  <PictureImg
                    key={leaf.id}
                    id={`leaf-${leaf.id}`}
                    src={leaf.src}
                    className="particle-leaf"
                    style={{ width: `${leaf.size}px`, left: `${leaf.left}%` }}
                  />
                ))}
              {mounted &&
                drops.current.map((drop) => (
                  <PictureImg
                    key={drop.id}
                    id={`drop-${drop.id}`}
                    src={drop.src}
                    className="particle-drop"
                    style={{ width: `${drop.size}px`, left: `${drop.left}%`, top: `${drop.top}%` }}
                  />
                ))}
              <PictureImg src={EFFECTS.lightParticles} ref={lightParticlesRef} className="light-particles" />
            </div>

            <div className="plant plant--fern-left" ref={fernLeftRef}>
              <PictureImg src={PLANTS.fernCluster} className="fill-img" />
            </div>
            <div className="plant plant--fern-right" ref={fernRightRef}>
              <PictureImg src={PLANTS.fernCluster} className="fill-img" />
            </div>

            <div className="layer layer--foreground" ref={foregroundRef}>
              <PictureImg src={HERO.foreground} className="fill-img" />
            </div>

            <div className="vignette" />
            <div className="finale-dim" ref={finaleDimRef} />

            <div className="captions">
              {SCENES.map((scene) => (
                <div
                  key={scene.id}
                  ref={(el) => {
                    captionRefs.current[scene.id] = el;
                  }}
                  className={`caption caption--${scene.id}`}
                >
                  <span className="caption__kicker en">{scene.kicker}</span>
                  <h2 className="caption__title">
                    <span className="jp">{scene.title}</span>
                  </h2>
                  {scene.titleSub && (
                    <p
                      className={`caption__sub ${scene.titleSubLang === "en" ? "en" : "jp"}`}
                      lang={scene.titleSubLang}
                    >
                      {scene.titleSub}
                    </p>
                  )}
                  {scene.line1 && <p className="caption__line jp">{scene.line1}</p>}
                  {scene.id === "aonagi" && scene.line2 && (
                    <button
                      type="button"
                      className="caption__cta jp"
                      onClick={() => {
                        autoScrollRef.current?.stop();
                        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
                      }}
                    >
                      {scene.line2}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="scroll-cue" ref={scrollCueRef}>
              <span className="en">Scroll to enter</span>
              <span className="scroll-cue__line" />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
