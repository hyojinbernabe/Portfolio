"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/*
 * The hero's 3D keyboard: a procedural 60% board (no model file to load).
 * Once parked it types H-Y-O-J-I-N, Enter, on a loop: each press dips the
 * cap and flashes it brand green.
 */

const U = 1; // one key unit
const GAP = 0.1;

// 60% ANSI layout, widths in units. Letters are tagged so the typing loop
// can find them.
const ROWS: (number | [number, string])[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
  [1.5, 1, 1, 1, 1, 1, [1, "Y"], 1, [1, "I"], [1, "O"], 1, 1, 1, 1.5],
  [1.75, 1, 1, 1, 1, 1, [1, "H"], [1, "J"], 1, 1, 1, 1, [2.25, "ENTER"]],
  [2.25, 1, 1, 1, 1, 1, [1, "N"], 1, 1, 1, 1, 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];

const SEQUENCE = ["H", "Y", "O", "J", "I", "N", "ENTER"];
const KEY_MS = 240;
const LOOP_MS = SEQUENCE.length * KEY_MS + 2400;

type Key = { x: number; z: number; w: number; label?: string; accent: boolean };

function buildKeys(): Key[] {
  const keys: Key[] = [];
  ROWS.forEach((row, r) => {
    let x = 0;
    row.forEach((k, i) => {
      const [w, label] = typeof k === "number" ? [k, undefined] : k;
      // escape, enter and the space bar get the green caps
      const accent = (r === 0 && i === 0) || label === "ENTER" || w === 6.25;
      keys.push({ x: x + w / 2, z: r, w, label, accent });
      x += w;
    });
  });
  // center the board on the origin (15u wide, 5 rows)
  return keys.map((k) => ({ ...k, x: k.x - 7.5, z: k.z - 2 }));
}

const KEY_LIST = buildKeys();

function Board() {
  const keys = KEY_LIST;
  const capRefs = useRef<(THREE.Mesh | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  const brand = useMemo(() => new THREE.Color("#22c55e"), []);
  const dark = useMemo(() => new THREE.Color("#262626"), []);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 1000) % LOOP_MS;
    const active = t < SEQUENCE.length * KEY_MS ? SEQUENCE[Math.floor(t / KEY_MS)] : null;
    const phase = (t % KEY_MS) / KEY_MS;
    keys.forEach((k, i) => {
      const cap = capRefs.current[i];
      if (!cap) return;
      const pressed = k.label !== undefined && k.label === active;
      const dip = pressed ? Math.sin(Math.PI * Math.min(1, phase * 1.4)) : 0;
      cap.position.y = 0.42 - dip * 0.22;
      const mat = cap.material as THREE.MeshStandardMaterial;
      if (!k.accent) mat.color.lerpColors(dark, brand, dip);
      mat.emissiveIntensity = k.accent ? 0.35 + dip : dip * 1.2;
    });
  });

  return (
    <group ref={group}>
      {/* case */}
      <RoundedBox args={[15.9, 0.7, 5.9]} radius={0.3} smoothness={4} position={[0, -0.05, 0]}>
        <meshStandardMaterial color="#141414" roughness={0.55} metalness={0.3} />
      </RoundedBox>
      {/* RGB underglow strip */}
      <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15.4, 5.4]} />
        <meshBasicMaterial color="#22c55e" toneMapped={false} />
      </mesh>
      {keys.map((k, i) => (
        <RoundedBox
          key={i}
          ref={(m: THREE.Mesh | null) => {
            capRefs.current[i] = m;
          }}
          args={[k.w * U - GAP, 0.45, U - GAP]}
          radius={0.12}
          smoothness={3}
          position={[k.x, 0.42, k.z]}
        >
          <meshStandardMaterial
            color={k.accent ? "#22c55e" : "#262626"}
            emissive="#22c55e"
            emissiveIntensity={0}
            roughness={0.6}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

export default function KeyboardModel() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 6.5, 13], fov: 36 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 10, 6]} intensity={2.2} />
      <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#22c55e" />
      <pointLight position={[0, -1.5, 3]} intensity={25} color="#22c55e" distance={12} />
      <group rotation={[0, -0.12, 0]}>
        <Board />
      </group>
    </Canvas>
  );
}
