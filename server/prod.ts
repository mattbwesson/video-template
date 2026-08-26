/**
 * The production server.
 *
 * In development the API is Vite middleware (see vite.config.ts) — one process, no proxy
 * table. There is no Vite in production, so this is the same three handlers mounted on a
 * bare Node server in front of two static roots.
 *
 * It is bundled to a single file by `scripts/build-server.mjs`, so the container needs no
 * TypeScript and no node_modules at runtime.
 */

import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import { handleAssets } from "./assetsRoute";
import { handleResearch } from "./researchRoute";
import { handleSession } from "./sessionRoute";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Both roots are siblings of the bundle inside the image (see the Dockerfile), so they
 * are resolved from the bundle rather than from `process.cwd()` — a server that only
 * works when started from one particular directory is a trap for whoever runs it next.
 */
const WEB_DIR = path.resolve(here, "web");
const PUBLIC_DIR = path.resolve(here, "public");

/**
 * `sirv` rather than a hand-rolled file server, for one reason above all: byte ranges.
 * The composition lays a video underneath every frame and the Player seeks in it, which
 * is a `Range:` request. A naive `createReadStream` answers those with the whole file and
 * a 200, and scrubbing stops working.
 */
const serveAssets = sirv(WEB_DIR, {
  // Vite hashes these filenames, so the name IS the version and a year is safe.
  maxAge: 31536000,
  immutable: true,
  etag: true,
  gzip: true,
  brotli: true,
});

/**
 * index.html, and only index.html.
 *
 * A second instance rather than a flag on the one above, because this file has to be
 * cached the OPPOSITE way and sirv cannot express both at once: it snapshots a
 * `Cache-Control` per file at startup and writes it via `writeHead`, which beats anything
 * a `setHeaders` callback sets. One instance therefore means one policy.
 *
 * And the policy matters more here than anywhere else in the app. The shell is the only
 * file whose NAME never changes, and it is what points at the hashed bundles — so caching
 * it hard pins a browser to whichever build it first saw. This served index.html as
 * `immutable, max-age=31536000` for a while: every deploy after an operator's first visit
 * was invisible to them for a year, and the symptom was a wizard that kept playing an old
 * cut of the film long after the new one shipped. Nothing in the app looked broken,
 * because nothing in the app was.
 *
 * `max-age=0` with an ETag, so every load asks and almost every answer is a 304.
 */
const serveShell = sirv(WEB_DIR, {
  maxAge: 0,
  etag: true,
  gzip: true,
  brotli: true,
});

/** The app shell, as opposed to a hashed asset: `/`, or any deep link the SPA owns. */
const wantsShell = (url: string): boolean => {
  const p = url.split("?")[0];
  return p === "/" || p.endsWith(".html");
};

/**
 * The composition's assets. Their names are NOT content-hashed — `staticFile("img/…")`
 * resolves to the literal path — so they get a short cache with revalidation instead of
 * a year. An operator who replaces a filler image should see it on the next hard reload,
 * not next year.
 */
const servePublic = sirv(PUBLIC_DIR, { maxAge: 3600, etag: true });

const notFound = (res: http.ServerResponse): void => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Not found." }));
};

const server = http.createServer(async (req, res) => {
  const url = req.url ?? "/";

  try {
    if (url === "/api/session" || url.startsWith("/api/session?")) {
      await handleSession(req, res);
      return;
    }
    if (url === "/api/research" || url.startsWith("/api/research?")) {
      await handleResearch(req, res);
      return;
    }
    if (url === "/api/assets" || url.startsWith("/api/assets?")) {
      handleAssets(req, res, PUBLIC_DIR);
      return;
    }
    // A health check that does not touch the API key or the disk, so the platform can
    // tell "the process is up" from "the process is up and configured".
    if (url === "/healthz") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("ok");
      return;
    }
    if (url.startsWith("/api/")) {
      notFound(res);
      return;
    }
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Server error.",
      }),
    );
    return;
  }

  // The shell is checked FIRST, before the asset server gets a look. Left to fall through,
  // sirv would resolve `/` to index.html itself and serve it with the immutable headers
  // meant for hashed files — which is the bug this split exists to prevent, and it would
  // come back silently.
  if (wantsShell(url)) {
    req.url = "/";
    serveShell(req, res, () => notFound(res));
    return;
  }

  // Then, in the order the dev server resolves them: the built app, then the composition's
  // assets, then the shell again. The wizard is a single page with no routes, so anything
  // left over is a deep link or a typo and both want the app.
  serveAssets(req, res, () =>
    servePublic(req, res, () => {
      req.url = "/";
      serveShell(req, res, () => notFound(res));
    }),
  );
});

const port = Number(process.env.PORT) || 8080;
server.listen(port, "0.0.0.0", () => {
  console.log(`Wizard listening on http://0.0.0.0:${port}`);
});
