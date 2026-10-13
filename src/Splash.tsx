import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const NAME = "Chandra Moorthy";
const CURTAIN: [number, number, number, number] = [0.76, 0, 0.24, 1];
const RISE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Props = { onDone: () => void };

export default function Splash({ onDone }: Props) {
  const reduce = useReducedMotion();
  const [pct, setPct] = useState(0);

  // Stop the page behind the splash from scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Count 0 to 100, then tell the app to remove the splash
  useEffect(() => {
    const total = reduce ? 250 : 1900;
    const start = performance.now();
    let raf = 0;
    let timer = 0;

    const tick = (now: number) => {
      const p = Math.min((now - start) / total, 1);
      setPct(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        timer = window.setTimeout(onDone, reduce ? 0 : 400);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [reduce, onDone]);

  return (
    <motion.div
      className="splash"
      role="status"
      aria-label="Loading portfolio"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.85, ease: CURTAIN }}
    >
      <div className="splash-center">
        <div className="splash-name" aria-hidden="true">
          {NAME.split("").map((ch, i) => (
            <span className="mask" key={i}>
              <motion.span
                style={{ display: "inline-block" }}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.045, ease: RISE }}
              >
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
            </span>
          ))}
        </div>
        <motion.p
          className="splash-role"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.95 }}
        >
          Full-stack engineer
        </motion.p>
      </div>

      <span className="splash-count" aria-hidden="true">
        {String(pct).padStart(3, "0")}
      </span>
      <div className="splash-bar" aria-hidden="true">
        <i style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </motion.div>
  );
}
