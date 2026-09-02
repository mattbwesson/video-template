/**
 * Start the wizard, trusting the corporate proxy CA if one has been exported.
 *
 * A launcher rather than putting the variable straight in the npm script, because
 * NODE_EXTRA_CA_CERTS pointing at a file that does not exist makes Node print a warning
 * on every start — and most machines will not have one.
 *
 * `--model=` does the same job for OPENAI_MODEL, and exists because `.env` PINS that
 * variable. A branch that changes the model default therefore starts up running the old
 * one, which is not a visible failure — it is a wizard that works, on the wrong model.
 * Same override that `scripts/bench-research.mjs` takes, and the same precedence: a
 * variable already in the environment beats the file (see server/env.ts).
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ca = path.resolve(process.cwd(), ".certs/corporate-ca.pem");
const env = { ...process.env };

if (fs.existsSync(ca)) {
  env.NODE_EXTRA_CA_CERTS = ca;
  console.log(`Trusting corporate CA bundle at ${path.relative(process.cwd(), ca)}`);
}

// Filtered out of what is forwarded, or vite rejects the unknown flag.
const argv = process.argv.slice(2);
const modelArg = argv.find((a) => a.startsWith("--model="));
if (modelArg) {
  env.OPENAI_MODEL = modelArg.slice("--model=".length);
  console.log(`Using OPENAI_MODEL=${env.OPENAI_MODEL} (overriding .env for this server)`);
}

const vite = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", ...argv.filter((a) => a !== modelArg)],
  { stdio: "inherit", env },
);

vite.on("exit", (code) => process.exit(code ?? 0));
