import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { ProjectImage } from "@my-portfolio/content";
import Lightbox from "./Lightbox";

type Props = {
  images?: ProjectImage[];
  /** CSS aspect-ratio, for example "16/9". */
  ratio?: string;
  /** With no images: draw a generated tile carrying this name. Without it, nothing is drawn. */
  fallback?: string;
};

/**
 * Screenshots in a swipeable carousel with a full-screen viewer. Arrows, dots and the counter exist
 * only when there is more than one image; with none, a generated name tile (or nothing) is shown.
 */
export default function Carousel({ images, ratio = "16/9", fallback }: Props) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const start = useRef<number | null>(null);
  const suppress = useRef(false);

  if (!images?.length) {
    return fallback ? (
      <div className="car">
        <div className="media" style={{ aspectRatio: ratio }}>
          <div className="ph" role="img" aria-label={fallback}>
            <b>{fallback}</b>
            <small>Screenshots coming soon</small>
          </div>
        </div>
      </div>
    ) : null;
  }

  const n = images.length;
  const go = (k: number) => setI((k + n) % n);

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") start.current = e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (start.current == null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    if (Math.abs(dx) > 40) {
      go(i + (dx < 0 ? 1 : -1));
      suppress.current = true;
      setTimeout(() => (suppress.current = false), 350);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (n < 2) return;
    if (e.key === "ArrowRight") go(i + 1);
    if (e.key === "ArrowLeft") go(i - 1);
  };

  return (
    <div
      className="car"
      {...(n > 1 ? { role: "region", "aria-roledescription": "carousel", "aria-label": "Screenshots" } : {})}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onClickCapture={(e) => {
        if (suppress.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="car-track" style={{ transform: `translateX(${-i * 100}%)` }}>
        {images.map((im, k) => (
          <div className="car-slide" key={im.src} {...(k !== i ? ({ inert: "" } as object) : {})}>
            <div className="media" style={{ aspectRatio: ratio }}>
              <button className="media-view" type="button" onClick={() => setOpen(true)} aria-label={`View ${im.alt} full screen`}>
                <img src={im.src} alt={im.alt} loading="lazy" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <button className="car-btn car-prev" type="button" aria-label="Previous image" onClick={() => go(i - 1)}>
            ‹
          </button>
          <button className="car-btn car-next" type="button" aria-label="Next image" onClick={() => go(i + 1)}>
            ›
          </button>
          <span className="car-count">
            {i + 1} / {n}
          </span>
          <div className="car-foot">
            <div className="car-dots">
              {images.map((im, k) => (
                <button key={im.src} type="button" aria-label={`Show image ${k + 1}`} aria-current={k === i} onClick={() => go(k)} />
              ))}
            </div>
          </div>
        </>
      )}
      {open && <Lightbox images={images} index={i} onIndex={setI} onClose={() => setOpen(false)} />}
    </div>
  );
}
