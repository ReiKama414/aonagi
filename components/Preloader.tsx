"use client";

interface PreloaderProps {
  progress: number; // 0..1
  visible: boolean;
}

export default function Preloader({ progress, visible }: PreloaderProps) {
  return (
    <div className={`preloader ${visible ? "" : "preloader--hidden"}`} aria-hidden={!visible}>
      <div className="preloader__mark jp">青凪</div>
      <div className="preloader__bar">
        <div className="preloader__bar-fill" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="preloader__label en">AONAGI</div>
    </div>
  );
}
