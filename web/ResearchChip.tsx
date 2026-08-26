import React, { useState } from "react";
import type { ResearchState } from "./research";

/**
 * A status line for the copywriting pass, under the step rail.
 *
 * It exists because the pass runs invisibly in the background, and silent background
 * work that changes what the operator is about to show a customer is the wrong kind of
 * magic. When it finishes, the sources it used are one click away — the copy makes
 * claims about a real company and somebody has to be able to check them.
 */
export const ResearchChip: React.FC<{
  state: ResearchState;
  onRetry: () => void;
}> = ({ state, onRetry }) => {
  const [open, setOpen] = useState(false);

  if (state.status === "idle") return null;

  if (state.status === "running") {
    return (
      <div className="vc-research">
        <span className="vc-orb" />
        <span>Researching {state.company} and writing the copy…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="vc-research vc-bad">
        <span>Copywriting failed: {state.error}</span>
        <button className="vc-link" onClick={onRetry}>
          Try again
        </button>
        <span className="vc-quietnote">
          The video still builds — it keeps the approved demo copy.
        </span>
      </div>
    );
  }

  const sources = state.citations.length;
  return (
    <div className="vc-research vc-good">
      <span>
        Copy written for {state.company}
        {sources > 0
          ? ` from ${sources} source${sources === 1 ? "" : "s"}`
          : " — no sources cited"}
        .
      </span>
      <button className="vc-link" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide" : "What it found"}
      </button>
      {state.issues.map((issue) => (
        <span className="vc-quietnote" key={issue}>
          {issue}
        </span>
      ))}
      {open && (
        <div className="vc-brief">
          <p>{state.brief || "No brief was returned."}</p>
          {sources > 0 && (
            <ul>
              {state.citations.map((url) => (
                <li key={url}>
                  {/* The model found these; opening one is the operator's call, and a
                      new tab keeps a half-finished wizard from being thrown away. */}
                  <a href={url} target="_blank" rel="noreferrer noopener">
                    {url.replace(/^https?:\/\//, "").split("?")[0]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
