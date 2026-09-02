/**
 * `POST /api/research` — the wizard's one server call.
 *
 * A bare Node handler rather than Express, because it is mounted straight into Vite's
 * dev server (see vite.config.ts). That means one process, no proxy configuration and no
 * second port to remember, and the same function can be mounted in any Node server later.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { passcodeGuard, requireApiKey } from "./env";
import { isLoopback } from "./loopback";
import { LlmError } from "./llm/client";
import {
  researchCompany,
  unbatchedCopyKeys,
  danglingCrossReferences,
  type ResearchInput,
  type ResearchResult,
} from "./llm/researchCompany";
import { brokenEditablePaths } from "../src/customize/editables";
import { companyKey, record } from "./analytics";

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

  /**
   * One line per run, whichever way it goes.
   *
   * A failed run records zero tokens, and that is a real gap rather than a claim that it
   * was free: `researchCompany` accumulates its counters locally and a throw loses them,
   * and the calls that had already returned inside a `Promise.all` are lost with it. What
   * this does capture is the failure itself, so the failure RATE is visible instead of
   * being inferred from runs that never reached a render.
   */
  const logRun = (
    ok: boolean,
    result?: ResearchResult,
    error?: string,
  ): void => {
    const company = (body.company ?? "").trim();
    record({
      kind: "run",
      at: new Date().toISOString(),
      company,
      key: companyKey(company),
      ok,
      issues: result?.issues?.length ?? 0,
      ms: result?.stats?.ms ?? 0,
      model: result?.stats?.model ?? "",
      calls: result?.stats?.calls ?? 0,
      searchCalls: result?.stats?.searchCalls ?? 0,
      inputTokens: result?.usage?.input ?? 0,
      outputTokens: result?.usage?.output ?? 0,
      reasoningTokens: result?.stats?.reasoning ?? 0,
      cachedTokens: result?.stats?.cached ?? 0,
      incompleteCalls: result?.stats?.incomplete ?? 0,
      warnings: {
        unbatched: unbatched.length,
        dangling: dangling.length,
        brokenEditables: broken.length,
      },
      ...(error ? { error } : {}),
    });
  };

  try {
    const result = await researchCompany(body);
    logRun(true, result);
    send(res, 200, result);
  } catch (err) {
    logRun(false, undefined, err instanceof Error ? err.message : "unknown");
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
