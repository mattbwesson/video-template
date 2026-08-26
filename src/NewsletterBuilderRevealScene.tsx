import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import "./NewsletterBuilderRevealStyles.css";
import { WorkvivoNewsletterBuilder } from "./components/workvivo/WorkvivoNewsletterBuilder";

/** Same curve the rest of the cut's entrances use. */
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Frames one panel takes to travel, and how far it comes up from. */
const RISE_FRAMES = 20;
const RISE_FROM = 90;

/**
 * Per-panel start frames.
 *
 * The editor leads because it is the subject; the palette follows it in, and the save bar
 * lands last. Staggering by 5 rather than firing together is what makes it read as a tool
 * assembling rather than one card sliding.
 */
const DELAYS = { editor: 0, palette: 5, save: 10 } as const;

export interface NewsletterBuilderRevealSceneProps {
  /** Plain field behind the builder. The cut passes `theme.brand`. */
  background?: string;
  /** Frame when components move down. Default 33 (global 2091). */
  exitFrom?: number;
  /** Duration in frames for downward exit. Default 9 (global 2091 to 2100). */
  exitDuration?: number;
}

/**
 * The newsletter builder assembling on the brand field.
 *
 * The three panels rise on their own timings, driven through custom properties rather than
 * a prop on the builder: it is a shared component and this is one scene's staging, so the
 * entrance lives with the scene. See NewsletterBuilderRevealStyles.css.
 */
export const NewsletterBuilderRevealScene: React.FC<
  NewsletterBuilderRevealSceneProps
> = ({ background = "#E10A0A", exitFrom = 33, exitDuration = 9 }) => {
  const frame = useCurrentFrame();

  const rise = (delay: number) =>
    interpolate(frame, [delay, delay + RISE_FRAMES], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: SCENE_EASE,
    });

  // Downward exit starting at frame 33 (global 2091) through frame 42 (global 2100)
  const exitY = interpolate(frame, [exitFrom, exitFrom + exitDuration], [0, 850], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.81, -0.01, 0.83, 0.27),
  });

  // Opacity resolves over the first half of each travel, so a panel is solid well before it
  // stops moving — a fade that runs the full distance reads as sluggish.
  const fade = (delay: number) =>
    interpolate(frame, [delay, delay + RISE_FRAMES / 2], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const vars: Record<string, string | number> = {};
  (Object.keys(DELAYS) as (keyof typeof DELAYS)[]).forEach((k) => {
    vars[`--nbr-${k}-y`] = `${rise(DELAYS[k]) * RISE_FROM + exitY}px`;
    vars[`--nbr-${k}-o`] = fade(DELAYS[k]);
  });

  return (
    <AbsoluteFill
      className="nbr-stage"
      style={{ background, overflow: "hidden", ...vars }}
    >
      {/* The builder paints its own field, so it is given the same colour rather than left
          to show a second one through the panels' gaps. */}
      <WorkvivoNewsletterBuilder width={1920} height={1080} brand={background} />
    </AbsoluteFill>
  );
};
