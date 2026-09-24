"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { BREAKPOINTS } from "./animationConfig";

// useLayoutEffect warns during SSR; fall back to useEffect on the server so
// the app-router server render of this client component stays warning-free.
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export type ViewportTier = "mobile" | "tablet" | "desktop";

export function useViewportTier(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>("desktop");

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < BREAKPOINTS.mobile) setTier("mobile");
      else if (w < BREAKPOINTS.tablet) setTier("tablet");
      else setTier("desktop");
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return tier;
}

interface PreloadState {
  loaded: number;
  total: number;
  done: boolean;
}

export function useImagePreloader(sources: string[]): PreloadState {
  const [state, setState] = useState<PreloadState>({
    loaded: 0,
    total: sources.length,
    done: sources.length === 0,
  });

  useEffect(() => {
    if (sources.length === 0) return;
    let cancelled = false;
    let loaded = 0;

    sources.forEach((src) => {
      const img = new Image();
      const onSettle = () => {
        if (cancelled) return;
        loaded += 1;
        setState({ loaded, total: sources.length, done: loaded >= sources.length });
      };
      img.onload = onSettle;
      img.onerror = onSettle;
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.length]);

  return state;
}
