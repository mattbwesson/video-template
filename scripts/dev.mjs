/**
 * Start the wizard, trusting the corporate proxy CA if one has been exported.
 *
 * A launcher rather than putting the variable straight in the npm script, because
 * NODE_EXTRA_CA_CERTS pointing at a file that does not exist makes Node print a warning
 * on every start — and most machines will not have one.
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

const vite = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", ...process.argv.slice(2)],
  { stdio: "inherit", env },
);

vite.on("exit", (code) => process.exit(code ?? 0));
