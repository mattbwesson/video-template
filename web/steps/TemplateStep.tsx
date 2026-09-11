import React, { useState } from "react";
import type { Patch, WizardState } from "../wizardState";
import { TEMPLATES, templateForPillars, type TemplateId } from "../templates";
import { lengthOf, WINDOWS } from "../../src/cuts/plan";

/**
 * The first step: what should the film cover?
 *
 * It asks the question the other way round from how it used to. This was "pick one pillar
 * or several", starting from one ticked box, which frames the film as something an operator
 * assembles. It is not — it is a finished 212-second edit with three chapters in it, and
 * the real decision is whether any of them is irrelevant to the prospect. So every chapter
 * starts ON and the operator turns things OFF, which is both the truthful framing and the
 * one that produces the better default for someone who just clicks Continue.
 *
 * WHAT THE TIMELINE IS FOR. Ticking a box used to change a number in the footer, and a
 * number is a poor way to feel a cut getting shorter. The strip is the film to scale: two
 * hatched blocks for the opening and the ending, which are in every version and cannot be
 * turned off, and one coloured block per chapter sized by its actual length. Turning a
 * chapter off collapses its block and the rest widen into the space, so the shape of what
 * is being made is visible before anyone commits to it.
 *
 * Every number on this screen comes from `src/cuts/plan.ts` — the same module `CombinedCut`
 * lays the windows down from and the renderer sizes its encode with. Nothing here is
 * written down twice: a chapter's block, its row and the runtime are all the one length,
 * so this page cannot promise a film the render does not produce.
 *
 * Real `<input type="checkbox">`es inside `<label>`s, and that is not incidental. This is a
 * set of independent yes/no answers, which is what a checkbox group IS — so each one
 * toggles on its own, announces its own state, and reads out with its label. The input is
 * made invisible and left covering its row rather than removed, because `display:none`
 * would take it out of the tab order; a `<button role="checkbox">` would have to
 * reimplement all of that and starts with no accessible name at all.
 */

/**
 * A running time, as a clock — "1:42".
 *
 * m:ss rather than a raw second count. "102s" is a number, and a number next to a title
 * reads as a quantity of something; an operator ticking boxes is watching a LENGTH grow,
 * and a colon is what says so without a unit label.
 */
const clock = (frames: number, fps: number): string => {
  const total = Math.round(frames / fps);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * The two windows every version carries: the film's opening and its ending.
 *
 * "Shell" because that is what they are — the film's own front and back, which no selection
 * can remove. Drawn hatched rather than coloured on the strip and called out in a line
 * under it, so their share of the runtime is accounted for rather than silently inflating
 * every chapter's.
 */
const SHELL = ["intro", "outro"] as const;

const TICK = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 12.5l5.2 5.2L20 7"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CHEVRON = (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" aria-hidden="true">
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

export const TemplateStep: React.FC<{
  state: WizardState;
  patch: Patch;
  onNext: () => void;
}> = ({ state, patch, onNext }) => {
  const picked = state.pillars;
  const kept = picked.length;
  const all = kept === TEMPLATES.length;
  const none = kept === 0;

  /** Which chapter's detail is open. One at a time — it is a chooser, not a document. */
  const [open, setOpen] = useState<TemplateId | null>(null);
  /** Which row the pointer is over, so its slice of the strip can light up. */
  const [hot, setHot] = useState<TemplateId | null>(null);

  /**
   * Tick or untick one chapter.
   *
   * The new list is filtered out of `TEMPLATES` rather than appended to, so it is always in
   * the film's own order whatever order the boxes were clicked in. Nothing downstream
   * depends on that — `templateForPillars` orders them again — but state that is already
   * in the right order is state nobody has to remember to sort.
   *
   * It reads `s.pillars` from the UPDATER rather than `picked` from this render, and that
   * is load-bearing rather than stylistic. Unticking two chapters in quick succession puts
   * both clicks in one React batch; computing from `picked` meant both read the same stale
   * list and the second click undid the first, leaving a chapter ticked that the operator
   * had just turned off — and the render then encoded it.
   */
  const toggle = (id: TemplateId) =>
    patch((s) => ({
      pillars: TEMPLATES.map((t) => t.id as TemplateId).filter((t) =>
        t === id ? !s.pillars.includes(id) : s.pillars.includes(t),
      ),
    }));

  // The film these ticks currently add up to. Resolved here as well as on the reveal
  // screen, from the same function, so the length promised on this page is the length that
  // comes out the other end.
  const cut = templateForPillars(picked);
  const fps = cut.fps;
  const shellFrames = SHELL.reduce((a, key) => a + lengthOf(WINDOWS[key]), 0);
  const time = none ? "0:00" : clock(cut.durationInFrames, fps);

  const title = none
    ? "No chapters yet"
    : all
      ? "The complete film"
      : kept === 1
        ? "A single chapter cut"
        : "A two chapter cut";

  const sub = none
    ? "Turn a chapter back on to build something."
    : all
      ? "Every chapter, in the order it was edited."
      : "The opening, the chapters you kept, then the ending.";

  return (
    <section className="vc-stage">
      <div className="vc-eyebrow vc-mono">
        Step one <b>of five</b>
      </div>
      <h1>What should the film cover?</h1>
      <p className="vc-lede">
        The film has three chapters and covers all of them. Turn off anything that will
        not be relevant and the rest stitch back together. Every answer after this one —
        the company, the logo, the photos — applies to whichever chapters you keep.
      </p>

      <section className={`vc-film${all ? " vc-whole" : ""}`}>
        <div className="vc-fhead">
          <div>
            <h2>{title}</h2>
            <p>{sub}</p>
          </div>
          <div className="vc-runtime">
            <span className="vc-t vc-num">{time}</span>
            <span className="vc-l vc-mono">Runtime</span>
          </div>
        </div>

        {/* Decorative: it is the same information as the rows below, drawn to scale, and a
            screen reader reading it out would be reading the list twice. */}
        <div className="vc-strip" aria-hidden="true">
          <div
            className="vc-seg vc-fixed"
            style={{ "--w": lengthOf(WINDOWS.intro) } as React.CSSProperties}
          >
            <span className="vc-seglen vc-mono">
              {clock(lengthOf(WINDOWS.intro), fps)}
            </span>
            <span className="vc-seglab">Opening</span>
          </div>
          {TEMPLATES.map((t, i) => {
            const id = t.id as TemplateId;
            const frames = lengthOf(WINDOWS[id]);
            const on = picked.includes(id);
            return (
              <div
                key={t.id}
                className={`vc-seg vc-ch${on ? "" : " vc-off"}${hot === id ? " vc-hot" : ""}`}
                style={
                  {
                    "--w": frames,
                    "--c": `var(--chapter-${i + 1}, var(--accent))`,
                  } as React.CSSProperties
                }
              >
                <span className="vc-seglen vc-mono">{clock(frames, fps)}</span>
                <span className="vc-seglab">{t.pillar.replace(" & ", " + ")}</span>
              </div>
            );
          })}
          <div
            className="vc-seg vc-fixed"
            style={{ "--w": lengthOf(WINDOWS.outro) } as React.CSSProperties}
          >
            <span className="vc-seglen vc-mono">
              {clock(lengthOf(WINDOWS.outro), fps)}
            </span>
            {/* "End", not "Ending": this is the narrowest block on the strip — the ending
                is twelve seconds of a three-minute film — and the longer word ellipsises. */}
            <span className="vc-seglab">End</span>
          </div>
        </div>
        <p className="vc-shelline">
          The opening and the ending ({clock(shellFrames, fps)}) are in every version.
        </p>

        <ul className="vc-chs" role="group" aria-label="Chapters to include">
          {TEMPLATES.map((t, i) => {
            const id = t.id as TemplateId;
            const on = picked.includes(id);
            return (
              <li
                key={t.id}
                style={
                  {
                    "--c": `var(--chapter-${i + 1}, var(--accent))`,
                  } as React.CSSProperties
                }
              >
                <label
                  className="vc-row"
                  onMouseEnter={() => setHot(id)}
                  onMouseLeave={() => setHot((h) => (h === id ? null : h))}
                >
                  <input
                    type="checkbox"
                    name="chapters"
                    value={t.id}
                    checked={on}
                    onChange={() => toggle(id)}
                    onFocus={() => setHot(id)}
                    onBlur={() => setHot((h) => (h === id ? null : h))}
                  />
                  <span className="vc-box">{TICK}</span>
                  <span className="vc-rbody">
                    <b>{t.pillar}</b>
                    <span>{t.blurb}</span>
                  </span>
                  <span className="vc-rlen vc-num">
                    {clock(lengthOf(WINDOWS[id]), fps)}
                  </span>
                </label>
                <button
                  className="vc-more"
                  aria-expanded={open === id}
                  onClick={() => setOpen((o) => (o === id ? null : id))}
                >
                  What is in it {CHEVRON}
                </button>
                <div className={`vc-det${open === id ? " vc-open" : ""}`}>
                  <div>
                    <p>{t.detail}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="vc-act">
        {/* Disabled rather than hidden, and paired with the line beside it: a button that
            vanishes when the last box is unticked leaves nothing to explain why. */}
        <button className="vc-btn" onClick={onNext} disabled={none}>
          <span>{all ? "Continue with the full film" : "Continue with this cut"}</span>
          {!none && <span className="vc-num vc-gotime">{time}</span>}
        </button>
        <span className="vc-hintline">
          {none
            ? "Keep at least one chapter to carry on."
            : "You can change this later without losing your other answers."}
        </span>
      </div>
    </section>
  );
};
