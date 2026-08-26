import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * The component gallery — separate from the wizard's config on purpose.
 *
 * The wizard (vite.config.ts) roots at web/ and mounts the research/session/asset API
 * as middleware; the gallery needs none of that and roots at gallery/. Sharing one
 * config would mean the gallery could not start without an OpenAI key in the
 * environment, which is the opposite of what a component catalogue is for.
 *
 * `publicDir` still points at the composition's public/ folder, because `staticFile()`
 * inside these components resolves against the site root.
 */
export default defineConfig({
  root: path.resolve(__dirname, "gallery"),
  publicDir: path.resolve(__dirname, "public"),
  server: {
    port: Number(process.env.GALLERY_PORT) || 5274,
    // The components live above `root`; without this Vite refuses to serve them.
    fs: { allow: [path.resolve(__dirname)] },
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "build/gallery"),
    emptyOutDir: true,
  },
});
