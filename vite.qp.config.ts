import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Temporary: builds the quality probe as a static page so an encode measurement cannot be
// interrupted by HMR. Deleted after the measurement.
export default defineConfig({
  root: path.resolve(__dirname, "web"),
  publicDir: false,
  resolve: { preserveSymlinks: false },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "out/qp"),
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(__dirname, "web/quality-probe.html") },
  },
});
