"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lerp-following custom cursor. The native cursor is hidden ONLY while this is
 * mounted and actively tracking (a JS class on <html>); it is restored on blur,
 * tab-hidden, pointer-leave, errors, and unmount — so a mouse user is never left
 * without a visible pointer. Skipped entirely on touch or reduced-motion.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return; // keep the native cursor

    const html = document.documentElement;
    let hidden = false;
    const hideNative = () => {
      if (!hidden) {
        html.classList.add("cursor-none");
        hidden = true;
      }
    };
    const showNative = () => {
      if (hidden) {
        html.classList.remove("cursor-none");
        hidden = false;
      }
    };

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    let hovered = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      hideNative(); // only hide once we're genuinely tracking the pointer
      target.x = e.clientX;
      target.y = e.clientY;
      if (dot.current) {
        dot.current.style.opacity = "1";
        dot.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };
    const overInteractive = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      hovered = !!el.closest?.('a, button, [data-cursor="hover"]');
    };
    const onVisibility = () => {
      if (document.hidden) showNative();
    };

    const loop = () => {
      ringPos.x += (target.x - ringPos.x) * 0.16;
      ringPos.y += (target.y - ringPos.y) * 0.16;
      if (ring.current) {
        const s = hovered ? 1.9 : 1;
        ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) scale(${s})`;
        ring.current.style.opacity = hovered ? "0.9" : "0.5";
      }
      raf = requestAnimationFrame(loop);
    };

    let cleanup = () => {};
    try {
      setActive(true);
      loop();
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseover", overInteractive);
      window.addEventListener("blur", showNative);
      document.addEventListener("visibilitychange", onVisibility);
      document.addEventListener("mouseleave", showNative);
      window.addEventListener("error", showNative); // restore on any JS error
      cleanup = () => {
        cancelAnimationFrame(raf);
        showNative();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseover", overInteractive);
        window.removeEventListener("blur", showNative);
        document.removeEventListener("visibilitychange", onVisibility);
        document.removeEventListener("mouseleave", showNative);
        window.removeEventListener("error", showNative);
      };
    } catch {
      showNative();
    }
    return () => cleanup();
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] hidden md:block" aria-hidden>
      <div ref={ring} className="absolute h-8 w-8 rounded-full border border-brand/70 opacity-0 transition-[opacity] duration-200" style={{ left: 0, top: 0 }} />
      <div ref={dot} className="absolute h-1.5 w-1.5 rounded-full bg-brand opacity-0" style={{ left: 0, top: 0 }} />
    </div>
  );
}
