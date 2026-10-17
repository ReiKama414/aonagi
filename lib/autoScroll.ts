import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Smooth auto-scroll through the pinned cinematic track. */
export const AUTO_SCROLL_DURATION_S = 32;

gsap.registerPlugin(ScrollTrigger);

type AutoScrollHandle = {
  playing: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => boolean;
  dispose: () => void;
};

export function createAutoScroll(options?: {
  duration?: number;
  onChange?: (playing: boolean) => void;
}): AutoScrollHandle {
  const duration = options?.duration ?? AUTO_SCROLL_DURATION_S;
  const onChange = options?.onChange;
  let tween: gsap.core.Tween | null = null;
  let playing = false;
  let disposed = false;

  const setPlaying = (next: boolean) => {
    if (playing === next) return;
    playing = next;
    onChange?.(playing);
  };

  /** Land exactly on ScrollTrigger progress=1 (finale), not past the pin. */
  const maxScroll = () => {
    const pinned = ScrollTrigger.getAll().find((t) => Boolean(t.vars.pin));
    if (pinned) return pinned.end;
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  };

  const stop = () => {
    tween?.kill();
    tween = null;
    setPlaying(false);
  };

  const start = () => {
    if (disposed || typeof window === "undefined") return;

    tween?.kill();
    tween = null;

    let from = window.scrollY;
    let to = maxScroll();
    if (to - from < 8) {
      window.scrollTo(0, 0);
      from = 0;
      to = maxScroll();
    }
    if (to <= 0) return;

    const remaining = to > 0 ? (to - from) / to : 1;
    const travel = Math.max(8, duration * Math.max(0.08, remaining));
    const state = { y: from };

    setPlaying(true);
    tween = gsap.to(state, {
      y: to,
      duration: travel,
      ease: "none",
      onUpdate: () => {
        window.scrollTo(0, state.y);
      },
      onComplete: () => {
        tween = null;
        setPlaying(false);
      },
    });
  };

  const onUserInterrupt = (e: Event) => {
    if (!playing) return;
    if (e instanceof KeyboardEvent) {
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      if (!keys.includes(e.key)) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("button, a, input, textarea, select") || t.isContentEditable)) return;
    }
    stop();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("wheel", onUserInterrupt, { passive: true });
    window.addEventListener("touchmove", onUserInterrupt, { passive: true });
    window.addEventListener("keydown", onUserInterrupt);
  }

  return {
    get playing() {
      return playing;
    },
    start,
    stop,
    toggle: () => {
      if (playing) stop();
      else start();
      return playing;
    },
    dispose: () => {
      disposed = true;
      stop();
      if (typeof window !== "undefined") {
        window.removeEventListener("wheel", onUserInterrupt);
        window.removeEventListener("touchmove", onUserInterrupt);
        window.removeEventListener("keydown", onUserInterrupt);
      }
    },
  };
}
