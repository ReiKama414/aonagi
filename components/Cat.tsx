"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import PictureImg from "./PictureImg";
import { CAT_TAIL, CAT_WALK } from "@/lib/assets";
import { CAT } from "@/lib/animationConfig";

export type CatMode = "hidden" | "walk" | "idle";

export interface CatHandle {
  setMode: (mode: CatMode) => void;
  /**
   * Advances the walk cycle by how far the cat actually moved this tick
   * (in % of stage width). Frame changes are tied to distance covered, not
   * wall-clock time, so the legs never cycle while the cat is stationary.
   */
  advanceWalk: (distanceDeltaPercent: number) => void;
}

interface CatProps {
  reducedMotion: boolean;
}

// Walk cycle plays 1-2-3-4 forward. Tail-flick idle plays a gentle
// 1-2-3-2 ping-pong so it reads as a slow, living flick rather than a hard loop.
const WALK_SEQUENCE = [0, 1, 2, 3];
const TAIL_SEQUENCE = [0, 1, 2, 1];

const Cat = forwardRef<CatHandle, CatProps>(({ reducedMotion }, ref) => {
  const walkRefs = useRef<(HTMLImageElement | null)[]>([]);
  const tailRefs = useRef<(HTMLImageElement | null)[]>([]);
  const modeRef = useRef<CatMode>("hidden");
  const timerRef = useRef<number | null>(null);
  const walkDistanceRef = useRef(0);
  const walkFrameIndexRef = useRef(-1);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const showWalkFrame = (i: number) => {
    if (walkFrameIndexRef.current === i) return;
    walkFrameIndexRef.current = i;
    walkRefs.current.forEach((img, idx) => {
      if (img) img.style.opacity = idx === i ? "1" : "0";
    });
    tailRefs.current.forEach((img) => {
      if (img) img.style.opacity = "0";
    });
  };

  const showTailFrame = (i: number) => {
    tailRefs.current.forEach((img, idx) => {
      if (img) img.style.opacity = idx === i ? "1" : "0";
    });
    walkRefs.current.forEach((img) => {
      if (img) img.style.opacity = "0";
    });
  };

  const hideAll = () => {
    walkRefs.current.forEach((img) => img && (img.style.opacity = "0"));
    tailRefs.current.forEach((img) => img && (img.style.opacity = "0"));
  };

  useImperativeHandle(ref, () => ({
    setMode(mode: CatMode) {
      if (modeRef.current === mode) return;
      modeRef.current = mode;
      clearTimer();

      if (mode === "hidden") {
        hideAll();
        return;
      }

      if (mode === "walk") {
        walkDistanceRef.current = 0;
        walkFrameIndexRef.current = -1;
        showWalkFrame(WALK_SEQUENCE[0]);
        return;
      }

      // idle: a slow, time-based tail flick is correct here — the cat is
      // genuinely stationary, so this loop is real ambient life, not a
      // "walking in place" artifact (that only applied to the walk cycle).
      if (reducedMotion) {
        showTailFrame(0);
        return;
      }
      let i = 0;
      showTailFrame(TAIL_SEQUENCE[0]);
      timerRef.current = window.setInterval(() => {
        i = (i + 1) % TAIL_SEQUENCE.length;
        showTailFrame(TAIL_SEQUENCE[i]);
      }, CAT.tailFrameMs);
    },
    advanceWalk(distanceDeltaPercent: number) {
      if (modeRef.current !== "walk" || distanceDeltaPercent <= 0) return;
      walkDistanceRef.current += distanceDeltaPercent;
      if (reducedMotion) {
        showWalkFrame(0);
        return;
      }
      const step = Math.floor(walkDistanceRef.current / CAT.walkStepPercent);
      showWalkFrame(WALK_SEQUENCE[step % WALK_SEQUENCE.length]);
    },
  }));

  useEffect(() => () => clearTimer(), []);

  return (
    <div className="cat-frames">
      {CAT_WALK.map((src, i) => (
        <PictureImg
          key={`walk-${i}`}
          src={src}
          ref={(el) => {
            walkRefs.current[i] = el;
          }}
          className="cat-frame"
          style={{ opacity: 0 }}
        />
      ))}
      {CAT_TAIL.map((src, i) => (
        <PictureImg
          key={`tail-${i}`}
          src={src}
          ref={(el) => {
            tailRefs.current[i] = el;
          }}
          className="cat-frame"
          style={{ opacity: 0 }}
        />
      ))}
    </div>
  );
});

Cat.displayName = "Cat";

export default Cat;
