import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import { lengthOf, type AudioFades, type Slot, type Window } from "./plan";

/**
 * The four mechanisms every window of the original edit is laid down with.
 *
 * THE REFERENCE VIDEO IS GONE FROM THIS FAMILY, and that is the change these parts exist
 * around. Every window used to mount a `<Video>` of the original edit and let its unbuilt
 * stretches show through; upstream then rebuilt the last of those stretches as scenes and
 * dropped the video from `WorkvivoCut` entirely (see the note on SOUNDTRACK there). The
 * blocks in this directory now cover every frame of every window with scenes, so what a
 * window still needs from the original is its SOUND and nothing else.
 *
 * That is why `ReferenceWindow` became `SoundtrackWindow` and why `BlockFade` had to be
 * written. A picture crossfade used to be applied to the window's video, which worked only
 * because every chapter opened on a reference-only pillar card — the one thing on screen at
 * the join. With the card rebuilt as a scene there is no video to fade, so the fade moves
 * to the block as a whole, which is also the correct compositing for a crossfade: the
 * incoming chapter dissolves up as one picture rather than scene by scene.
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
 * which is mounted one frame late (see `SoundtrackWindow`) and whose local 0 is therefore
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
 * The film's soundtrack, stream-copied out of the original edit's master.
 *
 * The same asset `WorkvivoCut` plays, for the same reason: the reference video was the only
 * sound in the tree, so removing it without this would ship a silent film that looked
 * completely correct.
 */
const SOUNDTRACK = "audio/l2-soundtrack.m4a";

/**
 * One window's worth of the film's sound, laid at `localOffset`.
 *
 * The soundtrack is mounted at `from={1}` in the full timeline, so composition frame F is
 * track frame F-1. Preserving that offset is what keeps a window's sound in the sync it was
 * cut against, and it is why `trimBefore` is `from - 1` rather than `from`.
 *
 * A window starting at global 0 is the exception: there is no track frame -1, and the
 * original simply had no sound on its first frame. That case starts one frame later and
 * plays from the top, which is exactly what the original does.
 *
 * There is deliberately no `durationInFrames` on the `<Audio>` itself. This component is
 * mounted up to five times in one cut, at five different lengths, so a length set here
 * would cap every window at the same number and silently truncate the longer ones. The
 * Sequence's own `durationInFrames` is what ends each window.
 */
export const SoundtrackWindow: React.FC<{
  name: string;
  window: Window;
  localOffset: number;
  /**
   * Where the soundtrack fades, in global frames — deliberately independent of the
   * picture's. At the intro's join the picture starts changing on 375 while the last word
   * runs to 384, so the sound holds at full through the front of the dissolve and only lets
   * go afterwards. See the AUDIO table in plan.ts.
   */
  audio?: AudioFades;
}> = ({ name, window: w, localOffset, audio = {} }) => {
  const atZero = w.from === 0;
  const length = lengthOf(w) - (atZero ? 1 : 0);
  return (
    <Sequence name={name} from={localOffset + (atZero ? 1 : 0)} durationInFrames={length}>
      <Audio
        src={staticFile(SOUNDTRACK)}
        trimBefore={atZero ? 0 : w.from - 1}
        volume={audioEnvelope(w, audio)}
      />
    </Sequence>
  );
};

/**
 * The picture crossfade a chapter arrives on, applied to a whole block.
 *
 * Read the note at the top of this file for why it lives here rather than on the window:
 * with every frame of every window now drawn by scenes, the thing that has to dissolve up
 * is the block's entire picture.
 *
 * It reads `useCurrentFrame()` from OUTSIDE any sequence on purpose — a block's children
 * are placed at absolute composition offsets by `placer`, so wrapping them in a Sequence to
 * get local frames would re-base every one of those offsets. The composition frame plus
 * `slot.localOffset` is the same information without moving anything.
 *
 * `fadeIn === 0` renders the children with no wrapper at all. Most joins in a cut are
 * continuations rather than transitions, so this is the common path, and keeping the DOM
 * identical on it is what makes those windows byte-for-byte the film.
 */
export const BlockFade: React.FC<{ slot: Slot; children: React.ReactNode }> = ({
  slot,
  children,
}) => {
  const frame = useCurrentFrame();
  if (slot.fadeIn <= 0) return <>{children}</>;
  const opacity = interpolate(
    frame,
    [slot.localOffset, slot.localOffset + Math.max(1, slot.fadeIn - 1)],
    [0, 1],
    {
      easing: Easing.bezier(0.4, 0, 0.6, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
