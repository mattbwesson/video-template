/**
 * `GET /api/assets?dir=<name>` — what image files are in one of the shipped asset folders.
 *
 * The swap drawer offers the operator a set of Workvivo value and space icons to choose
 * from. Those live on disk under `public/img/`, and hardcoding their filenames in the
 * client would mean a list that silently drifts every time somebody adds or renames one —
 * the drawer would offer an icon that 404s, or quietly hide one that exists.
 *
 * So the server reads the folder. This is the one place in the app where a directory
 * listing is the right answer rather than a closed enum: the guide's enum-in/lookup-out
 * rule (§4) exists to stop a *language model* inventing an asset path, and no model is
 * involved here — an operator picks from what is actually on disk.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";

/**
 * Folders the route will read, by request name.
 *
 * A whitelist, not a path parameter. `dir` arrives from the browser, and joining
 * arbitrary caller-supplied text onto a filesystem path is how a listing endpoint turns
 * into a way to read the rest of the disk. Adding a folder here is a deliberate edit.
 */
const FOLDERS: Record<string, string> = {
  // The trailing name really does contain spaces — it is the folder as shipped.
  "values-and-spaces": "img/values and spaces",
};

const IMAGE_EXT = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export type AssetEntry = {
  /** Web path, ready to use as a `src`. Not URL-encoded; `fetch` and the DOM handle that. */
  url: string;
  /**
   * The same file relative to `public/`, which is what `staticFile()` takes.
   *
   * This is the value that gets STORED as an override and travels into `inputProps`,
   * because the composition also has to render outside a browser: `remotion render`
   * serves the public folder from somewhere the wizard's leading-slash URL would not
   * resolve, and only `staticFile()` knows where. `url` is for the drawer's own preview.
   */
  path: string;
  /** The filename without its extension, as shipped. */
  file: string;
  /** A tidied, human-facing name derived from the filename. */
  label: string;
};

/**
 * `"valeus-payroll"` -> `"Payroll"`.
 *
 * The shipped files carry a category prefix, and one of them is misspelled ("valeus").
 * Both spellings are stripped: the label should read as the icon's name, and correcting
 * a typo by renaming the asset is a change to someone else's file.
 */
const labelFor = (file: string): string =>
  file
    .replace(/^(values?|valeus|spaces?)[-_]/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const send = (res: ServerResponse, status: number, body: unknown): void => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
};

export const handleAssets = (
  req: IncomingMessage,
  res: ServerResponse,
  publicDir: string,
): void => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const dir = url.searchParams.get("dir") ?? "";
  const rel = FOLDERS[dir];

  if (!rel) {
    send(res, 400, { error: `Unknown asset folder "${dir}".` });
    return;
  }

  const abs = path.join(publicDir, rel);
  let names: string[];
  try {
    names = fs.readdirSync(abs);
  } catch {
    // Missing folder is not an error worth failing the UI over — the drawer just shows
    // no icons and the operator carries on with photos.
    send(res, 200, { assets: [] });
    return;
  }

  const assets: AssetEntry[] = names
    .filter((n) => IMAGE_EXT.has(path.extname(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((n) => {
      const file = n.slice(0, n.length - path.extname(n).length);
      // Always forward slashes: this is a URL fragment and a `staticFile()` argument,
      // neither of which takes a Windows separator, so `path.join` is wrong here.
      const web = `${rel}/${n}`.replace(/\/+/g, "/");
      return { url: `/${web}`, path: web, file, label: labelFor(file) };
    });

  send(res, 200, { assets });
};
