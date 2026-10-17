/** Module-level ambient BGM — survives React Strict Mode remounts. */

export const BGM_SRC = "/audio/bgm_moonlit_water.mp3";
export const BGM_TARGET_VOLUME = 0.25;
export const BGM_ENTER_DELAY_MS = 500;

type AmbientHandle = {
  startOnEnter: () => void;
  release: () => void;
};

let audio: HTMLAudioElement | null = null;
let enterStarted = false;
let rampTimer: number | null = null;
let unlockAttached = false;
let retainCount = 0;
let releaseTimer: number | null = null;
let watchdog: number | null = null;
let muted = false;
const muteListeners = new Set<(muted: boolean) => void>();

function applyVolume() {
  if (!audio) return;
  audio.volume = muted ? 0 : enterStarted ? BGM_TARGET_VOLUME : audio.volume;
}

export function isAmbientMuted() {
  return muted;
}

export function setAmbientMuted(next: boolean) {
  muted = next;
  applyVolume();
  if (!muted && enterStarted) tryPlay();
  muteListeners.forEach((fn) => fn(muted));
}

export function toggleAmbientMuted() {
  setAmbientMuted(!muted);
  return muted;
}

export function subscribeAmbientMuted(fn: (muted: boolean) => void) {
  muteListeners.add(fn);
  return () => {
    muteListeners.delete(fn);
  };
}

function restart() {
  const el = ensureAudio();
  el.loop = true;
  try {
    el.currentTime = 0;
  } catch {
    /* ignore seek errors while loading */
  }
  void el.play().catch(() => {
    attachUnlock();
  });
}

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio;

  const el = new Audio(BGM_SRC);
  el.loop = true;
  el.preload = "auto";
  el.volume = 0;

  // Native loop is unreliable on some MP3 encodings — force restart.
  el.addEventListener("ended", () => {
    if (retainCount > 0 && enterStarted) restart();
  });

  audio = el;
  return el;
}

function tryPlay() {
  const el = ensureAudio();
  el.loop = true;
  void el.play().catch(() => {
    attachUnlock();
  });
}

function attachUnlock() {
  if (unlockAttached || typeof window === "undefined") return;
  unlockAttached = true;
  const unlock = () => {
    tryPlay();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("wheel", unlock, true);
    window.removeEventListener("touchstart", unlock);
    unlockAttached = false;
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  window.addEventListener("wheel", unlock, { capture: true });
  window.addEventListener("touchstart", unlock, { passive: true });
}

function startWatchdog() {
  if (watchdog != null || typeof window === "undefined") return;
  // Belt-and-suspenders: if native loop fails and `ended` is skipped, nudge.
  watchdog = window.setInterval(() => {
    if (!audio || retainCount <= 0 || !enterStarted) return;
    const el = audio;
    if (el.ended || (el.duration > 0 && el.currentTime >= el.duration - 0.05 && el.paused)) {
      restart();
    }
  }, 800);
}

function startOnEnter() {
  if (enterStarted) {
    tryPlay();
    startWatchdog();
    return;
  }
  enterStarted = true;
  const el = ensureAudio();
  el.volume = 0;
  tryPlay();
  attachUnlock();
  startWatchdog();

  if (rampTimer != null) window.clearTimeout(rampTimer);
  rampTimer = window.setTimeout(() => {
    applyVolume();
    rampTimer = null;
  }, BGM_ENTER_DELAY_MS);
}

function release() {
  retainCount = Math.max(0, retainCount - 1);
  if (retainCount > 0) return;

  // Delay so Strict Mode's fake unmount → remount keeps the same player alive.
  if (releaseTimer != null) window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(() => {
    releaseTimer = null;
    // Intentionally keep singleton + watchdog for the page session.
  }, 0);
}

/** Call from the cinematic enter effect. */
export function acquireAmbientPlayer(): AmbientHandle {
  if (releaseTimer != null) {
    window.clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  retainCount += 1;
  ensureAudio();
  return {
    startOnEnter,
    release,
  };
}
