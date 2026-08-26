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
  const [copied, setCopied] = useState(false);

  const save = useCallback(() => {
    const filename = `workvivo-${companySlug(company)}.json`;
    // Indented rather than minified: an SE who opens this to see what went wrong should be
    // able to read it. It costs a few percent on a file nobody keeps.
    const blob = new Blob([JSON.stringify(inputProps, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, filename);
    setSaved(filename);
    setCopied(false);
  }, [inputProps, company]);

  /**
   * The full render command, exactly as it should be pasted, with THIS download's
   * filename already in it. This server publishes the composition as a Remotion serve URL
   * at /bundle, so the only thing the machine running this needs is Node — the CLI and
   * its browser download themselves on first use. The origin comes from the page rather
   * than being written here, so the command is right on localhost, on staging, and on
   * whatever the app is called next.
   */
  // --image-format=png: with the default JPEG screenshots, the rebuilt UI scenes carry a
  // faint wavy shimmer from quantization noise moving frame to frame. The repo's
  // remotion.config.ts sets the same thing, but a config file cannot follow the bundle to
  // someone else's machine, so the command has to say it.
  const command = saved
    ? `npx -p @remotion/cli remotion render ${window.location.origin}/bundle CustomizedWorkvivo workvivo-${companySlug(company)}.mp4 --props=$HOME/Downloads/${saved} --image-format=png`
    : "";

  const copy = useCallback(() => {
    // Fire-and-forget: if the clipboard is unavailable the command is still on screen to
    // select by hand, which is the fallback either way.
    void navigator.clipboard?.writeText(command).then(() => setCopied(true));
  }, [command]);

  if (saved) {
    return (
      <span className="vc-render">
        <span className="vc-quietnote">
          Saved. Render it in Terminal — needs only{" "}
          <a href="https://nodejs.org" target="_blank" rel="noreferrer">
            Node
          </a>
          :
        </span>
        <code
          className="vc-mono"
          style={{ userSelect: "all", cursor: "pointer" }}
          title="Click to copy"
          onClick={copy}
        >
          {command}
        </code>
        <button className="vc-btn vc-quiet" onClick={copy}>
          {copied ? "Copied" : "Copy command"}
        </button>
        <button className="vc-btn vc-quiet" onClick={save}>
          Download again
        </button>
      </span>
    );
  }

  return (
    <span className="vc-render">
      <span className="vc-quietnote">Full quality, renders on your machine</span>
      <button className="vc-btn" onClick={save}>
        Download project file
      </button>
    </span>
  );
};
