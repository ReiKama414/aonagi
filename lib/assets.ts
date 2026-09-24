// Centralized asset path map. WebP is the delivery format; PNG masters stay
// in /aonagi-assets for editing and are not shipped to the browser except as
// the <picture> fallback for browsers without WebP support.

const webp = (path: string) => `/assets/webp/${path}`;
const png = (path: string) => `/assets/${path}`;

export const HERO = {
  forestSky: { webp: webp("hero/forest-sky.webp"), png: png("hero/forest-sky.png") },
  water: { webp: webp("hero/water.webp"), png: png("hero/water.png") },
  midground: { webp: webp("hero/midground.webp"), png: png("hero/midground.png") },
  foreground: { webp: webp("hero/foreground.webp"), png: png("hero/foreground.png") },
  master: { webp: webp("hero/hero-master.webp"), png: png("hero/hero-master.png") },
};

export const PLANTS = {
  bambooLeft: { webp: webp("plants/bamboo-left.webp"), png: png("plants/bamboo-left.png") },
  bambooRight: { webp: webp("plants/bamboo-right.webp"), png: png("plants/bamboo-right.png") },
  fernCluster: { webp: webp("plants/fern-cluster.webp"), png: png("plants/fern-cluster.png") },
};

export const EFFECTS = {
  fogLow: { webp: webp("effects/fog-low.webp"), png: png("effects/fog-low.png") },
  moonRays: { webp: webp("effects/moon-rays.webp"), png: png("effects/moon-rays.png") },
  lightParticles: { webp: webp("effects/light-particles.webp"), png: png("effects/light-particles.png") },
  fallingLeaves: [1, 2, 3, 4, 5].map((n) => ({
    webp: webp(`effects/falling-leaf-0${n}.webp`),
    png: png(`effects/falling-leaf-0${n}.png`),
  })),
  waterDrops: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    webp: webp(`effects/water-drop-0${n}.webp`),
    png: png(`effects/water-drop-0${n}.png`),
  })),
};

export const CAT_WALK = [1, 2, 3, 4].map((n) => ({
  webp: webp(`cat/walk/cat-walk-0${n}.webp`),
  png: png(`cat/walk/cat-walk-0${n}.png`),
}));

export const CAT_TAIL = [1, 2, 3].map((n) => ({
  webp: webp(`cat/tail/cat-tail-0${n}.webp`),
  png: png(`cat/tail/cat-tail-0${n}.png`),
}));

// Every image required before the first frame may be shown.
export const CRITICAL_PRELOAD = [
  HERO.forestSky.webp,
  HERO.water.webp,
  HERO.midground.webp,
  HERO.foreground.webp,
  EFFECTS.fogLow.webp,
  EFFECTS.moonRays.webp,
  EFFECTS.lightParticles.webp,
  PLANTS.bambooLeft.webp,
  PLANTS.bambooRight.webp,
  PLANTS.fernCluster.webp,
  ...CAT_WALK.map((f) => f.webp),
  ...CAT_TAIL.map((f) => f.webp),
];

export const SECONDARY_PRELOAD = [
  ...EFFECTS.fallingLeaves.map((f) => f.webp),
  ...EFFECTS.waterDrops.map((f) => f.webp),
];
