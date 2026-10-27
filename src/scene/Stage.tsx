import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, TiltShift2, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";

import { LOT_BY_ID, VOLCANO, lotCenter } from "../lots";
import { ENV } from "./env";
import { Rig, type Shot } from "./Rig";
import { Site } from "./Site";
import { Sky } from "./Sky";
import { HERO_AZ, stage, type Insets, type SceneView } from "./state";
import { Terrain } from "./Terrain";

function Atmosphere() {
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    scene.fog = new THREE.FogExp2(ENV.fog.getHex(), ENV.fogDensity);
    scene.environmentIntensity = 0.85;
  }, [scene]);
  return null;
}

function Lights({ small }: { small: boolean }) {
  const sun = useMemo(() => ENV.sunDir.clone().multiplyScalar(520), []);
  return (
    <>
      <hemisphereLight args={[ENV.hemiSky, ENV.hemiGround, ENV.hemiIntensity]} />
      <directionalLight
        position={sun}
        color={ENV.sunColor}
        intensity={ENV.sunIntensity}
        castShadow
        shadow-mapSize={small ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-190}
        shadow-camera-right={190}
        shadow-camera-top={190}
        shadow-camera-bottom={-190}
        shadow-camera-near={60}
        shadow-camera-far={1200}
        shadow-bias={-0.0012}
        shadow-normalBias={0.14}
      />
    </>
  );
}

const ENV_FRAGMENT = /* glsl */ `
uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGround; uniform vec3 uSun; uniform vec3 uSunColor;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  vec3 col = d.y > 0.0 ? mix(uHorizon, uTop, smoothstep(0.0, 0.7, d.y)) : mix(uHorizon, uGround, smoothstep(0.0, -0.25, d.y));
  col += uSunColor * pow(max(dot(d, normalize(uSun)), 0.0), 24.0) * 3.0;
  gl_FragColor = vec4(col, 1.0);
}`;

function EnvBackdrop() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: ENV.skyTop.clone() },
      uHorizon: { value: ENV.skyHorizon.clone() },
      uGround: { value: ENV.hemiGround.clone().multiplyScalar(0.6) },
      uSun: { value: ENV.sunDir.clone() },
      uSunColor: { value: ENV.sunColor.clone().multiplyScalar(ENV.sunIntensity / 3) },
    }),
    [],
  );
  return (
    <mesh scale={50}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        uniforms={uniforms}
        vertexShader="varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
        fragmentShader={ENV_FRAGMENT}
      />
    </mesh>
  );
}

function Effects({ small, plan }: { small: boolean; plan: boolean }) {
  return (
    <EffectComposer multisampling={small ? 0 : 4}>
      {small ? <></> : <N8AO aoRadius={5} distanceFalloff={1.2} intensity={2.4} halfRes />}
      <Bloom mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.2} intensity={0.22} radius={0.7} />
      {!small && plan ? <TiltShift2 blur={0.12} taper={0.55} /> : <></>}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Vignette offset={0.32} darkness={0.36} />
    </EffectComposer>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 4) onReady();
  });
  return null;
}

export function shotFor(view: SceneView, compact: boolean): Shot {
  const lot = view.lot ? LOT_BY_ID.get(view.lot) : undefined;
  if (view.vista && lot) {
    const [x, z] = lotCenter(lot);
    return { kind: "eye", position: [x, 1.9, z], dir: Math.atan2(VOLCANO.z - z, VOLCANO.x - x), pitch: 0.1 };
  }
  if (view.mode === "intro") return { kind: "orbit", target: compact ? [10, 38, -70] : [0, 58, -50], radius: compact ? 104 : 138, elevation: compact ? -0.02 : 0.08, azimuth: HERO_AZ, fov: compact ? 56 : 38 };
  if (lot) {
    const [x, z] = lotCenter(lot);
    return { kind: "orbit", target: [x, 0, z], radius: 24, elevation: 0.78 };
  }
  return { kind: "orbit", target: [0, 0, 0], radius: compact ? 150 : 158, elevation: 0.92 };
}

type StageProps = {
  view: SceneView;
  insets: Insets;
  onLot: (id: string) => void;
  onReady: () => void;
};

export default function Stage({ view, insets, onLot, onReady }: StageProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const small = useMemo(() => window.matchMedia("(max-width: 899px)").matches, []);
  const compact = useMemo(() => window.matchMedia("(max-width: 959px)").matches, []);
  const shot = useMemo(() => shotFor(view, compact), [view, compact]);
  const plan = view.mode === "explore" && !view.lot && !view.vista;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let down: { id: number; x: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      down = { id: e.pointerId, x: e.clientX };
    };
    const onMove = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.x;
      down.x = e.clientX;
      if (Math.abs(dx) < 0.5) return;
      stage.touched = performance.now() / 1000;
      if (shot.kind === "eye") stage.look = THREE.MathUtils.clamp(stage.look - dx * 0.004, -1.3, 1.3);
      else stage.azTarget -= dx * 0.0062;
    };
    const onUp = () => (down = null);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [shot.kind]);

  return (
    <div className="stage__canvas" ref={wrap}>
      <Canvas
        shadows="percentage"
        dpr={[1, small ? 1.5 : 1.75]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 38, near: 0.5, far: 60000, position: [0, 80, 600] }}
        frameloop={active ? "always" : "never"}
        onPointerMissed={() => (document.body.style.cursor = "")}
      >
        <Atmosphere />
        <Lights small={small} />
        <Environment resolution={64} frames={1}>
          <EnvBackdrop />
        </Environment>
        <Sky />
        <Terrain />
        <Site view={view} onLot={onLot} />
        <Rig shot={shot} insets={insets} drift={view.mode === "intro"} />
        <Effects small={small} plan={plan} />
        <Ready onReady={onReady} />
      </Canvas>
    </div>
  );
}
