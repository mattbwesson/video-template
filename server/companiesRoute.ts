/**
 * `GET /api/companies` — the customers this tool has made videos for, for an agent to
 * reconcile against Salesforce.
 *
 * WHAT IT ANSWERS, PRECISELY
 * "Had a video created" is not the same question as "appears in the log", and the log
 * distinguishes them. A `run` record means the research pass produced copy; a `render`
 * record with outcome `done` means an MP4 actually finished encoding in the operator's
 * browser. A company can easily have the first without the second — the operator ran the
 * wizard, looked at it, and never exported.
 *
 * So the default list is companies with at least one COMPLETED render, and the response
 * says which rule produced it in `basis`. `?include=attempted` widens it to anyone a
 * render was started for, and `?include=researched` widens it again to anyone the wizard
 * was ever run for. An agent writing to Salesforce should know which of those it got
 * rather than infer it, which is why the field is in the payload and not just the docs.
 *
 * WHAT IT DELIBERATELY DOES NOT RETURN
 * No costs, token counts, model names, prompts, error strings, stack traces or user
 * agents. The caller's job is to match a name to an account, and none of that helps it do
 * that. The analytics log holds all of it and `/api/analytics` already exposes it to the
 * operator behind the wizard's own passcode; this route is a narrower projection for a
 * different audience, and keeping it narrow is what makes it safe to point at an agent.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { companiesApiToken } from "./env";
import { readAll, type Record_ } from "./analytics";

/** Never return the whole log in one response, however the caller asks. */
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 5000;

/**
 * Failed-auth throttle, per peer address.
 *
 * A bearer token on a public hostname is guessable at whatever rate the network allows,
 * and this endpoint is meant to be reachable by an agent, so it cannot hide behind the
 * loopback exemption the wizard's own routes use. Ten misses buys a five-minute hold.
 *
 * In memory on purpose: it resets when the process does, which is the right trade for a
 * single-instance deployment and one fewer piece of state to operate. It is a speed bump
 * against online guessing, NOT the thing keeping the endpoint shut — that is the token's
 * own entropy, which is why the guard below refuses to run with a short one.
 */
const MISS_LIMIT = 10;
const MISS_WINDOW_MS = 5 * 60 * 1000;
const misses = new Map<string, { n: number; until: number }>();

const throttled = (addr: string): boolean => {
  const hit = misses.get(addr);
  if (!hit) return false;
  if (Date.now() > hit.until) {
    misses.delete(addr);
    return false;
  }
  return hit.n >= MISS_LIMIT;
};

const noteMiss = (addr: string): void => {
  const hit = misses.get(addr);
  const now = Date.now();
  if (!hit || now > hit.until) {
    misses.set(addr, { n: 1, until: now + MISS_WINDOW_MS });
    return;
  }
  hit.n += 1;
  hit.until = now + MISS_WINDOW_MS;
};

/**
 * Compare two secrets without leaking their contents through timing.
 *
 * Both sides are hashed first so the buffers are always 32 bytes: `timingSafeEqual`
 * throws on a length mismatch, and catching that throw would itself be a length oracle —
 * a caller could learn the token's length by watching which requests 500. Hashing makes
 * every comparison the same shape regardless of what was sent.
 */
const sameSecret = (a: string, b: string): boolean => {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
};

/** The token in `Authorization: Bearer …`, or "" if the header is absent or malformed. */
const bearer = (req: IncomingMessage): string => {
  const raw = req.headers.authorization;
  if (typeof raw !== "string") return "";
  const m = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return m ? m[1].trim() : "";
};

const send = (res: ServerResponse, status: number, body: unknown): void => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  // Customer names must not sit in a proxy or browser cache.
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
};

type Company = {
  name: string;
  key: string;
  videosCompleted: number;
  rendersAttempted: number;
  researchRuns: number;
  firstSeen: string;
  lastSeen: string;
  lastVideoAt: string | null;
};

const BASES = {
  completed: "companies with at least one completed video render",
  attempted: "companies a video render was attempted for",
  researched: "companies the wizard was run for at all",
} as const;
type Basis = keyof typeof BASES;

/** Roll the log up per company, keeping only what an account-matching agent needs. */
export const companiesFrom = (records: Record_[]): Company[] => {
  const byKey = new Map<string, Company>();

  for (const r of records) {
    const name = (r.company ?? "").trim();
    // An unnamed run cannot be matched to an account, so it is not a row. It still exists
    // in the analytics log; it just has no business being in a reconciliation feed.
    if (!name) continue;
    const key = r.key || name.toLowerCase();

    let c = byKey.get(key);
    if (!c) {
      c = {
        name,
        key,
        videosCompleted: 0,
        rendersAttempted: 0,
        researchRuns: 0,
        firstSeen: r.at,
        lastSeen: r.at,
        lastVideoAt: null,
      };
      byKey.set(key, c);
    }

    // The log is append-only but not guaranteed sorted, so both ends are compared.
    if (r.at < c.firstSeen) c.firstSeen = r.at;
    if (r.at > c.lastSeen) c.lastSeen = r.at;
    // Prefer a spelling that carries capitals. The key folds case, so one company can
    // arrive as "Spotify" once and "spotify" the next time, and whichever the operator
    // typed last is not the better name — taking the latest turned "Spotify" into
    // "spotify", which is the one thing this feed must not do when its whole job is
    // matching a name to an account. An all-lowercase entry is only used while nothing
    // better has been seen.
    if (name !== name.toLowerCase() && c.name === c.name.toLowerCase()) c.name = name;

    if (r.kind === "run") {
      c.researchRuns += 1;
    } else {
      c.rendersAttempted += 1;
      if (r.outcome === "done") {
        c.videosCompleted += 1;
        if (!c.lastVideoAt || r.at > c.lastVideoAt) c.lastVideoAt = r.at;
      }
    }
  }

  return [...byKey.values()];
};

export const handleCompanies = (req: IncomingMessage, res: ServerResponse): void => {
  if (req.method !== "GET") {
    send(res, 405, { error: "GET only." });
    return;
  }

  const token = companiesApiToken();

  // OFF, not open. See companiesApiToken's note: an unset token here can only mean the
  // endpoint was never configured, and there is no reading of that under which the right
  // answer is a list of customers.
  if (!token) {
    send(res, 503, {
      error: "This endpoint is not configured. Set COMPANIES_API_TOKEN to enable it.",
    });
    return;
  }
  // A short token is a misconfiguration that looks like a configuration, so it is refused
  // outright rather than defended by the throttle alone.
  if (token.length < 24) {
    send(res, 503, {
      error: "COMPANIES_API_TOKEN is too short; use at least 24 random characters.",
    });
    return;
  }

  // Off the socket, never off a header — X-Forwarded-For is caller-supplied.
  const addr = req.socket.remoteAddress ?? "unknown";
  const supplied = bearer(req);
  const ok = supplied.length > 0 && sameSecret(supplied, token);

  // THE TOKEN IS CHECKED BEFORE THE THROTTLE, and that order is the point.
  //
  // Checking the throttle first is the obvious arrangement and it is a denial of service.
  // Behind a proxy — Fly's, for one — every request arrives from the same peer address,
  // so `addr` is one bucket shared by the whole world. Ten bad guesses from anyone would
  // then lock the real agent out for five minutes, and repeating that is trivial. The
  // first version of this did exactly that: a valid token got a 429 while the throttle
  // was hot, which the tests caught.
  //
  // Keying on X-Forwarded-For instead would separate the buckets and hand an attacker a
  // free reset every request, which is the other bad answer. So the throttle never gates
  // a correct credential: it only slows down wrong ones, which is all it was ever for.
  if (ok) {
    misses.delete(addr);
  } else {
    if (throttled(addr)) {
      res.setHeader("Retry-After", "300");
      send(res, 429, { error: "Too many failed attempts." });
      return;
    }
    noteMiss(addr);
    res.setHeader("WWW-Authenticate", 'Bearer realm="companies"');
    send(res, 401, { error: "Bearer token required." });
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const include = (url.searchParams.get("include") ?? "completed") as Basis;
  if (!(include in BASES)) {
    send(res, 400, { error: `include must be one of ${Object.keys(BASES).join(", ")}` });
    return;
  }

  const sinceRaw = url.searchParams.get("since");
  let since = "";
  if (sinceRaw) {
    const d = new Date(sinceRaw);
    if (Number.isNaN(d.getTime())) {
      send(res, 400, { error: "since must be an ISO 8601 date." });
      return;
    }
    since = d.toISOString();
  }

  // Absent or empty means the default; anything else must be a positive integer, as the
  // OpenAPI declares (minimum 1) — `Number("")` is 0, so the empty case is checked by
  // hand rather than left to clamp silently to a one-row page.
  const limitRaw = url.searchParams.get("limit");
  let limit = DEFAULT_LIMIT;
  if (limitRaw !== null && limitRaw.trim() !== "") {
    const n = Number(limitRaw);
    if (!Number.isInteger(n) || n < 1) {
      send(res, 400, { error: "limit must be a positive integer." });
      return;
    }
    limit = Math.min(MAX_LIMIT, n);
  }

  let rows = companiesFrom(readAll());
  if (since) rows = rows.filter((c) => c.lastSeen >= since);
  if (include === "completed") rows = rows.filter((c) => c.videosCompleted > 0);
  else if (include === "attempted") rows = rows.filter((c) => c.rendersAttempted > 0);

  // Most recent first: an agent syncing incrementally wants the new ones without paging.
  rows.sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : a.lastSeen > b.lastSeen ? -1 : 0));
  const total = rows.length;

  send(res, 200, {
    generatedAt: new Date().toISOString(),
    basis: BASES[include],
    include,
    since: since || null,
    total,
    returned: Math.min(total, limit),
    truncated: total > limit,
    companies: rows.slice(0, limit),
  });
};
