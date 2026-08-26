import React from "react";
import { companyReady, type WizardState } from "../wizardState";

export const CompanyStep: React.FC<{
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  onNext: () => void;
}> = ({ state, patch, onNext }) => {
  const ready = companyReady(state);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (ready) onNext();
  };

  return (
    <section className="vc-stage">
      <div className="vc-eyebrow vc-mono">
        Step one <b>of four</b>
      </div>
      <h1>Who is this video for?</h1>
      <p className="vc-lede">
        The company it is being cut for. Their name goes on screen and into
        every line of copy the video speaks.
      </p>

      <div className="vc-field">
        <div className="vc-cap">
          <span>Company name</span>
          <em className="vc-req">required</em>
        </div>
        <label className="vc-sr" htmlFor="company">
          Company name
        </label>
        <input
          id="company"
          className="vc-bigin"
          placeholder="Northwind Logistics"
          autoComplete="off"
          value={state.company}
          onChange={(e) => patch({ company: e.target.value })}
          onKeyDown={onKeyDown}
        />
      </div>

      <div className="vc-field">
        <div className="vc-cap">
          <span>Anything else we should know?</span>
          <em>optional</em>
        </div>
        <p className="vc-subhint">
          Saved with the project for the copywriting pass. It does not change
          anything you will see in the preview yet.
        </p>
        <label className="vc-sr" htmlFor="ctx">
          Additional context
        </label>
        <textarea
          id="ctx"
          className="vc-ctx"
          placeholder="What they care about, the deal you are working, anything the copy should know. A sentence is plenty."
          value={state.context}
          onChange={(e) => patch({ context: e.target.value })}
        />
      </div>

      <div className="vc-foot">
        <button className="vc-btn" disabled={!ready} onClick={onNext}>
          Continue
        </button>
        <span className="vc-hintline">Press Enter to continue</span>
      </div>
    </section>
  );
};
