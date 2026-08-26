#!/usr/bin/env node
/**
 * Render a project file downloaded from the wizard, on this machine, at full quality.
 *
 *   npm run render:project -- ~/Downloads/workvivo-northwind.json
 *
 * Why this exists rather than the wizard's own "Render MP4" button: that button uses
 * `@remotion/web-renderer`, a canvas renderer with emulated CSS, and the film does not
 * survive it intact — sprite icons, blend modes and CSS background photos all come out
 * wrong (docs/browser-render-best-practices.md). This path shells out to the Remotion CLI,
 * which drives real headless Chromium — the same renderer behind every verification still
 * in this repo. There is no fidelity gap to explain because there is no second renderer.
 *
 * A thin wrapper over `remotion render`, deliberately. Everything it adds is for the
 * person running it: it checks the file before Chromium spends three minutes discovering
 * the problem, names the output after the company so a folder of these stays legible, and
 * turns the two failures that actually happen — wrong path, browser not installed — into
 * sentences with the fix in them. The SEs running this are not expected to know Remotion.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMPOSITION = "CustomizedWorkvivo";

const die = (...lines) => {
  console.error(`\n  ${lines.join("\n  ")}\n`);
  process.exit(1);
};

const [, , propsArg, ...extra] = process.argv;

// `npm run render:project -- file.json -- --frames=0-99` leaves a bare `--` in argv, and
// forwarding it to Remotion makes it ignore every flag after it — silently, so the render
// looks fine and just does the wrong thing. Drop the separators; keep the flags.
const rest = extra.filter((a) => a !== "--");

if (!propsArg || propsArg === "--help" || propsArg === "-h") {
  die(
    "Render a wizard project file at full quality.",
    "",
    "  npm run render:project -- <project.json> [-- extra remotion flags]",
    "",
    "Example:",
    "  npm run render:project -- ~/Downloads/workvivo-northwind.json",
    "",
    "The project file is the one the wizard's \"Download project file\" button saves.",
  );
}

const propsPath = path.resolve(process.cwd(), propsArg);

if (!fs.existsSync(propsPath)) {
  die(
    `No project file at ${propsPath}`,
    "",
    "Check the path. If you dragged the file into the terminal, make sure there is a",
    "space after `--` and no stray quotes.",
  );
}

// Parsed here rather than left to Remotion so a truncated or half-copied download is
// caught in milliseconds, with a message about the file, instead of surfacing several
// minutes later as a stack trace from inside the renderer.
let props;
try {
  props = JSON.parse(fs.readFileSync(propsPath, "utf8"));
} catch (err) {
  die(
    `${path.basename(propsPath)} is not valid JSON.`,
    "",
    "It was probably cut short while downloading. Download it from the wizard again.",
    "",
    `(${err.message})`,
  );
}

const company = props?.copy?.companyName;
if (!company) {
  die(
    `${path.basename(propsPath)} does not look like a wizard project file.`,
    "",
    "It is missing `copy.companyName`. Make sure this is the file from the wizard's",
    '"Download project file" button, not a research or session export.',
  );
}

const slug =
  company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
  "video";
const outDir = path.join(ROOT, "out");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `workvivo-${slug}.mp4`);

console.log(`\n  Company   ${company}`);
console.log(`  Project   ${path.basename(propsPath)}`);
console.log(`  Output    ${path.relative(process.cwd(), outPath)}`);
console.log(
  `\n  Rendering with headless Chromium. This takes a few minutes — the film is 5,300\n  frames and one scene composites 24 samples per frame for motion blur.\n`,
);

// `--props=<path>`, not the JSON inline: the project file carries uploaded photos as data
// URLs and runs to megabytes, which is far past the command-line length limit on every
// platform. Remotion reads the file itself.
const args = [
  "remotion",
  "render",
  COMPOSITION,
  outPath,
  `--props=${propsPath}`,
  // PNG screenshots, or the flat-colour UI scenes pick up a faint frame-to-frame shimmer
  // from JPEG quantization — see remotion.config.ts. Spelled out here as well because a
  // caller's extra flags come after and can still override it.
  "--image-format=png",
  ...rest,
];

const child = spawn("npx", args, { cwd: ROOT, stdio: "inherit" });

child.on("error", (err) => {
  die(`Could not start the renderer: ${err.message}`, "", "Is Node installed correctly?");
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log(`\n  Done — ${path.relative(process.cwd(), outPath)}\n`);
    return;
  }
  // Remotion has already printed the real error above; this only adds the fix for the one
  // that is guaranteed to happen on a machine that has never rendered before.
  console.error(
    [
      "",
      "  Render failed. If the error above mentions a missing browser, run this once:",
      "",
      "    npx remotion browser ensure",
      "",
      "  Then try again.",
      "",
    ].join("\n"),
  );
  process.exit(code ?? 1);
});
