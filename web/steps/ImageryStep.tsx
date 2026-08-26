import React, { useRef } from "react";
import { FileDrop } from "../Dropzone";
import { readImages } from "../uploads";
import { buildReady, imageryReady, type WizardState } from "../wizardState";
import {
  SUGGESTED_UPLOADS,
  imageSlotLabel,
  slotsForUpload,
} from "../../src/customize/imagery";

export const ImageryStep: React.FC<{
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  onBuild: () => void;
  onBack: () => void;
  backLabel: string;
}> = ({ state, patch, onBuild, onBack, backLabel }) => {
  const input = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | File[]) => {
    const ups = await readImages(files);
    if (ups.length) patch({ shots: [...state.shots, ...ups] });
  };

  const n = state.shots.length;
  /** The copywriting pass is still in the air, so the cut would come out uncustomised. */
  const waiting = state.research.status === "running";

  return (
    <section className="vc-stage">
      <div className="vc-eyebrow vc-mono">
        Step four <b>of four</b>
      </div>
      <h1>Add your imagery.</h1>
      <p className="vc-lede">
        Faces first — the opening shot is ten portraits at once. Then product
        shots, the office, the team. Around {SUGGESTED_UPLOADS} is plenty; the cut
        has more picture slots than that and reuses photos across scenes.
      </p>

      <div className="vc-shots">
        <FileDrop
          className="vc-bigdrop"
          multiple
          label="Your images"
          onFiles={add}
          inputRef={input}
        >
          <span className="vc-fan">
            <span />
            <span />
            <span />
          </span>
          <h2>Drop your images here</h2>
          <p>Or click to browse. Pasting works too.</p>
        </FileDrop>

        {n > 0 && (
          <div className="vc-grid">
            {state.shots.map((shot, i) => {
              const lands = slotsForUpload(i, n);
              return (
                <div
                  className="vc-tile"
                  key={shot.id}
                  style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
                >
                  <img src={shot.url} alt="" />
                  <button
                    className="vc-kill"
                    aria-label={`Remove ${shot.name}`}
                    onClick={() =>
                      patch({ shots: state.shots.filter((s) => s.id !== shot.id) })
                    }
                  >
                    ✕
                  </button>
                  {lands.length > 0 && (
                    <span className="vc-slot">
                      {imageSlotLabel(lands[0])}
                      {lands.length > 1 ? ` +${lands.length - 1}` : ""}
                    </span>
                  )}
                </div>
              );
            })}
            <button className="vc-addtile" onClick={() => input.current?.click()}>
              ＋<span className="vc-sr">Add more images</span>
            </button>
          </div>
        )}

        {n > 0 && (
          <div className="vc-counter">
            <span>
              {n} image{n === 1 ? "" : "s"} added
            </span>
            <span className="vc-meter">
              <i style={{ width: `${Math.min(100, (n / SUGGESTED_UPLOADS) * 100)}%` }} />
            </span>
            <span className="vc-mono">
              {n >= SUGGESTED_UPLOADS
                ? "Plenty"
                : n >= 10
                  ? "Good range"
                  : `${10 - n} more for ten distinct faces`}
            </span>
          </div>
        )}
      </div>

      <div className="vc-foot">
        <button className="vc-btn" disabled={!buildReady(state)} onClick={onBuild}>
          {waiting ? (
            <>
              <span className="vc-orb" />
              Writing your copy…
            </>
          ) : (
            "Build the video"
          )}
        </button>
        <button className="vc-back" onClick={onBack}>
          ← {backLabel}
        </button>
        {waiting && (
          <span className="vc-hintline">
            Waiting on the copywriting pass — building now would show the demo's
            own words, not {state.company.trim() || "your company"}'s.
          </span>
        )}
      </div>
    </section>
  );
};
