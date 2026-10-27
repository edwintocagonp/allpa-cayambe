import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { GATE, SITE, VOLCANO } from "../lots";

const PAD = 26;
const RADIUS = 9000;
const smooth = THREE.MathUtils.smoothstep;
const VOLCANO_ANGLE = Math.atan2(VOLCANO.z, VOLCANO.x);

function rng(seed: number) {
  return () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
}

function hash(a: number, b: number) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function siteDistance(x: number, z: number) {
  const dx = Math.max(SITE[0] - PAD - x, 0, x - SITE[2] - PAD);
  const dz = Math.max(SITE[1] - PAD - z, 0, z - SITE[3] - PAD);
  return Math.hypot(dx, dz);
}

export function heightAt(x: number, z: number) {
  const d = siteDistance(x, z);
  const blend = smooth(d, 0, 180);
  const r = Math.hypot(x, z);
  const hills = 15 * Math.sin(x / 280 + 1.2) * Math.sin(z / 330 + 0.4) + 8 * Math.sin(x / 120 + z / 160) + 3.2 * Math.sin(x / 47 - z / 61);
  const rise = Math.max(0, -z) * 0.028 + Math.max(0, -x) * 0.012;
  const angle = Math.atan2(z, x);
  const dv = Math.abs(Math.atan2(Math.sin(angle - VOLCANO_ANGLE), Math.cos(angle - VOLCANO_ANGLE)));
  const far = 460 * smooth(r, 3800, RADIUS) * (0.55 + 0.45 * Math.sin(angle * 3 + 1.1)) * smooth(dv, 0.3, 0.8);
  return -0.35 + blend * (hills + rise) + far;
}

const FIELD_TONES = ["#8b9a5a", "#9ba664", "#7f8f4f", "#b3a465", "#a49758", "#71844a", "#c0b07a", "#8d9f63", "#a7a76b", "#6d7d46"].map((h) => new THREE.Color(h));
const HEDGE = new THREE.Color("#4f6040");
const GRASS = new THREE.Color("#8f9d5d");

function fieldColor(x: number, z: number, out: THREE.Color) {
  const u = (x * 0.82 + z * 0.31) / 96;
  const v = (z * 0.9 - x * 0.26) / 72;
  const fu = u - Math.floor(u);
  const fv = v - Math.floor(v);
  out.copy(FIELD_TONES[Math.floor(hash(Math.floor(u), Math.floor(v)) * FIELD_TONES.length)]);
  const edge = Math.min(fu, 1 - fu, fv, 1 - fv);
  if (edge < 0.035) out.lerp(HEDGE, 0.55);
  const near = smooth(siteDistance(x, z), 10, 70);
  return out.lerp(GRASS, 1 - near);
}

function terrainGeometry() {
  const rings = 230;
  const segments = 340;
  const positions: number[] = [];
  const colors: number[] = [];
  const index: number[] = [];
  const c = new THREE.Color();
  positions.push(0, heightAt(0, 0), 0);
  fieldColor(0, 0, c);
  colors.push(c.r, c.g, c.b);
  for (let i = 1; i <= rings; i++) {
    const r = RADIUS * Math.pow(i / rings, 2.3);
    for (let j = 0; j < segments; j++) {
      const a = (j / segments) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      positions.push(x, heightAt(x, z), z);
      fieldColor(x, z, c);
      const haze = smooth(r, 2500, RADIUS) * 0.25;
      c.lerp(HEDGE, haze * 0.3);
      colors.push(c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < segments; j++) index.push(0, 1 + ((j + 1) % segments), 1 + j);
  for (let i = 1; i < rings; i++) {
    const a0 = 1 + (i - 1) * segments;
    const a1 = 1 + i * segments;
    for (let j = 0; j < segments; j++) {
      const j1 = (j + 1) % segments;
      index.push(a0 + j, a0 + j1, a1 + j, a0 + j1, a1 + j1, a1 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

function ribbon(points: [number, number][], width: number, lift = 0.4) {
  const positions: number[] = [];
  const index: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    const [px, pz] = points[Math.max(0, i - 1)];
    const [nx, nz] = points[Math.min(points.length - 1, i + 1)];
    const dx = nx - px;
    const dz = nz - pz;
    const len = Math.hypot(dx, dz) || 1;
    const ox = (-dz / len) * (width / 2);
    const oz = (dx / len) * (width / 2);
    positions.push(x + ox, heightAt(x + ox, z + oz) + lift, z + oz, x - ox, heightAt(x - ox, z - oz) + lift, z - oz);
    if (i < points.length - 1) {
      const a = i * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

const panamericana = (z: number) => -860 + Math.sin(z / 900) * 140 + Math.sin(z / 2300) * 260;

function roads() {
  const main: [number, number][] = [];
  for (let z = -8200; z <= 8200; z += 40) main.push([panamericana(z), z]);
  const access: [number, number][] = [];
  for (let z = GATE.z + 2; z <= 420; z += 10) access.push([0, z]);
  const join = panamericana(430);
  for (let x = -10; x >= join; x -= 20) access.push([x, 430 + Math.sin(x / 140) * 18]);
  const lane: [number, number][] = [];
  for (let x = 160; x <= 2600; x += 30) lane.push([x, 430 + Math.sin(x / 220) * 40 - (x - 160) * 0.05]);
  return { main: ribbon(main, 16, 0.6), access: ribbon(access, 9, 0.5), lane: ribbon(lane, 6, 0.4) };
}

function Instances({ geometry, material, items }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: { m: THREE.Matrix4; c?: THREE.Color }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m);
      if (it.c) mesh.setColorAt(i, it.c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow receiveShadow frustumCulled={false} />;
}

const tmp = new THREE.Object3D();
const matrix = (x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) => {
  tmp.position.set(x, y, z);
  tmp.rotation.set(0, ry, 0);
  tmp.scale.set(sx, sy, sz);
  tmp.updateMatrix();
  return tmp.matrix.clone();
};

function greenhouses() {
  const random = rng(21);
  const clusters: [number, number, number][] = [
    [-520, 260, 0.2],
    [520, -380, -0.15],
    [-1200, -760, 0.35],
    [1300, 620, 0.1],
    [260, 1250, -0.3],
    [-1700, 900, 0.05],
    [1900, -1500, 0.25],
    [-300, -1700, -0.1],
  ];
  const items: { m: THREE.Matrix4 }[] = [];
  for (const [cx, cz, ry] of clusters) {
    const cols = 2 + Math.floor(random() * 2);
    const rows = 7 + Math.floor(random() * 6);
    for (let a = 0; a < cols; a++) {
      for (let b = 0; b < rows; b++) {
        if (random() < 0.08) continue;
        const lx = (a - cols / 2) * 58;
        const lz = (b - rows / 2) * 9.5;
        const x = cx + lx * Math.cos(ry) - lz * Math.sin(ry);
        const z = cz + lx * Math.sin(ry) + lz * Math.cos(ry);
        items.push({ m: matrix(x, heightAt(x, z), z, 1, 1, 1, -ry) });
      }
    }
  }
  return items;
}

function eucalyptus() {
  const random = rng(8);
  const items: { m: THREE.Matrix4; c: THREE.Color }[] = [];
  const tones = ["#4e6b57", "#58735c", "#465f50", "#61785e"].map((h) => new THREE.Color(h));
  const line = (x0: number, z0: number, x1: number, z1: number, spacing: number) => {
    const n = Math.floor(Math.hypot(x1 - x0, z1 - z0) / spacing);
    for (let i = 0; i <= n; i++) {
      if (random() < 0.12) continue;
      const t = i / n;
      const x = x0 + (x1 - x0) * t + (random() - 0.5) * 3;
      const z = z0 + (z1 - z0) * t + (random() - 0.5) * 3;
      if (siteDistance(x, z) < 8) continue;
      const h = 9 + random() * 13;
      items.push({ m: matrix(x, heightAt(x, z) + h * 0.55, z, 2 + random() * 1.8, h * 0.48, 2 + random() * 1.8, random() * 6), c: tones[Math.floor(random() * tones.length)] });
    }
  };
  line(SITE[0] - 14, SITE[1] - 14, SITE[2] + 14, SITE[1] - 14, 7);
  line(SITE[0] - 46, SITE[1] - 14, SITE[0] - 46, SITE[3] + 40, 7);
  line(SITE[2] + 14, SITE[1] - 14, SITE[2] + 14, SITE[3] + 14, 7);
  line(-600, 120, -600, -900, 8);
  line(-300, -400, 900, -260, 8);
  line(420, 180, 420, 1100, 9);
  line(-1400, 300, -700, 380, 9);
  line(200, -900, 1200, -1150, 9);
  line(-900, -300, -1800, -420, 9);
  line(600, 820, 1800, 760, 9);
  for (let k = 0; k < 18; k++) {
    const cx = (random() * 2 - 1) * 2600;
    const cz = (random() * 2 - 1) * 2600;
    if (siteDistance(cx, cz) < 260) continue;
    for (let i = 0; i < 26; i++) {
      const x = cx + (random() - 0.5) * 120;
      const z = cz + (random() - 0.5) * 90;
      const h = 8 + random() * 14;
      const w = 2.4 + random() * 2.4;
      items.push({ m: matrix(x, heightAt(x, z) + h * 0.55, z, w, h * 0.46, w * (0.8 + random() * 0.4), random() * 6), c: tones[Math.floor(random() * tones.length)] });
    }
  }
  return items;
}

function farmhouses() {
  const random = rng(31);
  const walls: { m: THREE.Matrix4; c: THREE.Color }[] = [];
  const roofs: { m: THREE.Matrix4; c: THREE.Color }[] = [];
  const wallTones = ["#efe8dc", "#e7d8bf", "#f3efe6", "#d9c3a2", "#e4cdb6"].map((h) => new THREE.Color(h));
  const roofTones = ["#a6512e", "#8f4a30", "#9a9a95", "#b35f39"].map((h) => new THREE.Color(h));
  for (let i = 0; i < 170; i++) {
    const nearRoad = random() < 0.55;
    const z = nearRoad ? (random() * 2 - 1) * 4000 : (random() * 2 - 1) * 3200;
    const x = nearRoad ? panamericana(z) + (random() < 0.5 ? -1 : 1) * (22 + random() * 90) : (random() * 2 - 1) * 3200;
    if (siteDistance(x, z) < 200) continue;
    const w = 7 + random() * 6;
    const d = 6 + random() * 4;
    const h = 2.8 + (random() < 0.3 ? 2.8 : 0);
    const ry = random() * Math.PI;
    const y = heightAt(x, z);
    walls.push({ m: matrix(x, y + h / 2, z, w, h, d, ry), c: wallTones[Math.floor(random() * wallTones.length)] });
    roofs.push({ m: matrix(x, y + h, z, w * 1.08, 1.8, d * 1.1, ry), c: roofTones[Math.floor(random() * roofTones.length)] });
  }
  return { walls, roofs };
}

function prism() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 1);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  g.rotateY(Math.PI / 2);
  return g;
}

export function Terrain() {
  const ground = useMemo(terrainGeometry, []);
  const road = useMemo(roads, []);
  const houses = useMemo(farmhouses, []);
  const gh = useMemo(() => greenhouses(), []);
  const trees = useMemo(() => eucalyptus(), []);
  const geo = useMemo(
    () => ({
      vault: (() => {
        const g = new THREE.CylinderGeometry(4.2, 4.2, 52, 10, 1, false, 0, Math.PI);
        g.rotateZ(Math.PI / 2);
        g.scale(1, 0.85, 1);
        return g;
      })(),
      tree: new THREE.IcosahedronGeometry(1, 0),
      box: new THREE.BoxGeometry(1, 1, 1),
      roof: prism(),
    }),
    [],
  );
  const mat = useMemo(
    () => ({
      ground: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
      road: new THREE.MeshStandardMaterial({ color: "#5d5955", roughness: 0.95 }),
      gravel: new THREE.MeshStandardMaterial({ color: "#a4927a", roughness: 1 }),
      vault: new THREE.MeshStandardMaterial({ color: "#eef2f0", roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.92 }),
      tree: new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }),
      wall: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
      roof: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
    }),
    [],
  );
  return (
    <group>
      <mesh geometry={ground} material={mat.ground} receiveShadow />
      <mesh geometry={road.main} material={mat.road} receiveShadow />
      <mesh geometry={road.access} material={mat.road} receiveShadow />
      <mesh geometry={road.lane} material={mat.gravel} receiveShadow />
      <Instances geometry={geo.vault} material={mat.vault} items={gh} />
      <Instances geometry={geo.tree} material={mat.tree} items={trees} />
      <Instances geometry={geo.box} material={mat.wall} items={houses.walls} />
      <Instances geometry={geo.roof} material={mat.roof} items={houses.roofs} />
    </group>
  );
}

export { Instances, matrix, prism };
