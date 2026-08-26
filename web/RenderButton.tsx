import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  downloadBlob,
  renderFilename,
  renderReadiness,
  startRender,
  type RenderHandle,
  type RenderProgress,
} from "./browserRender";
import type { VideoInputProps } from "../src/customize/videoCopy";

/**
 * "Render MP4" — the whole export, in the operator's own tab.
 *
 * Four states, and the third is the one that matters: a render of this film is thousands of
 * frames and takes minutes, so it has to show progress, stay cancellable, and never leave
 * the operator wondering whether it is still going. The estimate comes from the renderer
 * rather than from a guess, and it settles rather than jittering because it is only shown
 * once the job is past its first few percent.
 *
 * It is deliberately NOT a modal. The operator can keep scrubbing and editing while it runs
 * — the render has its own copy of `inputProps` from the moment it started, so later edits
 * simply do not appear in the file, which is the same contract as any other export.
 */

type State =
  | { kind: "idle" }
  | { kind: "unsupported"; blockers: string[] }
  | { kind: "rendering"; progress: RenderProgress }
  | { kind: "done"; filename: string }
  | { kind: "failed"; message: string };

const pct = (p: number) => `${Math.min(99, Math.floor(p * 100))}%`;

/** "about 4 min left" / "under a minute left". Rounded hard — this is reassurance, not a clock. */
const remaining = (p: RenderProgress): string => {
  if (!p.estimatedMs || p.progress <= 0.02) return "estimating…";
  const left = p.estimatedMs * (1 - p.progress);
  if (left < 60_000) return "under a minute left";
  return `about ${Math.round(left / 60_000)} min left`;
};

export const RenderButton: React.FC<{
  inputProps: VideoInputProps;
  company: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}> = ({ inputProps, company, durationInFrames, fps, width, height }) => {
  const [state, setState] = useState<State>({ kind: "idle" });
  const handle = useRef<RenderHandle | null>(null);
  /** Guards against a cancelled render's rejection landing on an unmounted component. */
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      handle.current?.cancel();
    };
  }, []);

  const run = useCallback(async () => {
    // Asked here rather than on mount: the check loads the renderer, and most sessions on
    // the reveal screen never press this.
    const ready = await renderReadiness(width, height);
    if (!live.current) return;
    if (!ready.supported) {
      setState({ kind: "unsupported", blockers: ready.blockers });
      return;
    }

    setState({
      kind: "rendering",
      progress: { progress: 0, renderedFrames: 0, encodedFrames: 0, estimatedMs: 0 },
    });

    const job = startRender({
      inputProps,
      durationInFrames,
      fps,
      width,
      height,
      onProgress: (progress) => {
        if (live.current) setState({ kind: "rendering", progress });
      },
    });
    handle.current = job;

    try {
      const blob = await job.done;
      if (!live.current) return;
      const filename = renderFilename(company);
      downloadBlob(blob, filename);
      setState({ kind: "done", filename });
    } catch (err) {
      if (!live.current) return;
      // An abort is the operator's own doing, so it returns to idle rather than reporting
      // a failure at them.
      const message = err instanceof Error ? err.message : String(err);
      if (/abort/i.test(message)) {
        setState({ kind: "idle" });
        return;
      }
      setState({ kind: "failed", message });
    } finally {
      handle.current = null;
    }
  }, [inputProps, company, durationInFrames, fps, width, height]);

  if (state.kind === "rendering") {
    return (
      <span className="vc-render vc-render-busy">
        <span className="vc-render-bar">
          <i style={{ width: pct(state.progress.progress) }} />
        </span>
        <span className="vc-mono">
          {pct(state.progress.progress)} · {remaining(state.progress)}
        </span>
        <button className="vc-btn vc-quiet" onClick={() => handle.current?.cancel()}>
          Cancel
        </button>
      </span>
    );
  }

  if (state.kind === "unsupported") {
    return (
      <span className="vc-render vc-render-bad">
        <span>This browser cannot encode video.</span>
        <span className="vc-quietnote">
          {state.blockers[0] ?? "WebCodecs is unavailable."} Try Chrome or Edge on desktop.
        </span>
      </span>
    );
  }

  if (state.kind === "failed") {
    return (
      <span className="vc-render vc-render-bad">
        <span>Render failed: {state.message}</span>
        <button className="vc-btn vc-quiet" onClick={run}>
          Try again
        </button>
      </span>
    );
  }

  return (
    <span className="vc-render">
      {state.kind === "done" ? (
        <span className="vc-quietnote">Saved {state.filename}</span>
      ) : (
        /* Not decoration. The canvas renderer this button uses is not the renderer the
           preview above uses, and today the film does not survive the trip intact — see
           the fidelity note in browserRender.ts. Saying so here costs one line and saves
           an operator from sending a customer a video with no icons in it. */
        <span className="vc-quietnote">Preview quality — see notes</span>
      )}
      <button className="vc-btn" onClick={run}>
        {state.kind === "done" ? "Render again" : "Render MP4"}
      </button>
    </span>
  );
};
