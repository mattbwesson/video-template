/**
 * Tell the server how a render went.
 *
 * The MP4 is encoded in this page, so the server has no way of knowing a video was ever
 * produced unless it is told. Without this the analytics can only count what was RESEARCHED
 * — and every abandoned run would look identical to a delivered one.
 *
 * Best effort by design. A dropped event costs a row in a log; a render that fails because
 * its analytics call threw would be a far worse trade, so nothing here rejects and nothing
 * here is awaited on the render path.
 */

import { storedPasscode } from "./passcode";

export type RenderOutcome = "done" | "failed" | "aborted" | "unsupported";

export type RenderEvent = {
  company: string;
  outcome: RenderOutcome;
  ms?: number;
  bytes?: number;
  reason?: string;
  /**
   * Everything about a failure that is not the message.
   *
   * A render that dies nine minutes in and one that dies on frame two have the same
   * message surprisingly often, and the difference is the whole diagnosis: the first is
   * memory or the encoder giving up, the second is the composition. `frame` and `progress`
   * are what tell them apart, so they are worth more here than any wording.
   *
   * The browser fields are here for the same reason. This encodes on the operator's own
   * machine through WebCodecs, so "it failed" is often a fact about their laptop — how
   * much memory it admits to and how many cores it has — and none of that is knowable
   * from the server side afterwards.
   */
  detail?: {
    errorName?: string;
    stack?: string;
    frame?: number;
    encodedFrame?: number;
    totalFrames?: number;
    progress?: number;
    width?: number;
    height?: number;
    fps?: number;
    ua?: string;
    deviceMemoryGb?: number;
    cores?: number;
  };
};

/**
 * What the browser will admit about itself.
 *
 * `deviceMemory` and `hardwareConcurrency` are both optional in the platform and absent in
 * Safari, hence the guards — a missing field is recorded as missing rather than as zero,
 * which would read as a machine with no memory.
 */
export const browserFacts = (): Pick<
  NonNullable<RenderEvent["detail"]>,
  "ua" | "deviceMemoryGb" | "cores"
> => {
  if (typeof navigator === "undefined") return {};
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    ua: nav.userAgent,
    ...(typeof nav.deviceMemory === "number" ? { deviceMemoryGb: nav.deviceMemory } : {}),
    ...(typeof nav.hardwareConcurrency === "number"
      ? { cores: nav.hardwareConcurrency }
      : {}),
  };
};

export const reportRender = (ev: RenderEvent): void => {
  try {
    const body = JSON.stringify(ev);
    const passcode = storedPasscode();

    // `sendBeacon` survives the tab closing, which matters for the one event most likely
    // to race it: the operator downloads the file and leaves. It cannot set headers
    // though, so it is only usable when the route is unguarded — locally.
    if (!passcode && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/render-event", new Blob([body], { type: "application/json" }));
      return;
    }

    void fetch("/api/render-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(passcode ? { "x-api-key": passcode } : {}),
      },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics is never the reason a render reports a failure.
  }
};
