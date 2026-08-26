/**
 * Export the machine's corporate TLS-inspection CAs to `.certs/corporate-ca.pem`.
 *
 * On a network that intercepts TLS, every certificate is re-signed by a proxy CA that
 * lives in the OS trust store. `curl` reads that store and is happy; Node ships its own
 * root list and is not, so server-side `fetch` to api.openai.com fails with
 * SELF_SIGNED_CERT_IN_CHAIN on a machine whose browser reaches the same URL fine.
 *
 * `scripts/dev.mjs` points NODE_EXTRA_CA_CERTS at whatever this writes, which is
 * additive — Node keeps its own roots and gains these as well.
 *
 * Re-run it if the proxy CA is rotated. The output is gitignored: it is machine-specific
 * and belongs to whoever's laptop it came from.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.cwd(), ".certs/corporate-ca.pem");

/** Issuers worth exporting. Anything here is a known TLS-inspection vendor. */
const NEEDLES = ["Zoom", "Zscaler", "Netskope", "Palo Alto", "Blue Coat", "Forcepoint"];

if (process.platform !== "darwin") {
  console.error(
    "This helper only knows how to read the macOS keychain.\n" +
      "On Linux, point NODE_EXTRA_CA_CERTS at your CA bundle (often /etc/ssl/certs/ca-certificates.crt).",
  );
  process.exit(1);
}

const chunks = [];
for (const needle of NEEDLES) {
  let pem = "";
  try {
    // No keychain argument: searches the whole search list, which is where an
    // MDM-installed proxy CA actually lands.
    pem = execFileSync("security", ["find-certificate", "-a", "-c", needle, "-p"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    continue; // No certificate matched that vendor. Normal.
  }
  const count = (pem.match(/BEGIN CERTIFICATE/g) ?? []).length;
  if (count) {
    console.log(`  found ${count} certificate(s) matching "${needle}"`);
    chunks.push(pem);
  }
}

if (!chunks.length) {
  console.log(
    "No corporate proxy CA found — your machine is probably not behind TLS inspection.\n" +
      "Nothing written; the dev server will use Node's own roots.",
  );
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, chunks.join("\n"));
console.log(`\nWrote ${path.relative(process.cwd(), OUT)}`);
console.log("Restart the dev server to pick it up.");
