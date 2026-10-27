import { useEffect, useRef } from "react";
import type { ProjectImage } from "@my-portfolio/content";

type Props = { images: ProjectImage[]; index: number; onIndex: (i: number) => void; onClose: () => void };

/** Full-screen image viewer. Esc closes, arrows move, Tab stays inside, focus returns to the opener. */
export default function Lightbox({ images, index, onIndex, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const n = images.length;
  const img = images[index];
  const go = (d: number) => onIndex((index + d + n) % n);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && n > 1) go(1);
      else if (e.key === "ArrowLeft" && n > 1) go(-1);
      else if (e.key === "Tab" && root.current) {
        const f = [...root.current.querySelectorAll<HTMLElement>("button")];
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="lb"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {n > 1 ? (
        <button className="lb-btn lb-prev" type="button" aria-label="Previous image" onClick={() => go(-1)}>
          ‹
        </button>
      ) : (
        <span />
      )}
      <figure>
        <img src={img.src} alt={img.alt} />
        <figcaption>
          {img.alt}
          {n > 1 ? ` · ${index + 1} of ${n}` : ""}
        </figcaption>
      </figure>
      {n > 1 ? (
        <button className="lb-btn lb-next" type="button" aria-label="Next image" onClick={() => go(1)}>
          ›
        </button>
      ) : (
        <span />
      )}
      <button ref={closeBtn} className="lb-btn lb-x" type="button" aria-label="Close viewer" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
