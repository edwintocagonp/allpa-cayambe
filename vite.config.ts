import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const optionalBodyFont = (): Plugin => ({
  name: "optional-body-font",
  enforce: "pre",
  transform: (code, id) => (id.includes("@fontsource-variable/figtree") && id.endsWith(".css") ? code.replace(/font-display:\s*swap/g, "font-display: optional") : undefined),
});

export default defineConfig({
  plugins: [optionalBodyFont(), react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes("node_modules/three/") ? "three" : undefined),
      },
    },
  },
});
