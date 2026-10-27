import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { HERO_AZ, stage, type Insets } from "./state";

export type Shot =
  | { kind: "orbit"; target: [number, number, number]; radius: number; elevation: number; azimuth?: number; fov?: number }
  | { kind: "eye"; position: [number, number, number]; dir: number; pitch: number };

const ORBIT_FOV = 32;
const EYE_FOV = 50;

export function Rig({ shot, insets, drift }: { shot: Shot; insets: Insets; drift: boolean }) {
  const { camera, size } = useThree() as unknown as { camera: THREE.PerspectiveCamera; size: { width: number; height: number } };
  const s = useRef({
    ready: false,
    az: HERO_AZ,
    el: 0.3,
    dist: 600,
    target: new THREE.Vector3(0, 0, 0),
    pos: new THREE.Vector3(),
    look: new THREE.Vector3(0, 0, 0),
    offX: 0,
    offY: 0,
    kind: shot.kind,
  });
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    if (shot.kind === "orbit" && shot.azimuth !== undefined) stage.azTarget = shot.azimuth;
    if (shot.kind === "eye") stage.look = 0;
  }, [shot]);

  useFrame(({ clock }, dt) => {
    const st = s.current;
    const k = 1 - Math.exp(-dt * 2.6);
    const ox = (insets.right - insets.left) / 2;
    const oy = (insets.bottom - insets.top) / 2;
    st.offX = st.ready ? st.offX + (ox - st.offX) * k : ox;
    st.offY = st.ready ? st.offY + (oy - st.offY) * k : oy;
    camera.setViewOffset(size.width, size.height, st.offX, st.offY, size.width, size.height);

    const fov = shot.kind === "eye" ? EYE_FOV : (shot.fov ?? ORBIT_FOV);
    camera.near = shot.kind === "eye" ? 0.4 : 3;
    if (Math.abs(camera.fov - fov) > 0.01) camera.fov += (fov - camera.fov) * k;
    camera.updateProjectionMatrix();

    if (shot.kind === "orbit") {
      if (st.kind === "eye") {
        const rel = camera.position.clone().sub(st.target);
        st.dist = rel.length();
        st.el = Math.asin(THREE.MathUtils.clamp(rel.y / st.dist, -1, 1));
        st.az = Math.atan2(rel.z, rel.x);
        stage.azTarget = st.az;
      }
      st.kind = "orbit";
      const t = clock.elapsedTime - 6;
      if (drift && t > 0 && clock.elapsedTime - stage.touched > 7) stage.azTarget = (shot.azimuth ?? HERO_AZ) + Math.sin(t * 0.07) * 0.16 * Math.min(1, t / 8);
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const freeH = Math.max(0.25, (size.height - insets.top - insets.bottom) / size.height);
      const freeW = Math.max(0.25, (size.width - insets.left - insets.right) / size.width);
      const half = Math.min(Math.atan(tanHalf * freeH), Math.atan(tanHalf * camera.aspect * freeW));
      const dist = shot.radius / Math.sin(half);
      desired.current.set(...shot.target);
      if (!st.ready) {
        st.target.copy(desired.current);
        st.dist = dist;
        st.el = shot.elevation;
        st.az = stage.azTarget;
        st.ready = true;
      }
      st.target.lerp(desired.current, k);
      st.dist += (dist - st.dist) * k;
      st.el += (shot.elevation - st.el) * k;
      let delta = stage.azTarget - st.az;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      st.az += delta * Math.min(1, k * 1.4);
      stage.camAz = st.az;
      const cosEl = Math.cos(st.el);
      camera.position.set(st.target.x + Math.cos(st.az) * cosEl * st.dist, st.target.y + Math.sin(st.el) * st.dist, st.target.z + Math.sin(st.az) * cosEl * st.dist);
      st.look.copy(st.target);
      camera.lookAt(st.target);
    } else {
      st.kind = "eye";
      desired.current.set(...shot.position);
      camera.position.lerp(desired.current, k);
      const az = shot.dir + stage.look;
      lookAt.current.set(shot.position[0] + Math.cos(az) * 80, shot.position[1] + shot.pitch * 80, shot.position[2] + Math.sin(az) * 80);
      st.look.lerp(lookAt.current, k);
      camera.lookAt(st.look);
    }
  });

  useEffect(() => () => camera.clearViewOffset(), [camera]);
  return null;
}
