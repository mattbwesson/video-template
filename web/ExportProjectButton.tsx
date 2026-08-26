import React, { useCallback, useState } from "react";
import { companySlug, downloadBlob } from "./browserRender";
import type { VideoInputProps } from "../src/customize/videoCopy";

/**
 * "Download project file" — the handoff to a local, full-quality render.
 *
 * The button beside this one encodes in the tab, which is convenient and lossy: the canvas
 * renderer behind it is not the renderer the Player above uses, so the file it produces is
 * a preview (see the fidelity note in browserRender.ts). This button is the other half of
 * that trade. It writes out everything the operator has decided — researched copy, their
 * own edits, the brand, the logo, every swapped photo — and `scripts/render-local.mjs`
 * feeds it to real headless Chromium, which is the same renderer that produced every
 * frame anybody has signed off on.
 *
 * The file is self-contained ON PURPOSE. Uploaded photos are already data URLs by the time
 * they reach here — uploads.ts converts them off `blob:` precisely so they survive a trip
 * out of the page — so the operator emails or drops ONE file and the render on the other
 * end needs nothing else. A project file that referenced photos by path would be a project
 * file that renders differently on someone else's machine, which is the failure this whole
 * handoff exists to avoid.
 */
export const ExportProjectButton: React.FC<{
  inputProps: VideoInputProps;
  company: string;
}> = ({ inputProps, company }) => {
  const [saved, setSaved] = useState<string | null>(null);

  const save = useCallback(() => {
    const filename = `workvivo-${companySlug(company)}.json`;
    // Indented rather than minified: an SE who opens this to see what went wrong should be
    // able to read it. It costs a few percent on a file nobody keeps.
    const blob = new Blob([JSON.stringify(inputProps, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, filename);
    setSaved(filename);
  }, [inputProps, company]);

  return (
    <span className="vc-render">
      {saved ? (
        <span className="vc-quietnote">
          Saved {saved} — render it with{" "}
          <code className="vc-mono">npm run render:project</code>
        </span>
      ) : (
        <span className="vc-quietnote">Full quality, renders on your machine</span>
      )}
      <button className="vc-btn" onClick={save}>
        {saved ? "Download again" : "Download project file"}
      </button>
    </span>
  );
};
