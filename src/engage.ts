import { useSyncExternalStore } from "react";

const START_AFTER_LOAD = 1200;
const EVENTS = ["pointerdown", "pointermove", "touchstart", "wheel", "keydown", "scroll"] as const;
const SOFTWARE = /swiftshader|llvmpipe|softpipe|lavapipe|software|basic render/i;
const listeners = new Set<() => void>();
let engaged = false;
let pending = false;

function hasGpu() {
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return false;
  let renderer = String(gl.getParameter(gl.RENDERER));
  if (/webkit webgl/i.test(renderer)) {
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  }
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return !SOFTWARE.test(renderer);
}

function begin(force: boolean) {
  if (engaged || (pending && !force)) return;
  pending = true;
  EVENTS.forEach((type) => window.removeEventListener(type, start, true));
  requestAnimationFrame(() =>
    setTimeout(() => {
      if (engaged || !(force || hasGpu())) return;
      engaged = true;
      listeners.forEach((listener) => listener());
    }),
  );
}

const start = () => begin(false);
export const forceStart = () => begin(true);

if (typeof window !== "undefined") {
  EVENTS.forEach((type) => window.addEventListener(type, start, { capture: true, passive: true }));
  const whenIdle = () =>
    setTimeout(() => (window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1000 }) : start()), START_AFTER_LOAD);
  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (window.scrollY > 0) start();
  return () => listeners.delete(listener);
}

export const useEngaged = () =>
  useSyncExternalStore(
    subscribe,
    () => engaged,
    () => false,
  );
