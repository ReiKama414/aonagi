// Single source of truth for every timing / position / easing value used by
// the cinematic scroll experience. Nothing scene-specific should be
// hardcoded inside components — it all comes from here so the pacing of the
// whole piece can be tuned from one file.

export const COLORS = {
  deepest: "#041716",
  deep: "#071F20",
  forest: "#0C3435",
  moss: "#155052",
  jade: "#4E8586",
  mist: "#9BC6C7",
  paper: "#E4EEEE",
} as const;

export type SceneId =
  | "forest"
  | "descend"
  | "mist"
  | "wind"
  | "cat"
  | "moonlight"
  | "aonagi";

export interface SceneMeta {
  id: SceneId;
  index: number;
  weight: number; // relative share of the total pinned scroll distance
  kicker: string;
  title: string;
  titleSub: string;
  line1?: string;
  line1Sub?: string;
  line2?: string;
  line2Sub?: string;
}

export const SCENES: SceneMeta[] = [
  {
    id: "forest",
    index: 0,
    weight: 1,
    kicker: "SCENE 01",
    title: "AONAGI",
    titleSub: "青凪",
  },
  {
    id: "descend",
    index: 1,
    weight: 1.2,
    kicker: "SCENE 02",
    title: "水庭へ",
    titleSub: "Into the water garden",
  },
  {
    id: "mist",
    index: 2,
    weight: 1,
    kicker: "SCENE 03",
    title: "静けさは、まだ生きている",
    titleSub: "寂靜仍然活著",
  },
  {
    id: "wind",
    index: 3,
    weight: 0.9,
    kicker: "SCENE 04",
    title: "風の痕跡",
    titleSub: "The trace of wind",
  },
  {
    id: "cat",
    index: 4,
    weight: 1.3,
    kicker: "SCENE 05",
    title: "水面に残る、風の記憶",
    titleSub: "留在水面的風之記憶",
  },
  {
    id: "moonlight",
    index: 5,
    weight: 1.1,
    kicker: "SCENE 06",
    title: "月光",
    titleSub: "Moonlight",
  },
  {
    id: "aonagi",
    index: 6,
    weight: 1.2,
    kicker: "SCENE 07",
    title: "AONAGI",
    titleSub: "青凪",
    line1: "静けさは、まだ生きている",
    line2: "もう一度、青凪へ",
  },
];

const totalWeight = SCENES.reduce((sum, s) => sum + s.weight, 0);

/** Cumulative [start, end] progress (0..1) range for every scene. */
export const SCENE_RANGES: Record<SceneId, [number, number]> = (() => {
  const ranges = {} as Record<SceneId, [number, number]>;
  let cursor = 0;
  for (const scene of SCENES) {
    const start = cursor / totalWeight;
    cursor += scene.weight;
    const end = cursor / totalWeight;
    ranges[scene.id] = [start, end];
  }
  return ranges;
})();

export const sceneRange = (id: SceneId): [number, number] => SCENE_RANGES[id];

/** Remap a global progress value into local 0..1 progress within a range. */
export function localProgress(global: number, [start, end]: [number, number]): number {
  if (end === start) return 0;
  return Math.min(1, Math.max(0, (global - start) / (end - start)));
}

export const TIMING = {
  pinVhDesktop: 720, // vh of scroll distance driving the whole pinned stage
  pinVhMobile: 420,
  ease: {
    drift: "sine.inOut",
    reveal: "power2.out",
    camera: "power1.inOut",
  },
};

export const BREAKPOINTS = {
  tablet: 1024,
  mobile: 640,
};

export const CAT = {
  // Horizontal travel as % of stage width, within the "cat" scene's local progress.
  // The sprite's native pose faces right, so walking entryX -> stopX (leftward)
  // is mirrored (scaleX -1); the exit retraces stopX -> entryX (rightward,
  // unmirrored) so the cat leaves back the way it came.
  entryXPercent: 108, // starts off-screen right
  stopXPercent: 62, // stops near the shoreline
  bottomPercentDesktop: 30,
  bottomPercentMobile: 26,
  widthPercentDesktop: 16,
  widthPercentMobile: 22,
  // The cat's on-screen position eases toward a scroll-derived target at a
  // capped speed (% of stage width per second) instead of snapping straight
  // to it — scrolling fast or slow only decides WHEN the walk is triggered,
  // never how fast the legs move.
  followSpeedPercentPerSec: 13,
  arriveEpsilonPercent: 0.4,
  walkStepPercent: 3, // % of stage width covered per walk-cycle frame step
  tailFrameMs: 260, // ms per tail-flick frame while idling (genuinely stationary)
};

export const PARTICLES = {
  fallingLeaves: { desktop: 9, mobile: 4 },
  waterDrops: { desktop: 5, mobile: 2 },
  lightDots: { desktop: 1, mobile: 1 }, // multiplier on the base sprite layer count
};
