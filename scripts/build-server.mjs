/**
 * Bundle the production server to one file.
 *
 * The handlers import out of `src/customize` so the prompt and the composition read the
 * same slot table — which means the server is TypeScript that reaches across the repo,
 * and shipping it would otherwise mean shipping a TS toolchain and the whole source tree.
 * esbuild resolves all of that at build time instead.
 *
 * `sirv` is bundled in too, so the runtime image needs no node_modules at all.
 */

import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [path.join(root, "server/prod.ts")],
  outfile: path.join(root, "build/server/index.mjs"),
  bundle: true,
  platform: "node",
  // The Dockerfile pins the same major; anything newer than this and `sirv`'s exports
  // resolve differently.
  target: "node20",
  format: "esm",
  // Node builtins stay external by virtue of platform:node; everything else is inlined.
  banner: {
    // esbuild's ESM output can emit `require` for a CJS dep (sirv is one). Without a
    // shim that is a ReferenceError the first time a file is served, which is every
    // request — so it fails immediately and loudly rather than subtly.
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
  logLevel: "info",
});
