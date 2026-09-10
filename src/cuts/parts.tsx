import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Video } from "@remotion/media";
import { REFERENCE_VIDEO } from "../referenceVideo";
import { lengthOf, type AudioFades, type Window } from "./plan";

/**
 * The four mechanisms every window of the original edit is laid down with.
 *
 * Lifted verbatim from ZoeTestSearchCut and ZoeTestPeopleCut, which each carry their own
 * copy of most of this — the combined cut needs all of it at once, so here it is in one
 * place. The three single-pillar cuts are deliberately NOT changed to import from here:
 * they are signed off, and a shared module that anyone can retune is a way to move three
 * approved films by accident. This copy exists to be edited when the combined cut needs it
 * to be.
 */

/**
 * Fades its children up over the first `frames` frames of the sequence it sits in.
 *
 * A child of the `<Sequence>` rather than a wrapper around it, because `useCurrentFrame()`
 * has to be read from INSIDE the sequence to get frames counted from that sequence's own
 * start. Read from outside it would return the composition's frame and the fade would run
 * once at frame 0 and never again.
 *
 * `frames` is the number of frames that OVERLAP, and the fade finishes on the last of them
 * — hence `frames - 1` as the end of the range. Ending it on `frames` instead would put
 * full opacity one frame after the outgoing window stops, so the last overlapped frame
 * would composite at 14/15 and the next would jump to 1: a step of about 7% on the frame
 * the shot changes hands, which is exactly where it is most likely to be noticed.
 *
 * `frames === 0` renders the children with no wrapper at all. Most joins in a combined cut
 * are continuations rather than transitions, so this is the common path, and keeping the
 * DOM identical on it is what makes those windows byte-for-byte the film.
 */
export const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({
  frames,
  children,
}) => {
  const frame = useCurrentFrame();
  if (frames <= 0) return <>{children}</>;
  const opacity = interpolate(frame, [0, Math.max(1, frames - 1)], [0, 1], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/**
 * A dip through a solid colour, centred on the end of the sequence's first half.
 *
 * Up over `frames`, down over `frames`, so it is fully opaque for exactly one frame in the
 * middle — the frame the shot changes hands. Mount it LAST in the tree: the export paints
 * in DOM order and ignores z-index, so its position among its siblings is the only thing
 * that puts it on top.
 */
export const DipThrough: React.FC<{ colour: string; frames: number }> = ({
  colour,
  frames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, frames, frames * 2 - 1], [0, 1, 0], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: colour, opacity }} />;
};

/**
 * An equal-power fade envelope for one window, written in GLOBAL frames.
 *
 * `<Video volume>` is called with the frame counted from its own Sequence's start, so this
 * converts: sequence-local 0 is global `from`, except for a window starting at global 0,
 * which is mounted one frame late (see `ReferenceWindow`) and whose local 0 is therefore
 * global 1.
 *
 * `Math.sqrt` rather than a straight line: the two windows either side of a join are
 * uncorrelated stretches of one track, so two LINEAR ramps crossing sum to about 0.5 of the
 * power at the midpoint — an audible dip in the middle of the crossfade. Two square-root
 * ramps sum to roughly constant power, which is what a crossfade is supposed to sound like.
 */
export const audioEnvelope = (w: Window, fades: AudioFades) => {
  const base = w.from === 0 ? 1 : w.from;
  const ramp = (x: number, a: number, b: number) =>
    Math.min(1, Math.max(0, (x - a) / (b - a)));
  return (frame: number) => {
    const g = frame + base;
    const rise = fades.fadeIn ? ramp(g, fades.fadeIn[0], fades.fadeIn[1]) : 1;
    const fall = fades.fadeOut ? 1 - ramp(g, fades.fadeOut[0], fades.fadeOut[1]) : 1;
    return Math.sqrt(Math.min(rise, fall));
  };
};

/**
 * One window of the original edit, laid at `localOffset`.
 *
 * The reference is mounted at `from={1}` in the full timeline, so composition frame F shows
 * video frame F-1. Preserving that offset is what keeps picture and audio in the sync they
 * were graded in, and it is why `trimBefore` is `from - 1` rather than `from`.
 *
 * A window starting at global 0 is the exception: there is no video frame -1, and the
 * original simply had no reference on its first frame. That case starts one frame later and
 * plays from the top, which is exactly what the original does.
 *
 * There is deliberately no `durationInFrames` on the `<Video>` itself. This component is
 * mounted up to five times in one cut, at five different lengths, so a length set here
 * would cap every window at the same number and silently truncate the longer ones. The
 * Sequence's own `durationInFrames` is what ends each window.
 */
export const ReferenceWindow: React.FC<{
  name: string;
  window: Window;
  localOffset: number;
  reference: keyof typeof REFERENCE_VIDEO;
  /** Frames to fade the PICTURE up over on entry. 0 for a hard cut or a continuation. */
  fadeIn?: number;
  /**
   * Where the SOUNDTRACK fades, in global frames — deliberately independent of the
   * picture's. At the intro's join the picture starts changing on 375 while the last word
   * runs to 384, so the sound holds at full through the front of the dissolve and only lets
   * go afterwards. See the AUDIO table in plan.ts.
   */
  audio?: AudioFades;
}> = ({ name, window: w, localOffset, reference, fadeIn = 0, audio = {} }) => {
  const atZero = w.from === 0;
  const length = lengthOf(w) - (atZero ? 1 : 0);
  return (
    <Sequence
      name={name}
      from={localOffset + (atZero ? 1 : 0)}
      durationInFrames={length}
      style={{
        scale: 0.712,
        translate: "-1px 0px",
      }}
    >
      <FadeIn frames={fadeIn}>
        {/* Unmuted, as in the original: this element is the film's only sound. */}
        <Video
          src={staticFile(REFERENCE_VIDEO[reference])}
          trimBefore={atZero ? 0 : w.from - 1}
          volume={audioEnvelope(w, audio)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </FadeIn>
    </Sequence>
  );
};
