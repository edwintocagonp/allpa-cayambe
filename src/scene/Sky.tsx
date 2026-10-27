import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { VOLCANO } from "../lots";
import { ENV } from "./env";
import { cloudTexture } from "./textures";

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const SKY_FRAGMENT = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform vec3 uSunDir;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float e = d.y;
  vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.2, e));
  col = mix(col, uTop, smoothstep(0.18, 0.85, e));
  float s = max(dot(d, normalize(uSunDir)), 0.0);
  col += uGlow * (pow(s, 6.0) * 0.32 + pow(s, 64.0) * 0.5 + smoothstep(0.99935, 0.99965, s) * 1.6);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

function SkyDome() {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({ uTop: { value: ENV.skyTop }, uMid: { value: ENV.skyMid }, uHorizon: { value: ENV.skyHorizon }, uGlow: { value: ENV.sunGlow }, uSunDir: { value: ENV.sunDir } }),
    [],
  );
  useFrame(({ camera }) => mesh.current?.position.copy(camera.position));
  return (
    <mesh ref={mesh} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1000, 48, 24]} />
      <shaderMaterial vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} uniforms={uniforms} side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

const smooth = THREE.MathUtils.smoothstep;

function cayambeHeight(dx: number, dz: number) {
  const S = VOLCANO.summit;
  const a = Math.atan2(dz, dx);
  const re = Math.hypot(dx / 1.7, dz);
  const main = 0.6 * Math.exp(-Math.pow(re / 2500, 2.3)) + 0.4 * Math.exp(-Math.pow(re / 5600, 1.35));
  const north = (0.5 * Math.exp(-Math.pow(Math.hypot((dx + 2100) / 1.3, dz + 500) / 1300, 2.2)) + 0.36 * Math.exp(-Math.pow(Math.hypot(dx + 2100, dz + 500) / 3600, 1.4))) * 0.95;
  const east = (0.5 * Math.exp(-Math.pow(Math.hypot((dx - 2600) / 1.4, dz + 300) / 1400, 2.2)) + 0.34 * Math.exp(-Math.pow(Math.hypot(dx - 2600, dz + 300) / 3800, 1.4))) * 0.9;
  const body = Math.max(main, north, east);
  const gullies = 1 - 0.07 * Math.pow(Math.abs(Math.sin(a * 9 + re / 900)), 3) * smooth(re, 400, 5000);
  const noise = 1 + (0.035 * Math.sin(a * 17 + re / 400) + 0.02 * Math.sin(dx / 230 + dz / 310)) * smooth(re, 300, 1800);
  return S * body * gullies * noise - 60;
}

const ROCK = new THREE.Color("#7a6f64");
const DARK = new THREE.Color("#5f574f");
const PARAMO = new THREE.Color("#9a915c");
const MOOR = new THREE.Color("#7d8752");
const SNOW = new THREE.Color("#f6f7f9");
const ICE = new THREE.Color("#d9e4ee");

function volcanoGeometry() {
  const rings = 150;
  const segments = 240;
  const R = 9500;
  const positions: number[] = [];
  const colors: number[] = [];
  const index: number[] = [];
  const c = new THREE.Color();
  const S = VOLCANO.summit;
  for (let i = 0; i <= rings; i++) {
    const r = R * Math.pow(i / rings, 1.6);
    for (let j = 0; j < segments; j++) {
      const a = (j / segments) * Math.PI * 2;
      const dx = Math.cos(a) * r;
      const dz = Math.sin(a) * r;
      const h = cayambeHeight(dx, dz);
      positions.push(VOLCANO.x + dx, h, VOLCANO.z + dz);
      const t = h / S;
      const snowline = 0.6 + 0.035 * Math.sin(a * 13 + r / 500) + 0.025 * Math.sin(a * 31) + (dz > 0 ? 0.02 : -0.02);
      if (t > snowline) c.copy(SNOW).lerp(ICE, smooth(Math.sin(a * 23 + r / 260), 0.3, 1) * 0.6);
      else if (t > snowline - 0.03) c.copy(SNOW).lerp(ROCK, 0.6);
      else if (t > 0.42) c.copy(ROCK).lerp(DARK, 0.5 + 0.5 * Math.sin(a * 21 + r / 300));
      else if (t > 0.2) c.copy(PARAMO).lerp(ROCK, smooth(t, 0.3, 0.42));
      else c.copy(MOOR).lerp(PARAMO, smooth(t, 0.05, 0.2));
      colors.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * segments + j;
      const b = i * segments + ((j + 1) % segments);
      const c2 = (i + 1) * segments + j;
      const d = (i + 1) * segments + ((j + 1) % segments);
      index.push(a, b, c2, b, d, c2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function ridge(radius: number, from: number, to: number, steps: number, height: (b: number) => number) {
  const positions: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const b = from + ((to - from) * i) / steps;
    const x = Math.cos(b) * radius;
    const z = Math.sin(b) * radius;
    positions.push(x, -80, z, x, height(b), z);
    if (i < steps) {
      const a = i * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  return g;
}

const wave = (b: number) => Math.sin(b * 29) * 60 + Math.sin(b * 83 + 1.3) * 28 + Math.sin(b * 167 + 2.1) * 12;
const gauss = (b: number, c: number, w: number) => Math.exp(-(((b - c) / w) ** 2));
const VOLCANO_ANGLE = Math.atan2(VOLCANO.z, VOLCANO.x);

function Mountains() {
  const volcano = useMemo(volcanoGeometry, []);
  const far = useMemo(
    () =>
      ridge(15500, 0, Math.PI * 2, 720, (b) => {
        const dv = Math.abs(Math.atan2(Math.sin(b - VOLCANO_ANGLE), Math.cos(b - VOLCANO_ANGLE)));
        return (520 + 260 * Math.sin(b * 3 + 0.6) + 700 * gauss(b, Math.PI - 0.2, 0.22) + 900 * gauss(b, -2.05, 0.09) + wave(b)) * smooth(dv, 0.25, 0.6) + 120;
      }),
    [],
  );
  const material = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }), []);
  return (
    <group>
      <mesh geometry={volcano} material={material} />
      <mesh geometry={far} renderOrder={-6}>
        <meshBasicMaterial color="#9aa6b3" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

const CLOUDS: [number, number, number, number][] = [
  [VOLCANO.x - 3200, VOLCANO.z + 1800, 1250, 2600],
  [VOLCANO.x + 1800, VOLCANO.z + 2600, 1500, 3000],
  [VOLCANO.x - 400, VOLCANO.z + 3400, 1050, 2200],
  [VOLCANO.x + 4600, VOLCANO.z + 900, 1900, 3200],
  [-6800, -6200, 2300, 3400],
  [-9000, 2600, 2100, 3600],
  [6200, 7800, 2500, 3600],
  [9800, -2600, 2700, 3800],
];

function Clouds() {
  const texture = useMemo(() => cloudTexture(), []);
  return (
    <group>
      {CLOUDS.map(([x, z, y, s], i) => (
        <sprite key={i} position={[x, y, z]} scale={[s * 1.9, s * 0.55, 1]} renderOrder={-5}>
          <spriteMaterial map={texture} color="#fffaf2" opacity={0.88} transparent depthWrite={false} fog />
        </sprite>
      ))}
    </group>
  );
}

export function Sky() {
  return (
    <>
      <SkyDome />
      <Mountains />
      <Clouds />
    </>
  );
}
