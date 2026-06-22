"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Scene3D — the noomoagency.com MOVEMENT, copied directly: a camera that FLIES
// FORWARD through a field of elegant gold forms as you scroll. Because the forms
// sit off-axis at varying depths, flying past them makes them move radially — up,
// down, left, right — not just "down". Fixed full-screen, transparent, behind HTML.
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = { color: "#dca322", metalness: 0.55, roughness: 0.22, emissive: "#4a3208", emissiveIntensity: 0.16, envMapIntensity: 1.2 };

function scrollProgress() {
  if (typeof window === "undefined") return 0;
  const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
  return Math.min(1, Math.max(0, window.scrollY / max));
}

// Forms scattered off-axis and spread through depth — the camera passes each in turn.
const FORMS: { pos: [number, number, number]; r: number; d: number; sp: number }[] = [
  { pos: [2.6, 1.6, 0], r: 1.0, d: 0.28, sp: 1.4 },
  { pos: [-2.9, -1.4, -5], r: 1.3, d: 0.32, sp: 1.2 },
  { pos: [3.3, -2.1, -10], r: 0.9, d: 0.36, sp: 1.7 },
  { pos: [-2.4, 2.3, -15], r: 1.55, d: 0.26, sp: 1.1 },
  { pos: [1.8, -2.5, -21], r: 1.1, d: 0.34, sp: 1.5 },
  { pos: [-3.3, 0.7, -27], r: 1.4, d: 0.3, sp: 1.3 },
  { pos: [2.4, 2.2, -33], r: 1.25, d: 0.3, sp: 1.4 },
];

function Form({ pos, r, sp, reduce }: { pos: [number, number, number]; r: number; d: number; sp: number; reduce: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = (reduce ? 0 : state.clock.elapsedTime * 0.1) + pos[0];
    ref.current.rotation.x = (reduce ? 0 : state.clock.elapsedTime * 0.06) + pos[1];
  });
  // Keep distortion low and uniform so the forms read as deliberate, coherent
  // gold objects rather than amorphous blobs.
  return (
    <mesh ref={ref} position={pos}>
      <icosahedronGeometry args={[r, 32]} />
      <MeshDistortMaterial {...GOLD} distort={reduce ? 0 : 0.12} speed={sp * 0.6} />
    </mesh>
  );
}

// scroll drives the camera FORWARD through the field (with a little sway for life)
function Rig({ reduce }: { reduce: boolean }) {
  useFrame((state) => {
    const s = scrollProgress();
    const targetZ = 8 - s * 40; // fly forward, passing the whole field
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.06;
    state.camera.position.x += ((reduce ? 0 : Math.sin(s * Math.PI * 2.2) * 0.6) - state.camera.position.x) * 0.06;
    state.camera.position.y += ((reduce ? 0 : Math.cos(s * Math.PI * 1.8) * 0.4) - state.camera.position.y) * 0.06;
    state.camera.lookAt(0, 0, state.camera.position.z - 12);
  });
  return null;
}

export function Scene3D() {
  // Only mount the WebGL canvas on large screens with motion allowed. Phones and
  // reduced-motion users get the clean light backdrop instead — no GPU/battery
  // cost, and the desktop-tuned forms aren't squeezed into a narrow viewport.
  // This mirrors the landing's ≥1024px scroll-choreography gate.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const reduce = false; // when enabled, motion is allowed by definition
  if (!enabled) return <div aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <Canvas dpr={[1, 1.8]} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 8], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 6, 8]} intensity={2.2} />
        <directionalLight position={[-6, -2, 3]} intensity={0.8} color="#fff0cf" />
        {FORMS.map((f, i) => <Form key={i} {...f} reduce={reduce} />)}
        <Rig reduce={reduce} />
        <Suspense fallback={null}>
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={1.6} position={[0, 5, 7]} scale={[14, 6, 1]} color="#ffffff" />
            <Lightformer form="rect" intensity={0.9} position={[-6, 1, 5]} scale={[7, 8, 1]} color="#fff1d6" />
            <Lightformer form="ring" intensity={1.1} position={[5, 3, 6]} scale={3.5} color="#ffffff" />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}
