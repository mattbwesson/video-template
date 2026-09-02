/**
 * `POST /api/render-event` — a render started, finished or failed.
 * `GET  /api/analytics`    — what has been recorded, rolled up.
 *
 * The render happens in the browser, not here: `renderMediaOnWeb` encodes the MP4 on the
 * operator's own machine, so the server never sees one unless the page tells it. That is
 * the whole reason the first route exists.
 *
 * Both sit behind the same guard as the research route, header and loopback exemption
 * included. The summary names customers and what each cost, which is not something to
 * leave open on a public hostname.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { passcodeGuard, requireApiKey } from "./env";
import { isLoopback } from "./loopback";
import { companyKey, record, summarise, type RenderRecord } from "./analytics";

const MAX_BODY_BYTES = 8 * 1024;

const send = (res: ServerResponse, status: number, body: unknown): void => {
  const json = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(json);
};

const readJson = (req: IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Body too large."));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("Body was not valid JSON."));
      }
    });
    req.on("error", reject);
  });

/** The research route's guard, to the letter — one definition of who may call the API. */
const authorised = (req: IncomingMessage): boolean => {
  const expected = passcodeGuard();
  if (!expected) return true;
  if (!requireApiKey() && isLoopback(req)) return true;
  return req.headers["x-api-key"] === expected;
};

const OUTCOMES = new Set(["done", "failed", "aborted", "unsupported"]);

export const handleRenderEvent = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  if (req.method !== "POST") {
    send(res, 405, { error: "POST only." });
    return;
  }
  if (!authorised(req)) {
    send(res, 401, { error: "Passcode required." });
    return;
  }

  let body: Partial<RenderRecord>;
  try {
    body = (await readJson(req)) as Partial<RenderRecord>;
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : "Bad request." });
    return;
  }

  const outcome = String(body.outcome ?? "");
  if (!OUTCOMES.has(outcome)) {
    send(res, 400, { error: `outcome must be one of ${[...OUTCOMES].join(", ")}` });
    return;
  }

  const company = String(body.company ?? "").trim();
  record({
    kind: "render",
    at: new Date().toISOString(),
    company,
    key: companyKey(company),
    outcome: outcome as RenderRecord["outcome"],
    // Numbers only if they are numbers: this body comes from a page, and a NaN in the log
    // is a line that breaks every later sum.
    ...(Number.isFinite(body.ms) ? { ms: Number(body.ms) } : {}),
    ...(Number.isFinite(body.bytes) ? { bytes: Number(body.bytes) } : {}),
    ...(body.reason ? { reason: String(body.reason).slice(0, 200) } : {}),
  });

  // 204: the page is not waiting for this, and `sendBeacon` ignores the body anyway.
  res.statusCode = 204;
  res.end();
};

export const handleAnalytics = (req: IncomingMessage, res: ServerResponse): void => {
  if (req.method !== "GET") {
    send(res, 405, { error: "GET only." });
    return;
  }
  if (!authorised(req)) {
    send(res, 401, { error: "Passcode required." });
    return;
  }
  send(res, 200, summarise());
};
