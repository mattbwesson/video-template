import React from "react";
import type { WizardState } from "../wizardState";
import { TEMPLATES, templateForPillars, type TemplateId } from "../templates";

/**
 * The first step: which of the film's three pillars is this video about?
 *
 * One or more. Ticking a single box gives that pillar's own approved cut, exactly as this
 * step did when it was a single choice; ticking two or three gives one video with the
 * film's opening at the front, the chosen chapters in the film's own order, and the film's
 * ending at the back. The card that resolves to is worked out by `templateForPillars`, and
 * the footer below shows its running time so the consequence of a tick is visible before
 * anyone commits to it.
 *
 * Checkboxes rather than buttons, and that is not incidental. This is a set of independent
 * yes/no answers, which is what a checkbox group IS — so each one toggles on its own,
 * announces its own state to a screen reader, and reads out with its label. A grid of
 * `<button aria-pressed>`s would have to reimplement all of that and would still be a
 * worse fit for what is being asked.
 *
 * It was a radio group until the wizard learned to combine pillars. The mechanical
 * difference is small — `type="checkbox"`, and a `role="group"` in place of the
 * `radiogroup`, since a group of checkboxes is not one choice and should not be arrowed
 * through as if it were — but the two must not be mixed up: a radio that cannot be
 * unticked is right for "pick a cut" and wrong for "pick the chapters".
 */

/**
 * A cut's running time, as a clock — "1:42".
 *
 * m:ss rather than a raw second count. "102s" is a number, and a number next to a title
 * reads as a quantity of something; an operator ticking boxes is watching a LENGTH grow,
 * and a colon is what says so without a unit label.
 */
const runtime = (frames: number, fps: number): string => {
  const total = Math.round(frames / fps);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export const TemplateStep: React.FC<{
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  onNext: () => void;
}> = ({ state, patch, onNext }) => {
  const picked = state.pillars;
  const none = picked.length === 0;

  /**
   * Tick or untick one pillar.
   *
   * The new list is filtered out of `TEMPLATES` rather than appended to, so it is always in
   * the film's own order whatever order the boxes were clicked in. Nothing downstream
   * depends on that — `templateForPillars` orders them again — but state that is already
   * in the right order is state nobody has to remember to sort.
   */
  const toggle = (id: TemplateId) => {
    const next = TEMPLATES.map((t) => t.id as TemplateId).filter((t) =>
      t === id ? !picked.includes(id) : picked.includes(t),
    );
    patch({ pillars: next });
  };

  // The film these ticks currently add up to. Resolved here as well as on the reveal
  // screen, from the same function, so the length promised on this page is the length that
  // comes out the other end.
  const cut = templateForPillars(picked);

  return (
    <section className="vc-stage">
      <div className="vc-eyebrow vc-mono">
        Step one <b>of five</b>
      </div>
      <h1>What is this video about?</h1>
      <p className="vc-lede">
        Pick one pillar or several. Several are stitched into a single video — the film's
        opening, the chapters you chose, then its ending. Every answer after this one — the
        company, the logo, the photos — applies to whichever chapters you pick, and you can
        come back and change them without losing any of it.
      </p>

      <div className="vc-field">
        <div className="vc-cap">
          <span>Pillars</span>
          <em className="vc-req">one or more</em>
        </div>

        <div className="vc-tplgrid" role="group" aria-label="Pillars to include">
          {TEMPLATES.map((t) => {
            const current = picked.includes(t.id as TemplateId);
            return (
              <label key={t.id} className={`vc-tpl${current ? " vc-cur" : ""}`}>
                <input
                  type="checkbox"
                  name="pillars"
                  value={t.id}
                  checked={current}
                  onChange={() => toggle(t.id as TemplateId)}
                />
                <span className="vc-tpl-head">
                  <span className="vc-tpl-name">{t.label}</span>
                  <span className="vc-tpl-len vc-mono">
                    {runtime(t.durationInFrames, t.fps)}
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
        {/* Disabled rather than hidden, and paired with the line beside it: a button that
            vanishes when the last box is unticked leaves nothing to explain why. */}
        <button className="vc-btn" onClick={onNext} disabled={none}>
          Continue
        </button>
        <span className="vc-hintline">
          {none ? (
            "Pick at least one pillar."
          ) : (
            <>
              {cut.label} · <span className="vc-mono">{runtime(cut.durationInFrames, cut.fps)}</span>
              {picked.length > 1 ? " as one video" : ""}
            </>
          )}
        </span>
      </div>
    </section>
  );
};
