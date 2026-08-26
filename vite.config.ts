import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * The API lives inside the dev server rather than in a second process.
 *
 * `POST /api/research` needs the OpenAI key and `GET /api/assets` needs to read the
 * shipped icon folder off disk, so neither can run in the browser. Mounting them as
 * middleware here means one command to start everything, no proxy table to keep in
 * step, and — because Vite loads this file through its own TS pipeline — the handlers can
 * import straight out of `src/customize`, so the prompt and the composition read the
 * same slot table with no duplicated types.
 */
const RESEARCH_MODULE = path.resolve(__dirname, "server/researchRoute.ts");
const ASSETS_MODULE = path.resolve(__dirname, "server/assetsRoute.ts");
const SESSION_MODULE = path.resolve(__dirname, "server/sessionRoute.ts");
const PUBLIC_DIR = path.resolve(__dirname, "public");

const apiPlugin = (): Plugin => ({
  name: "workvivo-api",
  configureServer(server) {
    server.middlewares.use("/api/research", async (req, res, next) => {
      try {
        // Imported lazily and through Vite's module graph so editing the server code
        // hot-reloads like the rest of the app instead of needing a restart.
        //
        // An absolute filesystem path, not "/server/…": a leading slash is resolved
        // against Vite's `root`, which is web/, so the tidy-looking version goes
        // looking for web/server/researchRoute.ts and 500s.
        const { handleResearch } = await server.ssrLoadModule(RESEARCH_MODULE);
        await handleResearch(req, res);
      } catch (err) {
        next(err);
      }
    });

    server.middlewares.use("/api/session", async (req, res, next) => {
      try {
        const { handleSession } = await server.ssrLoadModule(SESSION_MODULE);
        await handleSession(req, res);
      } catch (err) {
        next(err);
      }
    });

    server.middlewares.use("/api/assets", async (req, res, next) => {
      try {
        const { handleAssets } = await server.ssrLoadModule(ASSETS_MODULE);
        handleAssets(req, res, PUBLIC_DIR);
      } catch (err) {
        next(err);
      }
    });
  },
});

export default defineConfig({
  root: path.resolve(__dirname, "web"),
  publicDir: path.resolve(__dirname, "public"),
  // `root` is web/, but the API handler and the composition live above it. Without this
  // Vite refuses to serve them and `ssrLoadModule` cannot resolve `/server/...`.
  server: {
    // 5273 unless something hands us a port — two copies of the wizard on one machine
    // (a second agent session, a colleague's tunnel) otherwise collide on start.
    port: Number(process.env.PORT) || 5273,
    fs: { allow: [path.resolve(__dirname)] },
  },
  plugins: [react(), apiPlugin()],
  build: {
    outDir: path.resolve(__dirname, "build/web"),
    emptyOutDir: true,
    // Vite copies `publicDir` into the bundle by default, which would put every
    // composition asset into build/web AS WELL as leaving it in public/ — the same
    // 350 MB twice in the image. The production server mounts public/ directly
    // (server/prod.ts), so the copy is pure duplication. It also gets the app bundle's
    // year-long immutable cache headers, which are wrong for filenames that are not
    // content-hashed: replacing a filler image would never be picked up.
    copyPublicDir: false,
  },
});
