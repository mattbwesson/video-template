/**
 * `POST /api/research` — the wizard's one server call.
 *
 * A bare Node handler rather than Express, because it is mounted straight into Vite's
 * dev server (see vite.config.ts). That means one process, no proxy configuration and no
 * second port to remember, and the same function can be mounted in any Node server later.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { passcodeGuard, requireApiKey } from "./env";
import { LlmError } from "./llm/client";
import {
  researchCompany,
  unbatchedCopyKeys,
  danglingCrossReferences,
  type ResearchInput,
} from "./llm/researchCompany";
import { brokenEditablePaths } from "../src/customize/editables";

/** Refuse anything larger than this outright rather than buffering it. */
const MAX_BODY_BYTES = 64 * 1024;

const readJson = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("Request body was not valid JSON."));
      }
    });
    req.on("error", reject);
  });

const send = (res: ServerResponse, status: number, body: unknown): void => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
};

/**
 * True when the TCP peer is this machine.
 *
 * Read off the socket, never off a header: `X-Forwarded-For` and friends are attacker-
 * supplied, so trusting them here would let any remote caller claim to be local and walk
 * straight past the guard.
 */
const isLoopback = (req: IncomingMessage): boolean => {
  const addr = req.socket.remoteAddress ?? "";
  return (
    addr === "127.0.0.1" ||
    addr === "::1" ||
    addr === "::ffff:127.0.0.1" ||
    addr.startsWith("127.")
  );
};

export const handleResearch = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  if (req.method !== "POST") {
    send(res, 405, { error: "Use POST." });
    return;
  }

  // `PASSCODE` in .env gates the route once this is deployed anywhere but a laptop.
  // `REQUIRE_API_KEY=1` drops the loopback exemption below, which a deployment must set:
  // behind a reverse proxy on the same host every request looks local.
  //
  // Loopback is exempt, and that is the point rather than a shortcut: the wizard is a
  // browser page, so anything it sends is readable by anyone who opens devtools. Giving
  // it the key to present would publish the key and secure nothing. What the guard is
  // actually for is a request arriving over the network, and "the connection came from
  // this machine" is a property the browser cannot forge.
  const expected = passcodeGuard();
  if (expected && (requireApiKey() || !isLoopback(req))) {
    if (req.headers["x-api-key"] !== expected) {
      send(res, 401, { error: "Bad or missing x-api-key." });
      return;
    }
  }

  let body: ResearchInput;
  try {
    body = (await readJson(req)) as ResearchInput;
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : "Bad request." });
    return;
  }

  // A copy group that no batch writes would silently ship the demo's words. Cheap to
  // check, and it fires the moment somebody adds a group to videoCopy.ts and forgets
  // researchCompany.ts — which is the one mistake this split makes possible.
  const unbatched = unbatchedCopyKeys();
  if (unbatched.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[research] copy groups no batch writes, so they keep the baseline: ${unbatched.join(", ")}`,
    );
  }

  // Round two is shown only the earlier groups its guides actually name, so a guide
  // pointing at a group written later — or moved to a later round — is told to agree with
  // something it never sees, and answers plausibly rather than failing.
  const dangling = danglingCrossReferences();
  if (dangling.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[research] cross-references that cannot be satisfied: ${dangling.join("; ")}`,
    );
  }

  // Same class of silent failure on the review screen: a mistyped path in editables.ts
  // just makes a field disappear from the panel.
  const broken = brokenEditablePaths();
  if (broken.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `[research] editables.ts names ${broken.length} copy path(s) that do not exist: ${broken.join(", ")}`,
    );
  }

  try {
    const result = await researchCompany(body);
    send(res, 200, result);
  } catch (err) {
    if (err instanceof LlmError) {
      // 502, not 500: the failure is upstream, and the wizard says so rather than
      // implying the operator did something wrong.
      send(res, 502, { error: err.message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error("[research] unexpected failure", err);
    send(res, 500, { error: "Research failed. See the server log." });
  }
};
