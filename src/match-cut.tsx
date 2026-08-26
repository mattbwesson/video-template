/**
 * match-cut.tsx — a whip-pan-style match cut for Remotion, unified across scale, directional,
 * directional-scale, rotational, scale-rotational, and perspective.
 *
 * THE MECHANIC (identical for every kind of cut):
 *   • The outgoing element and the incoming element travel the SAME motion path, eased by ONE shared
 *     curve (per mode — see below), moving the SAME direction — B slides/scales/spins in continuing
 *     exactly where A left off, so B reads as directly replacing A. Like a whip pan.
 *   • The middle of the motion is removed with a HARD CUT. Treat the transition as a timeline 0→100%:
 *       0%→cutStart of the time   → A plays 0%→cutStart of its motion
 *       at cutStart               → hard cut
 *       cutEnd of the time        → B is already at cutEnd of its motion
 *       cutEnd→100% of the time   → B plays cutEnd→100% of its motion
 *     The whole cutStart–cutEnd slice — the fast, hard-to-track middle where the A→B seam sweeps past —
 *     is never shown. The jump across it IS the cut, and it lands in the curve's fast stretch, so it
 *     reads as one seamless, invisible snap instead of a visible transition. cutStart/cutEnd default to
 *     0.5/0.75 (the "hard" intensity preset — see INTENSITY below) but are configurable per mode.
 *
 * TIME, NOT EASED OUTPUT: the cutStart/cutEnd thresholds are elapsed time inside the motion (the INPUT
 * to the bezier), not the bezier's output. Each retained segment is eased independently: an element's
 * displacement is BEZIER(m), where m is its motion-time fraction. So we excise the INPUT band
 * [cutStart, cutEnd] and read the eased displacement on each side — see matchCutTimeline.
 *
 * DIRECTIONAL = a whip pan of both scenes, on cubic-bezier(0.81, -0.01, 0.35, 1). B enters from one
 * edge as A exits the opposite edge, both translating the same direction on the shared curve. angleDeg
 * 0 → B enters from the LEFT (both pan right); 180 → B enters from the RIGHT (both pan left); 90/270 →
 * bottom/top. Any angle reverses cleanly — there's no separate "direction" flag because angleDeg
 * already covers every direction, including left ↔ right. The excised middle is where the A|B seam
 * crosses frame-center.
 *
 * SCALE = the same cut, on the same curve, but the motion is SCALE, as one continuous push THROUGH A
 * into B. direction "in" (default) grows the outgoing past you (1× → scaleFactor×) while the incoming
 * is revealed growing from a point (0 → 1×); direction "out" reverses it — the outgoing recedes to a
 * point (1× → 0) while the incoming looms in and settles (scaleFactor× → 1×). Both directions rest at
 * 1× on their shared end, so the incoming's final size always matches the outgoing's original size —
 * that shared size IS the match. A is shown up to the cut, B after it (they occlude, so only one draws
 * at a time).
 *
 * DIRECTIONAL-SCALE = DIRECTIONAL and SCALE combined, on the same shared curve: both scenes translate
 * along one axis AND scale at once, off the identical `disp` value, so the two properties never drift
 * out of sync. Travel reverses via angleDeg (same as directional); scale reverses via direction "in"
 * (outgoing grows 1× → scaleFactor×, incoming reveals 0× → 1×, same shapes as scale's "in") or "out"
 * (outgoing recedes 1× → 0, incoming settles scaleFactor× → 1×, same shapes as scale's "out") — the two
 * axes are independent, so any combination of travel direction and scale direction works. Because the
 * incoming's position and scale at the cut are just `disp` further along the identical curve the
 * outgoing was riding, its motion reads as a straight continuation of the outgoing's path and growth,
 * not a new transition. Like scale, A and B occlude — only one draws at a time.
 *
 * ROTATIONAL = the same cut, but the motion is ROTATION, on its own curve, cubic-bezier(0.61, -0.35,
 * 0.38, 1.15) (an anticipate/overshoot curve — it suits a spin better than the whip/scale curve). Both
 * A and B turn through the SAME total sweep (0° → totalDegrees, default 720° = two full turns) around
 * the same axis; direction "cw" (default) or "ccw" reverses which way they turn. So B reads as A's
 * spin simply continuing. Like scale, A and B occlude (only one draws at a time — A up to the cut, B
 * after it); unlike scale there's no size mismatch to reconcile, so both sides share one identical
 * rotation formula.
 *
 * SCALE-ROTATIONAL = SCALE and ROTATIONAL combined, on ROTATIONAL's curve (both properties ride it,
 * not the whip/scale curve — an anticipate/overshoot shape suits a spin-and-grow better). Scale
 * reverses via direction "in"|"out" (same shapes as scale's); rotation reverses via rotationDirection
 * "cw"|"ccw" (same shape as rotational's) — the two axes are independent. Because scale and rotation
 * are driven by the identical `disp`, they're always synchronized: same timing, same easing, so growth
 * and spin never drift apart. Like rotational, A and B occlude — only one draws at a time — and B's
 * scale+rotation at the cut is exactly where A's were heading, so it reads as one continuous
 * spin-and-grow straight through the hard cut.
 *
 * PERSPECTIVE = a genuinely different mechanic from every mode above — a single continuous 3D rotation
 * split across two objects, with NO excised band and NO jump in angle at all. Both A and B turn on the
 * SAME real 3D transform, `perspective(px) rotate{X,Y}(angle deg)` — apparent width narrows toward the
 * edge-on angle (90°, 270°, ...) as an intrinsic result of the 3D projection, and widens again as it
 * turns back toward the viewer. This is actual perspective rotation, not a horizontal-scale fake.
 * A plays the FRONT half of the sweep (0° → totalDegrees/2); B plays the BACK half (totalDegrees/2 →
 * totalDegrees) — same axis, same direction, same totalDegrees, same curve — cubic-bezier(0.61, -0.35,
 * 0.38, 1.15), i.e. ROTATION_EASE, reused as-is. Because angle must be perfectly continuous (B starts
 * at EXACTLY the angle A ended on, not 0°), the cut is placed not at a fixed fraction of TIME like the
 * other modes, but at the exact TIME the shared curve's OUTPUT reaches 0.5 — the instant the angle
 * itself reaches half the total sweep. That time is found by numerically inverting the curve (see
 * invertEase/ROTATION_HALF_TIME) rather than assumed to be t=0.5, because this curve is NOT symmetric
 * about (0.5, 0.5) (its output at t=0.5 is ≈0.44, not 0.5). For the default 180° flip, half is exactly
 * 90°: genuinely edge-on, so the object is at its narrowest (or invisible) exactly when the swap
 * happens — real foreshortening hides the cut, not fast motion. (For other totalDegrees, e.g. 360°, the
 * cut still lands at exactly half — 180° — per the same rule, though that angle isn't edge-on; the
 * default 180° is the case where "half the sweep" and "edge-on" coincide.)
 *
 * EVERY mode is reversible: directional/directional-scale reverse travel via angleDeg (any angle,
 * including left ↔ right and up ↔ down); scale/directional-scale/scale-rotational reverse growth
 * via direction "in"|"out"; rotational/scale-rotational/perspective reverse spin via
 * (rotation)Direction "cw"|"ccw".
 *
 * INTENSITY — three presets for how much of the motion is skipped, for every mode except perspective
 * (which has no excised band at all, so intensity doesn't apply — see above). All three are still
 * true match cuts (a hard, instantaneous jump) — the only difference is how much is skipped, which
 * changes how strong/abrupt the cut READS:
 *   "hard"   (default): cutStart 0.5, cutEnd 0.75 — skips 25%. The strongest, most energetic jump.
 *            Good for small/isolated subjects or simple compositions, where the skipped visual
 *            information doesn't matter and a punchy, deliberate discontinuity is the goal.
 *   "medium": cutStart 0.5, cutEnd 0.70 — skips 20%. General-purpose default balance of a clearly
 *            noticeable cut with more preserved continuity than "hard".
 *   "soft":   cutStart 0.5, cutEnd 0.65 — skips 15%. The most subtle — still a real cut, but the
 *            smaller skip reads as smoother. Good for full-frame or busy/multi-element compositions,
 *            where a "hard" cut would feel too abrupt.
 * cutStart is 0.5 in every preset — only cutEnd (how far into its motion the incoming scene resumes)
 * changes. Explicit `cutStart`/`cutEnd` props always override `intensity` if both are given.
 *
 * cutStart / cutEnd (default 0.5 / 0.75, i.e. "hard") set the excised middle slice directly, for every
 * mode except perspective. Prefer `intensity` unless you need an exact custom window.
 *
 * Part of the zm-motion library. Import: `import {MatchCut} from 'zm-motion/match-cut'`.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  getRemotionEnvironment,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";

type Point = { x: number; y: number }; // normalized 0..1 of the frame
type EaseFn = (t: number) => number;

/**
 * How the cut is constructed. See the header for what each looks like on screen.
 *
 * MOUNT COST — this is a real, load-bearing difference, not a detail:
 *   "directional" is the ONLY mode that has both scenes on screen at once. A whip pan needs
 *   edge-to-edge coverage, so neither side can be skipped while the pan is running. Every other
 *   mode occludes and draws exactly one scene per frame.
 *   Budget for TWO scenes' worth of render during `transitionDurationInFrames` in "directional",
 *   one everywhere else. Outside that window all six modes cost one scene — the dormant panel is
 *   unmounted, not merely parked off-canvas (see `matchCutPanelLifetime`).
 *   This matters because in Remotion a mounted-but-invisible element still pays full price: React
 *   render, layout, paint, and a complete frame extraction per <OffthreadVideo>. There is no
 *   compositor to skip it, the way a browser would.
 */
export type MatchCutMode =
  | "scale"
  | "directional"
  | "directional-scale"
  | "rotational"
  | "scale-rotational"
  | "perspective";

/** How much of the motion the cut removes — see INTENSITY in the header. */
export type MatchCutIntensity = "hard" | "medium" | "soft";

/** Timing-only subset of the props. Everything the exported timing helpers need, so a caller can
 *  compute frame numbers without constructing scenes. */
export type MatchCutTiming = {
  /** Frames of the accelerate→cut→decelerate window. 10–18 @30fps (rotational: 20–30, to read the
   *  full sweep). */
  transitionDurationInFrames: number;
  /** Static hold on A before the move. default 0 */
  holdBefore?: number;
  /** Static hold on B after the move. default 0. Does not affect the motion — it extends the
   *  component's intended TOTAL length, which is what `matchCutDuration` reports. */
  holdAfter?: number;
  /** Which mode's timing to compute. "perspective" places its cut differently (see
   *  `matchCutCutFrame`); every other mode shares one excised-band timeline. default "directional" */
  mode?: MatchCutMode;
  intensity?: MatchCutIntensity;
  cutStart?: number;
  cutEnd?: number;
};

type MatchCutBase = {
  /** Scene A — author its matched feature at the focal/anchor point.
   *
   *  FRAME SPACE: `outgoing`/`incoming` are rendered as plain elements, NOT wrapped in a
   *  <Sequence>. So `useCurrentFrame()` inside them returns THIS component's frame, un-rebased —
   *  frame 0 of the panel is frame 0 of the match cut, not of the transition window. Wrap a panel
   *  in your own <Sequence> if you want it rebased or time-bounded. */
  outgoing: React.ReactNode;
  /** Scene B — author its matched feature at the focal/anchor point. Same frame-space contract as
   *  `outgoing`: not wrapped in a <Sequence>, so `useCurrentFrame()` is un-rebased. */
  incoming: React.ReactNode;

  /** Frames of the accelerate→cut→decelerate window. 10–18 @30fps (rotational: 20–30, to read the
   *  full sweep). */
  transitionDurationInFrames: number;
  /** Static hold on A before the move. default 0 */
  holdBefore?: number;
  /** Static hold on B after the move. default 0.
   *
   *  This does NOT change the motion — the transition still ends at `holdBefore +
   *  transitionDurationInFrames`, and B simply holds its settled state for as long as the parent
   *  keeps this component mounted. Its purpose is to declare the intended total length, which
   *  `matchCutDuration(props)` returns; pass that to your <Sequence durationInFrames> rather than
   *  adding the three numbers by hand at the call site. */
  holdAfter?: number;

  /** How much of the motion is skipped — see INTENSITY above. "hard" (default) skips 25% (cutStart
   *  0.5/cutEnd 0.75), "medium" skips 20% (0.5/0.70), "soft" skips 15% (0.5/0.65). N/A to perspective
   *  mode (no excised band). Ignored if `cutStart`/`cutEnd` are also given — those win. */
  intensity?: MatchCutIntensity;

  /** The excised middle slice of the MOTION, as elapsed-time fractions (0..1) — set this directly to
   *  override `intensity` with an exact custom window. The motion plays 0→cutStart, JUMPS to cutEnd,
   *  then plays cutEnd→1 — the hard cut removes everything between. These are time (the bezier's
   *  input), not eased output. Applies to every mode except perspective. */
  cutStart?: number; // default 0.5 (via intensity "hard")
  cutEnd?: number; // default 0.75 (via intensity "hard")

  /** Overlay A-at-cut over B-at-cut with crosshairs to dial in the match. Turn off to render. */
  debugAlign?: boolean;
};

/** Where the INCOMING scene enters from. Same convention as whip-pan's `direction`, so the two
 *  files agree. Maps to `angleDeg`: left 0°, bottom 90°, right 180°, top 270°. */
export type MatchCutDirectionName = "left" | "right" | "top" | "bottom";

const DIRECTION_ANGLES: Record<MatchCutDirectionName, number> = {
  left: 0,
  bottom: 90,
  right: 180,
  top: 270,
};

/** Named `enterFrom` wins over raw `angleDeg` when both are given. */
const resolveAngle = (cfg?: { angleDeg?: number; enterFrom?: MatchCutDirectionName }): number =>
  cfg?.enterFrom ? DIRECTION_ANGLES[cfg.enterFrom] : (cfg?.angleDeg ?? 0);

export type MatchCutScaleConfig = {
  direction?: "in" | "out"; // "in" pushes through into B; "out" pulls back to reveal B. default "in"
  scaleFactor?: number; // how far the OUTGOING grows as it's passed through (e.g. 3 = to 3×). default 3
  focalOut?: Point; // where A's matched feature sits (default center)
  focalIn?: Point; // where B's matched feature sits (default = focalOut)
};

export type MatchCutDirectionalConfig = {
  /** Travel direction, applied to BOTH scenes (they move together like a whip pan).
   *  0 = incoming enters from the LEFT (both pan right); 180 = enters from the right (pan left);
   *  90 = enters from the bottom; 270 = enters from the top. default 0. This single angle covers
   *  every reversal — left ↔ right is just 0 vs 180, up ↔ down is 90 vs 270.
   *
   *  Prefer `direction` below for the four cardinals: `angleDeg: 0` reads as "enters from the left",
   *  which is the opposite of the pan's own direction and is easy to get backwards — a 180°-wrong
   *  match cut renders perfectly and is simply reversed, so nothing catches it but eyes. */
  angleDeg?: number;
  /** Named alias for the four cardinal directions, in terms of where the INCOMING scene enters
   *  from. Wins over `angleDeg` if both are given. "left" = 0°, "bottom" = 90°, "right" = 180°,
   *  "top" = 270°.
   *
   *  Deliberately NOT called `direction`: `directionalScale.direction` already means the scale
   *  sense ("in"/"out"), and reusing the word across the two configs for two different axes is
   *  exactly the confusion this alias exists to remove. */
  enterFrom?: MatchCutDirectionName;
};

export type MatchCutDirectionalScaleConfig = {
  /** Travel direction, same convention as `directional.angleDeg`. default 0. */
  angleDeg?: number;
  /** Named alias for the four cardinals, same convention as `directional.enterFrom`. Wins over
   *  `angleDeg` if both are given. */
  enterFrom?: MatchCutDirectionName;
  /** Scale direction, same convention as `scale.direction`. "in" (default): outgoing grows
   *  1× → scaleFactor×, incoming reveals 0× → 1×. "out": outgoing recedes 1× → 0, incoming settles
   *  scaleFactor× → 1×. Independent of the travel direction — any travel direction combines with
   *  either scale direction. */
  direction?: "in" | "out";
  /** How far the OUTGOING grows as it travels (1× → scaleFactor×), same meaning as
   *  `scale.scaleFactor`. default 3. */
  scaleFactor?: number;
  /** How far the object travels along the axis over the whole (uncut) motion, as a fraction of the
   *  frame's extent along that axis. default 0.5. */
  travelDistance?: number;
  focalOut?: Point; // where A's matched feature sits (default center)
  focalIn?: Point; // where B's matched feature sits (default = focalOut)
};

export type MatchCutRotationalConfig = {
  direction?: "cw" | "ccw"; // spin direction, shared by both scenes. default "cw"
  totalDegrees?: number; // total sweep across the whole (uncut) rotation, e.g. 720 = two turns. default 720
  ease?: EaseFn; // optional custom easing function. default ROTATION_EASE
  blur?: number; // optional blur param
  /** Sub-samples along the rotation arc, used when RENDERING. default 8.
   *
   *  COST IS LINEAR AND STEEP: <CameraMotionBlur> renders the whole subtree `shutterSamples` times
   *  per frame, each copy in its own `mixBlendMode: plus-lighter` + `filter: opacity()` layer — i.e.
   *  N full React renders AND N full-frame offscreen rasters. At 1080p, 24 samples of a
   *  screenshot-heavy scene is ~24 × 2MP of compositing plus every <Img>/<IFrame> in the tree
   *  duplicated 24×. Past ~8–12 the visual difference is nil; the cost is not. */
  shutterSamples?: number;
  /** Sub-samples used during PLAYBACK/SCRUBBING in the Studio or a <Player>, where the frame budget
   *  is realtime and dropped frames read as stutter. Renders always use the full `shutterSamples`,
   *  so lowering this changes nothing about the output file. default 4. Pass `null` to disable the
   *  cap and preview at full quality. */
  previewShutterSamples?: number | null;
  shutterAngle?: number; // shutter exposure angle in degrees (180 = a 180° shutter, i.e. half-frame). default 180
};

export type MatchCutScaleRotationalConfig = {
  /** Scale direction, same convention as `scale.direction`. "in" (default): outgoing grows
   *  1× → scaleFactor×, incoming reveals 0× → 1×. "out": outgoing recedes 1× → 0, incoming settles
   *  scaleFactor× → 1×. Independent of rotationDirection. */
  direction?: "in" | "out";
  scaleFactor?: number; // how far the OUTGOING grows as it spins, same meaning as `scale.scaleFactor`. default 3
  rotationDirection?: "cw" | "ccw"; // spin direction, same convention as `rotational.direction`. default "cw"
  totalDegrees?: number; // total sweep across the whole (uncut) rotation, same meaning as `rotational.totalDegrees`. default 720
  focalOut?: Point; // where A's matched feature sits (default center)
  focalIn?: Point; // where B's matched feature sits (default = focalOut)
};

export type MatchCutPerspectiveConfig = {
  axis?: "x" | "y"; // rotation axis. default "y" (a left-right card-flip)
  direction?: "cw" | "ccw"; // rotation direction, same convention as rotational.direction. default "cw"
  /** Total sweep across the whole (uncut) rotation. The cut always lands at exactly HALF this value.
   *  default 180 (a single flip) — half is 90°, genuinely edge-on, which is what makes the cut
   *  invisible. Other values (e.g. 360) still cut at exactly half per the same rule, though that
   *  angle may not be edge-on. */
  totalDegrees?: number;
  perspectivePx?: number; // CSS perspective distance — smaller = more dramatic foreshortening. default 1000
};

/**
 * Props for <MatchCut>. Discriminated on `mode`, so each mode accepts ONLY its own config object —
 * `<MatchCut mode="directional" scale={{...}} />` is a compile error rather than a silent no-op.
 *
 * Every mode also accepts the shared base: `outgoing`, `incoming`,
 * `transitionDurationInFrames`, `holdBefore`, `holdAfter`, `intensity`, `cutStart`, `cutEnd`,
 * `debugAlign`.
 */
export type MatchCutProps = MatchCutBase &
  (
    | { mode: "scale"; scale?: MatchCutScaleConfig }
    | { mode: "directional"; directional?: MatchCutDirectionalConfig }
    | { mode: "directional-scale"; directionalScale?: MatchCutDirectionalScaleConfig }
    | { mode: "rotational"; rotational?: MatchCutRotationalConfig }
    | { mode: "scale-rotational"; scaleRotational?: MatchCutScaleRotationalConfig }
    | { mode: "perspective"; perspective?: MatchCutPerspectiveConfig }
  );

/** Internal shape: every config visible at once. The mode components and DebugAlign read whichever
 *  config they own, so they can't use the narrowed public union. `MatchCut` casts to this exactly
 *  once, at the dispatch point. */
type MatchCutAnyProps = MatchCutBase & {
  mode: MatchCutMode;
  scale?: MatchCutScaleConfig;
  directional?: MatchCutDirectionalConfig;
  directionalScale?: MatchCutDirectionalScaleConfig;
  rotational?: MatchCutRotationalConfig;
  scaleRotational?: MatchCutScaleRotationalConfig;
  perspective?: MatchCutPerspectiveConfig;
};

const DEG = Math.PI / 180;

// Whip/scale curve: slow, held ends and a hard, fast center. Its velocity peaks in the middle, so the
// slice we excise is exactly the fastest, least-trackable part of the motion.
const MATCH_CUT_EASE = Easing.bezier(0.81, -0.01, 0.35, 1);
// Rotational curve: an anticipate/overshoot bezier — it suits a spin's momentum better than the
// whip/scale curve. Still symmetric about the cut in the same sense: one continuous curve split at m.
const ROTATION_EASE = Easing.bezier(0.61, -0.35, 0.38, 1.15);

/** Numerically inverts an easing function via bisection: finds t such that ease(t) ≈ target. Assumes
 *  ease is monotonic in the region straddling the target (true for ROTATION_EASE around 0.5 — its
 *  non-monotonic anticipate/overshoot wobbles are confined near t=0 and t=1, well away from the
 *  crossing). Used at module scope, not per-frame — a one-time, fixed computation. */
export const invertEase = (ease: EaseFn, target: number, iterations = 50): number => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

// The TIME fraction at which ROTATION_EASE's output crosses 0.5 — NOT t=0.5 itself, since this curve
// isn't symmetric about (0.5, 0.5) (ease(0.5) ≈ 0.44). Used by perspective mode to place its cut at the
// exact instant the shared curve reaches half its output — i.e. half the total rotation, whatever
// totalDegrees is (disp is a 0..1 FRACTION of it, so this constant doesn't depend on totalDegrees).
const ROTATION_HALF_TIME = invertEase(ROTATION_EASE, 0.5);

/**
 * The shared match-cut timeline. `frame` maps to linear window progress f ∈ [0,1], which we turn into
 * the motion-time fraction `m` with the middle band [cutStart, cutEnd] EXCISED — the hard cut. `m` is
 * elapsed TIME within the motion (the bezier's INPUT), not the eased value: A plays m 0→cutStart, m
 * then jumps to cutEnd, and B plays m cutEnd→1. The eased displacement each element uses is
 * `ease(m)`, so the cutStart/cutEnd thresholds (default 0.5/0.75) live on the curve's input, exactly
 * as specified.
 *
 * The played window is split between the two retained bands in proportion to their widths, so dm/df
 * (playback speed through the motion) is uniform on both sides of the cut. Both sides land in the
 * curve's fast middle — where the excised slice, and the A→B seam, would be — so the jump reads as a
 * single hard cut during fast motion rather than a visible transition. Returns the eased displacement
 * `disp` (0..1) and `beforeCut` (true while A is on screen).
 */
export const matchCutTimeline = (
  frame: number,
  holdBefore: number,
  T: number,
  cutStart: number,
  cutEnd: number,
  ease: EaseFn,
) => {
  const f = Math.max(0, Math.min(1, (frame - holdBefore) / T));
  const w1 = Math.max(0, cutStart); // outgoing's retained time band: [0, cutStart]
  const w2 = Math.max(0, 1 - cutEnd); // incoming's retained time band: [cutEnd, 1]
  const fSplit = w1 + w2 === 0 ? 0.5 : w1 / (w1 + w2); // where the cut lands in the played window
  const beforeCut = f < fSplit;
  const m = beforeCut
    ? (f / fSplit) * cutStart // 0 → cutStart (A's motion time)
    : cutEnd + ((f - fSplit) / (1 - fSplit)) * (1 - cutEnd); // cutEnd → 1 (B's motion time)
  return { beforeCut, disp: ease(m) };
};

// The three intensity presets — see INTENSITY in the file header. cutStart is always 0.5; only
// cutEnd (how far into its own motion the incoming scene resumes) changes between them.
const INTENSITY_WINDOWS: Record<"hard" | "medium" | "soft", { cutStart: number; cutEnd: number }> = {
  hard: { cutStart: 0.5, cutEnd: 0.75 },
  medium: { cutStart: 0.5, cutEnd: 0.7 },
  soft: { cutStart: 0.5, cutEnd: 0.65 },
};

/** Resolves the effective excised-band window for any mode: explicit `cutStart`/`cutEnd` always win
 *  (per-value — you can mix one explicit value with the other from the intensity preset); otherwise
 *  both come from `intensity` (default "hard", matching the library's original window). */
const resolveCutWindow = (
  props: Pick<MatchCutTiming, "intensity" | "cutStart" | "cutEnd">,
): { cutStart: number; cutEnd: number } => {
  const preset = INTENSITY_WINDOWS[props.intensity ?? "hard"];
  return {
    cutStart: props.cutStart ?? preset.cutStart,
    cutEnd: props.cutEnd ?? preset.cutEnd,
  };
};

// --- exported timing helpers ------------------------------------------------
// These exist so callers never have to re-derive matchCutTimeline's arithmetic by
// hand. Getting the split wrong fails SILENTLY — the cut just feels slightly off,
// with no error to search for — so every number a caller might want is published
// here instead of being reverse-engineered from the source.

/**
 * Total intended length: `holdBefore + transitionDurationInFrames + holdAfter`.
 * Pass this to your <Sequence durationInFrames> rather than summing the three by hand.
 */
export const matchCutDuration = (t: MatchCutTiming): number =>
  (t.holdBefore ?? 0) + t.transitionDurationInFrames + (t.holdAfter ?? 0);

/** The frames the motion actually occupies — outside this the scene is static on A (before) or B
 *  (after). `end` is exclusive-ish: it's the frame the motion settles on. */
export const matchCutWindow = (t: MatchCutTiming): { start: number; end: number } => {
  const start = t.holdBefore ?? 0;
  return { start, end: start + t.transitionDurationInFrames };
};

/**
 * The frame the hard cut lands on — the instant A is replaced by B.
 *
 * Two different rules, because perspective mode is a different mechanic:
 *   • Every excised-band mode: the cut sits where the two RETAINED time bands balance —
 *     `fSplit = cutStart / (cutStart + (1 - cutEnd))` — not at the midpoint of the window.
 *   • "perspective": no band is excised. The cut is placed at the exact time the shared curve's
 *     OUTPUT reaches 0.5 (found by numerically inverting the curve, since it is not symmetric about
 *     (0.5, 0.5)) — the instant the angle reaches half the total sweep.
 */
export const matchCutCutFrame = (t: MatchCutTiming): number => {
  const { start, end } = matchCutWindow(t);
  const T = end - start;
  if (t.mode === "perspective") return start + T * ROTATION_HALF_TIME;
  const { cutStart, cutEnd } = resolveCutWindow(t);
  const w1 = Math.max(0, cutStart);
  const w2 = Math.max(0, 1 - cutEnd);
  const fSplit = w1 + w2 === 0 ? 0.5 : w1 / (w1 + w2);
  return start + T * fSplit;
};

/**
 * How long each scene is actually on screen, as `{from, durationInFrames}` pairs ready to hand to
 * <Sequence>. This is the number you want when a panel is expensive (video, blur, a large subtree)
 * and you are bounding its mount at the call site.
 *
 * Note the two modes differ in kind, not just in numbers:
 *   • "directional" mounts BOTH scenes for the whole transition window — a whip pan needs
 *     edge-to-edge coverage — so the two lifetimes OVERLAP across `transitionDurationInFrames`.
 *   • Every other mode occludes, drawing one scene at a time, so the lifetimes meet at the cut
 *     frame and never overlap.
 * In both cases the component already unmounts the dormant side itself; these bounds are for
 * callers who want to bound their own subtree, or who need to reason about peak render cost.
 */
export const matchCutPanelLifetime = (
  t: MatchCutTiming,
): {
  outgoing: { from: number; durationInFrames: number };
  incoming: { from: number; durationInFrames: number };
} => {
  const { start, end } = matchCutWindow(t);
  const total = matchCutDuration(t);
  const overlaps = (t.mode ?? "directional") === "directional";
  const outgoingEnd = overlaps ? end : matchCutCutFrame(t);
  const incomingStart = overlaps ? start : matchCutCutFrame(t);
  return {
    outgoing: { from: 0, durationInFrames: Math.max(0, Math.ceil(outgoingEnd) + 1) },
    incoming: {
      from: Math.floor(incomingStart),
      durationInFrames: Math.max(0, total - Math.floor(incomingStart)),
    },
  };
};

export const MatchCut: React.FC<MatchCutProps> = (props) => {
  // The public props are narrowed per mode; the mode components each read their own config, so they
  // take the widened internal shape. This is the single cast that bridges the two.
  const p = props as MatchCutAnyProps;
  if (p.debugAlign) return <DebugAlign {...p} />;
  switch (p.mode) {
    case "scale":
      return <ScaleMatchCut {...p} />;
    case "directional-scale":
      return <DirectionalScaleMatchCut {...p} />;
    case "rotational":
      return <RotationalMatchCut {...p} />;
    case "scale-rotational":
      return <ScaleRotationalMatchCut {...p} />;
    case "perspective":
      return <PerspectiveMatchCut {...p} />;
    default:
      return <DirectionalMatchCut {...p} />;
  }
};

// --- transforms -------------------------------------------------------------
// Pure per-side transforms off the eased displacement `disp` (0..1), shared by the live components
// and the debug overlay so both stay in lockstep.

/** Directional: PURE translation along one axis. Both scenes travel the SAME direction; the outgoing
 *  exits (0 → +span) while the incoming enters from the opposite edge (−span → 0). */
const dirTransform = (
  side: "outgoing" | "incoming",
  disp: number,
  angleDeg: number,
  width: number,
  height: number,
): string => {
  const angle = angleDeg * DEG;
  const ux = Math.cos(angle);
  const uy = -Math.sin(angle); // screen y is down; negate so 90deg reads bottom->top
  const span = Math.abs(ux) * width + Math.abs(uy) * height; // frame extent along the travel axis
  const shift = side === "outgoing" ? disp * span : (disp - 1) * span;
  return `translate(${ux * shift}px, ${uy * shift}px)`;
};

/** Scale: one continuous push THROUGH the outgoing into the incoming. "in" (default) grows the
 *  outgoing past you (1× → scaleFactor×) while the incoming is revealed growing from a point (0 → 1×);
 *  "out" is the reverse (outgoing recedes to a point 1 → 0, incoming looms in and settles Z → 1).
 *  Both directions rest at 1× on each end, so the incoming's final size matches the outgoing's
 *  original — the match. The incoming is also translated so its focal point lands on the outgoing's,
 *  keeping the scale axis continuous through the cut. */
const scaleTransform = (
  side: "outgoing" | "incoming",
  disp: number,
  scale: MatchCutScaleConfig | undefined,
  width: number,
  height: number,
): { transform: string; transformOrigin: string } => {
  const Z = scale?.scaleFactor ?? 3;
  const out = (scale?.direction ?? "in") === "out";
  const fOut = scale?.focalOut ?? { x: 0.5, y: 0.5 };
  const fIn = scale?.focalIn ?? fOut;
  if (side === "outgoing") {
    const s = out ? 1 - disp : 1 + (Z - 1) * disp; // "in": 1 → Z ; "out": 1 → 0
    return { transform: `scale(${s})`, transformOrigin: `${fOut.x * 100}% ${fOut.y * 100}%` };
  }
  const s = out ? Z + (1 - Z) * disp : disp; // "in": 0 → 1 ; "out": Z → 1
  const dx = (fOut.x - fIn.x) * width;
  const dy = (fOut.y - fIn.y) * height;
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${s})`,
    transformOrigin: `${fIn.x * 100}% ${fIn.y * 100}%`,
  };
};

/** Directional-scale: DIRECTIONAL's translate formula and SCALE's scale formula, driven by the SAME
 *  `disp` so they never drift apart. Travel direction (angleDeg) and scale direction ("in"|"out") are
 *  independent axes — either can reverse on its own. "in": outgoing translates 0 → +travel while
 *  scaling 1× → Z (scaleTransform "in" outgoing shape); incoming translates −travel → 0 while scaling
 *  0× → 1× (scaleTransform "in" incoming shape). "out": outgoing scales 1× → 0 instead (recedes to a
 *  point) while still translating 0 → +travel; incoming scales Z → 1× (settles) while still
 *  translating −travel → 0 — same translate shapes either way, just the scale formulas flip to
 *  scaleTransform's "out" shapes. Incoming is also nudged so its focal point lands on the outgoing's.
 *  Because every piece reuses the identical source formulas at the identical `disp`, the incoming's
 *  position+size at the cut is exactly where the outgoing's path/growth would be next — it reads as
 *  one continuous move-and-grow (or move-and-recede) straight through the cut. */
const directionalScaleTransform = (
  side: "outgoing" | "incoming",
  disp: number,
  cfg: MatchCutDirectionalScaleConfig | undefined,
  width: number,
  height: number,
): { transform: string; transformOrigin: string } => {
  const Z = cfg?.scaleFactor ?? 3;
  const out = (cfg?.direction ?? "in") === "out";
  const angle = (cfg?.angleDeg ?? 0) * DEG;
  const fOut = cfg?.focalOut ?? { x: 0.5, y: 0.5 };
  const fIn = cfg?.focalIn ?? fOut;
  const ux = Math.cos(angle);
  const uy = -Math.sin(angle); // screen y is down; negate so 90deg reads bottom->top
  const span = Math.abs(ux) * width + Math.abs(uy) * height; // frame extent along the travel axis
  const travel = (cfg?.travelDistance ?? 0.5) * span;

  if (side === "outgoing") {
    const s = out ? 1 - disp : 1 + (Z - 1) * disp; // "in": 1 -> Z ; "out": 1 -> 0
    const shift = disp * travel; // 0 -> +travel, same shape as dirTransform outgoing either way
    return {
      transform: `translate(${ux * shift}px, ${uy * shift}px) scale(${s})`,
      transformOrigin: `${fOut.x * 100}% ${fOut.y * 100}%`,
    };
  }
  const s = out ? Z + (1 - Z) * disp : disp; // "in": 0 -> 1 ; "out": Z -> 1
  const shift = (disp - 1) * travel; // -travel -> 0, same shape as dirTransform incoming either way
  const dx = (fOut.x - fIn.x) * width;
  const dy = (fOut.y - fIn.y) * height;
  return {
    transform: `translate(${ux * shift + dx}px, ${uy * shift + dy}px) scale(${s})`,
    transformOrigin: `${fIn.x * 100}% ${fIn.y * 100}%`,
  };
};

/** Rotational: PURE rotation, one continuous sweep (0° → totalDegrees) shared identically by both
 *  scenes — there's no size/position mismatch to reconcile (unlike scale), so A and B use the exact
 *  same formula and simply hand off the angle at the cut. */
const rotationTransform = (disp: number, rotational: MatchCutRotationalConfig | undefined): string => {
  const total = rotational?.totalDegrees ?? 720;
  const sign = (rotational?.direction ?? "cw") === "ccw" ? -1 : 1;
  return `rotate(${sign * disp * total}deg)`;
};

/** Scale-rotational: ROTATIONAL's rotation formula and SCALE's scale formula, both driven by the SAME
 *  `disp` so growth and spin are always synchronized. Rotation has no separate outgoing/incoming
 *  shape — like rotationTransform, both sides share the identical `sign * disp * total` sweep, just
 *  handing off the angle at the cut. Scale uses the same outgoing/incoming shapes as scaleTransform
 *  ("in": 1→Z growing / 0→1 revealing; "out": 1→0 receding / Z→1 settling), reversible independently
 *  of rotation direction. Incoming is also nudged so its focal point lands on the outgoing's. */
const scaleRotationalTransform = (
  side: "outgoing" | "incoming",
  disp: number,
  cfg: MatchCutScaleRotationalConfig | undefined,
  width: number,
  height: number,
): { transform: string; transformOrigin: string } => {
  const Z = cfg?.scaleFactor ?? 3;
  const out = (cfg?.direction ?? "in") === "out";
  const total = cfg?.totalDegrees ?? 720;
  const sign = (cfg?.rotationDirection ?? "cw") === "ccw" ? -1 : 1;
  const fOut = cfg?.focalOut ?? { x: 0.5, y: 0.5 };
  const fIn = cfg?.focalIn ?? fOut;
  const rot = sign * disp * total; // same shape as rotationTransform, shared by both sides

  if (side === "outgoing") {
    const s = out ? 1 - disp : 1 + (Z - 1) * disp; // same shape as scaleTransform "in"/"out" outgoing
    return {
      transform: `rotate(${rot}deg) scale(${s})`,
      transformOrigin: `${fOut.x * 100}% ${fOut.y * 100}%`,
    };
  }
  const s = out ? Z + (1 - Z) * disp : disp; // same shape as scaleTransform "in"/"out" incoming
  const dx = (fOut.x - fIn.x) * width;
  const dy = (fOut.y - fIn.y) * height;
  return {
    transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${s})`,
    transformOrigin: `${fIn.x * 100}% ${fIn.y * 100}%`,
  };
};

/** Perspective: a REAL 3D rotation, `perspective(px) rotate{X,Y}(angle deg)` — not a horizontal-scale
 *  fake. The browser's own 3D projection narrows the apparent width toward the edge-on angle and widens
 *  it again automatically; no manual scaleX is applied. Both scenes share the identical
 *  `sign * disp * totalDegrees` sweep — same as rotationTransform — there's no separate outgoing/incoming
 *  shape, they just hand off the angle at the cut. */
const perspectiveTransform = (disp: number, cfg: MatchCutPerspectiveConfig | undefined): string => {
  const total = cfg?.totalDegrees ?? 180;
  const sign = (cfg?.direction ?? "cw") === "ccw" ? -1 : 1;
  const px = cfg?.perspectivePx ?? 1000;
  const rotateFn = (cfg?.axis ?? "y") === "x" ? "rotateX" : "rotateY";
  return `perspective(${px}px) ${rotateFn}(${sign * disp * total}deg)`;
};

// --- live components --------------------------------------------------------

/**
 * Directional match cut = a whip pan of BOTH scenes at once, with the middle of the motion cut out.
 * Both panels are always on screen edge-to-edge (so there is never an edge reveal) and ride the same
 * eased displacement, moving together in one direction. At the cut the displacement JUMPS across the
 * excised middle, sweeping the A|B seam past frame-center in a single invisible instant.
 */
const DirectionalMatchCut: React.FC<MatchCutAnyProps> = (props) => {
  const {
    outgoing,
    incoming,
    transitionDurationInFrames: T,
    holdBefore = 0,
    directional,
  } = props;
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const angle = resolveAngle(directional);
  const { cutStart, cutEnd } = resolveCutWindow(props);
  const { disp } = matchCutTimeline(frame, holdBefore, T, cutStart, cutEnd, MATCH_CUT_EASE);

  const panel = (node: React.ReactNode, side: "outgoing" | "incoming") => (
    <AbsoluteFill
      style={{ transform: dirTransform(side, disp, angle, width, height), willChange: "transform" }}
    >
      {node}
    </AbsoluteFill>
  );

  // Unlike every other mode, this one needs BOTH panels on screen at once — a whip pan
  // with only one side drawn would show an empty edge sweeping past. But it needs them
  // both only WITHIN the transition window. Outside it, matchCutTimeline has clamped
  // disp to 0 or 1 and the dormant side is parked a full span off-canvas (see
  // dirTransform), where it renders, lays out, paints and extracts video frames while
  // contributing nothing. Unmount it instead — the same economy the occluding modes get
  // for free from `beforeCut ? outgoing : incoming`.
  const showOutgoing = frame <= holdBefore + T; // A is parked off-canvas past the window
  const showIncoming = frame >= holdBefore; // B is parked off-canvas before it

  return (
    <AbsoluteFill>
      {showIncoming && panel(incoming, "incoming")}
      {showOutgoing && panel(outgoing, "outgoing")}
    </AbsoluteFill>
  );
};

/**
 * Scale match cut = the same middle-excised motion, but the animation is SCALE, read as one continuous
 * push THROUGH A into B. Direction "in" (default): A grows past you (1× → scaleFactor×) while B is
 * revealed growing from a point (0 → 1×); B's final size equals A's original size, so they rhyme — the
 * match. Direction "out" reverses it: A recedes to a point (1× → 0) while B looms in and settles
 * (scaleFactor× → 1×). Because the two occlude, only one is drawn at a time — A up to the cut, B after
 * it. The excised middle (the fast scaling where the sizes would cross) is the cut, hidden exactly as
 * the fast pan hides the seam.
 */
const ScaleMatchCut: React.FC<MatchCutAnyProps> = (props) => {
  const {
    outgoing,
    incoming,
    transitionDurationInFrames: T,
    holdBefore = 0,
    scale,
  } = props;
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const { cutStart, cutEnd } = resolveCutWindow(props);
  const { beforeCut, disp } = matchCutTimeline(frame, holdBefore, T, cutStart, cutEnd, MATCH_CUT_EASE);
  const side = beforeCut ? "outgoing" : "incoming";
  const { transform, transformOrigin } = scaleTransform(side, disp, scale, width, height);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform, transformOrigin, willChange: "transform" }}>
        {beforeCut ? outgoing : incoming}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Directional-scale match cut = the same middle-excised motion, but BOTH translate and scale at once,
 * off the identical `disp` — direction and scale combined, each independently reversible. Direction
 * "in" (default): A moves along the travel axis while growing past you (1× → scaleFactor×); B is
 * revealed growing from a point (0× → 1×) while continuing along the SAME line A was traveling.
 * Direction "out": A recedes to a point (1× → 0) while still traveling; B settles (scaleFactor× → 1×)
 * while still continuing the line. Because the two occlude, only one is drawn at a time — A up to the
 * cut, B after it — and B picks up exactly where A's position and size were heading, so the excised
 * middle (the fast move-and-scale where the two would cross) hides the handoff as one continuous push.
 */
const DirectionalScaleMatchCut: React.FC<MatchCutAnyProps> = (props) => {
  const {
    outgoing,
    incoming,
    transitionDurationInFrames: T,
    holdBefore = 0,
    directionalScale,
  } = props;
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const { cutStart, cutEnd } = resolveCutWindow(props);
  const { beforeCut, disp } = matchCutTimeline(frame, holdBefore, T, cutStart, cutEnd, MATCH_CUT_EASE);
  const side = beforeCut ? "outgoing" : "incoming";
  const { transform, transformOrigin } = directionalScaleTransform(side, disp, directionalScale, width, height);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform, transformOrigin, willChange: "transform" }}>
        {beforeCut ? outgoing : incoming}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Rotational match cut = the same middle-excised motion, but the animation is ROTATION, on its own
 * anticipate/overshoot curve. A and B both sweep the SAME 0° → totalDegrees arc, so — because they
 * occlude, only one drawn at a time — B's rotation at the cut simply continues A's, and the spin reads
 * as one continuous two-turn motion straight through the hard cut.
 */
const RotationalSubScene: React.FC<
  MatchCutAnyProps & { side: "outgoing" | "incoming"; blurred?: boolean }
> = (props) => {
  const {
    outgoing,
    incoming,
    transitionDurationInFrames: T,
    holdBefore = 0,
    rotational,
    side,
    blurred,
  } = props;
  const frame = useCurrentFrame();
  const { cutStart, cutEnd } = resolveCutWindow(props);
  const ease = rotational?.ease ?? ROTATION_EASE;
  const { disp } = matchCutTimeline(frame, holdBefore, T, cutStart, cutEnd, ease);
  const transform = rotationTransform(disp, rotational);

  return (
    <AbsoluteFill>
      {/* `willChange: transform` promotes this to its own compositor layer — worth it for ONE
          rotating panel, actively harmful under <CameraMotionBlur>, where it would pin N
          full-frame layers in VRAM at once. Inside the blur each sample already gets its own
          raster surface from the `filter: opacity()` wrapper, so the hint buys nothing. */}
      <AbsoluteFill style={blurred ? { transform } : { transform, willChange: "transform" }}>
        {side === "outgoing" ? outgoing : incoming}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Sub-samples to use while playing/scrubbing in the Studio or a <Player>, unless the caller
 *  overrides it. Renders are unaffected — see `previewShutterSamples`. */
const DEFAULT_PREVIEW_SHUTTER_SAMPLES = 4;

const RotationalMatchCut: React.FC<MatchCutAnyProps> = (props) => {
  const {
    transitionDurationInFrames: T,
    holdBefore = 0,
    rotational,
  } = props;
  const frame = useCurrentFrame();

  const { cutStart, cutEnd } = resolveCutWindow(props);
  const ease = rotational?.ease ?? ROTATION_EASE;
  const { beforeCut } = matchCutTimeline(frame, holdBefore, T, cutStart, cutEnd, ease);

  const inTransition = frame >= holdBefore && frame <= holdBefore + T;
  const shutterAngle = rotational?.shutterAngle ?? 180;
  const renderSamples = rotational?.shutterSamples ?? 8;

  // The Studio player and <Player> are REALTIME: every sample is a full re-render plus a
  // full-frame composite, so a sample count tuned for render quality turns playback into
  // dropped frames and stutter — which reads as the cut being "glitchy" when the rendered
  // output is fine. Cap it for preview only; `isRendering` is true for both `remotion render`
  // and `remotion still`, so the output file always gets the full `shutterSamples`.
  const previewCap = rotational?.previewShutterSamples;
  const samples =
    getRemotionEnvironment().isRendering || previewCap === null
      ? renderSamples
      : Math.min(renderSamples, previewCap ?? DEFAULT_PREVIEW_SHUTTER_SAMPLES);

  if (inTransition && samples > 1) {
    return (
      <CameraMotionBlur shutterAngle={shutterAngle} samples={samples}>
        <RotationalSubScene {...props} side={beforeCut ? "outgoing" : "incoming"} blurred />
      </CameraMotionBlur>
    );
  }

  return (
    <RotationalSubScene {...props} side={beforeCut ? "outgoing" : "incoming"} />
  );
};

/**
 * Scale-rotational match cut = the same middle-excised motion, but BOTH scale and rotate at once, off
 * the identical `disp` on ROTATIONAL's anticipate/overshoot curve — scale and spin combined, each
 * independently reversible. Direction "in" (default): A grows past you (1× → scaleFactor×) while
 * spinning; B is revealed growing from a point (0× → 1×) while continuing the SAME spin A was on.
 * Direction "out": A recedes to a point (1× → 0) while still spinning; B settles (scaleFactor× → 1×)
 * while still continuing the spin. Because the two occlude, only one is drawn at a time — A up to the
 * cut, B after it — and B picks up exactly where A's size and angle were heading, so the excised
 * middle (the fast spin-and-scale where the two would cross) hides the handoff as one continuous
 * spin-through.
 */
const ScaleRotationalMatchCut: React.FC<MatchCutAnyProps> = (props) => {
  const {
    outgoing,
    incoming,
    transitionDurationInFrames: T,
    holdBefore = 0,
    scaleRotational,
  } = props;
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const { cutStart, cutEnd } = resolveCutWindow(props);
  const { beforeCut, disp } = matchCutTimeline(frame, holdBefore, T, cutStart, cutEnd, ROTATION_EASE);
  const side = beforeCut ? "outgoing" : "incoming";
  const { transform, transformOrigin } = scaleRotationalTransform(side, disp, scaleRotational, width, height);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform, transformOrigin, willChange: "transform" }}>
        {beforeCut ? outgoing : incoming}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Perspective match cut = a single continuous 3D rotation split across two objects — unlike every mode
 * above, there is NO excised band and NO jump in angle at all. A plays the front half of the sweep
 * (0° → totalDegrees/2) on the shared curve; B plays the back half (totalDegrees/2 → totalDegrees) on
 * the SAME continuous curve — angle is one unbroken function of time for the whole window, so B starts
 * at exactly the angle A ended on. What decides which object is drawn is not a fixed time fraction but
 * `ROTATION_HALF_TIME` — the exact instant the curve's output crosses 0.5 (found once, numerically, at
 * module scope) — so the swap happens exactly when the angle reaches half the total sweep. For the
 * default 180° flip that's 90°, genuinely edge-on: the object is at its narrowest right when it's
 * replaced, so the cut hides in real foreshortening rather than in fast motion.
 */
const PerspectiveMatchCut: React.FC<MatchCutAnyProps> = (props) => {
  const { outgoing, incoming, transitionDurationInFrames: T, holdBefore = 0, perspective } = props;
  const frame = useCurrentFrame();

  const f = Math.max(0, Math.min(1, (frame - holdBefore) / T));
  const disp = ROTATION_EASE(f); // one continuous curve over the WHOLE window — no excision, no jump
  const beforeCut = f < ROTATION_HALF_TIME;
  const transform = perspectiveTransform(disp, perspective);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform, willChange: "transform" }}>
        {beforeCut ? outgoing : incoming}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- calibration ------------------------------------------------------------

/** Freeze both clips at the cut — A at its last pre-cut transform (disp at cutStart), B at its first
 *  post-cut transform (disp at cutEnd) — with B at 50% opacity and crosshairs at the focal/anchor
 *  point(s), so the author can line the matched features up. */
const DebugAlign: React.FC<MatchCutAnyProps> = (props) => {
  const {
    mode,
    outgoing,
    incoming,
    scale,
    directional,
    directionalScale,
    rotational,
    scaleRotational,
    perspective,
  } = props;
  const { width, height } = useVideoConfig();
  const angle = resolveAngle(directional);
  const { cutStart, cutEnd } = resolveCutWindow(props);

  const ease = mode === "rotational" || mode === "scale-rotational" ? ROTATION_EASE : MATCH_CUT_EASE;
  // Perspective has no excised band — both sides freeze at the SAME instant, output 0.5 (half the
  // sweep), since that's exactly where the real cut sits (angle is continuous, no jump).
  const dispOut = mode === "perspective" ? 0.5 : ease(cutStart);
  const dispIn = mode === "perspective" ? 0.5 : ease(cutEnd);

  const styleFor = (side: "outgoing" | "incoming", disp: number): React.CSSProperties => {
    if (mode === "scale") return scaleTransform(side, disp, scale, width, height);
    if (mode === "directional-scale")
      return directionalScaleTransform(side, disp, directionalScale, width, height);
    if (mode === "scale-rotational")
      return scaleRotationalTransform(side, disp, scaleRotational, width, height);
    if (mode === "perspective") return { transform: perspectiveTransform(disp, perspective) };
    if (mode === "rotational") return { transform: rotationTransform(disp, rotational) };
    return { transform: dirTransform(side, disp, angle, width, height) };
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill style={styleFor("outgoing", dispOut)}>{outgoing}</AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.5, ...styleFor("incoming", dispIn) }}>{incoming}</AbsoluteFill>
      <Crosshairs
        mode={mode}
        scale={scale}
        directionalScale={directionalScale}
        scaleRotational={scaleRotational}
      />
    </AbsoluteFill>
  );
};

/** Calibration crosshairs at the focal/anchor point(s). */
const Crosshairs: React.FC<{
  mode: MatchCutMode;
  scale?: MatchCutScaleConfig | undefined;
  directionalScale?: MatchCutDirectionalScaleConfig | undefined;
  scaleRotational?: MatchCutScaleRotationalConfig | undefined;
}> = ({ mode, scale, directionalScale, scaleRotational }) => {
  const focal =
    mode === "scale"
      ? scale
      : mode === "directional-scale"
        ? directionalScale
        : mode === "scale-rotational"
          ? scaleRotational
          : undefined;
  const pts: Point[] = focal
    ? [focal.focalOut ?? { x: 0.5, y: 0.5 }, focal.focalIn ?? focal.focalOut ?? { x: 0.5, y: 0.5 }]
    : [{ x: 0.5, y: 0.5 }];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {pts.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: 24,
            height: 24,
            marginLeft: -12,
            marginTop: -12,
            border: `2px solid ${i === 0 ? "#00FF91" : "#00CFFF"}`,
            borderRadius: "50%",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.6)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
