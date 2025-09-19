// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  root: "./examples",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "../dist-examples",
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ["pdfjs-dist"],
  },
});
