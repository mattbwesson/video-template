import React from "react";
import { FileDrop } from "../Dropzone";
import { readOneImage } from "../uploads";
import { personReady, type WizardState } from "../wizardState";

export const PersonStep: React.FC<{
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  backLabel: string;
}> = ({ state, patch, onNext, onBack, backLabel }) => {
  const ready = personReady(state);

  const setPhoto = async (files: FileList | File[]) => {
    const up = await readOneImage(files);
    if (up) patch({ person: { ...state.person, photo: up } });
  };

  // Enter advances from either field, matching the hint under the button.
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (ready) onNext();
  };

  return (
    <section className="vc-stage">
      <div className="vc-eyebrow vc-mono">
        Step two <b>of four</b>
      </div>
      <h1>Who is the main character?</h1>
      <p className="vc-lede">
        The person this video speaks to. Their headshot, name and title carry
        the middle of the cut — they are the signed-in face on every screen.
      </p>

      <div className="vc-field">
        <div className="vc-cap">
          <span>Their headshot, name and title</span>
          <em className="vc-req">required</em>
        </div>
        <div className="vc-person">
          <FileDrop
            className={`vc-avatar${state.person.photo ? " vc-has" : ""}`}
            label="Headshot"
            onFiles={setPhoto}
          >
            {state.person.photo ? (
              <>
                <img src={state.person.photo.url} alt="Headshot" />
                <span className="vc-swap">replace</span>
              </>
            ) : (
              <span className="vc-mono">
                add
                <br />
                headshot
              </span>
            )}
          </FileDrop>
          <div className="vc-pfields">
            <label className="vc-sr" htmlFor="pname">
              Their name
            </label>
            <input
              id="pname"
              className="vc-midin"
              placeholder="Their name"
              autoComplete="off"
              value={state.person.name}
              onChange={(e) =>
                patch({ person: { ...state.person, name: e.target.value } })
              }
              onKeyDown={onKeyDown}
            />
            <label className="vc-sr" htmlFor="ptitle">
              Their title
            </label>
            <input
              id="ptitle"
              className="vc-midin"
              placeholder="Their title"
              autoComplete="off"
              value={state.person.title}
              onChange={(e) =>
                patch({ person: { ...state.person, title: e.target.value } })
              }
              onKeyDown={onKeyDown}
            />
          </div>
        </div>
        <p className="vc-subhint vc-below">
          A square-ish crop with the face high in the frame works best — every
          place it appears is a circle.
        </p>
      </div>

      <div className="vc-foot">
        <button className="vc-btn" disabled={!ready} onClick={onNext}>
          Continue
        </button>
        <button className="vc-back" onClick={onBack}>
          ← {backLabel}
        </button>
      </div>
    </section>
  );
};
