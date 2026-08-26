/**
 * `GET /api/session` — is a passcode required? · `POST /api/session` — is this one right?
 *
 * The wizard is a static page: anything baked into its bundle is readable by anyone who
 * opens devtools, so the app cannot hold a secret of its own. What it CAN do is ask a
 * human for one and pass it along, which is what this route is for — the passcode is
 * typed, never shipped.
 *
 * It exists as a route of its own rather than letting the research call be the test
 * because that call takes the better part of a minute. Finding out the passcode was wrong
 * after forty seconds of waiting, having already filled in four steps, is not an
 * acceptable way to learn it.
 */

import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { passcodeGuard, requireApiKey } from "./env";

const send = (res: ServerResponse, status: number, body: unknown): void => {
  const json = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  // Never let a proxy or the browser hold on to the answer to "is this passcode right".
  res.setHeader("Cache-Control", "no-store");
  res.end(json);
};

/**
 * Constant-time compare, so the number of correct leading characters cannot be read off
 * the response time. `timingSafeEqual` throws on a length mismatch, which would leak the
 * length, so both sides are padded to the same size first.
 */
const matches = (given: string, expected: string): boolean => {
  const size = Math.max(given.length, expected.length, 1);
  const a = Buffer.alloc(size);
  const b = Buffer.alloc(size);
  a.write(given);
  b.write(expected);
  return timingSafeEqual(a, b) && given.length === expected.length;
};

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      // A passcode is a short string; anything bigger is not one.
      if (size > 4096) {
        reject(new Error("Too large."));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

export const handleSession = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  const expected = passcodeGuard();

  if (req.method === "GET") {
    // The gate is only shown when there is something to check. On a laptop with no
    // passcode set that means the wizard opens straight into the form, as it always has.
    send(res, 200, { required: Boolean(expected) && requireApiKey() });
    return;
  }

  if (req.method !== "POST") {
    send(res, 405, { error: "Use GET or POST." });
    return;
  }

  if (!expected) {
    send(res, 200, { ok: true });
    return;
  }

  let passcode = "";
  try {
    const raw = await readBody(req);
    passcode = String(
      (JSON.parse(raw || "{}") as { passcode?: unknown }).passcode ?? "",
    );
  } catch {
    send(res, 400, { error: "Send {\"passcode\": \"…\"} as JSON." });
    return;
  }

  if (!matches(passcode, expected)) {
    send(res, 401, { error: "That passcode is not right." });
    return;
  }
  send(res, 200, { ok: true });
};
