#!/usr/bin/env node
/**
 * Time the research + copywriting pass, with the knobs on the command line.
 *
 *   node scripts/bench-research.mjs "Northwind Logistics"
 *   node scripts/bench-research.mjs "Northwind Logistics" --effort=minimal
 *   node scripts/bench-research.mjs "Northwind Logistics" --effort=minimal --runs=2
 *
 * Why a script rather than curling the route: the pass is the slowest thing the wizard
 * does, its cost is spread over eight model calls, and the only honest way to tune it is
 * to change one variable and re-run. Doing that through the browser means clicking through
 * four wizard steps each time, and doing it through `curl` means the settings come from
 * `.env` and cannot be varied per run.
 *
 * Environment set here wins over `.env` (see server/env.ts), so `--effort` and `--model`
 * override the deployment's configuration for this run only. Nothing is written anywhere;
 * this makes real, billed API calls and prints what they cost.
 *
 * The per-call and per-phase lines come from server/llm/timing.ts — this script only adds
 * the run-over-run summary at the end.
 */

import { pathToFileURL } from "node:url";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

const company = args.find((a) => !a.startsWith("--"));
if (!company) {
  console.error(
    'Usage: node scripts/bench-research.mjs "<company>" [--effort=minimal|low|medium|high] [--model=…] [--runs=N]',
  );
  process.exit(1);
}

// Set BEFORE the server modules are imported: env.ts reads the environment once, at first
// use, and a variable already present wins over .env.
const effort = flag("effort");
const model = flag("model");
if (effort) process.env.OPENAI_REASONING_EFFORT = effort;
if (model) process.env.OPENAI_MODEL = model;
const runs = Number(flag("runs") ?? 1) || 1;

// Printed before the import, not after. The import pulls the whole copy table through the
// tsx loader and takes a moment; a script that prints nothing until that finishes looks
// like it has hung, which is exactly what it did the first time this was written.
console.log(
  `\n[bench] ${company} — ${runs} run(s), effort=${effort ?? "(from .env)"}, model=${model ?? "(from .env)"}\n`,
);

// Run this file through tsx (`npx tsx scripts/bench-research.mjs …`), which is what lets it
// import the TypeScript pipeline directly, extensionless imports and all — the same loader
// the dev server uses for server/. Do NOT set NODE_OPTIONS here to try to arrange that from
// inside: by this point the loader is either registered or it is too late, and mutating it
// mid-process just makes the import hang.
const modulePath = path.resolve(process.cwd(), "server/llm/researchCompany.ts");
const { researchCompany } = await import(pathToFileURL(modulePath).href);

const totals = [];
for (let i = 0; i < runs; i++) {
  if (runs > 1) console.log(`\n--- run ${i + 1} of ${runs} ---`);
  const t0 = Date.now();
  try {
    const result = await researchCompany({
      company,
      person: { name: "Dana Whitfield", title: "Head of Operations" },
    });
    const elapsed = Date.now() - t0;
    totals.push(elapsed);
    // A spot-check that the run actually produced customised copy, not a silent fallback
    // to the baseline demo's words — a fast run that wrote nothing is not an improvement.
    console.log(
      `[bench] issues=${result.issues.length} citations=${result.citations.length} headline="${String(
        result.copy?.quote?.original ?? "",
      ).slice(0, 60)}"`,
    );
    for (const issue of result.issues) console.log(`[bench]   ! ${issue}`);
  } catch (err) {
    console.error(`[bench] run failed: ${err?.message ?? err}`);
  }
}

if (totals.length > 1) {
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  console.log(
    `\n[bench] ${totals.length} runs: ${totals.map((t) => (t / 1000).toFixed(1) + "s").join(", ")}  avg ${(avg / 1000).toFixed(1)}s`,
  );
}
