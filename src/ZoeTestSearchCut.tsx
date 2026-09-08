import React from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { HeadquartersScene } from "./HeadquartersScene";
import { VirginWorkvivoHomeScene } from "./VirginWorkvivoHomeScene";
import { AskBarScene } from "./AskBarScene";
import { HqSearchScene } from "./HqSearchScene";
import { HqChatScene } from "./HqChatScene";
import { BrandWordScene } from "./BrandWordScene";
import { WorkvivoCustomerGridScene } from "./WorkvivoCustomerGridScene";
import { useCustomization } from "./customize/CustomizationProvider";
import { REFERENCE_VIDEO } from "./WorkvivoCut";

/**
 * The Search & Knowledge cut — the `Zoe-test-search` composition.
 *
 * The film's own opening and ending, with one of its three chapters in between: the
 * pillar wheel at global 2236-2268 names Communication & Engagement, Search & Knowledge
 * and People Intelligence, and this cut keeps the middle one — "find and access what you
 * need instantly". 1216 frames, about 49 seconds, against the original's 5300.
 *
 * Three windows of the original, laid end to end:
 *
 *   local 0-389     global 0-390       intro   brand mark, the faces, the workvivo HQ
 *                                              title card, and the wheel with all three
 *                                              pillars lit
 *   local 375-898   global 2236-2760   chapter the wheel again with Search & Knowledge
 *                                              picked out, then Ask bar -> HQ Search ->
 *                                              HQ Chat -> Ask / Answer / Job Done -> the
 *                                              mobile iris and its hold
 *   local 899-1215  global 4983-5300   outro   the customer logo wall, the workvivo HQ
 *                                              endcard and the strapline
 *
 * Both joins are transitions, and they are different on purpose:
 *
 *   local 375-389  intro -> chapter   DISSOLVE. The two windows overlap by CROSSFADE
 *                                     frames and the chapter fades up over the intro.
 *                                     Both sides are the same pillar wheel, so it reads
 *                                     as one graphic changing state.
 *   local 889-908  chapter -> outro   DIP through the brand colour. The shots have
 *                                     nothing in common and the outgoing one is a scene
 *                                     rather than the reference, so an overlay is the
 *                                     right tool. Costs no frames — see OUTRO_DIP.
 *
 * The soundtrack is faded across both joins to match, since three windows of one track
 * means the audio would otherwise cut where the windows meet: an equal-power crossfade
 * over the first join, and a fade to silence and back over the second. The head and tail
 * are left alone — they are the film's own first and last frames, not cuts. See
 * audioEnvelope.
 *
 * Window ends are exclusive here, as the sequence names in WorkvivoCut are, so the intro's
 * last frame is 389.
 *
 * The chapter is a window rather than a hand-picked set of scenes on purpose. Those frames
 * are already self-contained: the beats inside are hard cuts choreographed INTO each
 * other, several framed so only the content changes across the cut. Picking
 * search-flavoured scenes out of other chapters and splicing them together would have
 * broken those match cuts and gained nothing the pillar card does not already promise.
 *
 * The intro and outro carry the whole film's framing — the platform positioning at both
 * ends and the wheel that says which of three things you are about to be shown — so this
 * reads as one chapter of the film rather than as an excerpt starting mid-thought.
 *
 * Every scene is shifted by its window's offset. The scene components all read LOCAL
 * frames inside their own `<Sequence>`, which is what makes that shift a matter of
 * arithmetic rather than of retiming each scene.
 *
 * Left out deliberately, and easy to add if the brief widens: Spaces / Space page
 * (1468-1639), the Workvivo Article (3264-3326) and the Integrations pair (4397-4554) all
 * touch knowledge in some sense. None is inside the chapter the pillar card introduces,
 * and each is cut into its own neighbours, so each would need its transitions rebuilt.
 *
 * Scene components are still shared with WorkvivoCut and ZoetestCut — see the note in
 * ZoetestCut.tsx. Only the timeline is this file's own.
 */

/**
 * The three windows of the original this cut is made of, in order.
 *
 * `to` is exclusive, as the sequence names in WorkvivoCut are. Lengths and local offsets
 * are derived below rather than written down, so moving a boundary moves everything after
 * it and cannot leave a gap.
 */
const WINDOWS = {
  intro: { from: 0, to: 390 },
  chapter: { from: 2236, to: 2760 },
  outro: { from: 4983, to: 5300 },
} as const;

const lengthOf = (w: { from: number; to: number }) => w.to - w.from;

/**
 * Frames of dissolve between the intro and the chapter.
 *
 * The two shots either side of this join are the SAME graphic in two states: the intro
 * ends on the pillar wheel fully lit and settled (global 389), and the chapter opens on
 * that wheel dimmed and re-entering with Search & Knowledge picked out (global 2236).
 * Same position, same scale, same wedges — so a dissolve reads as the highlight coming up
 * on one graphic rather than as a cut between two shots, which is the whole reason this
 * join is worth crossfading and the outro's is not.
 *
 * The chapter fades UP over an intro still at full opacity, rather than the two
 * cross-fading past each other. Fading both would let the black underneath show through
 * the middle of the dissolve and read as a dip rather than a blend.
 */
const CROSSFADE = 15;

/**
 * Frames each side of the chapter -> outro join, which dips through the brand colour
 * rather than dissolving.
 *
 * A dissolve is wrong here for two reasons. The shots either side have nothing in common —
 * the chapter ends on the phone held on a near-black field and the outro opens on the
 * bright customer logo wall — so blending them would just superimpose two unrelated
 * pictures. And the chapter's last shot is a SCENE (`MobileIrisOpen`), not the reference
 * underneath it, so fading the reference window the way the first join does would fade
 * something that is not what is on screen.
 *
 * A dip sidesteps both: it is an overlay in the brand colour that fades up over whatever
 * is there and back down onto whatever comes next, so it needs to know nothing about
 * either side. The colour is the film's own connective tissue — the Ask / Answer / Job
 * Done cards stand on it, and the logo wall's own field is the same colour, so the dip
 * lands on ground the next shot is already standing on.
 *
 * Being an overlay, it also costs no frames: the join stays at OUTRO_AT and the cut's
 * length is unchanged.
 */
const OUTRO_DIP = 10;

/**
 * Where each window starts in the new timeline.
 *
 * The chapter is pulled back by CROSSFADE so it overlaps the tail of the intro; the outro
 * follows the chapter with a hard cut, as the original does at 4983.
 */
const INTRO_AT = 0;
const CHAPTER_AT = INTRO_AT + lengthOf(WINDOWS.intro) - CROSSFADE;
const OUTRO_AT = CHAPTER_AT + lengthOf(WINDOWS.chapter);

/** Composition length. Root.tsx reads this rather than restating 1258. */
export const SEARCH_CUT_DURATION = OUTRO_AT + lengthOf(WINDOWS.outro);

/** `from` for a scene that sat at `globalFrame` inside `window`. */
const at =
  (window: { from: number; to: number }, localOffset: number) => (globalFrame: number) =>
    localOffset + globalFrame - window.from;

const inIntro = at(WINDOWS.intro, INTRO_AT);
const inChapter = at(WINDOWS.chapter, CHAPTER_AT);
const inOutro = at(WINDOWS.outro, OUTRO_AT);

/**
 * One window of the original edit, laid at `localOffset`.
 *
 * The reference is mounted at `from={1}` in the full timeline, so composition frame F
 * shows video frame F-1. Preserving that offset is what keeps picture and audio in the
 * sync they were graded in, and it is why `trimBefore` is `from - 1` rather than `from`.
 *
 * A window starting at global 0 is the exception: there is no video frame -1, and the
 * original simply had no reference on its first frame. That case starts one frame later
 * and plays from the top, which is exactly what the original does.
 */
/**
 * Fades its children up over the first `frames` frames of the sequence it sits in.
 *
 * A child of the `<Sequence>` rather than a wrapper around it, because
 * `useCurrentFrame()` has to be read from INSIDE the sequence to get frames counted from
 * that sequence's own start. Read from outside it would return the composition's frame and
 * the fade would run once at frame 0 and never again.
 *
 * `frames` is the number of frames that OVERLAP, and the fade finishes on the last of
 * them — hence `frames - 1` as the end of the range. Ending it on `frames` instead would
 * put full opacity one frame after the outgoing window stops, so the last overlapped frame
 * would composite at 14/15 and the next would jump to 1: a step of about 7% on the frame
 * the shot changes hands, which is exactly where it is most likely to be noticed.
 *
 * `frames === 0` renders the children with no wrapper at all: opacity 1 is the same
 * picture, but not adding the box keeps the DOM identical to what it was before the fade
 * existed, which matters for the two windows that still hard-cut.
 */
const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({
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
 * middle — the frame the shot changes hands. Mounted LAST in the tree so it paints over
 * everything: the export paints in DOM order and ignores z-index, so its position among
 * its siblings is the only thing that puts it on top.
 */
const DipThrough: React.FC<{ colour: string; frames: number }> = ({ colour, frames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, frames, frames * 2 - 1], [0, 1, 0], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: colour, opacity }} />;
};

/**
 * An equal-power fade envelope for a window `length` frames long.
 *
 * `Math.sqrt` rather than a straight line, and that matters at the first join. The two
 * windows there are different stretches of the same track, so they are uncorrelated: two
 * LINEAR ramps crossing sum to about 0.5 of the power at the midpoint, which is an audible
 * dip in the middle of the crossfade. Two square-root ramps sum to roughly constant power,
 * which is what "crossfade" is supposed to sound like.
 *
 * The same curve is used for the dip's fades, where the two halves do not overlap and the
 * curve is inaudible either way, purely so there is one envelope in this file rather than
 * two.
 */
const audioEnvelope =
  (length: number, fadeIn: number, fadeOut: number) => (frame: number) => {
    const rise = fadeIn > 0 ? Math.min(1, Math.max(0, frame / fadeIn)) : 1;
    const fall =
      fadeOut > 0 ? Math.min(1, Math.max(0, (length - 1 - frame) / fadeOut)) : 1;
    return Math.sqrt(Math.min(rise, fall));
  };

const ReferenceWindow: React.FC<{
  name: string;
  window: { from: number; to: number };
  localOffset: number;
  reference: keyof typeof REFERENCE_VIDEO;
  /** Frames to fade the PICTURE up over on entry. 0 for a hard cut. */
  fadeIn?: number;
  /** Frames to fade the AUDIO up over on entry. 0 to start at full. */
  audioFadeIn?: number;
  /** Frames to fade the AUDIO down over on exit. 0 to end at full. */
  audioFadeOut?: number;
}> = ({
  name,
  window: w,
  localOffset,
  reference,
  fadeIn = 0,
  audioFadeIn = 0,
  audioFadeOut = 0,
}) => {
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
        {/* `trimBefore` is what trims the window; the Sequence's own
            `durationInFrames` above is what ends it. There is deliberately no
            `durationInFrames` on the <Video> itself — this component is mounted three
            times, so a length set here would cap every window at the same number and
            silently truncate the two longer ones.

            `volume` takes the frame counted from this Sequence's start, which is why the
            envelope can be written against the window's own length and needs to know
            nothing about where the window sits in the cut. Unmuted, as in the original:
            this element is the film's only sound. */}
        <Video
          src={staticFile(REFERENCE_VIDEO[reference])}
          trimBefore={atZero ? 0 : w.from - 1}
          volume={audioEnvelope(length, audioFadeIn, audioFadeOut)}
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

/**
 * The mobile home, opening out of nothing on a circular mask at local 0-12 — global
 * 2565-2577. The inverse of the irises elsewhere in the cut: those shut onto what is
 * mounted below them, this one grows to fill the frame from the middle of the "Job Done"
 * card, which is held under it for the whole opening (see the sequence at 2547).
 *
 * The half-diagonal of the 1920x1080 frame is 1101.6, so 1110 is the end radius: the
 * smallest circle that covers the frame, plus enough margin that no hairline of the arc
 * survives at the corners for the long hold afterwards.
 *
 * It eases inOut(quad), as SpacePageShot's iris does, rather than the house
 * bezier(0.16, 1, 0.3, 1). That curve is 90% of the way open four frames in, so over
 * twelve it would read as a cut with eight dead frames after it; this one spends the
 * whole window growing, which is what a circle scaling up is meant to look like.
 *
 * It is a round window rather than a `clipPath: circle()` — the clip composited as an
 * opaque black quad past roughly 1000px, blacking out the card underneath instead of
 * letting it through. A `border-radius: 50%` box with `overflow: hidden` is the same
 * shape with none of that; the scene inside is offset by the radius so it stays put in
 * the frame while the window around it grows.
 *
 * What it opens onto is global 545's framing: VirginWorkvivoHomeScene's local 128, which is
 * the phone on #010026 a few frames after its hard cut to mobile, before the headline
 * arrives at 130. The scene is frozen there, so the shot is that frame returning rather
 * than the scene running again — everything about it is pinned EXCEPT the page, which is
 * driven from out here.
 *
 * The page opens at the top and scrolls to its end between the iris finishing and global
 * 2725, then holds. The scroll is passed in as a prop from ABOVE the <Freeze> — a frozen
 * scene cannot scroll itself, and computing it out here is what lets one thing move while
 * the rest of the frame stays exactly as 545 left it.
 */
const MOBILE_IRIS_OPEN_FRAMES = 12;
const MOBILE_IRIS_END_RADIUS = 1110;
const HOME_SCENE_FRAME_AT_545 = 545 - 417;

/**
 * The two poses the device takes, as fractions of the 1920x1080 frame.
 *
 * NEAR is the shot the iris opens onto — centred across, 60% down, 37% wide. Its 79.5%
 * height is the box the FRAME CROPS, not the device: at that width the phone is half as
 * tall again as the frame and runs off the bottom. So what the height gives us is the top
 * edge, which the box's bottom being the frame's bottom puts at (0.6 - 0.795/2).
 *
 * FAR is where it pulls back to — 48% down and 19.5% wide, which at that width is the
 * whole device on frame with room around it. Its top is therefore derived from the centre
 * and the device's own height rather than from a crop.
 *
 * FAR's given height of 73.5% is the one number here that cannot be honoured: the device
 * is 852pt tall to every 393pt wide, so at 19.5% of the frame's width it is 75.2% of its
 * height, not 73.5%. Centre and width are matched exactly and the height falls where the
 * aspect puts it — the alternative is stretching the phone.
 */
const PHONE_NEAR = {
  centreX: 0.5,
  centreY: 0.6,
  width: 0.37,
  /** Cropped by the frame's bottom edge, so this fixes the top rather than the size. */
  croppedHeight: 0.795,
};

const PHONE_FAR = {
  centreX: 0.5,
  centreY: 0.48,
  width: 0.195,
};

/** The device's own proportions, from .wm-phone. */
const PHONE_ASPECT = 852 / 393;

/**
 * How tall a box the frozen scene is given to draw in — see the wrapper that uses it. The
 * phone's bottom edge sits 1407 down from the frame's top and its shadow reaches ~110
 * further, so 2000 centred on the frame (spanning -460 to 1540) clears both.
 */
const SCENE_BOX_HEIGHT = 2000;

/** The pull-back, and the scroll home, run together across 2730 - 2755. */
const MOBILE_PULLBACK_FROM = 2730 - 2565;
const MOBILE_PULLBACK_TO = 2755 - 2565;

/** The last frame the shot is on screen; 2760 hard-cuts to the words. */
const MOBILE_LAST_FRAME = 2759 - 2565;

/**
 * The pull-back's curve, and its slope where it ends.
 *
 * Not inOut: that lands the device on the far pose with zero velocity, which is the one
 * thing this move must not do. This one still leaves the near pose from rest — it is
 * coming out of a five-frame hold — but arrives travelling, at twice its own average, and
 * the exit below picks that speed up rather than starting again from nothing.
 *
 * The slope is (1 - y2) / (1 - x2) of the bezier's second control point. Stated here so
 * that retuning the curve retunes the hand-off with it.
 */
const PULLBACK_EASE = Easing.bezier(0.3, 0, 0.7, 0.4);
const PULLBACK_EXIT_SLOPE = (1 - 0.4) / (1 - 0.7);

/**
 * How much of the device is above the frame's top edge on the last frame before the cut.
 *
 * The far pose is passed through, not stopped at: from 2755 the device keeps rising and
 * accelerating, and 2760 cuts to the words while it is still only this far gone. Fifteen
 * percent is comfortably inside "not even a quarter" while still reading unmistakably as
 * leaving rather than as a device that happens to sit high.
 */
const EXIT_OFFSCREEN_FRAC = 0.15;

/**
 * The phone's box on the frame as the FROZEN SCENE leaves it, before this shot reframes
 * it: 589.5 wide — VirginWorkvivoHomeScene draws the 393pt device at 1.5 — with its top
 * edge on 129, which is where that scene's entrance slide has reached by its local 128.
 *
 * Measured off the shot rather than recomputed from the scene's easing, and only true as
 * long as the scene's mobile entrance is unchanged. If that moves, re-measure: everything
 * below is the difference between this box and the target one.
 */
const FROZEN_PHONE_WIDTH = 393 * 1.5;
const FROZEN_PHONE_TOP = 129;

/** The phone's own metrics, from WorkvivoMobileStyles.css. */
const PHONE_BEZEL = 16.5;
/** .wm-scroll's padding-top — what holds the page clear of the fixed hero. */
const PHONE_HERO_PAD = 169.6;
/** The scroll track's full height, measured by colouring it and reading off the frame. */
const PHONE_TRACK_HEIGHT = 1134.7;

/** The page holds at the top until the iris is open, then travels to global 2725. */
const MOBILE_SCROLL_TO = 2725 - 2565;

const MobileIrisOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const radius = interpolate(
    frame,
    [0, MOBILE_IRIS_OPEN_FRAMES],
    [0, MOBILE_IRIS_END_RADIUS],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    },
  );

  // ---- reframing -------------------------------------------------------------------
  // The scene inside the <Freeze> cannot be asked to place its phone differently — it is
  // load-bearing for 417-600 and its framing there is signed off. So the whole frozen
  // frame is scaled and moved instead, about the frame's centre, until its phone lands in
  // the pose wanted. The scene's only other mobile element, the headline, has not begun at
  // local 128, so nothing else is along for the ride.
  //
  // Each pose resolves to the same two numbers — how wide the device should be, and where
  // its top edge should sit — and the transform is the difference between that and the box
  // the frozen scene leaves. Solving both poses and interpolating BETWEEN THE RESULTS is
  // what keeps the move honest: the tween runs from one exact pose to the other rather
  // than from a scale to a scale with the position guessed alongside it.
  const nearWidth = width * PHONE_NEAR.width;
  const nearTop = height * (PHONE_NEAR.centreY - PHONE_NEAR.croppedHeight / 2);

  const farWidth = width * PHONE_FAR.width;
  // Whole device on frame here, so its top is its centre less half its own height.
  const farTop = height * PHONE_FAR.centreY - (farWidth * PHONE_ASPECT) / 2;

  const solve = (targetWidth: number, targetTop: number, centreX: number) => {
    const scale = targetWidth / FROZEN_PHONE_WIDTH;
    // Where scaling about the centre alone would leave the top edge, and therefore how far
    // it still has to travel. translateY is written to the LEFT of scale in the transform
    // so it reads in frame pixels rather than in scaled ones.
    const scaledTop = height / 2 + (FROZEN_PHONE_TOP - height / 2) * scale;
    return { scale, y: targetTop - scaledTop, x: width * centreX - width / 2 };
  };

  const near = solve(nearWidth, nearTop, PHONE_NEAR.centreX);
  const far = solve(farWidth, farTop, PHONE_FAR.centreX);

  const pullback = interpolate(
    frame,
    [MOBILE_PULLBACK_FROM, MOBILE_PULLBACK_TO],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: PULLBACK_EASE,
    },
  );

  // ---- the exit ----------------------------------------------------------------------
  // Past the far pose the device carries on up and out. Position and velocity are both
  // continuous across 2755 — it leaves at exactly the speed it arrived at and accelerates
  // from there — so there is no frame on which it is standing still. That is the whole
  // point of the move: it is passing through the pose, not landing on it.
  //
  // Written as travel = v0*t + a*t²/2 rather than as an eased interpolate because an
  // easing curve has to start somewhere, and every one of them starts at rest. Solving for
  // `a` from where it has to have got to by the cut is what keeps both ends honest.
  const pullbackFrames = MOBILE_PULLBACK_TO - MOBILE_PULLBACK_FROM;
  const exitV0 = (PULLBACK_EXIT_SLOPE * (nearTop - farTop)) / pullbackFrames;

  const exitSpan = MOBILE_LAST_FRAME - MOBILE_PULLBACK_TO;
  const exitTotal = farTop + EXIT_OFFSCREEN_FRAC * (farWidth * PHONE_ASPECT);
  const exitAccel = (2 * (exitTotal - exitV0 * exitSpan)) / (exitSpan * exitSpan);

  const exitFrames = Math.max(0, frame - MOBILE_PULLBACK_TO);
  const exitY = exitV0 * exitFrames + 0.5 * exitAccel * exitFrames * exitFrames;

  const reframe = interpolate(pullback, [0, 1], [near.scale, far.scale]);
  const reframeY = interpolate(pullback, [0, 1], [near.y, far.y]) - exitY;
  const reframeX = interpolate(pullback, [0, 1], [near.x, far.x]);

  // ---- how far the page can travel ---------------------------------------------------
  // Further than the page's own end, and deliberately. In the near pose the device is big
  // and low, so much of its screen is below the cut edge: only this much of the scrolling
  // window is actually on frame.
  const deviceScale = 1.5 * near.scale;
  const windowTopOnFrame = nearTop + (PHONE_BEZEL + PHONE_HERO_PAD) * deviceScale;
  const windowVisible = (height - windowTopOnFrame) / deviceScale;

  // Stopping at the page's own end (track less the FULL window) would leave the last rows
  // below the cut, because the bottom of the window is not the bottom of the shot. Landing
  // the last row on the frame's edge means running past that end — the trailing blank it
  // opens up is entirely off-frame, so what is seen is simply the page arriving at its
  // bottom.
  const scrollBottom = PHONE_TRACK_HEIGHT - windowVisible;

  // Top -> bottom -> hold -> top. One interpolate rather than three, because the holds are
  // just segments with the same value at both ends, and stating the whole journey in one
  // place is what makes it obvious the page ends where it started.
  //
  // inOut, not the house entrance curve: over a run this long a front-loaded ease would
  // spend the first second lurching and the rest crawling. This one leaves the top and
  // settles on the bottom, which is how a page being read scrolls. The way back is the
  // same curve over 25 frames, so it reads as a flick home rather than a second read.
  const scrollTop = interpolate(
    frame,
    [MOBILE_IRIS_OPEN_FRAMES, MOBILE_SCROLL_TO, MOBILE_PULLBACK_FROM, MOBILE_PULLBACK_TO],
    [0, scrollBottom, scrollBottom, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    },
  );

  return (
    <AbsoluteFill>
      {/* `radius > 0` is load-bearing, not defensive. The iris opens FROM zero, and a
          zero-size box does not clip in the export — the renderer bails out of an element
          whose width or height is 0 before installing its overflow clip, then walks into
          the children anyway. Without this the whole mobile scene paints at full size on
          the frame where the iris is supposed to be shut. Same trap as the livestream
          comments panel; see the note in WorkvivoLivestream.tsx. */}
      {radius > 0 && (
        <div
          style={{
            position: "absolute",
            left: width / 2 - radius,
            top: height / 2 - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          {/* Pulled back by the radius so the scene sits on the frame, not on the window:
            the window's centre is the frame's centre, so this puts the scene's top-left
            back on the frame's.

            The field is painted HERE as well as inside the scene. Scaling the scene up and
            dropping it leaves its own 1920x1080 fill short of the top of the frame, and a
            bare strip there would show the card underneath during the opening and black
            after it. #010026 is the scene's own colour, so this is the same field, just
            one that cannot be moved off the edge. */}
          <div
            style={{
              position: "absolute",
              left: radius - width / 2,
              top: radius - height / 2,
              width,
              height,
              background: "#010026",
              overflow: "hidden",
            }}
          >
            {/* Taller than the frame, and centred on it. VirginWorkvivoHomeScene's root
              clips to its own box, and in this shot the phone hangs 327px past the bottom
              of a 1080 one — invisible while the scene is scaled UP, but the moment the
              pull-back shrinks it that edge comes on frame and cuts the device in half.
              Giving the scene a 2000-tall box puts the clip back out of sight.

              Centred rather than top-aligned so nothing else moves: the phone is placed at
              `top: 50%` of this box, so a box centred on the frame's centre leaves it
              exactly where a 1080 one did, and FROZEN_PHONE_TOP still holds. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: (height - SCENE_BOX_HEIGHT) / 2,
                width: "100%",
                height: SCENE_BOX_HEIGHT,
                transform: `translate(${reframeX}px, ${reframeY}px) scale(${reframe})`,
                transformOrigin: "center center",
              }}
            >
              <Freeze frame={HOME_SCENE_FRAME_AT_545}>
                <VirginWorkvivoHomeScene mobileScrollTop={scrollTop} />
              </Freeze>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/** The opening brand mark, behind a circular mask. Lifted from WorkvivoCut. */
const BrandIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { theme, logo } = useCustomization();

  // Entrance: Fade up to center (frames 0 to 18)
  const entrance = interpolate(frame, [0, 18], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(entrance, [0, 1], [45, 0]);

  // Scale down logo from frame 25 to 33
  const scale = interpolate(frame, [25, 33], [1, 0.05], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Circular mask: Full before frame 31, shrinks across frames 31-32, fully done by 33
  // At frame 31: 540px radius (height of 1080p), matching screenshot
  // At frame 32: 180px radius
  // At frame 33: 0px radius (closed)
  const maskRadius = interpolate(frame, [30, 31, 32, 33], [1200, 540, 180, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.brand }}>
      {/* White circular masked container */}
      <AbsoluteFill
        style={{
          backgroundColor: "#ffffff",
          clipPath: `circle(${maskRadius}px at 50% 50%)`,
          WebkitClipPath: `circle(${maskRadius}px at 50% 50%)`,
        }}
      >
        <AbsoluteFill
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: entrance,
            transform: `translateY(${translateY}px) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* The mask is white here, so this is the on-light logo — the knockout would
              vanish. Uploads are usually the full-colour mark, which is the right one. */}
          <Img
            src={logo.onLight}
            style={{
              maxWidth: "55%",
              maxHeight: "55%",
              objectFit: "contain",
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ZoeTestSearchCut: React.FC<{
  /** Which encode to lay underneath. Defaults to the full one, as the full cut needs. */
  reference?: keyof typeof REFERENCE_VIDEO;
}> = ({ reference = "full" }) => {
  const { theme } = useCustomization();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", ...theme.vars }}>
      {/* Three windows of the original edit, laid end to end.
   
          They are kept rather than replaced for two reasons. Between them they carry every
          frame no scene was ever rebuilt over — the workvivo HQ title card, BOTH states of
          the pillar wheel, the endcard and the strapline exist only in this footage, and
          there is nothing else to cut to. And it is still the film's only sound: the
          `<Video>` is unmuted and there is no other audio source in the tree, so dropping
          it would leave a silent cut.

          The chapter is mounted AFTER the intro so it paints over it during the dissolve
          — the export paints in DOM order and ignores z-index, so the order of these three
          is what decides which is on top, not the ladder.

          Separate windows means the audio cuts at each join. The dissolve overlaps the two
          Separate windows means the soundtrack cuts at each join, so each window carries
          an audio fade shaped to the join beside it — see audioEnvelope. Only the two
          joins are faded: the head and the tail are not cuts, they are the film's own
          first and last frames, and the track starts and ends there of its own accord. */}
      <ReferenceWindow
        name="Reference — intro (0 - 390)"
        window={WINDOWS.intro}
        localOffset={INTRO_AT}
        reference={reference}
        audioFadeOut={CROSSFADE}
      />
      <ReferenceWindow
        name="Reference — chapter (2236 - 2760)"
        fadeIn={CROSSFADE}
        window={WINDOWS.chapter}
        localOffset={CHAPTER_AT}
        reference={reference}
        audioFadeIn={CROSSFADE}
        audioFadeOut={OUTRO_DIP}
      />
      <ReferenceWindow
        name="Reference — outro (4983 - 5300)"
        window={WINDOWS.outro}
        localOffset={OUTRO_AT}
        reference={reference}
        audioFadeIn={OUTRO_DIP}
      />

      {/* ---------- intro: global 0 - 417 ---------- */}

      {/* Part 1: Brand logo with Circular Mask (frames 0 to 33) */}
      <Sequence name="Brand Intro" from={inIntro(0)} durationInFrames={33}>
        <BrandIntro />
      </Sequence>
      {/* Part 2: Headquarters Scene. Starts on 33, LAST FRAME 138 — extended from 136, so
          the closing word holds two frames longer before the cut to the reference's HQ
          title card. 33 + 106 = 139 is the exclusive end of the same range.

          139 - 417 is reference only: the workvivo HQ title card and then the wheel with
          all three pillars lit, which is what sets up the chapter below. */}
      <Sequence name="Headquarters Scene" from={inIntro(33)} durationInFrames={106}>
        <HeadquartersScene />
      </Sequence>

      {/* ---------- chapter: global 2236 - 2760 ---------- */}

      {/* Its first 32 frames are the pillar card, reference only, with Search & Knowledge
          picked out of the three. The chapter proper starts here: a circular mask scales
          up revealing the ask bar. */}
      <Sequence name="Ask bar (2268 - 2317)" from={inChapter(2268)} durationInFrames={49}>
        <AskBarScene background={theme.brand} maskFrom={0} maskTo={2} />
      </Sequence>
      {/* Hard cut — the bar is replaced by the search it opens, framed the same way on the
          same field, so only the content changes across the cut. */}
      <Sequence
        name="HQ Search (2317 - 2392)"
        from={inChapter(2317)}
        durationInFrames={75}
      >
        <HqSearchScene background={theme.brand} />
      </Sequence>
      {/* Hard cut from the search results to the agent answering. Same field and the same
          modal footprint — the search state runs off the bottom of the frame and the chat
          sits wholly inside it, which is the reference's own difference between the two
          states rather than a reframing. */}
      <Sequence
        name="HQ Chat (2392 - 2499)"
        from={inChapter(2392)}
        durationInFrames={107}
      >
        <HqChatScene brand={theme.brand} />
      </Sequence>
      {/* Hard cut to the word, on the same field the chat was floating on — so the modal
          leaves and the colour stays, which is what makes it read as a title card for the
          run rather than a new scene. */}
      <Sequence name="Ask (2499 - 2520)" from={inChapter(2499)} durationInFrames={21}>
        <BrandWordScene word="Ask" background={theme.brand} />
      </Sequence>
      <Sequence name="Answer (2520 - 2547)" from={inChapter(2520)} durationInFrames={27}>
        <BrandWordScene word="Answer" background={theme.brand} />
      </Sequence>
      {/* It runs to 2577 rather than 2573 so it is still there behind the iris opening at
          2565-2577: the word is what the circle grows out of, and ending it four frames
          early would put raw reference footage in the ring around the circle for the last
          third of the move. */}
      <Sequence
        name="Job Done (2547 - 2577)"
        from={inChapter(2547)}
        durationInFrames={30}
      >
        <BrandWordScene word="Job Done" background={theme.brand} />
      </Sequence>
      {/* The mobile home opening back out of the middle of that word — see MobileIrisOpen.
          Mounted AFTER the card so it composites above it. The window is fully open by
          2577 and the phone then holds the frame to 2760, which is where the chapter
          ends and the outro takes over. */}
      <Sequence
        name="Mobile iris open + hold (2565 - 2760)"
        from={inChapter(2565)}
        durationInFrames={2760 - 2565}
      >
        <MobileIrisOpen />
      </Sequence>

      {/* ---------- outro: global 4983 - 5300 ---------- */}

      {/* At 4983 the original hard-cuts to the customer logo wall, lit with the tenant
          colour, ending at 5166. No `brand` prop: the scene takes it from the theme, and
          passing a literal here is what kept this shot green for every customer.

          5166 - 5300 is reference only: the workvivo HQ endcard and the strapline. */}
      <Sequence
        name="Workvivo Customer Grid (4983 - 5166)"
        from={inOutro(4983)}
        durationInFrames={5166 - 4983}
      >
        <WorkvivoCustomerGridScene />
      </Sequence>

      {/* ---------- the chapter -> outro join ---------- */}

      {/* LAST in the tree, and that is the whole mechanism: it has to paint over every
          sequence above it, and DOM order is what decides that in the export. Centred on
          OUTRO_AT so it is fully opaque on the frame the shot changes hands. */}
      <Sequence
        name="Dip to brand (chapter -> outro)"
        from={OUTRO_AT - OUTRO_DIP}
        durationInFrames={OUTRO_DIP * 2}
      >
        <DipThrough colour={theme.brand} frames={OUTRO_DIP} />
      </Sequence>
    </AbsoluteFill>
  );
};
