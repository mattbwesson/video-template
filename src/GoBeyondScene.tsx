import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * "Go beyond the numbers" — the sign-off the survey's iris opens onto.
 *
 * Three beats on one line. The lead settles down onto the frame from oversize; before it
 * has finished doing so the line slides LEFT off centre; and the tail tracks out from
 * behind the lead to fill the space that opens.
 *
 * The type and the tracking are BackFromScene's, at global 612 — the same font stack,
 * letter-spacing, weight and two-stop glow, and the same pair of curves: the re-centring
 * on bezier(0.53, 0.27, 0.12, 1) and the words' travel on bezier(0.76, 0.08, 0.26, 0.84),
 * the second finishing well before the first. Two title cards doing the same gesture
 * should be doing it identically, so the numbers here are that scene's numbers rather
 * than a second set that happens to look similar.
 *
 * HOW THE TWO CENTRED STATES WORK
 * Also BackFromScene's, and worth restating because it looks redundant and is not. A
 * hidden sizer puts the WHOLE line in flow so the box, and therefore the centring and the
 * transform origin, is the width of the finished line. The visible copy is laid over it
 * with the tail absolutely positioned, so it carries no layout width of its own. The two
 * percentage transforms then resolve against different widths — the outer against the
 * whole line, the inner against the lead — which is what lets `centreOnLead` slide
 * between "lead centred" and "line centred" without either end depending on a measured
 * pixel width.
 */

/** Gap between words. The sizer has to use the same value to measure true. */
const WORD_GAP = "0.20em";

/** BackFromScene's type block, verbatim. */
const LINE_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const LINE_WEIGHT = 500;
const LINE_TRACKING = "0.025em";
const LINE_GLOW =
  "0 0 25px rgba(255, 255, 255, 0.4), 0 0 50px rgba(255, 255, 255, 0.2)";

/** The lead's settle, carried over from the card this replaces. */
const SCALE_FRAMES = 16;
const SCALE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** BackFromScene's own curves and spans, offset to start where this line starts moving. */
const MOVE_FRAMES = 22.5;
const MOVE_EASE = Easing.bezier(0.53, 0.27, 0.12, 1.0);
const TRACK_FRAMES = 15.5;
const TRACK_EASE = Easing.bezier(0.76, 0.08, 0.26, 0.84);

/**
 * The exit: the line is pushed up by the UI arriving under it.
 *
 * These are WorkvivoSeerManagerInsightsScene's entrance, not a choice — its device rises
 * over 18 frames on bezier(0.16, 1, 0.3, 1), and the two moves are meant to be one
 * gesture, so the line leaves on exactly that span and that curve. Retiming that scene's
 * entrance means retiming this.
 *
 * 700 clears the top: the line sits on the frame's middle and is about 140 tall.
 */
const EXIT_FRAMES = 18;
const EXIT_TRAVEL = 700;
const EXIT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * How far each tail word starts to the right, at BackFromScene's 340px type. Taken as a
 * ratio of the size so the travel stays the same distance in ems whatever this line is
 * set at — the gesture is "one word-ish behind, two word-ish behind", not "360 pixels".
 */
const TRACK_1 = 360 / 340;
const TRACK_2 = 720 / 340;

export interface GoBeyondSceneProps {
  /** The field behind it. The cut passes `theme.brand`. */
  background?: string;
  /** The word that is already on screen and settles into place. */
  lead?: string;
  /** The words that track out from behind it, in order. */
  tail?: string[];
  /** Against a 1080-tall frame. */
  fontSize?: number;
  /** What the lead scales FROM before landing on 1. */
  scaleFrom?: number;
  /** Local frame the line starts moving left and the tail starts arriving. */
  moveFrom?: number;
  /**
   * Local frame the line is pushed up and off. Leave it out and the line simply holds.
   *
   * From this frame the scene stops painting its own field, because the shot underneath
   * is arriving and painting the same one: two opaque brand fills, one of them moving,
   * would mean the exit took the colour with it.
   */
  exitFrom?: number;
}

export const GoBeyondScene: React.FC<GoBeyondSceneProps> = ({
  background = "#E10A0A",
  lead = "Go beyond",
  tail = ["the", "numbers"],
  fontSize = 135,
  scaleFrom = 2.2,
  moveFrom = 12,
  exitFrom,
}) => {
  const frame = useCurrentFrame();
  const leaving = exitFrom !== undefined && frame >= exitFrom;
  const exitY =
    exitFrom === undefined
      ? 0
      : interpolate(frame, [exitFrom, exitFrom + EXIT_FRAMES], [0, -EXIT_TRAVEL], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EXIT_EASE,
        });

  const scale = interpolate(frame, [0, SCALE_FRAMES], [scaleFrom, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCALE_EASE,
  });

  // 1 = the lead alone sits centred, 0 = the whole line does. It starts at `moveFrom`,
  // which is four frames before the settle above has finished — the line is meant to be
  // caught still shrinking, not to move once it has come to rest.
  const centreOnLead = interpolate(
    frame,
    [moveFrom, moveFrom + MOVE_FRAMES],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: MOVE_EASE,
    },
  );

  const track = interpolate(
    frame,
    [moveFrom, moveFrom + TRACK_FRAMES],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: TRACK_EASE,
    },
  );

  const travel = [TRACK_1, TRACK_2];
  const tailStyle = (i: number): React.CSSProperties => ({
    display: "inline-block",
    opacity: track,
    transform: `translateX(${
      interpolate(track, [0, 1], [travel[Math.min(i, travel.length - 1)], 0]) *
      fontSize
    }px)`,
    marginLeft: i === 0 ? undefined : WORD_GAP,
  });

  return (
    <AbsoluteFill
      style={{ background: leaving ? "transparent" : background, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${exitY}px) scale(${scale})`,
          transformOrigin: "center center",
          fontFamily: LINE_FONT,
          fontSize,
          fontWeight: LINE_WEIGHT,
          letterSpacing: LINE_TRACKING,
          color: "#ffffff",
          textShadow: LINE_GLOW,
        }}>
        {/* Sizer — never painted. See the note at the top of the file. */}
        <span
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            // `opacity: 0`, not `visibility: hidden`. The export renderer has no
            // visibility check anywhere in its paint path, so a hidden sizer is drawn in
            // full and the line appears twice, at two different trackings. Opacity is
            // multiplied into the canvas alpha, so 0 paints nothing and the box still
            // takes up its space.
            opacity: 0,
          }}>
          {lead}
          {tail.map((w) => (
            <span key={w} style={{ marginLeft: WORD_GAP }}>
              {w}
            </span>
          ))}
        </span>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            transform: `translateX(${centreOnLead * 50}%)`,
          }}>
          <span
            style={{
              display: "inline-block",
              position: "relative",
              whiteSpace: "nowrap",
              transform: `translateX(${-centreOnLead * 50}%)`,
            }}>
            {lead}
            <span
              style={{
                position: "absolute",
                left: "100%",
                marginLeft: WORD_GAP,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "baseline",
              }}>
              {tail.map((w, i) => (
                <span key={w} style={tailStyle(i)}>
                  {w}
                </span>
              ))}
            </span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
