import * as THREE from "three";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function texture(c: HTMLCanvasElement, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function rng(seed: number) {
  return () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
}

export function paverTexture() {
  const { c, ctx } = canvas(256, 256);
  const random = rng(11);
  ctx.fillStyle = "#4d4a46";
  ctx.fillRect(0, 0, 256, 256);
  const w = 32;
  const h = 16;
  for (let row = 0; row < 256 / h; row++) {
    for (let col = -1; col < 256 / w + 1; col++) {
      const x = col * w + (row % 2 ? w / 2 : 0);
      const tone = 92 + random() * 26;
      ctx.fillStyle = `rgb(${tone + 6},${tone},${tone - 6})`;
      ctx.fillRect(x + 1, row * h + 1, w - 2, h - 2);
    }
  }
  return texture(c, true);
}

export function courtTexture() {
  const { c, ctx } = canvas(512, 256);
  ctx.fillStyle = "#3f8f4e";
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
    ctx.fillRect(i * 64, 0, 64, 256);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 484, 228);
  ctx.beginPath();
  ctx.moveTo(256, 14);
  ctx.lineTo(256, 242);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 128, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(14, 78, 46, 100);
  ctx.strokeRect(452, 78, 46, 100);
  return texture(c);
}

export function signTexture(text: string) {
  const { c, ctx } = canvas(1024, 256);
  ctx.fillStyle = "#24305e";
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = "#f4ece0";
  ctx.font = '700 150px "Bricolage Grotesque Variable", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 512, 136);
  return texture(c);
}

export function cloudTexture() {
  const { c, ctx } = canvas(256, 128);
  const random = rng(3);
  for (let i = 0; i < 26; i++) {
    const x = 40 + random() * 176;
    const y = 50 + random() * 40 - Math.abs(x - 128) * 0.12;
    const r = 16 + random() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function labelTexture(text: string, sub: string) {
  const { c, ctx } = canvas(512, 160);
  ctx.fillStyle = "rgba(29,36,51,0.92)";
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 144, 36);
  ctx.fill();
  ctx.fillStyle = "#f4ece0";
  ctx.font = '700 64px "Bricolage Grotesque Variable", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 84);
  ctx.font = '500 34px "Figtree Variable", system-ui, sans-serif';
  ctx.fillStyle = "#e9c47a";
  ctx.fillText(sub, 256, 128);
  return texture(c);
}
