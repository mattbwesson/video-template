import React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import "./WorkvivoJourneyPhoneStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";

/**
 * Workvivo Journeys — the mobile journey detail screen, at its native 393pt.
 *
 * Authored from the supplied Figma CSS, normalised off its 1.0534 scale factor onto the
 * 393pt frame (see the stylesheet header for the table). SF Pro, not Inter: mobile and
 * desktop are a real platform split in Workvivo's type system.
 *
 * The banner's brand colour comes in as a prop so the screen can be dropped into a scene
 * that already knows the tenant. Everything else — the journey's name, its blurb and the
 * six step titles — comes from `copy.journeys.phone`, so a <CustomizationProvider> is
 * required above it. Every prop below still overrides what the context supplies, which is
 * what the gallery uses.
 */

export const JOURNEY_PHONE_W = 393;
export const JOURNEY_PHONE_H = 986;

/** Sequence start frame in the main cut (WorkvivoCut.tsx). */
export const JOURNEY_CUT_START = 1677;

/** Global frames where the first three checkboxes get checked. */
export const DEFAULT_CHECK_FRAMES: [number, number, number] = [1685, 1700, 1710];

const ChevronUp: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M4 10L8 6L12 10"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Check: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3.5 8.5L6.5 11.5L12.5 5"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** A padlock, per the source's "Not Started" step mark. Plain geometry — the library
 *  has no lock glyph and this one is a rounded rect with an arc over it. */
const Lock: React.FC = () => (
  <svg width={17} height={17} viewBox="0 0 17 17" fill="none" aria-hidden>
    <rect
      x="3.6"
      y="7"
      width="9.8"
      height="7.4"
      rx="1.6"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path
      d="M5.9 7V5.3a2.6 2.6 0 0 1 5.2 0V7"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

export type JourneyStep = {
  title: string;
  sub: string;
  done?: boolean;
  locked?: boolean;
};

export type JourneyDay = {
  label: string;
  steps: JourneyStep[];
};

/**
 * The day headings, the grey sub-line under each step, and how the six steps divide
 * between the days.
 *
 * All of it belongs to the product rather than to a company: "A message has been shared
 * with you" is Workvivo's own wording for a step TYPE, and which day a step falls on is
 * the shape of the journey the reference shows. Only the six step titles are copy, and
 * they arrive in one flat list — `copy.journeys.phone.steps` — that this splits 3/2/1.
 */
const DAY_SHAPE: { label: string; subs: string[] }[] = [
  {
    label: "Day 1",
    subs: [
      "A message has been shared with you",
      "You have been enrolled in a space",
      "A page has been shared with you",
    ],
  },
  {
    label: "Day 2",
    subs: ["An article has been shared with you", "View your companies values"],
  },
  { label: "Day 30", subs: ["A survey has been shared with you"] },
];

/** Fold a flat list of six titles into the 3/2/1 day shape above. */
const daysFrom = (titles: readonly string[]): JourneyDay[] => {
  let i = 0;
  return DAY_SHAPE.map(({ label, subs }, dayIndex) => ({
    label,
    steps: subs.map((sub) => ({
      title: titles[i++] ?? "",
      sub,
      ...(dayIndex > 0 ? { locked: true } : {}),
    })),
  }));
};

export interface WorkvivoJourneyPhoneProps {
  title?: string;
  blurb?: string;
  /** Completed steps and the total, shown as "n/total steps completed". If omitted, dynamically updates as checkboxes check. */
  completed?: number;
  total?: number;
  /**
   * 0–1 progress bar fill. If omitted, dynamically glides up as checkboxes check.
   */
  progress?: number;
  status?: "Started" | "Not Started";
  /** Per-tenant brand colour burnt over the cover photo. Not Primary-500. */
  brand?: string;
  cover?: string;
  days?: JourneyDay[];
  /** Frames (global or local) when the first 3 steps check. Defaults to [1695, 1699, 1710]. */
  checkFrames?: [number, number, number];
}

const isStepCheckedAt = (currentFrame: number, targetFrame: number) => {
  if (currentFrame >= 1000) {
    const globalTarget = targetFrame < 1000 ? targetFrame + JOURNEY_CUT_START : targetFrame;
    return currentFrame >= globalTarget;
  }
  const localTarget = targetFrame >= 1000 ? targetFrame - JOURNEY_CUT_START : targetFrame;
  return currentFrame >= localTarget;
};

const getCheckScale = (currentFrame: number, targetFrame: number) => {
  const localTarget = targetFrame >= 1000 ? targetFrame - JOURNEY_CUT_START : targetFrame;
  const current = currentFrame >= 1000 ? currentFrame - JOURNEY_CUT_START : currentFrame;
  const diff = current - localTarget;
  if (diff < 0) return 1;
  if (diff > 8) return 1;
  return interpolate(diff, [0, 3, 8], [0.6, 1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
};

export const WorkvivoJourneyPhone: React.FC<WorkvivoJourneyPhoneProps> = ({
  title,
  blurb,
  completed,
  total = 12,
  progress,
  status = "Started",
  brand = "#7F39F3",
  cover,
  days,
  checkFrames = DEFAULT_CHECK_FRAMES,
}) => {
  const frame = useCurrentFrame();
  const { copy, image } = useCustomization();
  const phoneCopy = copy.journeys.phone;

  // Props still win — the gallery stages this screen with copy of its own. Inside the
  // film none is passed, so everything comes from the copy table and the image pool.
  const heroTitle = title ?? phoneCopy.title;
  const heroBlurb = blurb ?? phoneCopy.blurb;
  const heroDays = days ?? daysFrom(phoneCopy.steps);
  // Its own position, not `journey.hero.0` and no longer the wall's `journey.card.6`
  // either. The approved cut previews this journey on the Continuous Learning photo —
  // the EIGHTH card of the wall, not the second one the match cut lands on — so it kept
  // that card's slot for a while, which meant editing this header quietly re-photographed
  // a card on the wall too. It is a header like the desktop and mobile ones, so it gets a
  // header's own slot; the baseline default is the same picture as before.
  const heroCover = cover
    ? staticFile(cover)
    : image("journey.phone.0", staticFile("img/journeys/continuous-learning.png"));

  const step1Done = isStepCheckedAt(frame, checkFrames[0]);
  const step2Done = isStepCheckedAt(frame, checkFrames[1]);
  const step3Done = isStepCheckedAt(frame, checkFrames[2]);

  const dynamicCompleted = (step1Done ? 1 : 0) + (step2Done ? 1 : 0) + (step3Done ? 1 : 0);
  const effectiveCompleted = completed !== undefined ? completed : dynamicCompleted;

  const effectiveProgress = (() => {
    if (progress !== undefined) return progress;
    if (completed !== undefined) return completed / total;

    const f0 = checkFrames[0] >= 1000 ? checkFrames[0] - JOURNEY_CUT_START : checkFrames[0];
    const f1 = checkFrames[1] >= 1000 ? checkFrames[1] - JOURNEY_CUT_START : checkFrames[1];
    const f2 = checkFrames[2] >= 1000 ? checkFrames[2] - JOURNEY_CUT_START : checkFrames[2];
    const current = frame >= 1000 ? frame - JOURNEY_CUT_START : frame;

    const p1 = interpolate(current, [f0, f0 + 4], [0, 1 / total], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    const p2 = interpolate(current, [f1, f1 + 4], [0, 1 / total], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    const p3 = interpolate(current, [f2, f2 + 4], [0, 1 / total], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    return p1 + p2 + p3;
  })();

  const isDone = (dayIndex: number, stepIndex: number, step: JourneyStep) => {
    if (step.done !== undefined) return step.done;
    if (dayIndex === 0) {
      if (stepIndex === 0) return step1Done;
      if (stepIndex === 1) return step2Done;
      if (stepIndex === 2) return step3Done;
    }
    return false;
  };

  const isLocked = (dayIndex: number, stepIndex: number, step: JourneyStep) => {
    if (step.locked !== undefined) return step.locked;
    return dayIndex > 0;
  };

  return (
    <div
      className="wjp-screen"
      style={{ ["--wjp-brand" as string]: brand }}
    >
      <div className="wjp-hero">
        <img data-vc-slot="journey.phone.0" src={heroCover} alt="" />
        <div className="wjp-hero-burn" />
      </div>

      <div className="wjp-summary">
        <div className="wjp-title">{heroTitle}</div>
        <div className="wjp-blurb">{heroBlurb}</div>
        <div className="wjp-progress">
          <div className="wjp-track">
            {effectiveProgress > 0 ? (
              <span style={{ width: `${Math.min(1, effectiveProgress) * 100}%` }} />
            ) : null}
          </div>
          <div className="wjp-steps">
            {effectiveCompleted}/{total} steps completed
          </div>
        </div>
        <span
          className={
            status === "Started"
              ? "wjp-status wjp-status-started"
              : "wjp-status wjp-status-notstarted"
          }
        >
          {status}
        </span>
      </div>

      <div className="wjp-days" data-vc-slot="journeys.steps">
        {heroDays.map((day, dayIndex) => (
          <div key={day.label}>
            <div className="wjp-dayhead">
              {day.label}
              <ChevronUp />
            </div>
            <div className="wjp-daycard">
              {day.steps.map((step, stepIndex) => {
                const done = isDone(dayIndex, stepIndex, step);
                const locked = isLocked(dayIndex, stepIndex, step);
                const checkTargetFrame = dayIndex === 0 && stepIndex < 3 ? checkFrames[stepIndex] : 0;
                const scale = done && checkTargetFrame ? getCheckScale(frame, checkTargetFrame) : 1;

                return (
                  <div
                    className={done ? "wjp-step" : "wjp-step wjp-todo"}
                    key={`${day.label}-${stepIndex}`}
                  >
                    <span
                      className={done ? "wjp-step-mark wjp-done" : "wjp-step-mark"}
                      style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
                    >
                      {done ? <Check /> : locked ? <Lock /> : null}
                    </span>
                    <span>
                      <span className="wjp-step-title" style={{ display: "block" }}>
                        {step.title}
                      </span>
                      <span className="wjp-step-sub" style={{ display: "block" }}>
                        {step.sub}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
