/**
 * The wizard's side of `POST /api/research`.
 *
 * The call takes the better part of a minute — a web search plus two model turns — which
 * is far too long to sit behind a button and watch. So it is kicked off the moment the
 * wizard knows enough to make it (company, and the person it is addressed to) and runs
 * while the operator is picking a logo and dropping photos. By the time they reach the
 * reveal it is usually already done.
 */

import type { WorkvivoCopy } from "../src/customize/videoCopy";
import { storedPasscode } from "./passcode";

export type ResearchResponse = {
  copy: WorkvivoCopy;
  brief: string;
  issues: string[];
  citations: string[];
  usage?: { input?: number; output?: number };
};

export type ResearchState =
  | { status: "idle" }
  | { status: "running"; company: string }
  | ({ status: "done"; company: string } & ResearchResponse)
  | { status: "error"; company: string; error: string };

export type ResearchRequest = {
  company: string;
  context?: string;
  person?: { name?: string; title?: string };
};

export const runResearch = async (
  req: ResearchRequest,
  signal?: AbortSignal,
): Promise<ResearchResponse> => {
  // The passcode the operator typed at the gate, forwarded as the shared secret the
  // route checks. Absent on a laptop, where the route exempts loopback and there is
  // nothing to send.
  const passcode = storedPasscode();
  const res = await fetch("/api/research", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(passcode ? { "x-api-key": passcode } : {}),
    },
    body: JSON.stringify(req),
    signal,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (body as { error?: string })?.error ?? `Research failed (${res.status}).`,
    );
  }
  return body as ResearchResponse;
};
