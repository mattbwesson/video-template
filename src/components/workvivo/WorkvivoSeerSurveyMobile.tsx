import React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoGlassEdge.css";
import "./WorkvivoSeerSurveyMobileStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import { SURVEY_ILLUSTRATION_SVGS } from "./surveyIllustrations";
import { GlassRing } from "./GlassRing";

/**
 * The illustration files, kept as the reference the inlined markup is generated from.
 *
 * Passing `illustrations` still swaps in files by path, which is what the deck stills and
 * the gallery do. Inside the film the INLINED copies are drawn instead — see
 * surveyIllustrations.ts — because a file loaded through `<img>` cannot take the tenant's
 * colour and these drawings have a brand accent in them.
 */
export const DEFAULT_SURVEY_ILLUSTRATIONS = [
  "img/illustration-1.svg",
  "img/illustration-2.svg",
  "img/illustration-3.svg",
];

/**
 * One illustration, tinted with the tenant colour.
 *
 * `color` on the wrapper is the whole mechanism: the generated markup paints its accent
 * with `currentColor`, so it inherits from here, and the line work keeps its own fills.
 */
const Illustration: React.FC<{
  markup: string;
  brand: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ markup, brand, className, style }) => (
  <div
    className={className}
    style={{ color: brand, display: "block", ...style }}
    dangerouslySetInnerHTML={{ __html: markup }}
  />
);

/**
 * Extracted from the Seer pitch deck (Seer Pitch - V2.html) rather than rebuilt: the
 * markup and stylesheet are the deck's own, so this matches the deck exactly. The deck's
 * class prefixes are already namespaced and are kept, so a re-extract from an updated
 * deck diffs cleanly against this file.
 */

/** Deck ids `slide10-survey-q1..q3`; the deck's customiser rewrites these per customer. */
/**
 * The survey's five statements.
 *
 * Kept as an export because the deck stills and the gallery both stage this screen with
 * them; inside the film the component reads `copy.seer.questions` instead, so a
 * researched survey asks about this company's own work rather than these.
 */
export const SEER_SURVEY_QUESTIONS = [
  "I am provided with the necessary tools and resources I need to do my job",
  "My manager gives me regular, helpful feedback on my work",
  "I feel my contributions are recognized and valued by my team",
  "I have good opportunities for career growth and professional development",
  "I would recommend our organization as a great place to work",
];

type FaceKind = "frown" | "meh" | "smile" | "laugh";

const Face: React.FC<{ kind: FaceKind }> = ({ kind }) => {
  const common = {
    viewBox: "0 0 24 24",
    width: 28,
    height: 28,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="10" />
      {kind === "frown" ? <path d="M16 16s-1.5-2-4-2-4 2-4 2" /> : null}
      {kind === "meh" ? <line x1="8" y1="15" x2="16" y2="15" /> : null}
      {kind === "smile" ? <path d="M8 14s1.5 2 4 2 4-2 4-2" /> : null}
      {kind === "laugh" ? (
        <>
          <path d="M18 13a6 6 0 0 1-12 0Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M18 13a6 6 0 0 1-12 0" />
        </>
      ) : null}
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
};

/** The deck's five-point scale. `\n` in the outer labels is a real line break. */
const OPTIONS: { label: string; icon: FaceKind; color: string }[] = [
  { label: "Strongly\nDisagree", icon: "frown", color: "var(--mis-red)" },
  { label: "Disagree", icon: "frown", color: "var(--mis-red-orange)" },
  { label: "Neutral", icon: "meh", color: "var(--mis-amber)" },
  { label: "Agree", icon: "smile", color: "var(--mis-light-green)" },
  { label: "Strongly\nAgree", icon: "laugh", color: "var(--mis-green)" },
];

/**
 * Completion sparkles.
 *
 * Every star keeps its own clock at both ends: it pops in on its `delay`, holds, and
 * leaves again on its `out`. Two earlier versions were wrong in opposite directions — one
 * looped each star forever, so only a handful were ever lit at once, and one faded the
 * whole set on a single curve, which reads as a layer being switched off rather than as a
 * scatter of twinkles. The reference has them all up together, and the burst has a
 * defined end, so the middle of it holds and only the edges are staggered.
 *
 * Positions and sizes are read off that reference, as fractions of the 1920x1080 stage.
 * They hug the device down both sides with a couple over and under it, and deliberately
 * avoid the middle where the artwork sits.
 */
type Sparkle = {
  left: string;
  top: string;
  /** Rendered width on the 1920x1080 stage. */
  size: number;
  /** Frames after completion before this star pops. */
  delay: number;
  /** Frames after completion when it starts to leave. Its own, not the set's. */
  out: number;
  /** Degrees per frame, signed — mixed directions stop the set reading as one rotation. */
  spin: number;
};

/** One light purple for all of them. These are Workvivo's own confetti, not the tenant's
 *  colour, and a single tint is what makes the scatter read as one material. */
const SPARKLE_TINT = "#C4B5FD";

const SPARKLES: Sparkle[] = [
  // above the device
  { left: "40.8%", top: "8.5%", size: 30, delay: 1, out: 20, spin: 2.6 },
  { left: "36.5%", top: "20.0%", size: 19, delay: 8, out: 16, spin: -2.2 },
  // down its left side
  { left: "36.7%", top: "34.3%", size: 32, delay: 3, out: 22, spin: 3.0 },
  { left: "34.1%", top: "63.8%", size: 27, delay: 6, out: 15, spin: -2.4 },
  { left: "37.4%", top: "73.6%", size: 25, delay: 10, out: 19, spin: 3.4 },
  // down its right side
  { left: "65.5%", top: "24.4%", size: 34, delay: 0, out: 17, spin: -3.4 },
  { left: "65.7%", top: "52.0%", size: 25, delay: 5, out: 21, spin: 2.4 },
  { left: "62.2%", top: "57.5%", size: 21, delay: 9, out: 14, spin: -4.0 },
  { left: "63.5%", top: "65.7%", size: 30, delay: 2, out: 18, spin: 2.8 },
  { left: "63.3%", top: "72.0%", size: 23, delay: 7, out: 22, spin: -2.8 },
  { left: "64.2%", top: "78.5%", size: 21, delay: 4, out: 16, spin: 3.6 },
  // under it
  { left: "57.8%", top: "84.6%", size: 21, delay: 10, out: 20, spin: -3.2 },
];

/** Frames one star takes to pop in. */
const SPARKLE_IN = 6;
/** Frames one star takes to leave. */
const SPARKLE_OUT = 5;

/** basic-star.svg's own viewBox, so a star is never drawn out of proportion. */
const STAR_ASPECT = 664.83 / 675.54;

/**
 * `window` is how many frames the whole burst has, counted from the completion screen.
 * The stars are drawn as masked boxes rather than as <img>: basic-star.svg is a solid
 * black path, and a mask is what lets it be painted a chosen colour instead of arriving
 * black or going through a stack of filters guessing at a hue.
 */
const SparkleLayer: React.FC<{ elapsed: number; window: number }> = ({
  elapsed,
  window: span,
}) => {
  const star = staticFile("img/basic-star.svg");
  return (
    <div className="mis-sparkles" aria-hidden>
      {SPARKLES.map((sp, i) => {
        const local = elapsed - sp.delay;
        if (local < 0) return null;

        // Each star arrives AND leaves on its own clock. Keying the exit to the end of the
        // window instead made the set vanish in one movement, which reads as a layer being
        // switched off rather than as a scatter of individual twinkles.
        //
        // `out` is capped so no star can outlive the window however it is retimed: the
        // burst is over when the burst is over.
        const out = Math.min(sp.out, span - SPARKLE_OUT);
        const popIn = interpolate(local, [0, SPARKLE_IN], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fadeOut = interpolate(elapsed, [out, out + SPARKLE_OUT], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const opacity = Math.min(popIn, fadeOut);
        if (opacity <= 0.01) return null;

        // A little past full and back, so it lands rather than simply appearing — and a
        // shrink on the way out, so leaving is the arrival run backwards.
        const scale =
          interpolate(
            local,
            [0, SPARKLE_IN * 0.7, SPARKLE_IN],
            [0.35, 1.12, 1],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ) * interpolate(fadeOut, [0, 1], [0.55, 1]);
        const angle = local * sp.spin;

        return (
          <i
            key={i}
            style={{
              left: sp.left,
              top: sp.top,
              width: sp.size,
              height: sp.size * STAR_ASPECT,
              background: SPARKLE_TINT,
              WebkitMaskImage: `url(${star})`,
              maskImage: `url(${star})`,
              opacity,
              transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${scale})`,
            }}
          />
        );
      })}
    </div>
  );
};

export interface WorkvivoSeerSurveyMobileProps {
  /** Composition size. The mock is scaled to the height given. */
  width?: number;
  height?: number;
  /** Field behind the mock. */
  background?: string;
  /** Natural height of the extracted phone, used to derive the scale. */
  naturalHeight?: number;
  questions?: string[];
  /**
   * Which option each question ends up on, in order. The deck lets you click any of the
   * five; this is what the timeline picks.
   */
  picks?: number[];
  /** Pin the question index for a still. Omit to run the timeline off the frame. */
  step?: number;
  /** Starting question index for the animated timeline (0-indexed, e.g. 3 for Question 4). */
  initialStep?: number;
  /**
   * Pin the answers for a still — one entry per question, `null` for unanswered. Omit to
   * derive them from the timeline.
   */
  answers?: (number | null)[];
  comment?: string;
  /** Frames each question holds before the timeline advances. */
  framesPerQuestion?: number;
  /** Frames into a question before its answer lands. */
  answerAtFrame?: number;
  /** Frame the timeline starts on. */
  startFrame?: number;
  glassBorder?: boolean;
  /**
   * Knockout wordmark for the header, shown on every page of the survey.
   *
   * Taken as a prop rather than read from the customisation context, as WorkvivoSpacePage
   * does it: this component is also mounted by a standalone composition that has no
   * provider over it. The cut passes `logo.onDark`, so a customer run gets theirs.
   */
  logoSrc?: string;
  /** Image paths for each question illustration. Defaults to illustration-1..3.svg */
  illustrations?: string[];
  /** Frame at which the completion screen triggers. Defaults to 102 (global 3673). */
  completeAtFrame?: number | null;
  /**
   * Frame the sparkles are gone by, on the same clock as `completeAtFrame`.
   *
   * 129 is global 3700. Expressed against this timeline rather than as a length so that
   * moving the completion screen does not drag the end of the burst with it — the burst
   * is meant to finish on 3700 whenever it starts.
   */
  sparklesEndAtFrame?: number;
  /** Explicitly show the completion screen. */
  isCompleted?: boolean;
  /** The star burst over the completion screen. */
  showSparkles?: boolean;
}

export const WorkvivoSeerSurveyMobile: React.FC<WorkvivoSeerSurveyMobileProps> = ({
  width = 1920,
  height = 1080,
  background = "#0A0A1E",
  naturalHeight = 844,
  questions,
  picks = [4, 4, 4, 3, 4],
  step,
  initialStep = 3,
  answers,
  comment = "",
  framesPerQuestion = 48,
  answerAtFrame = 19,
  startFrame = 0,
  glassBorder = false,
  logoSrc,
  illustrations,
  completeAtFrame = 102,
  sparklesEndAtFrame = 129,
  isCompleted,
  showSparkles = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { copy, logo, theme } = useCustomization();
  // Only an explicit list falls back to files; by default the inlined, tintable copies win.
  const custom = illustrations;
  const asked = questions ?? copy.seer.questions;
  const mark = logoSrc ?? logo.onDark;
  const total = asked.length;

  // This mock is a phone, not a dashboard: it is taller than it is wide, so it fits to
  // HEIGHT. Fitting to width would blow a 422px phone up to fill 1920 and crop it.
  const scale = (height * 0.92) / naturalHeight;

  // --- the deck's state machine, driven by the frame instead of by clicks -----------
  const elapsed = frame - startFrame;
  const isFinished =
    isCompleted ??
    (completeAtFrame !== null && completeAtFrame !== undefined && elapsed >= completeAtFrame);

  /** The frame completion lands on, which is what the sparkles run from — anchored to
   *  the same value that flips `isFinished` rather than hardcoded, so moving one moves
   *  both. `isCompleted` forces the screen with no timeline, so the burst starts at 0. */
  const completionFrame = isCompleted ? 0 : (completeAtFrame ?? 0);

  const maxStepOffset = Math.max(0, total - 1 - initialStep);
  const stepOffset = Math.min(
    maxStepOffset,
    Math.max(0, Math.floor(elapsed / framesPerQuestion)),
  );
  const timelineStep = initialStep + stepOffset;
  const idx = step ?? timelineStep;
  const localFrame = elapsed - stepOffset * framesPerQuestion;

  /** Answered questions stay answered; the current one lands part-way through its hold. */
  const derivedAnswers: (number | null)[] = asked.map((_, i) => {
    if (step !== undefined) return i < idx ? (picks[i] ?? null) : null;
    if (i < initialStep) return picks[i] ?? 4;
    if (i < timelineStep) return picks[i] ?? null;
    if (i === timelineStep && localFrame >= answerAtFrame) return picks[i] ?? null;
    return null;
  });
  const state = answers ?? derivedAnswers;
  const answer = state[idx] ?? null;

  const isLast = idx === total - 1;

  // The deck's fill carries `transition: width 350ms cubic-bezier(.16,1,.3,1)`. A CSS
  // transition cannot survive frame-by-frame seeking, so the same curve is run in JS.
  const transitionFrames = Math.max(1, Math.round((350 / 1000) * fps));
  const targetPct = ((idx + 1) / total) * 100;
  const prevPct = (idx / total) * 100;
  const progressPct = isFinished
    ? 100
    : step !== undefined || idx === initialStep
      ? targetPct
      : interpolate(localFrame, [0, transitionFrames], [prevPct, targetPct], {
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <div
      className="wsi-seersurveymobile"
      style={
        {
          width,
          height,
          overflow: "hidden",
          background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        } as React.CSSProperties
      }
    >
      {isFinished && showSparkles ? (
        <SparkleLayer
          elapsed={elapsed - completionFrame}
          window={sparklesEndAtFrame - completionFrame}
        />
      ) : null}
      <div
        style={{
          flex: "none",
          transform: "scale(" + scale + ")",
          transformOrigin: "center center",
        }}
      >
        <div className="mis-survey" data-mis-root="">
          {/* The glass edge is a BEZEL around the phone, not a ring on it.
              `wv-glass-edge` draws its rings outside the box it is put on, using
              ::before/::after — and .mis-phone clips its own overflow, so those rings were
              being cut away entirely and nothing was drawn. `wv-glass-phone` is the
              treatment meant for phones: this wrapper's padding IS the bezel, with the
              band gradient showing through it and the stroke drawn inside its own edge,
              so the clip never touches it. Same 16.5px the other phones in the cut use. */}
          <div
            className={glassBorder ? "mis-bezel wv-glass-phone" : undefined}
            style={
              glassBorder
                ? ({
                    ["--wv-glass-radius" as string]: "60.5px",
                  } as React.CSSProperties)
                : undefined
            }
          >
                <GlassRing />
          <div className="mis-phone">
            <div className="mis-header">
              <div className="mis-statusbar">
                <span>9:41</span>
                <div>
                  <svg width="17" height="11" viewBox="0 0 17 11" fill="white">
                    <rect x="0" y="7" width="3" height="4" rx="0.5"></rect>
                    <rect x="4.5" y="5" width="3" height="6" rx="0.5"></rect>
                    <rect x="9" y="3" width="3" height="8" rx="0.5"></rect>
                    <rect x="13.5" y="0.5" width="3" height="10.5" rx="0.5"></rect>
                  </svg>
                  <svg width="16" height="11" viewBox="0 0 16 11" fill="white">
                    <path d="M8 11l2-2.5a2.5 2.5 0 0 0-4 0L8 11zM8 7a4.5 4.5 0 0 0-3.5 1.7l-1-1.2a6 6 0 0 1 9 0l-1 1.2A4.5 4.5 0 0 0 8 7zM8 3.5a8 8 0 0 0-6 2.7L0.8 5a9.5 9.5 0 0 1 14.4 0L14 6.2A8 8 0 0 0 8 3.5z"></path>
                  </svg>
                  <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
                    <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="white" strokeOpacity="0.5"></rect>
                    <rect x="2" y="2" width="19" height="8" rx="1.5" fill="white"></rect>
                    <rect x="23.5" y="4" width="1.5" height="4" rx="0.5" fill="white" fillOpacity="0.5"></rect>
                  </svg>
                </div>
              </div>
              <div className="mis-titlebar">
                <button
                  className="mis-back"
                  aria-label="Back"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                {/* The tenant's mark, on every page rather than only the last one. It was
                    a "Virgin" wordmark hand-set in a cursive system font on the completion
                    screen and the words "Manager Insights" everywhere else; the reference
                    carries the real logo throughout, and a drawn approximation of somebody
                    else's wordmark had no business being here in any case. */}
                <img className="mis-logo" src={mark} alt="" />
                <div style={{ width: "26px" }}></div>
              </div>
            </div>

            <div className="mis-scroll">
              <div className="mis-progress-row">
                <div className="mis-progress-track">
                  <div
                    className="mis-progress-fill"
                    data-mis-progress=""
                    style={{ width: isFinished ? "100%" : progressPct + "%" }}
                  ></div>
                </div>
                <div className="mis-progress-text" data-mis-count="">
                  {isFinished ? "5/5" : `${idx + 1}/${total}`}
                </div>
              </div>

              {isFinished ? (
                <div className="mis-completion-wrap">
                  <div className="mis-completion-illustration">
                    {custom ? (
                      <img src={staticFile(custom[2] ?? custom[0])} alt="Survey Completed" />
                    ) : (
                      <Illustration
                        markup={SURVEY_ILLUSTRATION_SVGS[2]}
                        brand={theme.brand}
                      />
                    )}
                  </div>
                  <h2 className="mis-completion-title">Survey Completed</h2>
                  <p className="mis-completion-desc">
                    Thanks for taking the time to complete our survey. Your feedback is important to us.
                  </p>
                  <button className="mis-btn-close" type="button">
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mis-illustration">
                    {custom ? (
                      <img
                        src={staticFile(custom[idx % custom.length] ?? custom[0])}
                        alt={`Survey illustration ${idx + 1}`}
                        style={{
                          height: "120px",
                          maxWidth: "200px",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    ) : (
                      <Illustration
                        markup={
                          SURVEY_ILLUSTRATION_SVGS[idx % SURVEY_ILLUSTRATION_SVGS.length]
                        }
                        brand={theme.brand}
                      />
                    )}
                  </div>

                  <div className="mis-question" data-vc-slot="seer.survey">
                    <div className="mis-q-badge" data-mis-badge="">{idx + 1}</div>
                    <div className="mis-q-text" data-mis-text="">{asked[idx]}</div>
                  </div>

                  <div className="mis-options" data-mis-options="">
                    {OPTIONS.map((opt, i) => (
                      <button
                        key={opt.label}
                        className={answer === i ? "mis-option mis-selected" : "mis-option"}
                        type="button"
                      >
                        <div className="mis-radio"><div className="mis-radio-dot" /></div>
                        <div style={{ color: opt.color }}>
                          <Face kind={opt.icon} />
                        </div>
                        <div className="mis-option-label" style={{ whiteSpace: "pre-line" }}>
                          {opt.label}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mis-comment-wrap">
                    <textarea
                      className="mis-comment"
                      data-mis-comment=""
                      placeholder="Add Comment"
                      value={comment}
                      readOnly
                    ></textarea>
                  </div>
                </>
              )}
            </div>

            {!isFinished && (
              <div className="mis-buttons">
                <button className="mis-btn-prev" data-mis-prev="" disabled={idx === 0}>
                  Previous
                </button>
                <button className="mis-btn-skip" data-mis-skip="" disabled={isLast}>
                  Skip
                </button>
                <button
                  className="mis-btn-next"
                  data-mis-next=""
                  disabled={answer === null}
                >
                  {isLast ? "Submit" : "Next"}
                </button>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
