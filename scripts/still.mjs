#!/usr/bin/env node
/**
 * Render single frames of the film to PNG, to look at them.
 *
 *   npm run still 763                 one frame, baseline demo copy
 *   npm run still 593 763 1407 2489   several, in parallel
 *   npm run still 763 -- --props=~/Downloads/acme.json   a customer's version
 *
 * This is the loop for checking a change: edit a component, render the frame it appears
 * on, open the PNG. A still takes well under a minute where a full render takes several,
 * and it goes through the SAME headless Chromium as the final file — so if it looks right
 * here it will look right in the MP4, which is the whole point of using it to check.
 *
 * Frames land in `out/check/` and that folder is gitignored, so there is nothing to clean
 * up and nothing to accidentally commit.
 *
 * Finding the frame number: scrub the wizard's preview, or read the sequence ranges in
 * src/WorkvivoCut.tsx — each `<Sequence>` there is named with the global frames it covers,
 * e.g. `name="Workvivo Desktop (738 - 896)"`.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPOSITION = "CustomizedWorkvivo";
const OUT_DIR = path.join(ROOT, "out", "check");

const die = (...lines) => {
  console.error(`\n  ${lines.join("\n  ")}\n`);
  process.exit(1);
};

// `npm run still 763 -- --props=x.json` leaves a bare `--` in argv; drop it, keep the flags.
const argv = process.argv.slice(2).filter((a) => a !== "--");
const frames = argv.filter((a) => /^\d+$/.test(a)).map(Number);
const passthrough = argv.filter((a) => a.startsWith("-"));

if (!frames.length) {
  die(
    "Render single frames of the film to PNG.",
    "",
    "  npm run still <frame> [more frames…] [-- extra remotion flags]",
    "",
    "Examples:",
    "  npm run still 763",
    "  npm run still 593 763 1407",
    "  npm run still 763 -- --props=~/Downloads/workvivo-acme.json",
    "",
    "Frame numbers are global. src/WorkvivoCut.tsx names every sequence with its range.",
  );
}

// Expanded here so `--props=~/…` works: the shell only expands `~` when it is a bare word,
// and inside `--props=~/x.json` it is not, so it would arrive as a literal tilde and fail.
const flags = passthrough.map((f) =>
  f.startsWith("--props=~/")
    ? `--props=${path.join(process.env.HOME ?? "", f.slice("--props=~/".length))}`
    : f,
);

const propsFlag = flags.find((f) => f.startsWith("--props="));
if (propsFlag) {
  const p = propsFlag.slice("--props=".length);
  if (!fs.existsSync(p)) die(`No props file at ${p}`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const one = (frame) =>
  new Promise((resolve) => {
    const out = path.join(OUT_DIR, `f${frame}.png`);
    const child = spawn(
      "npx",
      [
        "remotion",
        "still",
        COMPOSITION,
        out,
        `--frame=${frame}`,
        // Quiet: with several running at once, interleaved progress bars are unreadable.
        // Errors still print.
        "--log=error",
        ...flags,
      ],
      { cwd: ROOT, stdio: "inherit" },
    );
    child.on("exit", (code) => resolve({ frame, out, ok: code === 0 }));
    child.on("error", () => resolve({ frame, out, ok: false }));
  });

console.log(
  `\n  Rendering ${frames.length} frame${frames.length === 1 ? "" : "s"}: ${frames.join(", ")}${
    propsFlag ? `\n  Props: ${propsFlag.slice("--props=".length)}` : "\n  Props: baseline demo copy"
  }\n`,
);

// All at once. Each still is its own Chromium, so this is bounded by the machine rather
// than by anything here; a handful is fine and is how this actually gets used.
const results = await Promise.all(frames.map(one));

const failed = results.filter((r) => !r.ok);
console.log("");
for (const r of results) {
  console.log(`  ${r.ok ? "✓" : "✗"} ${path.relative(process.cwd(), r.out)}`);
}
if (failed.length) {
  console.error(
    `\n  ${failed.length} failed. If the error above mentions a missing browser:\n\n    npx remotion browser ensure\n`,
  );
  process.exit(1);
}
console.log("");
