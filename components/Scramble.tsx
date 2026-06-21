"use client";

import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789·/<>";

/** Techy decode-in: letters scramble through random glyphs, then resolve. */
export function Scramble({ text, className = "", duration = 900 }: { text: string; className?: string; duration?: number }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(text);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      const reveal = p * text.length;
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (i < reveal || text[i] === " ") out += text[i];
        else out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      setDisplay(out);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);

  return <span className={className}>{display}</span>;
}
