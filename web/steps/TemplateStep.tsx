import React from "react";
import type { WizardState } from "../wizardState";
import { TEMPLATES, type TemplateId } from "../templates";

/**
 * The first step: which cut are we customising?
 *
 * Radio inputs rather than buttons, and that is not incidental. This is a single choice
 * from a short list, which is what a radio group IS — so arrow keys move between the
 * options, the label reads out with the description, and the browser enforces that exactly
 * one is picked. A grid of `<button>`s would have to reimplement all three and would still
 * announce itself wrong to a screen reader.
 *
 * The whole card is the label, so the hit target is the card and not just the dot.
 */
export const TemplateStep: React.FC<{
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  onNext: () => void;
}> = ({ state, patch, onNext }) => {
  const seconds = (frames: number, fps: number) => Math.round(frames / fps);

  return (
    <section className="vc-stage">
      <div className="vc-eyebrow vc-mono">
        Step one <b>of five</b>
      </div>
      <h1>Which video are you making?</h1>
      <p className="vc-lede">
        Every answer after this one — the company, the logo, the photos — applies to
        whichever cut you pick. You can come back and switch without losing any of it.
      </p>

      <div className="vc-field">
        <div className="vc-cap">
          <span>Template</span>
          <em className="vc-req">required</em>
        </div>

        <div className="vc-tplgrid" role="radiogroup" aria-label="Video template">
          {TEMPLATES.map((t) => {
            const current = t.id === state.template;
            return (
              <label key={t.id} className={`vc-tpl${current ? " vc-cur" : ""}`}>
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={current}
                  onChange={() => patch({ template: t.id as TemplateId })}
                />
                <span className="vc-tpl-head">
                  <span className="vc-tpl-name">{t.label}</span>
                  <span className="vc-tpl-len vc-mono">
                    {seconds(t.durationInFrames, t.fps)}s
                  </span>
                </span>
                <span className="vc-tpl-blurb">{t.blurb}</span>
                <span className="vc-tpl-detail">{t.detail}</span>
                <span className="vc-tick">✓</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="vc-foot">
        <button className="vc-btn" onClick={onNext}>
          Continue
        </button>
        <span className="vc-hintline">
          {TEMPLATES.find((t) => t.id === state.template)?.label} selected
        </span>
      </div>
    </section>
  );
};
