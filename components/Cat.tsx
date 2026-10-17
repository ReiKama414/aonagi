"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
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

/**
 * A single <picture>/<img> pair whose src is swapped imperatively, instead
 * of 7 stacked always-mounted frames cross-faded via CSS opacity
 * transitions. All frames are already in the browser cache (preloaded), so
 * a src swap paints on the very next frame with nothing to fade — no
 * simultaneous transitions to keep in sync, so no flicker window.
 */
const Cat = forwardRef<CatHandle, CatProps>(({ reducedMotion }, ref) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const sourceRef = useRef<HTMLSourceElement | null>(null);
  const modeRef = useRef<CatMode>("hidden");
  const timerRef = useRef<number | null>(null);
  const walkDistanceRef = useRef(0);
  const currentKeyRef = useRef<string | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const showFrame = (key: string, src: { webp: string; png: string }) => {
    if (currentKeyRef.current === key) return;
    currentKeyRef.current = key;
    if (sourceRef.current) sourceRef.current.srcset = src.webp;
    if (imgRef.current) imgRef.current.src = src.png;
  };

  const hide = () => {
    if (imgRef.current) imgRef.current.style.visibility = "hidden";
  };

  const show = () => {
    if (imgRef.current) imgRef.current.style.visibility = "visible";
  };

  useImperativeHandle(ref, () => ({
    setMode(mode: CatMode) {
      if (modeRef.current === mode) return;
      modeRef.current = mode;
      clearTimer();

      if (mode === "hidden") {
        hide();
        return;
      }

      show();

      if (mode === "walk") {
        walkDistanceRef.current = 0;
        showFrame(`walk-0`, CAT_WALK[WALK_SEQUENCE[0]]);
        return;
      }

      // idle: a slow, time-based tail flick is correct here — the cat is
      // genuinely stationary, so this loop is real ambient life, not a
      // "walking in place" artifact (that only applied to the walk cycle).
      if (reducedMotion) {
        showFrame(`tail-0`, CAT_TAIL[0]);
        return;
      }
      let i = 0;
      showFrame(`tail-${TAIL_SEQUENCE[0]}`, CAT_TAIL[TAIL_SEQUENCE[0]]);
      timerRef.current = window.setInterval(() => {
        i = (i + 1) % TAIL_SEQUENCE.length;
        showFrame(`tail-${TAIL_SEQUENCE[i]}`, CAT_TAIL[TAIL_SEQUENCE[i]]);
      }, CAT.tailFrameMs);
    },
    advanceWalk(distanceDeltaPercent: number) {
      if (modeRef.current !== "walk" || distanceDeltaPercent <= 0) return;
      walkDistanceRef.current += distanceDeltaPercent;
      if (reducedMotion) {
        showFrame(`walk-0`, CAT_WALK[WALK_SEQUENCE[0]]);
        return;
      }
      const step = Math.floor(walkDistanceRef.current / CAT.walkStepPercent);
      const idx = WALK_SEQUENCE[step % WALK_SEQUENCE.length];
      showFrame(`walk-${idx}`, CAT_WALK[idx]);
    },
  }));

  return (
    <picture className="cat-frames">
      <source ref={sourceRef} type="image/webp" />
      <img
        ref={imgRef}
        src={CAT_WALK[0].png}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="cat-frame"
        style={{ visibility: "hidden" }}
      />
    </picture>
  );
});

Cat.displayName = "Cat";

export default Cat;
