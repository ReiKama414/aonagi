"use client";

import { RefObject, useEffect, useState } from "react";
import {
  isAmbientMuted,
  subscribeAmbientMuted,
  toggleAmbientMuted,
} from "@/lib/ambientAudio";
import { GITHUB_URL, SITE_URL } from "@/lib/site";

interface StageChromeProps {
  visible: boolean;
  progressFillRef: RefObject<HTMLDivElement | null>;
  autoplaying: boolean;
  onToggleAutoplay: () => void;
  onBackToTop: () => void;
}

export default function StageChrome({
  visible,
  progressFillRef,
  autoplaying,
  onToggleAutoplay,
  onBackToTop,
}: StageChromeProps) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAmbientMuted());
    return subscribeAmbientMuted(setMuted);
  }, []);

  return (
    <div className={`stage-chrome ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <div className="scroll-rail" aria-hidden="true">
        <div className="scroll-rail__track" />
        <div className="scroll-rail__fill" ref={progressFillRef} />
      </div>

      <button
        type="button"
        className={`chrome-icon chrome-icon--autoplay ${autoplaying ? "is-active" : ""}`}
        aria-label={autoplaying ? "暫停自動播放" : "自動播放"}
        aria-pressed={autoplaying}
        title={autoplaying ? "Pause" : "Autoplay"}
        onClick={onToggleAutoplay}
      >
        <AutoplayIcon playing={autoplaying} />
      </button>

      <button
        type="button"
        className="chrome-icon chrome-icon--top"
        aria-label="回到頂部"
        title="Top"
        onClick={onBackToTop}
      >
        <TopIcon />
      </button>

      <button
        type="button"
        className={`chrome-icon chrome-icon--sound ${muted ? "is-muted" : ""}`}
        aria-label={muted ? "開啟聲音" : "靜音"}
        aria-pressed={muted}
        onClick={() => setMuted(toggleAmbientMuted())}
      >
        <SoundIcon muted={muted} />
      </button>

      <div className="chrome-links">
        <a
          className="chrome-icon"
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="個人網站"
          title="Website"
        >
          <GlobeIcon />
        </a>
        <a
          className="chrome-icon"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          title="GitHub"
        >
          <GitHubIcon />
        </a>
      </div>
    </div>
  );
}

function AutoplayIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {playing ? (
        <>
          <path d="M9 7v10" />
          <path d="M15 7v10" />
        </>
      ) : (
        <path d="M9 7.2v9.6L17.2 12z" fill="currentColor" stroke="none" />
      )}
    </svg>
  );
}

function TopIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 18V7.5" />
      <path d="M7.5 11.5L12 7l4.5 4.5" />
      <path d="M7 5.5h10" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5h3.2L12 6.8v10.4L7.2 13.5H4z" />
      {muted ? (
        <path d="M16 9.5l4 5m0-5l-4 5" />
      ) : (
        <>
          <path d="M15.2 9.2a3.2 3.2 0 0 1 0 5.6" />
          <path d="M17.4 7a5.6 5.6 0 0 1 0 10" />
        </>
      )}
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7.2" />
      <path d="M4.8 12h14.4M12 4.8c2.2 2.4 2.2 12 0 14.4M12 4.8c-2.2 2.4-2.2 12 0 14.4" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor">
      <path d="M12 2.2c-5.4 0-9.8 4.4-9.8 9.8 0 4.3 2.8 8 6.7 9.3.5.1.7-.2.7-.5v-1.8c-2.7.6-3.3-1.2-3.3-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.2-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.5 4.9.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 3.9-1.3 6.7-5 6.7-9.3 0-5.4-4.4-9.8-9.8-9.8z" />
    </svg>
  );
}
