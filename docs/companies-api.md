# `GET /api/companies`

A read-only list of the customers this tool has made videos for, for an agent to reconcile
against Salesforce.

## Runbook — enabling it

Five steps. Each one has a check, so you never move on from a step that silently did not
work.

### 1. Generate the token

```bash
openssl rand -base64 32
```

32 random bytes, ~44 characters. The route refuses anything under 24, so do not shorten it.
Put it straight into a password manager — this is the only time it is in your scrollback,
and it is not recoverable from Fly once set.

### 2. Set it as a Fly secret

```bash
flyctl secrets set COMPANIES_API_TOKEN="<paste>" --app l2-concept
```

Secrets are encrypted at rest and injected as environment variables at boot. Never put this
in `.env`, `fly.toml`, or anything git tracks.

**Check:** `flyctl secrets list --app l2-concept` shows `COMPANIES_API_TOKEN` with a digest
and a timestamp. It never shows the value.

Setting a secret restarts the machines on the CURRENT image, so on its own it does not ship
the route — step 3 does.

### 3. Build and deploy

```bash
npm run build:deploy
flyctl deploy --app l2-concept
```

`build:deploy` runs three builds in order: the wizard (`vite build`), the Remotion render
bundle, then the server. The route is compiled into the last of those.

**Check:** the deploy ends with the machines in `started`, and:

```bash
curl -s https://l2-concept.fly.dev/healthz
```

returns `ok`. Expect this one to take ~5 seconds if the app was asleep — see the cold-start
note below.

### 4. Verify the endpoint end to end

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "Authorization: Bearer <token>" \
  https://l2-concept.fly.dev/api/companies
```

| You get | It means |
| --- | --- |
| `200` | Working. Move on. |
| `503` | Deployed, but the secret is missing or under 24 characters. Redo step 2. |
| `404` | The secret is set but the deploy did not ship the route. Redo step 3. |
| `401` | Route and secret are live; the token you pasted does not match. |

Confirm the shape too, not just the status:

```bash
curl -s -H "Authorization: Bearer <token>" \
  https://l2-concept.fly.dev/api/companies | head -c 400
```

You want `basis`, `total` and a `companies` array. If `total` is 0, that is a real answer —
no video has completed yet — not a fault.

### 5. Hand the agent its two pieces

The token, through whatever secret store the agent platform provides, and
`docs/companies-api.openapi.json`. Nothing else. Do not paste the token into a prompt, an
agent instruction field, or anything that ends up in a transcript.

## Rotating the token

```bash
flyctl secrets set COMPANIES_API_TOKEN="$(openssl rand -base64 32)" --app l2-concept
```

Machines restart with the new value, so the old token stops working within seconds. There is
no overlap window: update the agent's stored secret in the same maintenance slot, or the
agent will 401 in between. If that matters, rotate when the agent is not polling.

## What any agent needs to know

Platform-independent contract, whatever ends up calling it:

- **Endpoint** `GET https://l2-concept.fly.dev/api/companies`
- **Auth** `Authorization: Bearer <token>`. No cookies, no query-string key.
- **Timeout** at least 30 seconds, with one retry on timeout. See the cold-start note.
- **Cadence** whatever suits; there is no server-side rate limit on authenticated calls.
- **Incremental sync** pass `since=<last successful sync ISO timestamp>`. Rows are sorted
  most-recently-active first.
- **Paging** there is none. `truncated: true` means raise `limit` (max 5000) rather than
  fetch a second page.
- **Read `basis`** before writing anything. It states in prose which rule produced the list,
  so a change of `include` cannot silently redefine what the agent is syncing.

## Matching a row to a CRM account

- `key` is the stable identity — case-folded and whitespace-collapsed. Use it as the
  external id for upserts so re-running the sync is idempotent.
- `name` is the display spelling, capitals preferred. Match this against the account name.
- `videosCompleted > 0` is the "has a video" fact. `rendersAttempted` counts starts,
  including failures, so it is the wrong field for that question.
- `lastVideoAt` is null when nothing has completed — expect it under
  `include=attempted` or `include=researched`, never under the default.

These are company names typed by an operator, so treat a miss as a miss: no CRM match should
create an account, only flag one for a human. Two different customers can share a
first word, and the wizard has no company id to disambiguate them.

## Calling it

The deployed host is the Fly app in `fly.toml` — `app = "l2-concept"`, so:

```bash
curl -H "Authorization: Bearer $COMPANIES_API_TOKEN" \
     "https://l2-concept.fly.dev/api/companies?include=completed&since=2026-01-01"
```

**Give the agent `docs/companies-api.openapi.json`**, not this page. It carries the server
URL, the auth scheme, every parameter and the full response schema, which is what an agent
needs to be configured rather than told.

### Cold start — set the client timeout accordingly

`fly.toml` has `min_machines_running = 0` and `auto_stop_machines = "stop"`, so the machine
sleeps when idle and the first request after a quiet period pays for the boot. Measured
against the live app, a cold `/healthz` took **5.1 seconds**. Fly holds the connection while
it boots, so nothing is lost — but an agent with a default 2 or 3 second timeout will give
up before the first response and look like an outage.

Allow at least 30 seconds of request timeout, and retry once on a timeout rather than
treating it as a failure. If the agent polls on a schedule, a poll more often than the idle
window keeps the machine warm and the question moot.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `include` | `completed` | `completed` = at least one finished video. `attempted` = a render was started. `researched` = the wizard was run at all. |
| `since` | none | ISO 8601. Keeps companies active on or after it. |
| `limit` | 500 | A positive integer, capped at 5000; empty means the default, anything else is a 400. `truncated` says whether anything was cut. |

```json
{
  "generatedAt": "2026-09-09T14:54:29.426Z",
  "basis": "companies with at least one completed video render",
  "include": "completed",
  "since": null,
  "total": 2,
  "returned": 2,
  "truncated": false,
  "companies": [
    {
      "name": "DeWalt",
      "key": "dewalt",
      "videosCompleted": 1,
      "rendersAttempted": 1,
      "researchRuns": 1,
      "firstSeen": "2026-09-05T08:00:00.000Z",
      "lastSeen": "2026-09-06T12:00:00.000Z",
      "lastVideoAt": "2026-09-06T12:00:00.000Z"
    }
  ]
}
```

## What "had a video created" means

Not the same question as "appears in the log", and the log tells them apart. A `run` record
means the research pass produced copy; a `render` record with outcome `done` means an MP4
actually finished encoding in the operator's browser. A company can have the first without
the second — the operator ran the wizard, looked at it, and never exported.

`include=completed` is therefore the default, and the response repeats the rule it used in
`basis` so a caller writing to Salesforce reads it rather than assumes it.

Rows are sorted most-recently-active first, so an incremental sync sees new ones without
paging.

## What it will not return

No costs, token counts, model names, prompts, error strings, stack traces or user agents.
Matching a name to an account needs none of it. `/api/analytics` still exposes all of that
to the operator behind the wizard's own passcode; this is a narrower projection for a
different audience, and keeping it narrow is what makes it safe to point at an agent.

Companies are keyed case-insensitively, so `Spotify` and `spotify` are one row. The
**capitalised** spelling wins the display name — taking the most recent one turned `Spotify`
into `spotify`, which is exactly the failure a name-matching feed cannot have.

Unnamed runs are dropped. They exist in the analytics log; they have no business in a
reconciliation feed.

## Security notes

- **Constant-time comparison.** Both sides are SHA-256'd before `timingSafeEqual`, so every
  comparison is the same shape. Comparing the raw strings would throw on a length mismatch,
  and catching that throw would itself leak the token's length.
- **The token is checked before the throttle.** The obvious order is a denial of service:
  behind a proxy every request shares one peer address, so ten bad guesses from anyone would
  lock the real agent out. Keying the throttle on `X-Forwarded-For` instead would hand an
  attacker a free reset, since that header is caller-supplied. So a correct credential is
  never gated — the throttle only slows wrong ones, which is all it is for.
- **Ten misses per address buys a five-minute hold**, in memory, reset on a successful auth.
  It is a speed bump against online guessing, not the boundary; the token's entropy is.
- `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` on every response.

## Verified

Against a seeded log: unauthenticated 401, wrong token 401, `POST` 405, unset token 503,
short token 503, eleventh bad guess 429, and a valid token 200 **while the throttle was hot**.
Each `include` and `since` combination was checked against known rows, and the seeded stack
trace and cost fields were confirmed absent from the output.
