import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const { render } = await vite.ssrLoadModule("/src/prerender.tsx");
const shell = render();
await vite.close();

const fonts = readdirSync("dist/assets").filter((f) => /^(bricolage-grotesque-latin-wght-normal|figtree-latin-wght-normal)-.*\.woff2$/.test(f));
const preload = fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin>`).join("\n  ");
let html = readFileSync("dist/index.html", "utf8")
  .replace("</title>", `</title>\n  ${preload}`)
  .replace('<div id="root"></div>', `<div id="root">${shell}</div>`);
const entry = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>\n?/);
if (entry) {
  const late = `<script>(()=>{let done=0;const go=()=>{if(done++)return;const s=document.createElement("script");s.type="module";s.crossOrigin="";s.src="${entry[1]}";document.head.append(s)};try{new PerformanceObserver((l,o)=>{if(l.getEntriesByName("first-contentful-paint").length){o.disconnect();setTimeout(go)}}).observe({type:"paint",buffered:true})}catch{go()}setTimeout(go,3000)})()</script>`;
  html = html.replace(entry[0], "").replace("</body>", `${late}\n</body>`);
}
writeFileSync("dist/index.html", html);
console.log(`prerender: ${shell.length} caracteres, ${fonts.length} fuentes precargadas, script ${entry ? "después del primer pintado" : "sin cambios"}`);
