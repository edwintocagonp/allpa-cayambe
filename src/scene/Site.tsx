import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { GATE, LOTS, LOT_BY_ID, PARK, SITE, STREETS, lotCenter, matches, type Lot, type Rect } from "../lots";
import { Instances, matrix, prism } from "./Terrain";
import { STATUS_COLOR, stage, type SceneView } from "./state";
import { courtTexture, paverTexture, signTexture } from "./textures";

const TOP = 0.18;

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function slab([x0, z0, x1, z1]: Rect, y0: number, y1: number) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

const grow = ([x0, z0, x1, z1]: Rect, d: number): Rect => [x0 - d, z0 - d, x1 + d, z1 + d];

function blockRects() {
  const map = new Map<string, Rect>();
  for (const lot of LOTS) {
    const r = map.get(lot.block);
    map.set(lot.block, r ? [Math.min(r[0], lot.rect[0]), Math.min(r[1], lot.rect[1]), Math.max(r[2], lot.rect[2]), Math.max(r[3], lot.rect[3])] : [...lot.rect]);
  }
  return [...map.values()];
}

function Ground() {
  const paver = useMemo(() => {
    const t = paverTexture();
    t.repeat.set((SITE[2] - SITE[0]) / 4, (SITE[3] - SITE[1] + 8) / 4);
    return t;
  }, []);
  const platforms = useMemo(() => {
    const parts = blockRects().map((r) => slab(grow(r, 1.6), 0, TOP));
    parts.push(slab(grow(PARK, 1.6), 0, TOP));
    parts.push(slab([-1.7, 8, 1.7, 108], 0, TOP + 0.05));
    return mergeGeometries(parts);
  }, []);
  const median = useMemo(() => slab([-1.4, 8.3, 1.4, 107.7], TOP + 0.05, TOP + 0.08), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 4]} receiveShadow>
        <planeGeometry args={[SITE[2] - SITE[0], SITE[3] - SITE[1] + 8]} />
        <meshStandardMaterial map={paver} roughness={0.95} />
      </mesh>
      <mesh geometry={platforms} receiveShadow>
        <meshStandardMaterial color="#d8d0c2" roughness={0.9} />
      </mesh>
      <mesh geometry={median} receiveShadow>
        <meshStandardMaterial color="#6f8a4a" roughness={1} />
      </mesh>
    </group>
  );
}

const GRASS = ["#8e9c58", "#97a35f", "#869552", "#9ea865", "#a39d62", "#8a9a5c"].map((h) => new THREE.Color(h));
const FADED = new THREE.Color("#cfc6b6");
const PICKED = new THREE.Color("#c0532d");
const LAWN = new THREE.Color("#7f9a50");

function lotColor(lot: Lot, view: SceneView, hover: string | null, out: THREE.Color) {
  if (view.vista) return out.copy(GRASS[Math.floor(hash(lot.id) * GRASS.length)]);
  if (lot.id === view.lot) return out.copy(PICKED);
  if (view.mode === "explore") {
    out.set(STATUS_COLOR[lot.status]);
    if (!matches(lot, view.filter)) out.lerp(FADED, 0.78);
    if (lot.id === hover) out.lerp(new THREE.Color("#ffffff"), 0.35);
    return out;
  }
  if (view.future) return out.copy(LAWN).lerp(GRASS[Math.floor(hash(lot.id) * GRASS.length)], 0.4);
  out.copy(GRASS[Math.floor(hash(lot.id) * GRASS.length)]);
  if (lot.id === hover) out.lerp(new THREE.Color("#ffffff"), 0.25);
  return out;
}

function Lots({ view, onLot }: { view: SceneView; onLot: (id: string) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const [hover, setHover] = useState<string | null>(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 }), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    LOTS.forEach((lot, i) => {
      const [x0, z0, x1, z1] = lot.rect;
      mesh.setMatrixAt(i, matrix((x0 + x1) / 2, TOP + 0.03, (z0 + z1) / 2, x1 - x0 - 0.36, 0.06, z1 - z0 - 0.36));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const c = new THREE.Color();
    LOTS.forEach((lot, i) => mesh.setColorAt(i, lotColor(lot, view, hover, c)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [view, hover]);
  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.instanceId === undefined ? null : LOTS[e.instanceId]?.id ?? null);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, LOTS.length]}
      receiveShadow
      onPointerMove={(e) => {
        e.stopPropagation();
        const id = pick(e);
        if (id !== hover) {
          setHover(id);
          stage.hover = id;
          document.body.style.cursor = id ? "pointer" : "";
        }
      }}
      onPointerOut={() => {
        setHover(null);
        stage.hover = null;
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        const id = pick(e);
        if (id && Math.abs(performance.now() / 1000 - stage.touched) > 0.25) onLot(id);
      }}
    />
  );
}

function Stakes({ hidden }: { hidden: boolean }) {
  const items = useMemo(() => {
    const out: { m: THREE.Matrix4 }[] = [];
    for (const lot of LOTS) {
      const [x0, z0, x1, z1] = lot.rect;
      const front = lot.faces === "norte" ? z0 + 0.3 : z1 - 0.3;
      const back = lot.faces === "norte" ? z1 - 0.3 : z0 + 0.3;
      for (const [x, z] of [
        [x0 + 0.3, front],
        [x1 - 0.3, front],
        [x0 + 0.3, back],
      ])
        out.push({ m: matrix(x, TOP + 0.3, z, 0.14, 0.6, 0.14) });
    }
    return out;
  }, []);
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f3efe7", roughness: 0.7 }), []);
  return (
    <group visible={!hidden}>
      <Instances geometry={geometry} material={material} items={items} />
    </group>
  );
}

function Perimeter() {
  const wall = useMemo(() => {
    const [x0, z0, x1, z1] = SITE;
    const t = 0.3;
    const h = 2.2;
    const parts = [
      slab([x0, z0 - t, x1, z0], 0, h),
      slab([x0 - t, z0 - t, x0, z1 + t], 0, h),
      slab([x1, z0 - t, x1 + t, z1 + t], 0, h),
      slab([x0, z1, GATE.x - 10, z1 + t], 0, h),
      slab([GATE.x + 10, z1, x1, z1 + t], 0, h),
    ];
    for (let x = x0; x <= x1; x += 12) {
      parts.push(slab([x - 0.3, z0 - 0.5, x + 0.3, z0 + 0.2], 0, h + 0.3));
      if (Math.abs(x - GATE.x) > 11) parts.push(slab([x - 0.3, z1 - 0.2, x + 0.3, z1 + 0.5], 0, h + 0.3));
    }
    for (let z = z0; z <= z1; z += 12) {
      parts.push(slab([x0 - 0.5, z - 0.3, x0 + 0.2, z + 0.3], 0, h + 0.3));
      parts.push(slab([x1 - 0.2, z - 0.3, x1 + 0.5, z + 0.3], 0, h + 0.3));
    }
    return mergeGeometries(parts);
  }, []);
  return (
    <mesh geometry={wall} castShadow receiveShadow>
      <meshStandardMaterial color="#c8b69a" roughness={0.95} />
    </mesh>
  );
}

function Gate() {
  const sign = useMemo(() => signTexture("ALLPA"), []);
  const stone = useMemo(() => {
    const parts = [slab([-10, GATE.z - 0.8, -7.6, GATE.z + 1.6], 0, 5.2), slab([7.6, GATE.z - 0.8, 10, GATE.z + 1.6], 0, 5.2), slab([-10.4, GATE.z - 1, 10.4, GATE.z + 1.8], 5.2, 5.6)];
    parts.push(slab([12, GATE.z - 7, 16.5, GATE.z - 2.5], 0, 3));
    return mergeGeometries(parts);
  }, []);
  const guardRoof = useMemo(() => {
    const g = prism();
    g.scale(5.4, 1.4, 5.4);
    g.translate(14.25, 3, GATE.z - 4.75);
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={stone} castShadow receiveShadow>
        <meshStandardMaterial color="#8c7a66" roughness={0.9} />
      </mesh>
      <mesh geometry={guardRoof} castShadow>
        <meshStandardMaterial color="#a9502c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.4, GATE.z + 1.62]}>
        <planeGeometry args={[9, 2.1]} />
        <meshStandardMaterial map={sign} roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.4, GATE.z - 0.82]} rotation-y={Math.PI}>
        <planeGeometry args={[9, 2.1]} />
        <meshStandardMaterial map={sign} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.1, GATE.z + 0.4]}>
        <boxGeometry args={[15.2, 2.2, 0.12]} />
        <meshStandardMaterial color="#2a2f3a" metalness={0.5} roughness={0.5} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Park() {
  const court = useMemo(() => courtTexture(), []);
  const [px0, pz0, px1, pz1] = PARK;
  const paths = useMemo(() => {
    const y0 = TOP;
    const y1 = TOP + 0.07;
    return mergeGeometries([
      slab([px0, -20.5, px1, -17.5], y0, y1),
      slab([-1.6, pz0, 1.6, pz1], y0, y1),
      slab([px0 + 2, pz0 + 2, px0 + 5, pz1 - 2], y0, y1),
      slab([px1 - 5, pz0 + 2, px1 - 2, pz1 - 2], y0, y1),
    ]);
  }, [px0, pz0, px1, pz1]);
  const hall = useMemo(() => mergeGeometries([slab([-62, -14, -36, 2], TOP, TOP + 4.4), slab([-63, -15, -35, 3], TOP + 4.4, TOP + 4.7)]), []);
  const hallRoof = useMemo(() => {
    const g = prism();
    g.scale(29, 2.6, 19);
    g.translate(-49, TOP + 4.7, -6);
    return g;
  }, []);
  const gardens = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) parts.push(slab([-62 + i * 4.2, -41, -59.2 + i * 4.2, -25], TOP, TOP + 0.22));
    return mergeGeometries(parts);
  }, []);
  const play = useMemo(
    () =>
      mergeGeometries([
        slab([30, -40, 31, -37], TOP, TOP + 2.6),
        slab([40, -40, 41, -37], TOP, TOP + 2.6),
        slab([30, -39, 41, -38], TOP + 2.4, TOP + 2.6),
        slab([45, -41, 55, -33], TOP, TOP + 0.06),
        slab([33, -31, 35, -25], TOP, TOP + 1.6),
      ]),
    [],
  );
  return (
    <group>
      <mesh position={[0, TOP + 0.03, (pz0 + pz1) / 2]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[px1 - px0, pz1 - pz0]} />
        <meshStandardMaterial color="#7f9a4c" roughness={1} />
      </mesh>
      <mesh geometry={paths} receiveShadow>
        <meshStandardMaterial color="#e3d6bf" roughness={0.95} />
      </mesh>
      <mesh position={[42, TOP + 0.09, -8]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[42, 21]} />
        <meshStandardMaterial map={court} roughness={0.9} />
      </mesh>
      <mesh geometry={hall} castShadow receiveShadow>
        <meshStandardMaterial color="#efe6d6" roughness={0.85} />
      </mesh>
      <mesh geometry={hallRoof} castShadow>
        <meshStandardMaterial color="#b0552f" roughness={0.75} />
      </mesh>
      <mesh position={[-49, TOP + 1.9, 2.05]}>
        <planeGeometry args={[18, 2.6]} />
        <meshStandardMaterial color="#2c3a4f" metalness={0.4} roughness={0.25} />
      </mesh>
      <mesh geometry={gardens} receiveShadow>
        <meshStandardMaterial color="#6b5a43" roughness={1} />
      </mesh>
      <mesh geometry={play} castShadow>
        <meshStandardMaterial color="#d9a441" roughness={0.6} />
      </mesh>
    </group>
  );
}

function trees() {
  const out: { x: number; z: number; s: number }[] = [];
  const add = (x: number, z: number, s = 1) => out.push({ x, z, s: s * (0.85 + hash(`${x},${z}`) * 0.4) });
  for (let z = 16; z <= 104; z += 11) add(0, z, 0.9);
  const [px0, pz0, px1, pz1] = PARK;
  for (let x = px0 + 4; x <= px1 - 4; x += 10) {
    add(x, pz0 + 3.5);
    add(x, pz1 - 3.5);
  }
  for (let z = pz0 + 12; z <= pz1 - 10; z += 10) {
    add(px0 + 3.5, z);
    add(px1 - 3.5, z);
  }
  for (const [x, z] of [
    [-20, -32],
    [-12, -6],
    [14, -30],
    [20, -2],
    [-28, -24],
    [8, -12],
  ])
    add(x, z, 1.2);
  return out;
}

function Trees({ future }: { future: boolean }) {
  const list = useMemo(trees, []);
  const crown = useRef<THREE.InstancedMesh>(null);
  const trunk = useRef<THREE.InstancedMesh>(null);
  const grow = useRef(future ? 1 : 0);
  const geo = useMemo(() => ({ crown: new THREE.IcosahedronGeometry(1, 1), trunk: new THREE.CylinderGeometry(0.12, 0.18, 1, 6) }), []);
  const mat = useMemo(() => ({ crown: new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), trunk: new THREE.MeshStandardMaterial({ color: "#6b5440", roughness: 1 }) }), []);
  useLayoutEffect(() => {
    const tones = ["#5d7d44", "#6b8a4a", "#557a49", "#73904f"].map((h) => new THREE.Color(h));
    list.forEach((t, i) => crown.current?.setColorAt(i, tones[Math.floor(hash(`${t.x}${t.z}`) * tones.length)]));
    if (crown.current?.instanceColor) crown.current.instanceColor.needsUpdate = true;
  }, [list]);
  useFrame((_, dt) => {
    const target = future ? 1 : 0;
    if (Math.abs(grow.current - target) < 0.001 && crown.current?.userData.done === target) return;
    grow.current += (target - grow.current) * Math.min(1, dt * 2.4);
    const k = 0.55 + grow.current * 0.45;
    list.forEach((t, i) => {
      const h = 6.5 * t.s * k;
      crown.current?.setMatrixAt(i, matrix(t.x, TOP + h * 0.62, t.z, 2.4 * t.s * k, 2.6 * t.s * k, 2.4 * t.s * k));
      trunk.current?.setMatrixAt(i, matrix(t.x, TOP + h * 0.25, t.z, 1, h * 0.5, 1));
    });
    if (crown.current) {
      crown.current.instanceMatrix.needsUpdate = true;
      crown.current.computeBoundingSphere();
      crown.current.userData.done = Math.abs(grow.current - target) < 0.001 ? target : -1;
    }
    if (trunk.current) trunk.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={crown} args={[geo.crown, mat.crown, list.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={trunk} args={[geo.trunk, mat.trunk, list.length]} castShadow frustumCulled={false} />
    </group>
  );
}

function Lamps() {
  const items = useMemo(() => {
    const out: { m: THREE.Matrix4 }[] = [];
    for (let z = 20; z <= 104; z += 22) {
      out.push({ m: matrix(-6, 0, z, 1, 1, 1) });
      out.push({ m: matrix(6, 0, z, 1, 1, 1, Math.PI) });
    }
    for (const s of STREETS) {
      if (s.kind !== "calle") continue;
      const [x0, z0, x1, z1] = s.rect;
      const horizontal = x1 - x0 > z1 - z0;
      if (horizontal) for (let x = x0 + 14; x < x1 - 10; x += 34) out.push({ m: matrix(x, 0, z0 + 0.6, 1, 1, 1, -Math.PI / 2) });
      else for (let z = z0 + 14; z < z1 - 10; z += 34) out.push({ m: matrix(x0 + 0.6, 0, z, 1, 1, 1) });
    }
    return out;
  }, []);
  const geometry = useMemo(() => {
    const pole = new THREE.CylinderGeometry(0.07, 0.1, 6, 6);
    pole.translate(0, 3, 0);
    const arm = new THREE.BoxGeometry(1.4, 0.12, 0.2);
    arm.translate(0.6, 6, 0);
    return mergeGeometries([pole, arm]);
  }, []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b3f47", metalness: 0.5, roughness: 0.5 }), []);
  return <Instances geometry={geometry} material={material} items={items} />;
}

const WALLS = ["#f2ece2", "#efe2cc", "#e9d6bd", "#f6f3ee", "#dfc8a8", "#e6d9cf", "#d8b892"].map((h) => new THREE.Color(h));
const ROOFS = ["#a9502c", "#93472b", "#b9623a", "#8d8a86", "#7f4b35"].map((h) => new THREE.Color(h));

function houseOf(lot: Lot) {
  const occupied = lot.status !== "disponible" || hash(`${lot.id}h`) < 0.36;
  if (!occupied) return null;
  const [x0, z0, x1, z1] = lot.rect;
  const w = Math.min(lot.frente - 2.6, 11);
  const d = Math.min(lot.fondo - 9, 11 + hash(`${lot.id}d`) * 3);
  const setback = 3.2;
  const cz = lot.faces === "norte" ? z0 + setback + d / 2 : z1 - setback - d / 2;
  const cx = (x0 + x1) / 2 + (hash(`${lot.id}x`) - 0.5) * (lot.frente - 2.6 - w);
  const floors = hash(`${lot.id}f`) < 0.72 ? 2 : 1;
  const gable = hash(`${lot.id}r`) < 0.62;
  return { cx, cz, w, d, h: floors * 2.8, gable, wall: WALLS[Math.floor(hash(`${lot.id}w`) * WALLS.length)], roof: ROOFS[Math.floor(hash(`${lot.id}c`) * ROOFS.length)], yard: lot.faces === "norte" ? z1 - 4 : z0 + 4 };
}

function Houses({ future }: { future: boolean }) {
  const list = useMemo(() => LOTS.map(houseOf).filter((h): h is NonNullable<typeof h> => h !== null), []);
  const walls = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);
  const slabs = useRef<THREE.InstancedMesh>(null);
  const yard = useRef<THREE.InstancedMesh>(null);
  const t = useRef(future ? 1 : 0);
  const geo = useMemo(() => ({ box: new THREE.BoxGeometry(1, 1, 1), roof: prism(), tree: new THREE.IcosahedronGeometry(1, 1) }), []);
  const mat = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
      roof: new THREE.MeshStandardMaterial({ roughness: 0.75 }),
      slab: new THREE.MeshStandardMaterial({ color: "#d9d2c6", roughness: 0.8 }),
      tree: new THREE.MeshStandardMaterial({ color: "#678a48", roughness: 0.95, flatShading: true }),
    }),
    [],
  );
  useLayoutEffect(() => {
    list.forEach((h, i) => {
      walls.current?.setColorAt(i, h.wall);
      roofs.current?.setColorAt(i, h.gable ? h.roof : new THREE.Color("#cfc7ba"));
    });
    if (walls.current?.instanceColor) walls.current.instanceColor.needsUpdate = true;
    if (roofs.current?.instanceColor) roofs.current.instanceColor.needsUpdate = true;
  }, [list]);
  useFrame((_, dt) => {
    const target = future ? 1 : 0;
    if (Math.abs(t.current - target) < 0.0005 && walls.current?.userData.done === target) return;
    t.current += (target - t.current) * Math.min(1, dt * 2.6);
    const k = Math.max(0.0001, t.current);
    list.forEach((h, i) => {
      const rise = THREE.MathUtils.clamp(k * 1.25 - (i % 9) * 0.03, 0.0001, 1);
      walls.current?.setMatrixAt(i, matrix(h.cx, TOP + (h.h * rise) / 2, h.cz, h.w, h.h * rise, h.d));
      if (h.gable) roofs.current?.setMatrixAt(i, matrix(h.cx, TOP + h.h * rise, h.cz, h.w + 0.6, 2.2 * rise, h.d + 0.6));
      else roofs.current?.setMatrixAt(i, matrix(h.cx, TOP + h.h * rise + 0.25 * rise, h.cz, h.w + 0.2, 0.5 * rise, h.d + 0.2));
      slabs.current?.setMatrixAt(i, matrix(h.cx, TOP + 0.05, h.cz, h.w + 1.4, 0.1, h.d + 1.4));
      yard.current?.setMatrixAt(i, matrix(h.cx + h.w * 0.25, TOP + 2.6 * rise, h.yard, 1.7 * rise, 2 * rise, 1.7 * rise));
    });
    for (const m of [walls, roofs, slabs, yard]) {
      if (!m.current) continue;
      m.current.instanceMatrix.needsUpdate = true;
      m.current.visible = t.current > 0.002;
      m.current.computeBoundingSphere();
    }
    if (walls.current) walls.current.userData.done = Math.abs(t.current - target) < 0.0005 ? target : -1;
  });
  return (
    <group>
      <instancedMesh ref={walls} args={[geo.box, mat.wall, list.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={roofs} args={[geo.roof, mat.roof, list.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={slabs} args={[geo.box, mat.slab, list.length]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={yard} args={[geo.tree, mat.tree, list.length]} castShadow frustumCulled={false} />
    </group>
  );
}

function Selection({ id }: { id: string | null }) {
  const pin = useRef<THREE.Group>(null);
  const lot = id ? LOT_BY_ID.get(id) : undefined;
  const outline = useMemo(() => {
    if (!lot) return null;
    const [x0, z0, x1, z1] = lot.rect;
    const pts = [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
      [x0, z0],
    ].map(([x, z]) => new THREE.Vector3(x, TOP + 0.12, z));
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: "#fff4e6" }));
  }, [lot]);
  useFrame(({ clock }) => {
    if (pin.current) pin.current.position.y = TOP + 7 + Math.sin(clock.elapsedTime * 2.2) * 0.5;
  });
  if (!lot || !outline) return null;
  const [cx, cz] = lotCenter(lot);
  return (
    <group>
      <primitive object={outline} />
      <group ref={pin} position={[cx, TOP + 7, cz]}>
        <mesh position={[0, -2.6, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 5.2, 6]} />
          <meshBasicMaterial color="#c0532d" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.9, 20, 12]} />
          <meshStandardMaterial color="#c0532d" emissive="#c0532d" emissiveIntensity={0.4} />
        </mesh>
        <Html center position={[0, 2.2, 0]} className="pin" zIndexRange={[20, 0]}>
          <span>{lot.id}</span>
          <small>{lot.area} m²</small>
        </Html>
      </group>
    </group>
  );
}

export function Site({ view, onLot }: { view: SceneView; onLot: (id: string) => void }) {
  return (
    <group>
      <Ground />
      <Lots view={view} onLot={onLot} />
      <Stakes hidden={view.future} />
      <Perimeter />
      <Gate />
      <Park />
      <Trees future={view.future} />
      <Lamps />
      <Houses future={view.future} />
      <Selection id={view.vista ? null : view.lot} />
    </group>
  );
}
