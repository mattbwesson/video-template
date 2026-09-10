import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { CursorArrow } from "./components/CursorArrow";
import { HeadquartersScene } from "./HeadquartersScene";
import { WorkvivoAnalyticsScene } from "./WorkvivoAnalyticsScene";
import { WorkvivoSeerSurveyMobileScene } from "./WorkvivoSeerSurveyMobileScene";
import { GoBeyondScene } from "./GoBeyondScene";
import { WorkvivoSeerManagerInsightsScene } from "./WorkvivoSeerManagerInsightsScene";
import { SeerManagerMobileScene } from "./SeerManagerMobileScene";
import { WorkvivoSpaceFeedScene } from "./WorkvivoSpaceFeedScene";
import { WorkvivoFeedbackArticleScene } from "./WorkvivoFeedbackArticleScene";
import { WorkvivoIntegrationsMarketplaceScene } from "./WorkvivoIntegrationsMarketplaceScene";
import { WorkvivoIntegrationsListScene } from "./WorkvivoIntegrationsListScene";
import { WorkvivoAdminHubScene } from "./WorkvivoAdminHubScene";
import { WorkvivoCustomerGridScene } from "./WorkvivoCustomerGridScene";
import { WorkvivoSeerRater, WorkvivoSeerInsights } from "./components/workvivo";
import "./components/workvivo/WorkvivoGlassEdge.css";
import { GlassRing } from "./components/workvivo/GlassRing";
import { useCustomization } from "./customize/CustomizationProvider";
import { REFERENCE_VIDEO } from "./referenceVideo";

/**
 * The People Intelligence cut — the `Zoe-test-people` composition.
 *
 * The film's own opening and ending, with one of its three chapters in between. The pillar
 * wheel at global 333 names Communication & Engagement, Search & Knowledge and People
 * Intelligence, and this cut keeps the LAST one — "turn signals into insight, action, and
 * results" — and then, because the brief asked for it, the integrations and admin run that
 * follows it. 2349 frames, about 94 seconds, against the original's 5300.
 *
 * Three windows of the original, laid end to end:
 *
 *   local 0-389      global 0-390       intro   brand mark, the faces, the workvivo HQ
 *                                               title card, and the wheel with all three
 *                                               pillars lit — 333 is inside this window
 *   local 375-2031   global 3326-4983   chapter the wheel again with People Intelligence
 *                                               picked out, then Analytics & Reporting ->
 *                                               the Seer survey on mobile -> "Go beyond
 *                                               the numbers" -> Seer Manager Insights,
 *                                               Rater and Comments -> Manager Insights on
 *                                               mobile -> the Space feed -> the feedback
 *                                               article -> the AI survey builder -> the
 *                                               Integrations Marketplace and its connector
 *                                               grid -> the Admin Hub -> the governance
 *                                               run -> the AI capability pills
 *   local 2032-2348  global 4983-5300   outro   the customer logo wall blooming in off
 *                                               those pills, then the workvivo HQ endcard
 *                                               and the strapline
 *
 * The chapter and the outro ABUT — 4983 is the exclusive end of one and the start of the
 * other — so the film runs through that frame untouched and there is exactly ONE join in
 * this cut. 4983 is still a picture CUT, because the logo wall's field is opaque from its
 * first frame; it is the ORIGINAL's cut reproduced, not one this file makes, and frame
 * 5000 here is byte-identical to frame 5000 of L2VirginAirline.
 *
 *   local 375-389   intro -> chapter    15 frames, a true dissolve. Both sides are the same
 *                                       pillar wheel — the intro ends on it fully lit and
 *                                       settled (global 389) and the chapter opens on it
 *                                       dimmed and re-entering with People Intelligence
 *                                       picked out (global 3326) — same position, same
 *                                       scale, same wedges, so the blend reads as one
 *                                       graphic changing state rather than as a cut
 *                                       between two shots. This is the invisible one.
 *
 * It was two joins until the integrations run was restored, and the second was the awkward
 * one — three treatments deep and still visible. Closing the hole removed it outright
 * rather than improving it; see the note where OUTRO_DISSOLVE used to be.
 *
 * The soundtrack does NOT cross where the picture does, and that is what makes the
 * remaining join survive being listened to. The track is a voiceover over a music bed, and
 * a crossfade landing on a word does not hide a cut — it ducks a syllable, which is more
 * noticeable than the cut would have been. Both fades are therefore placed inside a
 * measured pause in the speech, independently of the picture: see AUDIO for the
 * measurements and audioEnvelope for the mechanism. In practice the sound holds at FULL
 * through the front of the dissolve and only lets go once the intro's last word is out
 * on 384.
 *
 * Window ends are exclusive here, as the sequence names in WorkvivoCut are, so the intro's
 * last frame is 389 and the chapter's is 4982.
 *
 * The chapter is a window rather than a hand-picked set of scenes, for the same reason the
 * Search cut's is: those frames are already self-contained and choreographed INTO each
 * other. Four of the beats inside are hard cuts on a click — 3790/3794, 3839/3843 — three
 * more are irises that open onto whatever is mounted below them (the survey's at 3704, the
 * Space feed's at 4066), and the Marketplace at 4459 animates down out of frame to reveal
 * the connector grid behind it. Picking scenes out and splicing them together would have
 * broken every one of those.
 *
 * The intro and outro carry the whole film's framing — the platform positioning at both
 * ends and the wheel that says which of three things you are about to be shown — so this
 * reads as the film joined late rather than as an excerpt starting mid-thought.
 *
 * Every scene is shifted by its window's offset. The scene components all read LOCAL frames
 * inside their own `<Sequence>`, and every shot helper below is written against constants
 * of the form `global - sequenceStart`, so the shift is arithmetic on the `from` props
 * alone — nothing inside a scene or a helper had to be retimed.
 *
 * Still left out, and the only thing that is: the Journeys wall at 1677-1825, employee
 * lifecycle in the Communication & Engagement chapter. It sits a long way upstream, cut
 * into its own neighbours on both sides, so it would need its transitions rebuilt — unlike
 * the integrations run, which was adjacent and therefore free.
 *
 * Three stretches of the chapter are reference only, and are meant to be — no scene was
 * ever rebuilt over them: 3326-3388, the wheel itself; 4253-4397, the AI survey builder;
 * and 4591-4983, the governance run and the pill field.
 *
 * Scene components are still shared with WorkvivoCut, ZoetestCut and ZoeTestSearchCut —
 * see the note in ZoetestCut.tsx. Only the timeline and the shot helpers are this file's
 * own, so retiming or reordering here leaves L2VirginAirline, Zoe-test-comms and
 * Zoe-test-search untouched.
 */

/**
 * The three windows of the original this cut is made of, in order.
 *
 * `to` is exclusive, as the sequence names in WorkvivoCut are. Lengths and local offsets
 * are derived below rather than written down, so moving a boundary moves everything after
 * it and cannot leave a gap.
 *
 * The chapter used to stop at 4391, leaving out the platform-and-admin run the People
 * Intelligence pillar card does not introduce. That run was asked for — "the integrations
 * segment at 4401 to 4986" — so the chapter now carries it, and the hole between the two
 * halves of the cut is closed.
 *
 * Which makes `chapter` and `outro` ABUT: 4983 is both the chapter's exclusive end and the
 * outro's start, so between them nothing is skipped and there is nothing to transition.
 * They are still two entries rather than one because they are two different jobs — the
 * chapter is the part being chosen, the outro is the film's ending and is common to every
 * cut in this family — and keeping the names means the rest of the file, its sequence
 * offsets and its comments did not have to be rewritten to say the same thing.
 *
 * The brief's exact numbers are 4401 and 4986 and neither is used verbatim, for reasons
 * worth stating:
 *
 *   4401  is four frames into the Integrations Marketplace's entrance, which begins on
 *         4397, and nine frames into the sentence that introduces it, which begins on 4392.
 *         Starting there would clip both. Nothing is gained by it either: the chapter
 *         already runs to 4391, so continuing from 4391 costs ten frames and makes the
 *         whole stretch seamless rather than spliced.
 *   4986  is three frames PAST 4983, where the outro window already starts, so it is
 *         inside footage the cut has always had. Ending the added stretch at 4983 covers
 *         the requested range exactly once instead of laying three frames down twice.
 */
const WINDOWS = {
  intro: { from: 0, to: 390 },
  chapter: { from: 3326, to: 4983 },
  outro: { from: 4983, to: 5300 },
} as const;

const lengthOf = (w: { from: number; to: number }) => w.to - w.from;

/**
 * Where the voiceover is, and where it is not.
 *
 * Measured off the reference's own audio track rather than guessed: the track was pulled
 * to mono 16k, pre-emphasised (y[i] = x[i] - 0.97·x[i-1], which tilts +6dB/oct and drops
 * the music bed's low end away so what is left is dominated by the voice) and read as RMS
 * per video frame. Speech sits around -18 dBFS, the bed between -33 and -40, so the two
 * separate cleanly.
 *
 * The pauses that matter, in global frames:
 *
 *   384 - 424    after the intro's last phrase. 40 frames.
 *   3305 - 3387  across the whole People Intelligence pillar card. 82 frames — the chapter
 *                is silent until its own voiceover starts on 3387, one frame before
 *                Analytics arrives.
 * Both fades below sit inside one of those two, which is what makes the one remaining join
 * inaudible: no word is ever faded, and the only thing being crossfaded is a music bed
 * already 15-20 dB down.
 *
 * Two more measurements mattered while the chapter stopped at 4391, and are kept because
 * they are why it no longer does:
 *
 *   4392         where the integrations run's voiceover starts — six frames BEFORE its
 *                picture does at 4397, a J-cut of the original's own. The old out point
 *                had to dodge it, stopping at 4391 so as not to carry five frames of a
 *                sentence the cut did not go on to tell. There is nothing to dodge now:
 *                the sentence and the pictures it belongs to are both here.
 *   4977 - 4990  before the outro's first phrase. The outro used to fade up inside this
 *                pause because it was a splice. It is not one any more — the chapter runs
 *                straight into it — so the fade is gone and the track simply continues.
 *
 * Stated in GLOBAL frames, the same numbers the measurements are in, and converted to
 * sequence-local frames by audioEnvelope. Writing them as local offsets would mean
 * re-deriving them by hand every time a window boundary moves, which is exactly how a fade
 * ends up back on top of a word.
 */
const AUDIO = {
  intro: { fadeOut: [384, 389] },
  chapter: { fadeIn: [3335, 3347] },
  outro: {},
} as const;

/**
 * Frames of dissolve between the intro and the chapter.
 *
 * The two shots either side of this join are the SAME graphic in two states: the intro
 * ends on the pillar wheel fully lit and settled (global 389), and the chapter opens on
 * that wheel dimmed and re-entering with People Intelligence picked out (global 3326).
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
 * Frames the customer logo wall dissolves up over the reference at 4983.
 *
 * The original hard-cuts here and so did this cut until it was asked not to. What the cut
 * leaves is the reference's field of AI capability pills — bright blue, busy, full-frame —
 * and what arrives is WorkvivoCustomerGridScene, whose field is opaque brand colour from
 * its first frame. One frame of blue detail, then flat green. `Zoe-test-comms` makes the
 * same cut at its own 2232 and gets away with it because it is leaving the AI Summary card
 * on a dark purple gradient: calm, centred, and much closer in weight to what follows. The
 * mechanism is identical; only the outgoing shot makes it read as a bang here.
 *
 * The dissolve runs BEFORE 4983, not across it, and that is a hard constraint rather than a
 * preference. At 4987 the reference does its own circular iris, closing the pills down onto
 * the film's logo wall — and that wall is VIRGIN RED. Anything still translucent at that
 * point mixes tenant green with Virgin red and turns olive, which is not merely ugly: it
 * leaks un-rebranded footage into a customer's video, the exact failure this file warns
 * about wherever the wall's colour is discussed. A first attempt faded across 4983-4997 and
 * did precisely that.
 *
 * So the scene is mounted OUTRO_GRID_DISSOLVE frames early and is fully opaque by 4983 —
 * the frame the original cuts on. Everything underneath the blend is the pill field, which
 * is generic HQ blue and safe to show; from 4983 the wall is solid and the reference's red
 * never reaches the frame. Deriving the mount from the dissolve keeps that invariant true
 * if the length is ever retuned.
 *
 * Twelve frames, bounded on both sides. Longer would start the wall before the voiceover's
 * last phrase of the integrations run is out at 4976; shorter stops reading as a transition
 * at all. Blue to green passes through a desaturated middle for two or three frames, which
 * is the cost of blending two saturated fields — but the wall's cards are blooming across
 * exactly those frames and cover it, and unlike blue-to-red it never lands on a colour that
 * belongs to another brand.
 *
 * Opacity only, so it costs no frames and touches no audio. The soundtrack across here
 * stays bit-identical to the original — see AUDIO, and note the wall's arrival at 4983 sits
 * seven frames inside a 14-frame pause in the voiceover.
 */
const OUTRO_GRID_DISSOLVE = 12;

/**
 * Where the wall is mounted, so that its dissolve FINISHES on 4983.
 *
 * Derived, not written down: the whole point is that the scene is opaque before the
 * reference turns red, and that guarantee should survive someone changing the length above.
 */
const OUTRO_GRID_FROM = 4983 - OUTRO_GRID_DISSOLVE;

/**
 * There is no constant for a chapter -> outro transition because there is no longer a
 * chapter -> outro transition, and that is the best thing about restoring the integrations
 * run.
 *
 * It was the awkward join. The shots either side had nothing in common, and it went
 * through three treatments before this: a dip through the brand colour, an 18-frame
 * dissolve, and a 7-frame soft cut. None was invisible. The dip flashed a colour that
 * matched neither side — global 4983 does NOT open on the customer logo wall, it opens on
 * the reference's bright blue field of AI capability pills, with the wall fading up over
 * them afterwards. The 18-frame dissolve was worse: the incoming shot is itself a
 * transition, so blending into it put three pictures on the frame at half strength each.
 * The soft cut was the least bad of the three rather than good.
 *
 * All of that was work to disguise a splice that only existed because the film had been cut
 * in half here. With 4391 - 4983 put back the two windows abut and the reference runs
 * straight through them, so there is nothing left to disguise.
 *
 * Note what does NOT happen at 4983: it does not become a soft cut, and it is not the case
 * that nothing changes. WorkvivoCustomerGridScene mounts there with an OPAQUE brand field,
 * so on screen 4983 is still a hard cut — from the reference's blue pills to flat brand,
 * with the logo cards blooming in over 20 frames and the camera pulling back over 180.
 * That is the original's own transition, designed as a cut. The point is that this cut now
 * reproduces it rather than landing a window boundary on top of it: frame 5000 here is
 * byte-identical to frame 5000 of L2VirginAirline.
 */

/**
 * Where each window starts in the new timeline.
 *
 * The chapter is pulled back by CROSSFADE so it overlaps the tail of the intro — the only
 * frame cost in the cut. The outro simply follows the chapter, since they abut.
 */
const INTRO_AT = 0;
const CHAPTER_AT = INTRO_AT + lengthOf(WINDOWS.intro) - CROSSFADE;
const OUTRO_AT = CHAPTER_AT + lengthOf(WINDOWS.chapter);

/** Composition length. Root.tsx reads this rather than restating 2349. */
export const PEOPLE_CUT_DURATION = OUTRO_AT + lengthOf(WINDOWS.outro);

/** `from` for a scene that sat at `globalFrame` inside `window`. */
const at =
  (window: { from: number; to: number }, localOffset: number) => (globalFrame: number) =>
    localOffset + globalFrame - window.from;

const inIntro = at(WINDOWS.intro, INTRO_AT);
const inChapter = at(WINDOWS.chapter, CHAPTER_AT);
const inOutro = at(WINDOWS.outro, OUTRO_AT);

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
 * An equal-power fade envelope for one window, written in GLOBAL frames.
 *
 * `<Video volume>` is called with the frame counted from its own Sequence's start, so this
 * converts: sequence-local 0 is global `from`, except for a window starting at global 0,
 * which is mounted one frame late (see ReferenceWindow) and whose local 0 is therefore
 * global 1.
 *
 * Taking global frames rather than lengths-and-durations is the point of this signature.
 * Every one of these fades has to sit inside a measured pause in the voiceover — see AUDIO
 * — and those pauses are known in global frames. Expressing them as offsets from a window
 * edge would mean re-deriving four numbers by hand every time a boundary moves, and the
 * failure mode when that goes wrong is a fade sitting on top of a word, which is both the
 * most audible thing this file can get wrong and the hardest to spot in a diff.
 *
 * `Math.sqrt` rather than a straight line: the two windows either side of a join are
 * uncorrelated stretches of one track, so two LINEAR ramps crossing sum to about 0.5 of the
 * power at the midpoint — an audible dip in the middle of the crossfade. Two square-root
 * ramps sum to roughly constant power, which is what a crossfade is supposed to sound like.
 */
const audioEnvelope = (
  w: { from: number; to: number },
  fades: {
    readonly fadeIn?: readonly [number, number];
    readonly fadeOut?: readonly [number, number];
  },
) => {
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
 * The reference is mounted at `from={1}` in the full timeline, so composition frame F
 * shows video frame F-1. Preserving that offset is what keeps picture and audio in the
 * sync they were graded in, and it is why `trimBefore` is `from - 1` rather than `from`.
 *
 * A window starting at global 0 is the exception: there is no video frame -1, and the
 * original simply had no reference on its first frame. That case starts one frame later
 * and plays from the top, which is exactly what the original does.
 */
const ReferenceWindow: React.FC<{
  name: string;
  window: { from: number; to: number };
  localOffset: number;
  reference: keyof typeof REFERENCE_VIDEO;
  /** Frames to fade the PICTURE up over on entry. 0 for a hard cut. */
  fadeIn?: number;
  /**
   * Where the AUDIO fades, in global frames — deliberately independent of the picture's.
   *
   * This is the split edit that does most of the work at both joins. The picture dissolves
   * where the graphics want it to and the sound crosses where the voiceover has stopped
   * talking, and those are not the same frames: at the first join the picture starts
   * changing on 375 while the intro's last word runs to 384, so the audio holds at full
   * through the front of the dissolve and only lets go afterwards.
   */
  audio?: {
    readonly fadeIn?: readonly [number, number];
    readonly fadeOut?: readonly [number, number];
  };
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
        {/* `trimBefore` is what trims the window; the Sequence's own
            `durationInFrames` above is what ends it. There is deliberately no
            `durationInFrames` on the <Video> itself — this component is mounted three
            times, so a length set here would cap every window at the same number and
            silently truncate the two longer ones.

            `volume` takes the frame counted from this Sequence's start, which is why the
            envelope can be written against global frames and needs to know nothing about
            where the window sits in the cut. Unmuted, as in the original: this element is
            the film's only sound. */}
        <Video
          src={staticFile(REFERENCE_VIDEO[reference])}
          trimBefore={atZero ? 0 : w.from - 1}
          volume={audioEnvelope(w, audio)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          durationInFrames={1990}
        />
      </FadeIn>
    </Sequence>
  );
};

/**
 * The survey's sign-off: it recedes, then an iris shuts on it.
 *
 * Two moves that overlap rather than follow one another. The shrink sets off on global
 * 3695 and is still going when the iris starts on 3704 — a shot that had stopped moving
 * before the mask reached it would read as two separate events, and the point of the
 * overlap is that the device is being taken away rather than covered up.
 *
 * The iris is three frames on inOut(quad) rather than the house bezier(0.16, 1, 0.3, 1):
 * that curve is most of the way shut on its first frame, which over three frames reads as
 * a hard cut with two dead frames after it.
 *
 * What it opens onto is the "Go beyond" card mounted below it in the tree.
 */
const SURVEY_SHRINK_FROM = 3695 - 3571;
const SURVEY_IRIS_FROM = 3704 - 3571;
const SURVEY_IRIS_TO = 3707 - 3571;

const SurveySignOffShot: React.FC = () => {
  const frame = useCurrentFrame();

  // Runs past the iris on purpose — it is the rate that matters, not the destination,
  // because the shot is gone before it gets there.
  const shrink = interpolate(frame, [SURVEY_SHRINK_FROM, SURVEY_IRIS_TO + 6], [1, 0.74], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  const maskRadius = interpolate(frame, [SURVEY_IRIS_FROM, SURVEY_IRIS_TO], [1101, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const mask = `circle(${maskRadius}px at 50% 50%)`;

  return (
    // The field is painted HERE and the scene is handed `transparent`, so the shrink takes
    // the device and nothing else. Scaling the scene whole would pull its own 1920x1080
    // fill in with the phone and open a border of reference footage around it.
    <AbsoluteFill
      style={{
        background: "#010320",
        overflow: "hidden",
        clipPath: mask,
        WebkitClipPath: mask,
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${shrink})`,
          transformOrigin: "center center",
        }}
      >
        <WorkvivoSeerSurveyMobileScene background="transparent" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Global frames the two ends of this transition are pinned to. */
const SEER_MOBILE_FROM = 3903;
const SPACE_FEED_IRIS_FROM = 4066;

/**
 * At 4066, a circular mask closes down completing at 4070 (5 frames total),
 * shrinking the outgoing manager insights shot down to 0 and revealing
 * the brand field with WorkvivoSpaceFeed rising up underneath it.
 *
 * What shrinks is SeerManagerMobileScene — the native screen — not the reference video it
 * used to be. Before that scene existed this reached for the raw footage because there was
 * nothing else to shrink; now that there is, keeping the video would cut from the native
 * screen to Workvivo's own demo data on the iris's first frame. Same shot, different
 * person's name, and a red ring round the avatar.
 *
 * The negative `from` is what holds it still: this Sequence starts at the iris, so the
 * scene would otherwise replay its entrance inside the closing mask. Offsetting by the
 * frames since 3903 puts it at the state the cut is leaving.
 */
const SpaceFeedIrisTransition: React.FC = () => {
  const frame = useCurrentFrame();

  const maskRadius = interpolate(frame, [0, 4], [1101, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${maskRadius}px at 50% 50%)`,
        WebkitClipPath: `circle(${maskRadius}px at 50% 50%)`,
        overflow: "hidden",
      }}
    >
      <Sequence from={SEER_MOBILE_FROM - SPACE_FEED_IRIS_FROM} layout="none">
        <SeerManagerMobileScene />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Hard cut off the Manager Insights click, at 3794 — four frames after the 3790 click, the
 * same click-to-cut gap the film uses elsewhere. No transition of any kind: the Rater tab
 * simply replaces the frame when the sequence above ends.
 *
 * Framed exactly like the Manager Insights shot it cuts from — the same 1760x1080 device,
 * the same glass edge, the same top-176 box scaled to 1478 of the 1920 frame — so the two
 * shots read as the same window and only the tab changes across the cut. Static, not
 * arriving: this is a tab switch inside a window that is already on screen, not a device
 * showing up again.
 *
 * The cursor does not re-enter either. It continues exactly from where the Manager
 * Insights click left it (Centre X 33.2%, Centre Y 32.0%), holds for ten frames, then
 * travels to click the Comments tab at Centre X 38.4%, Centre Y 32.0% — global 3839,
 * local 45. WorkvivoSeerRater's own static cursor is switched off with `cursor={null}`
 * so it does not draw a second one underneath this animated one.
 */
const SEER_RATER_HANDOFF_X = 0.332;
const SEER_RATER_HANDOFF_Y = 0.32;
const SEER_RATER_CLICK_X = 0.384;
const SEER_RATER_CLICK_Y = 0.32;
const SEER_RATER_TRAVEL_FROM = 10;
const SEER_RATER_CLICK_AT = 3839 - 3794;

const SeerRaterClick2Shot: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = useCustomization();

  // Same device box as WorkvivoSeerManagerInsightsScene: 1760x1080 scaled to 1478 of the
  // 1920 frame, top edge fixed at 176 — but constant, no entrance, since this is a cut.
  const z = 1478 / 1760;

  // cursor.svg's point sits about (12, 3.75) inside its 85.5px box, same correction every
  // other cursor shot in the film makes.
  const handoffX = width * SEER_RATER_HANDOFF_X - 12;
  const handoffY = height * SEER_RATER_HANDOFF_Y - 3.75;
  const clickX = width * SEER_RATER_CLICK_X - 12;
  const clickY = height * SEER_RATER_CLICK_Y - 3.75;

  const cursorX = interpolate(
    frame,
    [SEER_RATER_TRAVEL_FROM, SEER_RATER_CLICK_AT - 4],
    [handoffX, clickX],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );
  const cursorY = interpolate(
    frame,
    [SEER_RATER_TRAVEL_FROM, SEER_RATER_CLICK_AT - 4],
    [handoffY, clickY],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    },
  );
  const cursorPress = interpolate(
    frame,
    [SEER_RATER_CLICK_AT - 3, SEER_RATER_CLICK_AT, SEER_RATER_CLICK_AT + 3],
    [1, 0.84, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        background: theme.brand,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "hidden",
      }}
    >
      <div
        className="wv-glass-edge"
        style={
          {
            position: "absolute",
            left: "50%",
            top: 176,
            width: 1760,
            height: 1080,
            marginLeft: -880,
            borderRadius: 16,
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.45)",
            ["--wv-glass-radius" as string]: "16px",
            transform: `scale(${z})`,
            transformOrigin: "center top",
          } as React.CSSProperties
        }
      >
        <GlassRing />
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <WorkvivoSeerRater cursor={null} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: cursorX,
          top: cursorY,
          transform: `scale(${cursorPress})`,
          transformOrigin: "12px 3.75px",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        <CursorArrow
          color="black"
          style={{
            width: 85.5,
            height: 85.5,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Hard cut off the Rater click, at 3843 — four frames after the 3839 click, the same
 * click-to-cut gap the 3790/3794 cut uses. The Comments tab (WorkvivoSeerInsights) simply
 * replaces the frame when the sequence above ends.
 *
 * Framed exactly like the two shots before it — the same 1760x1080 device, the same glass
 * edge, the same top-176 box scaled to 1478 of the 1920 frame — so all three tabs read as
 * the same window with only the content changing across each cut. `width={1760}
 * height={1080}` on WorkvivoSeerInsights is what keeps it 1:1 inside that box: the
 * component fits its own chrome to whatever size it is given, and at its native size that
 * fit is exactly 1, the box's own scale being handled by the wrapper below.
 *
 * WorkvivoSeerInsights draws no cursor of its own — unlike WorkvivoSeerRater there is
 * nothing to switch off. The cursor from the click that opened this shot lifts and fades
 * over ten frames instead of continuing to a further target.
 */
const SEER_INSIGHTS_HANDOFF_X = 0.384;
const SEER_INSIGHTS_HANDOFF_Y = 0.32;

const SeerInsightsCutShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { theme } = useCustomization();

  const z = 1478 / 1760;

  const cursorX = width * SEER_INSIGHTS_HANDOFF_X - 12;
  const cursorY = height * SEER_INSIGHTS_HANDOFF_Y - 3.75;
  const cursorLift = interpolate(frame, [0, 10], [0, -6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const cursorOpacity = interpolate(frame, [0, 10], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: theme.brand,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "hidden",
      }}
    >
      <div
        className="wv-glass-edge"
        style={
          {
            position: "absolute",
            left: "50%",
            top: 176,
            width: 1760,
            height: 1080,
            marginLeft: -880,
            borderRadius: 16,
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.45)",
            ["--wv-glass-radius" as string]: "16px",
            transform: `scale(${z})`,
            transformOrigin: "center top",
          } as React.CSSProperties
        }
      >
        <GlassRing />
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <WorkvivoSeerInsights
            width={1760}
            height={1080}
            glassEdge={false}
            animateIn
            animateStartFrame={6}
          />
        </div>
      </div>

      {frame <= 10 && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY + cursorLift,
            transform: "translate(-12px, -3.75px)",
            transformOrigin: "12px 3.75px",
            opacity: cursorOpacity,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <CursorArrow
            color="black"
            style={{
              width: 85.5,
              height: 85.5,
            }}
          />
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

export const ZoeTestPeopleCut: React.FC<{
  /** Which encode to lay underneath. Defaults to the full one, as the full cut needs. */
  reference?: keyof typeof REFERENCE_VIDEO;
}> = ({ reference = "full" }) => {
  const { theme } = useCustomization();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", ...theme.vars }}>
      {/* Three windows of the original edit, laid end to end.

          They are kept rather than replaced for two reasons. Between them they carry every
          frame no scene was ever rebuilt over — the workvivo HQ title card, BOTH states of
          the pillar wheel, the AI survey builder, the endcard and the strapline exist only
          in this footage, and there is nothing else to cut to. And it is still the film's
          only sound: the `<Video>` is unmuted and there is no other audio source in the
          tree, so dropping it would leave a silent cut.

          The chapter is mounted AFTER the intro so it paints over it during the dissolve
          — the export paints in DOM order and ignores z-index, so the order of these three
          is what decides which is on top, not the ladder.

          Separate windows means the soundtrack cuts at each join, so each window carries
          an audio fade placed in a measured pause in the voiceover — see AUDIO and
          audioEnvelope. Those fades are NOT the picture's: the sound crosses where the
          speech has stopped, the picture where the graphics want it to. Only the two joins
          are faded — the head and the tail are not cuts, they are the film's own first and
          last frames, and the track starts and ends there of its own accord. */}
      <ReferenceWindow
        name="Reference — intro (0 - 390)"
        window={WINDOWS.intro}
        localOffset={INTRO_AT}
        reference={reference}
        audio={AUDIO.intro}
      />
      <ReferenceWindow
        name="Reference — chapter (3326 - 4983)"
        fadeIn={CROSSFADE}
        window={WINDOWS.chapter}
        localOffset={CHAPTER_AT}
        reference={reference}
        audio={AUDIO.chapter}
      />
      {/* No `fadeIn`, and none wanted: this window starts on the frame after the one above
          it ends, so the two are consecutive frames of the same source. A fade here would
          be a transition between a shot and itself. */}
      <ReferenceWindow
        name="Reference — outro (4983 - 5300)"
        window={WINDOWS.outro}
        localOffset={OUTRO_AT}
        reference={reference}
        audio={AUDIO.outro}
      />

      {/* ---------- intro: global 0 - 390 ---------- */}

      {/* Part 1: Brand logo with Circular Mask (frames 0 to 33) */}
      <Sequence name="Brand Intro" from={inIntro(0)} durationInFrames={33}>
        <BrandIntro />
      </Sequence>
      {/* Part 2: Headquarters Scene. Starts on 33, LAST FRAME 138 — extended from 136, so
          the closing word holds two frames longer before the cut to the reference's HQ
          title card. 33 + 106 = 139 is the exclusive end of the same range.

          139 - 390 is reference only: the workvivo HQ title card and then the wheel with
          all three pillars lit — global 333, the card this cut is named after. */}
      <Sequence name="Headquarters Scene" from={inIntro(33)} durationInFrames={106}>
        <HeadquartersScene />
      </Sequence>

      {/* ---------- chapter: global 3326 - 4397 ---------- */}

      {/* Its first 62 frames are the pillar card, reference only, with People Intelligence
          picked out of the three. The chapter proper starts at 3388, where Analytics &
          Reporting animates up on #010320: the camera pans to the bar charts at 3430,
          zooms out at 3475 and the whole screen animates back down from 3534. */}
      <Sequence
        name="Workvivo Analytics (3388 - 3572)"
        from={inChapter(3388)}
        durationInFrames={3572 - 3388}
      >
        <WorkvivoAnalyticsScene background="#010320" />
      </Sequence>

      {/* The three Seer Insights tabs, cut click to click. Declared here — BEFORE the
          "Go beyond" card and the survey below them — because DOM order is what decides
          compositing in the export, and this ladder is load-bearing:

            Manager Insights (3758) is mounted before the card so the card's line can be
            pushed up ACROSS it — the two moves are one gesture and the words have to
            travel over the arriving device, not behind it. From 3758 this scene is also
            what paints the brand field.

          Trimmed to 36 frames, not 50: the cursor clicks the Rater tab at local 32
          (global 3790), and the sequence stops four frames later on the cut below. */}
      <Sequence
        name="Workvivo Seer Manager Insights (3758 - 3794)"
        from={inChapter(3758)}
        durationInFrames={3794 - 3758}
      >
        <WorkvivoSeerManagerInsightsScene />
      </Sequence>
      {/* Hard cut on the click at 3790: no transition, the Rater tab simply replaces the
          frame when the sequence above ends four frames later. See SeerRaterClick2Shot
          for the framing and the cursor handoff.

          Trimmed to 49 frames: this shot's own cursor clicks the Comments tab at local 45
          (global 3839), and the sequence stops four frames later on the cut below — the
          same click-to-cut gap as the 3790/3794 cut. */}
      <Sequence
        name="Workvivo Seer Rater, click 2 (3794 - 3843)"
        from={inChapter(3794)}
        durationInFrames={3843 - 3794}
      >
        <SeerRaterClick2Shot />
      </Sequence>
      {/* Hard cut on the click at 3839: no transition, the Comments tab
          (WorkvivoSeerInsights) simply replaces the frame when the sequence above ends
          four frames later. See SeerInsightsCutShot for the framing and the cursor
          lift-off. */}
      <Sequence
        name="Workvivo Seer Insights (Comments), click 3 (3843 - 3903)"
        from={inChapter(3843)}
        durationInFrames={3903 - 3843}
      >
        <SeerInsightsCutShot />
      </Sequence>
      {/* Hard cut at 3903 to Manager Insights on the phone, its two headline cards floated
          either side. Runs to 4072 — six frames past the Space Feed's iris at 4066, which
          is declared later in the tree and so shuts over this rather than under it. */}
      <Sequence
        name="Seer Manager Insights, mobile (3903 - 4072)"
        from={inChapter(SEER_MOBILE_FROM)}
        durationInFrames={4072 - SEER_MOBILE_FROM}
      >
        <SeerManagerMobileScene />
      </Sequence>

      {/* Under layer (3702+): the sign-off the survey's iris opens onto. Mounted BELOW the
          survey so the mask reveals it, and five frames early so it is up before it is
          ever seen.

          Runs to 3776 rather than stopping at 3758: its line is still on screen for the
          18 frames the device above takes to arrive, being pushed up and off by it. */}
      <Sequence name="Go beyond (3702 - 3776)" from={inChapter(3702)} durationInFrames={74}>
        {/* The field is laid down here rather than left to the card, and only until 3758.
            The iris starts shutting on 3704, and for those three frames the ring outside
            it has to be brand colour — if the only thing under the mask were a card that
            has not started yet, the reveal would open onto the reference footage instead.
            After 3758 the scene above owns the field, and a second opaque fill here would
            simply hide it. */}
        <Sequence durationInFrames={3758 - 3702}>
          <AbsoluteFill style={{ background: theme.brand }} />
        </Sequence>
        <Sequence from={3707 - 3702}>
          {/* scaleFrom is the house title card read backwards: Ask / Answer / Job Done all
              grow in from 0.88, and this one settles down onto the frame instead. The
              inner Sequence starts that move on 3707, the frame the iris finishes
              shutting, so the whole gesture is on screen rather than half of it happening
              behind the mask. */}
          <GoBeyondScene
            background={theme.brand}
            lead="Go beyond"
            tail={["the", "numbers"]}
            scaleFrom={2.2}
            moveFrom={3719 - 3707}
            exitFrom={3758 - 3707}
          />
        </Sequence>
      </Sequence>
      {/* At 3571, animate up WorkvivoSeerSurveyMobile with glass border. It ends on 3707
          rather than running on behind a zero-radius clip. See SurveySignOffShot for the
          shrink and the iris. Mounted after "Go beyond" so the iris opens onto it. */}
      <Sequence
        name="Workvivo Seer Survey Mobile (3571 - 3707)"
        from={inChapter(3571)}
        durationInFrames={3707 - 3571}
      >
        <SurveySignOffShot />
      </Sequence>

      {/* At 4066, a circular mask scales down completing at 4070, revealing the brand field
          with WorkvivoSpaceFeed animating up. The feed is mounted first so the iris above
          it opens onto it. */}
      <Sequence
        name="Workvivo Space Feed on Brand (4066 - 4110)"
        from={inChapter(4066)}
        durationInFrames={4110 - 4066}
      >
        <WorkvivoSpaceFeedScene background={theme.brand} entranceDuration={18} />
      </Sequence>
      <Sequence
        name="Space Feed Iris Close (4066 - 4070)"
        from={inChapter(SPACE_FEED_IRIS_FROM)}
        durationInFrames={4070 - 4066 + 1}
      >
        <SpaceFeedIrisTransition />
      </Sequence>
      {/* At 4110, hard cut from the Space feed to WorkvivoFeedbackArticle animating up on
          the brand field.

          4253 - 4397 is reference only: the AI survey builder — "Create a Survey or Form
          with Workvivo AI" — writing and assembling a company-wide employee sentiment
          survey. No scene was ever rebuilt over it. It closes the People Intelligence
          material, and the integrations run below picks up straight out of it exactly as
          the original does. */}
      <Sequence
        name="Workvivo Feedback Article (4110 - 4253)"
        from={inChapter(4110)}
        durationInFrames={4253 - 4110}
      >
        <WorkvivoFeedbackArticleScene background={theme.brand} entranceDuration={36} />
      </Sequence>

      {/* ---------- integrations and admin: global 4397 - 4983 ---------- */}

      {/* The run the pillar card does not introduce, here because the brief asked for it:
          the Integrations Marketplace, the connector grid it opens into, the Admin Hub,
          and then 4591 - 4983 of reference with no scene over it — the admin settings
          cards flying past (People, Features, Theming, Localization, Integrations,
          Provisioning), "Granular Controls / Permissions / Governance", and the field of
          AI capability pills which carries on across 4983 and under the logo wall.

          Its voiceover starts on 4392, six frames before its first picture. That J-cut is
          the original's own, and it lands here intact now that both halves are in the cut.

          The List is declared BEFORE the Marketplace, and that is load-bearing rather than
          alphabetical: the two overlap between 4459 and 4480, and the Marketplace animates
          DOWN out of frame across those frames to reveal the List underneath it. DOM order
          is what decides compositing in the export, so swapping these two would send the
          Marketplace out behind the grid it is supposed to be in front of. Same order as
          WorkvivoCut, for the same reason. */}
      <Sequence
        name="Workvivo Integrations List (4459 - 4554)"
        from={inChapter(4459)}
        durationInFrames={4554 - 4459}
      >
        <WorkvivoIntegrationsListScene background={theme.brand} entranceDuration={95} />
      </Sequence>
      {/* At 4397 the Marketplace card enters on the brand field; at local 62 — global 4459,
          the frame the List above starts arriving — it animates down and out. */}
      <Sequence
        name="Workvivo Integrations Marketplace (4397 - 4480)"
        from={inChapter(4397)}
        durationInFrames={4480 - 4397}
      >
        <WorkvivoIntegrationsMarketplaceScene
          background={theme.brand}
          exitStartFrame={62}
          exitDuration={18}
        />
      </Sequence>
      {/* At 4553 the Admin Hub animates up on #000021 — its own near-black field, not the
          tenant colour, which is why this one takes a literal where both its neighbours
          take `theme.brand`. */}
      <Sequence
        name="Workvivo Admin Hub (4553 - 4591)"
        from={inChapter(4553)}
        durationInFrames={4591 - 4553}
      >
        <WorkvivoAdminHubScene background="#000021" entranceDuration={24} />
      </Sequence>

      {/* ---------- outro: global 4983 - 5300 ---------- */}

      {/* At 4983 the customer logo wall takes the frame, lit with the tenant colour, and
          settles by 5166. No `brand` prop: the scene takes it from the theme, and passing a
          literal here is what kept this shot green for every customer.

          Its field is opaque from its first frame, so left alone this is a hard cut off the
          reference's pill grid, with the cards blooming in over 20 frames and the camera
          pulling back over 180. That is the original's own design and it was reproduced
          exactly until a smoother hand-off was asked for.

          The FadeIn is that hand-off: the wall dissolves up over the pills instead of
          replacing them. It is deliberately NOT the wrapper this carried two revisions ago
          — that one existed to stop the wall painting over a half-dissolved chapter and was
          removed with the dissolve it belonged to. This one is the transition itself. See
          OUTRO_GRID_DISSOLVE for the length and for why a dissolve is only possible here
          now that the reference underneath runs continuously.

          The mount moves EARLIER by the dissolve's length rather than the dissolve running
          across 4983, so the wall is solid on 4983 exactly as before. The out point is
          still 5166, so the sequence is longer by those frames and the tail is untouched.
          The wall's bloom and camera move therefore start twelve frames sooner than the
          original — the visible cost of the transition, and the only thing here that is not
          frame-for-frame the film.

          5166 - 5300 is reference only: the workvivo HQ endcard and the strapline. */}
      <Sequence
        name="Workvivo Customer Grid (4971 - 5166, dissolving up to 4983)"
        from={inOutro(OUTRO_GRID_FROM)}
        durationInFrames={5166 - OUTRO_GRID_FROM}
      >
        <FadeIn frames={OUTRO_GRID_DISSOLVE}>
          <WorkvivoCustomerGridScene />
        </FadeIn>
      </Sequence>
    </AbsoluteFill>
  );
};
