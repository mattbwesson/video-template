import React from "react";
import "./WorkvivoSurveyBuilderStyles.css";
import "./WorkvivoFormIcons";
import { PlacedSvg, SymbolSvg } from "./symbolRegistry";
import { useT } from "../../customize/uiStrings";
import { useCustomization } from "../../customize/CustomizationProvider";

/**
 * Workvivo Surveys & Forms builder — the "Create a Survey or Form with Workvivo AI" modal,
 * the Add Question palette and the per-question action bar.
 *
 * Every number here is MEASURED from the reference at 1920x1080, global frame 4392; see the
 * stylesheet's header for the three panel rects the rest hangs off.
 *
 * ONE LAYOUT, SCALED — NOT TWO LAYOUTS
 * The modal plays this beat at 1.563x and settles at 1.0x, and it was worth checking which
 * of those two things that is. Measured, the title's ink narrows by 0.6449 while the modal
 * narrows by 0.6396 — the same figure within 1% — so it is a single layout being scaled,
 * and the component is built once at the size it finally rests at. The alternative, two
 * layouts swapped at the cut, would have needed the type to be sized twice and would have
 * drifted the moment either was touched.
 *
 * COLLAPSED VS EXPANDED IS HEIGHT, NOT CONTENT
 * The modal renders its whole content always and is clipped by its own height, which the
 * caller animates from 367 to 820. That is what the reference does — the survey body is
 * revealed by the card growing, not swapped in — and it means there is no frame on which
 * the two versions could disagree.
 *
 * THE TEN QUESTION-TYPE GLYPHS
 * Supplied artwork, in public/img/page-icons/, registered into the shared symbol registry
 * by WorkvivoFormIcons — so they are part of the icon library and `<Icon href="#i-form-…">`
 * reaches them from anywhere, not just from here. They replaced a drawn set that stood in
 * while there was no artwork.
 *
 * They are `paint`ed rather than coloured by CSS. `currentColor` reaching a path is
 * inheritance, and the exporter does not reliably resolve it; SymbolSvg's `paint` prop
 * substitutes the literal into the markup instead. See symbolRegistry.tsx's header.
 */

export const SURVEY_BOARD_W = 1920;
export const SURVEY_BOARD_H = 1080;

/** The three panels, at the size the beat settles to. */
export const PANEL = {
  palette: { x: 378, y: 167, w: 380, h: 650 },
  bar: { x: 378, y: 865, w: 380, h: 62 },
  modal: { x: 816, y: 135, w: 741 },
} as const;

/** Modal heights, in the same design units. The caller animates between them. */
export const MODAL_H_COLLAPSED = 367;
export const MODAL_H_EXPANDED = 820;

const PURPLE = "#5a12d6";

/** The palette, in the reference's order. */
const QUESTION_TYPES: [string, string][] = [
  ["short-text", "Short Text"],
  ["paragraph", "Paragraph"],
  ["multiple-choice", "Multiple Choice"],
  ["checkbox", "Checkbox"],
  ["number-line", "Number Line"],
  ["enps", "eNPS"],
  ["file-upload", "File Upload"],
  ["date-time", "Date and Time"],
  ["dropdown", "Dropdown"],
  ["contact-field", "Contact Field"],
];

/** First row centre and the pitch between rows, both measured. */
const ROW_FIRST_CY = 77.5;
const ROW_PITCH = 58.75;

export const WorkvivoAddQuestionPanel: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const t = useT();
  return (
    <div
      className="wsb-card"
      style={{ left: PANEL.palette.x, top: PANEL.palette.y, width: PANEL.palette.w, height: PANEL.palette.h, ...style }}>
      <div className="wsb-aq-title">{t("Add Question")}</div>
      {QUESTION_TYPES.map(([kind, label], i) => (
        <div key={kind} className="wsb-row" style={{ top: ROW_FIRST_CY + i * ROW_PITCH - 23 }}>
          <div className="wsb-row-icon">
            {/* SymbolSvg rather than the Icon wrapper: only it takes `paint`, and these
                glyphs must be painted rather than inherit a colour. */}
            <SymbolSvg href={`#i-form-${kind}`} width={20} height={20} paint={PURPLE} />
          </div>
          <div className="wsb-row-label">{t(label)}</div>
        </div>
      ))}
    </div>
  );
};

/** Where the action bar's two glyphs sit, 21px left of their label, and their 15px box. */
const GLYPH_AT: React.CSSProperties = { position: "absolute", left: -21, top: 1 };
const GLYPH_BOX = { width: 15, height: 15 };

export const WorkvivoQuestionActionBar: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const t = useT();
  return (
    <div
      className="wsb-card"
      style={{ left: PANEL.bar.x, top: PANEL.bar.y, width: PANEL.bar.w, height: PANEL.bar.h, ...style }}>
      <div className="wsb-bar-required">{t("Required")}</div>
      <div className="wsb-toggle">
        <div className="wsb-toggle-knob" />
      </div>
      <div className="wsb-bar-rule" />
      {/* The two glyphs are placed through PlacedSvg, never as positioned svgs: an inline
          `left:-21px; top:1px` on the root moved both out of their viewport in the export —
          Duplicate and Delete shipped with no icon. */}
      <div className="wsb-bar-action" style={{ left: 212, color: PURPLE }}>
        <PlacedSvg style={GLYPH_AT} box={GLYPH_BOX}>
          {(svgStyle) => (
            <svg viewBox="0 0 16 16" width="15" height="15" style={svgStyle}>
              <rect x="2" y="2" width="9" height="9" rx="1.8" fill="none" stroke={PURPLE} strokeWidth="1.4" />
              <path d="M5.4 13.6h6.4a1.8 1.8 0 0 0 1.8-1.8V5.4" fill="none" stroke={PURPLE} strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          )}
        </PlacedSvg>
        {t("Duplicate")}
      </div>
      <div className="wsb-bar-action" style={{ left: 319, color: "#d23f3f" }}>
        <PlacedSvg style={GLYPH_AT} box={GLYPH_BOX}>
          {(svgStyle) => (
            <svg viewBox="0 0 16 16" width="15" height="15" style={svgStyle}>
              <path d="M2.6 4.2h10.8M6.4 4.2V2.9h3.2v1.3M4.2 4.2l.7 8.6a1.2 1.2 0 0 0 1.2 1.1h3.8a1.2 1.2 0 0 0 1.2-1.1l.7-8.6" fill="none" stroke="#d23f3f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </PlacedSvg>
        {t("Delete")}
      </div>
    </div>
  );
};

/** The four prompt suggestions, with the measured width of each. */
const PILLS: [string, number, number, number][] = [
  ["Create a fun survey", 0, 187, 167],
  ["Gauge employee sentiment", 175, 187, 222],
  ["Plan future improvements", 405, 187, 209],
  ["Gather insights on trends", 0, 230, 207],
];

const SCALE_X0 = 64;
const SCALE_PITCH = 57.7;

export const WorkvivoSurveyAiModal: React.FC<{
  /** Index of the selected suggestion, or null before one is chosen. */
  selected?: number | null;
  /** Card height in design units — animate between MODAL_H_COLLAPSED and MODAL_H_EXPANDED. */
  height?: number;
  /**
   * Opacity of the generated survey. Separate from `height` on purpose: the card is not
   * merely clipping the body while collapsed, it is not showing it — at 367 units tall
   * there is room for the section heading and the reference has none, so the body has to
   * be gated rather than cropped.
   */
  body?: number;
  /** Label on the call to action; the reference switches it once the survey exists. */
  cta?: string;
  style?: React.CSSProperties;
}> = ({ selected = null, height = MODAL_H_EXPANDED, body = 1, cta = "Redo Survey", style }) => {
  const t = useT();
  const { copy } = useCustomization();
  return (
    <div
      className="wsb-card"
      style={{ left: PANEL.modal.x, top: PANEL.modal.y, width: PANEL.modal.w, height, ...style }}>
      <div className="wsb-modal-title">{t("Create a Survey or Form with Workvivo AI")}</div>
      <svg className="wsb-close" viewBox="0 0 16 16">
        <path d="M3 3l10 10M13 3L3 13" stroke="#3a3a55" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* The one line in this modal the model writes. The survey it generates below is
          Workvivo's own example of what the feature produces and stays fixed; see the
          note on `surveyBuilder` in src/customize/videoCopy.ts. */}
      <div className="wsb-field" style={{ top: 68, height: 103 }} data-vc-slot="surveyBuilder.request">
        <div className="wsb-field-text">{t(copy.surveyBuilder.prompt)}</div>
      </div>

      {PILLS.map(([label, x, y, w], i) => (
        <div
          key={label}
          className={`wsb-pill${selected === i ? " wsb-pill-on" : ""}`}
          style={{ left: 25 + x, top: y, width: w }}>
          {t(label)}
        </div>
      ))}

      <div style={{ opacity: body }}>
      <div className="wsb-h2" style={{ top: 297 }}>{t("Company-Wide Employee Sentiment Survey")}</div>
      <div className="wsb-body" style={{ top: 334 }}>
        {t(
          "This survey is designed to gauge the overall sentiment of our employees across the company. " +
            "Your honest feedback helps leadership make informed decisions to improve our workplace " +
            "culture, processes, and overall employee experience. All responses are anonymous and greatly " +
            "appreciated.",
        )}
      </div>

      <div className="wsb-badge" style={{ top: 440 }}>1</div>
      <div className="wsb-item" style={{ top: 442 }}>{t("Welcome & Purpose")}</div>

      <div className="wsb-badge" style={{ top: 491 }}>2</div>
      <div className="wsb-item" style={{ top: 493 }}>{t("How would you rate your overall job satisfaction?")}</div>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="wsb-scale" style={{ left: SCALE_X0 + i * SCALE_PITCH, top: 526 }}>
          {i + 1}
        </div>
      ))}

      <div className="wsb-badge" style={{ top: 603 }}>3</div>
      <div className="wsb-item" style={{ top: 605 }}>{t("How do you currently feel about working at this company?")}</div>
      <div className="wsb-field" style={{ top: 642, height: 93 }}>
        <div className="wsb-field-placeholder">{t("Enter description")}</div>
      </div>
      </div>

      <div className="wsb-cta">{t(cta)}</div>
    </div>
  );
};

/** The whole screen at rest, for the gallery and for a still. */
export const WorkvivoSurveyBuilder: React.FC = () => (
  <div className="wsb">
    <WorkvivoAddQuestionPanel />
    <WorkvivoQuestionActionBar />
    <WorkvivoSurveyAiModal selected={1} />
  </div>
);
