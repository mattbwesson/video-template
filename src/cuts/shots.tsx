import React from "react";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  Img,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CursorArrow } from "../components/CursorArrow";
import { VirginWorkvivoHomeScene } from "../VirginWorkvivoHomeScene";
import { WorkvivoSeerSurveyMobileScene } from "../WorkvivoSeerSurveyMobileScene";
import { SeerManagerMobileScene } from "../SeerManagerMobileScene";
import {
  WorkvivoSpacePage,
  WorkvivoSeerRater,
  WorkvivoSeerInsights,
} from "../components/workvivo";
import "../components/workvivo/WorkvivoGlassEdge.css";
import { GlassRing } from "../components/workvivo/GlassRing";
import { useCustomization } from "../customize/CustomizationProvider";

/**
 * The composite shots a cut needs that are not scenes of their own — a scene under a mask,
 * two scenes handed off across an iris, a phone rebuilt at a second scale.
 *
 * These began as private copies inside three hand-forked single-pillar cuts, one copy per
 * cut. Those forks are gone (see src/CombinedCut.tsx for why), so this is the only version
 * of each, and it is shared by every cut the wizard and the Studio can produce. They are
 * kept here rather than beside their scenes because a shot is an arrangement of scenes at
 * particular frames, which is a property of the film's timeline and not of any one scene.
 *
 * Everything here reads frames from ITS OWN `<Sequence>`, so nothing in this file knows
 * where in the assembled cut it has been placed. That is what makes laying a chapter down
 * at an arbitrary offset a matter of arithmetic on `from` props alone.
 */

// ---------------------------------------------------------------------------------------
// intro
// ---------------------------------------------------------------------------------------

/** The opening brand mark, behind a circular mask. Lifted from WorkvivoCut. */
export const BrandIntro: React.FC = () => {
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

// ---------------------------------------------------------------------------------------
// Communication & Engagement
// ---------------------------------------------------------------------------------------

/**
 * The Space page shot, closing on a circular mask at local 87-90 — global 1635-1638.
 *
 * Same device the Desktop scene uses at 888-896, but over three frames instead of eight,
 * so two of its parameters had to change to survive the shorter window:
 *
 *  - It opens at 1101px, not the Desktop scene's 1400. 1101 is the half-diagonal of the
 *    1920x1080 frame, i.e. the smallest circle that still covers it. Starting wider wastes
 *    the first frames on travel that is off-screen and invisible, which you can afford over
 *    eight frames and cannot over three.
 *  - It eases inOut(quad) rather than the house bezier(0.16, 1, 0.3, 1). That curve is most
 *    of the way shut by its first frame; over three frames it would read as a hard cut with
 *    two dead frames after it, rather than as an iris.
 *
 * What it opens onto is the Spotlight layer mounted below it in the tree.
 */
export const SpacePageShot: React.FC = () => {
  const frame = useCurrentFrame();
  const maskRadius = interpolate(frame, [87, 90], [1101, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const mask = `circle(${maskRadius}px at 50% 50%)`;

  // Subtle scaling: scales down on cut at global 1549 (local 0) and scales back up to 1.0
  // by global 1567 (local 18)
  const scaleTransition = interpolate(frame, [0, 18], [0.94, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Once scaling is done (local 18, global 1567), slowly move the whole component up until
  // global 1639 (local 90). Distance reduced so the bottom of the component stays
  // off-screen throughout the shot.
  const moveUpY = interpolate(frame, [18, 90], [0, -350], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Base scale scaled down 15%
  const baseScale = (1600 / 1440) * 0.85;

  return (
    <AbsoluteFill
      style={{
        background: "#010224",
        overflow: "hidden",
        clipPath: mask,
        WebkitClipPath: mask,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 56,
          width: 1440,
          marginLeft: -720,
          transform: `translateY(${moveUpY}px) scale(${baseScale * scaleTransition})`,
          transformOrigin: "center 40%",
        }}
      >
        <WorkvivoSpacePage />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------
// Search & Knowledge
// ---------------------------------------------------------------------------------------

/**
 * The mobile home, opening out of nothing on a circular mask at local 0-12 — global
 * 2565-2577. The inverse of the irises elsewhere in the cut: those shut onto what is
 * mounted below them, this one grows to fill the frame from the middle of the "Job Done"
 * card, which is held under it for the whole opening.
 *
 * The half-diagonal of the 1920x1080 frame is 1101.6, so 1110 is the end radius: the
 * smallest circle that covers the frame, plus enough margin that no hairline of the arc
 * survives at the corners for the long hold afterwards.
 *
 * It eases inOut(quad), as SpacePageShot's iris does, rather than the house
 * bezier(0.16, 1, 0.3, 1). That curve is 90% of the way open four frames in, so over twelve
 * it would read as a cut with eight dead frames after it; this one spends the whole window
 * growing, which is what a circle scaling up is meant to look like.
 *
 * It is a round window rather than a `clipPath: circle()` — the clip composited as an
 * opaque black quad past roughly 1000px, blacking out the card underneath instead of
 * letting it through. A `border-radius: 50%` box with `overflow: hidden` is the same shape
 * with none of that; the scene inside is offset by the radius so it stays put in the frame
 * while the window around it grows.
 *
 * What it opens onto is global 545's framing: VirginWorkvivoHomeScene's local 128, which is
 * the phone on #010026 a few frames after its hard cut to mobile, before the headline
 * arrives at 130. The scene is frozen there, so the shot is that frame returning rather
 * than the scene running again — everything about it is pinned EXCEPT the page, which is
 * driven from out here.
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
 * FAR is where it pulls back to — 48% down and 19.5% wide, which at that width is the whole
 * device on frame with room around it. Its top is therefore derived from the centre and the
 * device's own height rather than from a crop.
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
 * How tall a box the frozen scene is given to draw in. The phone's bottom edge sits 1407
 * down from the frame's top and its shadow reaches ~110 further, so 2000 centred on the
 * frame (spanning -460 to 1540) clears both.
 */
const SCENE_BOX_HEIGHT = 2000;

/** The pull-back, and the scroll home, run together across 2730 - 2755. */
const MOBILE_PULLBACK_FROM = 2730 - 2565;
const MOBILE_PULLBACK_TO = 2755 - 2565;

/** The last frame the shot is on screen; 2760 hard-cuts away. */
const MOBILE_LAST_FRAME = 2759 - 2565;

/**
 * The pull-back's curve, and its slope where it ends.
 *
 * Not inOut: that lands the device on the far pose with zero velocity, which is the one
 * thing this move must not do. This one still leaves the near pose from rest — it is coming
 * out of a five-frame hold — but arrives travelling, at twice its own average, and the exit
 * below picks that speed up rather than starting again from nothing.
 */
const PULLBACK_EASE = Easing.bezier(0.3, 0, 0.7, 0.4);
const PULLBACK_EXIT_SLOPE = (1 - 0.4) / (1 - 0.7);

/**
 * How much of the device is above the frame's top edge on the last frame before the cut.
 *
 * The far pose is passed through, not stopped at: from 2755 the device keeps rising and
 * accelerating, and 2760 cuts away while it is still only this far gone.
 */
const EXIT_OFFSCREEN_FRAC = 0.15;

/**
 * The phone's box on the frame as the FROZEN SCENE leaves it, before this shot reframes it:
 * 589.5 wide — VirginWorkvivoHomeScene draws the 393pt device at 1.5 — with its top edge on
 * 129, which is where that scene's entrance slide has reached by its local 128.
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

export const MobileIrisOpen: React.FC = () => {
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
  // load-bearing for 417-600 and its framing there is signed off. So the whole frozen frame
  // is scaled and moved instead, about the frame's centre, until its phone lands in the
  // pose wanted.
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
  // from there — so there is no frame on which it is standing still.
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

  const scrollBottom = PHONE_TRACK_HEIGHT - windowVisible;

  // Top -> bottom -> hold -> top. One interpolate rather than three, because the holds are
  // just segments with the same value at both ends, and stating the whole journey in one
  // place is what makes it obvious the page ends where it started.
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
          the frame where the iris is supposed to be shut. */}
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
          {/* Pulled back by the radius so the scene sits on the frame, not on the window.
              The field is painted HERE as well as inside the scene: scaling the scene up
              and dropping it leaves its own 1920x1080 fill short of the top of the frame,
              and a bare strip there would show the card underneath during the opening and
              black after it. */}
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
                clips to its own box, and in this shot the phone hangs 327px past the
                bottom of a 1080 one — invisible while the scene is scaled UP, but the
                moment the pull-back shrinks it that edge comes on frame and cuts the
                device in half. */}
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

// ---------------------------------------------------------------------------------------
// People Intelligence
// ---------------------------------------------------------------------------------------

/**
 * The survey's sign-off: it recedes, then an iris shuts on it.
 *
 * Two moves that overlap rather than follow one another. The shrink sets off on global 3695
 * and is still going when the iris starts on 3704 — a shot that had stopped moving before
 * the mask reached it would read as two separate events, and the point of the overlap is
 * that the device is being taken away rather than covered up.
 *
 * What it opens onto is the "Go beyond" card mounted below it in the tree.
 */
const SURVEY_SHRINK_FROM = 3695 - 3571;
const SURVEY_IRIS_FROM = 3704 - 3571;
const SURVEY_IRIS_TO = 3707 - 3571;

export const SurveySignOffShot: React.FC = () => {
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

/** Global frames the two ends of the Space feed transition are pinned to. */
export const SEER_MOBILE_FROM = 3903;
export const SPACE_FEED_IRIS_FROM = 4066;

/**
 * At 4066, a circular mask closes down completing at 4070 (5 frames total), shrinking the
 * outgoing manager insights shot down to 0 and revealing the brand field with
 * WorkvivoSpaceFeed rising up underneath it.
 *
 * The negative `from` is what holds it still: this Sequence starts at the iris, so the
 * scene would otherwise replay its entrance inside the closing mask. Offsetting by the
 * frames since 3903 puts it at the state the cut is leaving.
 */
export const SpaceFeedIrisTransition: React.FC = () => {
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
 * shots read as the same window and only the tab changes across the cut.
 *
 * The cursor does not re-enter either. It continues exactly from where the Manager Insights
 * click left it, holds for ten frames, then travels to click the Comments tab at global
 * 3839, local 45.
 */
const SEER_RATER_HANDOFF_X = 0.332;
const SEER_RATER_HANDOFF_Y = 0.32;
const SEER_RATER_CLICK_X = 0.384;
const SEER_RATER_CLICK_Y = 0.32;
const SEER_RATER_TRAVEL_FROM = 10;
const SEER_RATER_CLICK_AT = 3839 - 3794;

export const SeerRaterClick2Shot: React.FC = () => {
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
 * `width={1760} height={1080}` on WorkvivoSeerInsights is what keeps it 1:1 inside that
 * box: the component fits its own chrome to whatever size it is given, and at its native
 * size that fit is exactly 1, the box's own scale being handled by the wrapper below.
 *
 * The cursor from the click that opened this shot lifts and fades over ten frames instead
 * of continuing to a further target.
 */
const SEER_INSIGHTS_HANDOFF_X = 0.384;
const SEER_INSIGHTS_HANDOFF_Y = 0.32;

export const SeerInsightsCutShot: React.FC = () => {
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
