import React from "react";
import { CursorArrow } from "./components/CursorArrow";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import {
  AbsoluteFill,
  Easing,
  Freeze,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import { HeadquartersScene } from "./HeadquartersScene";
import { VirginWorkvivoHomeScene } from "./VirginWorkvivoHomeScene";
import { BackFromScene } from "./BackFromScene";
import { VirginWorkvivoDesktopScene } from "./VirginWorkvivoDesktopScene";
import { LivestreamScene } from "./LivestreamScene";
import { VirginWorkvivoDesktopFullscreenScene } from "./VirginWorkvivoDesktopFullscreenScene";
import { SpacesRevealScene } from "./SpacesRevealScene";
import {
  WorkvivoSpacePage,
  WorkvivoPhonesScene,
  WorkvivoSeerRater,
  WorkvivoSeerInsights,
} from "./components/workvivo";
import "./components/workvivo/WorkvivoGlassEdge.css";
import { WidgetStoreRevealScene } from "./WidgetStoreRevealScene";
import { WorkvivoWidgetListScene } from "./WorkvivoWidgetListScene";
import { CreateYourOwnScene } from "./CreateYourOwnScene";
import { SeerManagerMobileScene } from "./SeerManagerMobileScene";
import { WorkvivoArticleScene } from "./WorkvivoArticleScene";
import { WorkvivoAnalyticsScene } from "./WorkvivoAnalyticsScene";
import { WorkvivoSeerSurveyMobileScene } from "./WorkvivoSeerSurveyMobileScene";
import { WorkvivoMobileSpotlightScene } from "./WorkvivoMobileSpotlightScene";
import { JourneyBuilderScene } from "./JourneyBuilderScene";
import { JourneyCardRevealScene } from "./JourneyCardRevealScene";
import { scaleDownMatchCut } from "./scaleDownMatchCut";
import { directionalMatchCut } from "./directionalMatchCut";
import { CatchUpRevealScene } from "./CatchUpRevealScene";
import { AskBarScene } from "./AskBarScene";
import { HqSearchScene } from "./HqSearchScene";
import { HqChatScene } from "./HqChatScene";
import { BrandWordScene } from "./BrandWordScene";
import { GoBeyondScene } from "./GoBeyondScene";
import { AmplifyReachScene } from "./AmplifyReachScene";
import { BillboardSignageScene } from "./BillboardSignageScene";
import { NewslettersRevealScene } from "./NewslettersRevealScene";
import { NewsletterBuilderRevealScene } from "./NewsletterBuilderRevealScene";
import { WorkvivoSeerManagerInsightsScene } from "./WorkvivoSeerManagerInsightsScene";
import { WorkvivoSpaceFeedScene } from "./WorkvivoSpaceFeedScene";
import { WorkvivoFeedbackArticleScene } from "./WorkvivoFeedbackArticleScene";
import { WorkvivoIntegrationsMarketplaceScene } from "./WorkvivoIntegrationsMarketplaceScene";
import { WorkvivoIntegrationsListScene } from "./WorkvivoIntegrationsListScene";
import { WorkvivoAdminHubScene } from "./WorkvivoAdminHubScene";
import { WorkvivoCustomerGridScene } from "./WorkvivoCustomerGridScene";
/**
 * `Video` comes from @remotion/media, not from remotion.
 *
 * remotion's own `<Video>` / `<OffthreadVideo>` are Html5Video under the hood, and
 * @remotion/web-renderer refuses them outright — the in-browser export dies with
 * "<Html5Video> is not supported". @remotion/media decodes through WebCodecs and works in
 * every renderer, which is what makes the wizard's Render MP4 button possible.
 *
 * The prop names differ: `startFrom` is `trimBefore` here. Everything else carries over.
 */
import { useCustomization } from "./customize/CustomizationProvider";
import { GlassRing } from "./components/workvivo/GlassRing";

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
const SpacePageShot: React.FC = () => {
  const frame = useCurrentFrame();
  const maskRadius = interpolate(frame, [87, 90], [1101, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const mask = `circle(${maskRadius}px at 50% 50%)`;

  // Subtle scaling: scales down on cut at global 1549 (local 0) and scales back up to 1.0 by global 1567 (local 18)
  const scaleTransition = interpolate(frame, [0, 18], [0.94, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Once scaling is done (local 18, global 1567), slowly move the whole component up until global 1639 (local 90)
  // Distance reduced so the bottom of the component stays off-screen throughout the shot
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
      }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 56,
          width: 1440,
          marginLeft: -720,
          transform: `translateY(${moveUpY}px) scale(${baseScale * scaleTransition})`,
          transformOrigin: "center 40%",
        }}>
        <WorkvivoSpacePage />
      </div>
    </AbsoluteFill>
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
 * The iris is SpacePageShot's, three frames and inOut(quad) for the same reason: the
 * house bezier is most of the way shut on its first frame, which over three frames reads
 * as a hard cut with two dead frames after it.
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
  const shrink = interpolate(
    frame,
    [SURVEY_SHRINK_FROM, SURVEY_IRIS_TO + 6],
    [1, 0.74],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.quad),
    },
  );

  const maskRadius = interpolate(
    frame,
    [SURVEY_IRIS_FROM, SURVEY_IRIS_TO],
    [1101, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    },
  );
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
      }}>
      <AbsoluteFill
        style={{
          transform: `scale(${shrink})`,
          transformOrigin: "center center",
        }}>
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
 * the brand green field with WorkvivoSpaceFeed rising up underneath it.
 *
 * What shrinks is SeerManagerMobileScene — the native screen — not the reference video it
 * used to be. Before that scene existed this reached for the raw footage because there was
 * nothing else to shrink; now that there is, keeping the video would cut from the native
 * screen to Workvivo's own demo data on the iris's first frame. Same shot, different
 * person's name, and a red ring round the avatar.
 *
 * The negative `from` is what holds it still: this Sequence starts at 4066, so the scene
 * would otherwise replay its entrance inside the closing iris. Offsetting by the frames
 * since 3903 puts it at the state the cut is leaving.
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
      }}>
      <Sequence from={SEER_MOBILE_FROM - SPACE_FEED_IRIS_FROM} layout="none">
        <SeerManagerMobileScene />
      </Sequence>
    </AbsoluteFill>
  );
};


/**
 * Hard cut off the Manager Insights click, at 3794 — four frames after the 3790 click,
 * the same cut-to-cut gap SpacePageShot uses off its own click at 1545/1549. No
 * transition of any kind: the Rater tab simply replaces the frame when the sequence
 * above ends.
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
  // other cursor shot in this file makes.
  const handoffX = width * SEER_RATER_HANDOFF_X - 12;
  const handoffY = height * SEER_RATER_HANDOFF_Y - 3.75;
  const clickX = width * SEER_RATER_CLICK_X - 12;
  const clickY = height * SEER_RATER_CLICK_Y - 3.75;

  const cursorX = interpolate(
    frame,
    [SEER_RATER_TRAVEL_FROM, SEER_RATER_CLICK_AT - 4],
    [handoffX, clickX],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) },
  );
  const cursorY = interpolate(
    frame,
    [SEER_RATER_TRAVEL_FROM, SEER_RATER_CLICK_AT - 4],
    [handoffY, clickY],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) },
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
      }}>
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
        }>
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
        }}>
        <CursorArrow color="black"
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
 * fit is exactly 1, the same as the box's own scale is handled by the wrapper below.
 *
 * WorkvivoSeerInsights draws no cursor of its own — unlike WorkvivoSeerRater there is
 * nothing to switch off. The cursor from the click that opened this shot lifts and fades
 * over ten frames instead of continuing to a further target, the same handoff
 * HqChatScene uses off its own click.
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
      }}>
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
        }>
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
          }}>
          <CursorArrow color="black"
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
  const exitY =
    exitV0 * exitFrames + 0.5 * exitAccel * exitFrames * exitFrames;

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
    [
      MOBILE_IRIS_OPEN_FRAMES,
      MOBILE_SCROLL_TO,
      MOBILE_PULLBACK_FROM,
      MOBILE_PULLBACK_TO,
    ],
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
        }}>
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
          }}>
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
            }}>
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

/**
 * The scene tree, shared by both compositions.
 *
 * `VirginAirline` renders it against the baseline demo's copy and colours;
 * `CustomizedWorkvivo` renders the same frames against an operator's. There is one tree
 * rather than two so a scene fix cannot land in one cut and miss the other.
 *
 * Every scene below reads its copy, colour, faces and logo from `useCustomization()`.
 */

/**
 * Frame count of the customised cut — the whole film.
 *
 * It was 1350 while only the opening run had been made customisable; everything past it
 * was still hardcoded Workvivo demo content and showing it to a customer would have been
 * worse than stopping. Now that the scenes through 5299 read from the copy, imagery and
 * icon tables, the wizard renders the same 5300 frames `L2VirginAirline` does.
 */
export const CUSTOMIZED_CUT_DURATION = 5300;

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

/**
 * The original L2 edit, in two encodes of the same 212 seconds.
 *
 * The master is 12 Mbps — 310 MB — which is right for the Studio and impossible to
 * deploy. `wizard` is the same running time at CRF 24, 45 MB, which is what the container
 * ships (see .dockerignore).
 *
 * It keeps its AUDIO TRACK, and that is not incidental: the reference is where the film's
 * entire soundtrack comes from. The `<Video>` below is unmuted, and there is no other
 * audio source anywhere in the tree — so an encode built with `-an` renders a silent film
 * that looks completely correct, which is exactly the kind of bug that ships.
 *
 * Both cover the WHOLE film now. The earlier 54-second trim existed because the
 * customised cut stopped at 1350; it can't be used any more, because the reference shows
 * through in roughly 1,400 frames of gaps between 1350 and 5299 — 4591-4983 alone is 392
 * of them — and a short file would render those black.
 */
export const REFERENCE_VIDEO = {
  full: "img/L2 Video(Virgin Airline).mp4",
  wizard: "img/l2-reference-212s.mp4",
} as const;

export const WorkvivoCut: React.FC<{
  /** Which encode to lay underneath. Defaults to the full one, as the full cut needs. */
  reference?: keyof typeof REFERENCE_VIDEO;
}> = ({ reference = "full" }) => {
  const { durationInFrames } = useVideoConfig();
  const { theme } = useCustomization();

  return (
    // The brand custom properties are set once, here, and inherit down to every ported
    // Workvivo stylesheet. Those files cannot take props, and each still carries the
    // baseline green as its `var()` fallback so it renders correctly on its own.
    <AbsoluteFill style={{ backgroundColor: "#000", ...theme.vars }}>
      {/* The original L2 edit, underneath everything. It is NOT customisable and it is
          not meant to be: what still shows through are the stretches no scene has been
          rebuilt over — 137-417, 2236-2268, 2760-2823, 3109-3264, 3326-3388, 3903-4066,
          4253-4397, 4591-4983 and the 5166 tail — and those are generic Workvivo product
          footage, which belongs in every customer's video unchanged.

          Which encode is laid down is the caller's choice — see REFERENCE_VIDEO. The
          wizard takes the re-encode, so the deployed image carries 45 MB rather than
          310 MB and is not slow to first frame on a cold cache.

          Unmuted, deliberately: this element is the film's only sound. */}
      <Sequence
        name="Reference video"
        from={1}
        durationInFrames={durationInFrames}
        style={{
          scale: 0.712,
          translate: "-1px 0px"
        }}>
        <Video
          src={staticFile(REFERENCE_VIDEO[reference])}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </Sequence>
      {/* Part 1: Brand logo with Circular Mask (frames 0 to 33) */}
      <Sequence name="Brand Intro" from={0} durationInFrames={33}>
        <BrandIntro />
      </Sequence>
      {/* Part 2: Headquarters Scene. Starts on 33, LAST FRAME 138 — extended from 136, so
          the closing word holds two frames longer before the cut to the reference's HQ
          title card. Stated as a last frame rather than an out point because that is how
          this beat has always been written down; the sequence names elsewhere in this file
          use exclusive ends, and 33 + 106 = 139 is the exclusive end of the same range. */}
      <Sequence name="Headquarters Scene" from={33} durationInFrames={106}>
        <HeadquartersScene />
      </Sequence>
      {/* Part 3: Workvivo Home (frames 417 to 600) */}
      <Sequence
        name={"Workvivo Home (417 - 600)"}
        from={417}
        durationInFrames={600 - 417}>
        <VirginWorkvivoHomeScene />
      </Sequence>
      {/* Part 4: Back From (starts at global frame 600, ends at local 138 / global 738) */}
      <Sequence name="Back From (600 - 738)" from={600} durationInFrames={138}>
        <BackFromScene />
      </Sequence>
      {/* Middle Layer (738 - 896): Workvivo Desktop Scene with Circular Mask closing from 888 to 896 */}
      <Sequence name="Workvivo Desktop (738 - 896)" from={738} durationInFrames={158}>
        <VirginWorkvivoDesktopScene />
      </Sequence>
      {/* Under Layer (1275+): revealed as the fullscreen scene's circular mask closes at
          global 1282-1285. Mounted BELOW that scene so the mask opens onto it, and a few
          frames early so its iframe is loaded before it is ever seen. */}
      <Sequence
        name="Livestream on brand colour (1275 - 1477)"
        from={1275}
        durationInFrames={202}>
        <LivestreamScene />
      </Sequence>
      {/* Spaces on #010224, wiping up from the bottom over the tail of the livestream.
          Mounted AFTER the livestream sequence so it composites above it during the 9
          frames they overlap. */}
      <Sequence
        name="Spaces reveal + click (1468 - 1549)"
        from={1468}
        durationInFrames={81}>
        <SpacesRevealScene />
      </Sequence>
      {/* Hard cut on the click at 1545: no transition of any kind, the Space page simply
          replaces the frame when the sequence above ends three frames later.

          Framed exactly like the Spaces pane it cuts from — 1600 of the 1920 frame, 56px
          down, centred on the same #010224 — so the two shots read as the same surface at
          the same distance and only the content changes across the cut. The page is 1440
          wide against the pane's 1320, hence the different scale for the same 1600. */}
      {/* Under Layer (1630+): the mobile Spotlight on the brand colour, revealed as the
          Space page's circular mask shuts at 1635-1638. Mounted BELOW that sequence so the
          mask opens onto it, and five frames early so it is mounted before it is ever seen
          — the same arrangement as the livestream under the fullscreen scene at 1275.

          It takes `theme.brand` rather than the scene's own Virgin-red default, so a
          customer run gets its colour here instead of Virgin's. */}
      <Sequence
        name="Mobile Spotlight on brand colour (1630 - 1677)"
        from={1630}
        durationInFrames={47}>
        <WorkvivoMobileSpotlightScene background={theme.brand} />
      </Sequence>
      {/* Hard cut on the Spotlight's local 47 (global 1677): no transition, the Journeys
          board simply replaces the frame. The phone is there on the first frame so the cut
          lands on it; the side palette then arrives from local 3 (the Spotlight's 50,
          global 1680), assembling around a phone that is already holding the shot. */}
      <Sequence
        name="Journeys (1677 - 1825)"
        from={1677}
        durationInFrames={148}
        style={{ zIndex: 1, isolation: "isolate" }}>
        {/* TransitionSeries subtracts the transition from the total, so the board's 73 and
            the card's 90 make 148, not 163 — and the transition occupies the board's last
            15 frames (local 58-73 / global 1735-1750) and the card's first 15. The transition
            completes by global 1750. Move the board's duration to move the cut; everything else follows
            from it.

            The brand field is laid under the series rather than left to the scenes: as
            the board scales to 0.25 the frame around it is whatever sits below in the
            tree, which here is the raw reference video. Backing the series with the
            tenant colour means the board shrinks onto brand, not onto footage. */}
        <AbsoluteFill style={{ background: theme.brand }}>
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={73}>
            <JourneyBuilderScene brand={theme.brand} columnsFrom={3} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={scaleDownMatchCut()}
            timing={linearTiming({ durationInFrames: 15 })}
          />
          <TransitionSeries.Sequence durationInFrames={90}>
            {/* revealFrom 7 is where the presentation's own hard cut lands — it swaps
                opacity across p 0.45-0.55 of the 15 frames. Starting the card's travel
                there rather than at 0 means it is seen to arrive, instead of spending most
                of its movement behind a zero-opacity gate.

                wallFrom 35 is global 1770: the other eight journeys start animating in at 1770
                and with 2-frame stagger and 11-frame duration are fully in by global 1795.
                Holds through frame 1824 so it is active under the circular mask (1813-1822). */}
            <JourneyCardRevealScene
              brand={theme.brand}
              revealFrom={7}
              revealDuration={10}
              heroOvershoot={1.05}
              wallFrom={35}
              wallTravel={18}
              wallStagger={2}
              wallDuration={11}
              sideFadeFrom={70}
              sideFadeTo={77}
              middleExitFrom={70}
              middleExitDuration={12.5}
            />
          </TransitionSeries.Sequence>
        </TransitionSeries>
        </AbsoluteFill>
      </Sequence>
      {/* Two words on the brand field, closing the Spaces run. At global 1813, a circular
          mask scales up from 0 to full screen by 1822, revealing the Amplify scene with the
          text scaling up alongside the mask over the static background. At global 1828 (local 15),
          a hard cut to "Reach". */}
      <Sequence
        name="Amplify / Reach -> signage (1813 - 1978)"
        from={1813}
        durationInFrames={165}
        style={{ zIndex: 2 }}>
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={38}>
            <AmplifyReachScene maskFrom={0} maskTo={9} cutAt={15} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={scaleDownMatchCut({ scaleOutRoot: false })}
            timing={linearTiming({ durationInFrames: 12 })}
          />
          <TransitionSeries.Sequence durationInFrames={139}>
            <BillboardSignageScene />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </Sequence>
      {/* Hard cut off the signage at 1978. The screen is already three-quarters through its
          travel on the first frame, so the shot opens mid-move; only the four card rows are
          drawn until local 56 (global 2034), when the rest of the UI assembles around them
          — see WorkvivoNewsletters' `chrome` prop. */}
      <Sequence name="Newsletters reveal (1978 - 2058)" from={1978} durationInFrames={80}>
        <NewslettersRevealScene background={theme.brand} />
      </Sequence>
      {/* Hard cut at 2058 onto the plain brand field: builder panels rise in.
          At 2091, the components move down off-screen while the background remains static. */}
      <Sequence name="Newsletter builder (2058 - 2100)" from={2058} durationInFrames={42}>
        <NewsletterBuilderRevealScene background={theme.brand} />
      </Sequence>
      {/* Hard cut at 2100 onto the purple background.
          At 2155 (local 55), the phones animate up off-screen while the background stays static,
          and "Catch up on what you missed" animates up from below, morphing into the AI summary card.
          Hard cut at 2236 (136 frames duration). */}
      <Sequence
        name="Phones -> catch-up (2100 - 2236)"
        from={2100}
        durationInFrames={136}>
        <AbsoluteFill
          style={{
            background:
              // Linear, not radial: the export drops a radial background entirely, and
              // this one is the whole frame behind the phones.
              "linear-gradient(180deg, #3B1B8F 0%, #23106B 45%, #12053C 100%)",
            overflow: "hidden",
          }}>
          <WorkvivoPhonesScene
            animateUp={true}
            riseFrames={18}
            riseDistance={350}
            exitUpFrom={55}
            exitUpFrames={18}
            exitUpDistance={1200}
          />
          <CatchUpRevealScene
            background="transparent"
            revealFrom={55}
            revealDuration={18}
            revealDistance={700}
            clickFrame={85}
            morphFrom={90}
            morphDuration={18}
          />
        </AbsoluteFill>
      </Sequence>
      {/* At 2268, circular mask scales up revealing the ask bar (full page by 2270),
          with the ask bar scaling up alongside the mask over the background. */}
      <Sequence name="Ask bar (2268 - 2317)" from={2268} durationInFrames={49}>
        <AskBarScene background={theme.brand} maskFrom={0} maskTo={2} />
      </Sequence>
      {/* Hard cut at 2317 — the bar is replaced by the search it opens, framed the same
          way on the same field, so only the content changes across the cut. */}
      <Sequence name="HQ Search (2317 - 2392)" from={2317} durationInFrames={75}>
        <HqSearchScene background={theme.brand} />
      </Sequence>
      {/* Hard cut at 2392 from the search results to the agent answering. Same field and
          the same modal footprint — the search state runs off the bottom of the frame and
          the chat sits wholly inside it, which is the reference's own difference between
          the two states rather than a reframing.

          `hidden` matches the search sequence above it, which another pass switched off;
          the two are one run and should be toggled together. */}
      <Sequence name="HQ Chat (2392 - 2499)" from={2392} durationInFrames={107}>
        <HqChatScene brand={theme.brand} />
      </Sequence>
      {/* Hard cut at 2499 to the word, on the same field the chat was floating on — so
          the modal leaves and the colour stays, which is what makes it read as a title
          card for the run rather than a new scene. Same `hidden` as the two above it. */}
      <Sequence name="Ask (2499 - 2520)" from={2499} durationInFrames={21}>
        <BrandWordScene word="Ask" background={theme.brand} />
      </Sequence>
      {/* Hard cut at 2520 onto the second word (5 frames earlier). */}
      <Sequence name="Answer (2520 - 2547)" from={2520} durationInFrames={27}>
        <BrandWordScene word="Answer" background={theme.brand} />
      </Sequence>
      {/* Hard cut at 2547 onto the third and last word of the run. Given 26 frames to
          match Ask's, rather than the 12 that were left over — 2559 was an arbitrary end
          for a single card, and a closing beat that brief does not land.

          It runs to 2577 rather than the 2573 it was cut at so it is still there behind
          the iris opening at 2565-2577: the word is what the circle grows out of, and
          ending it four frames early would put raw reference footage in the ring around
          the circle for the last third of the move. The word itself settles at local 16,
          so the extra frames add nothing but the field it is standing on. */}
      <Sequence name="Job Done (2547 - 2577)" from={2547} durationInFrames={30}>
        <BrandWordScene word="Job Done" background={theme.brand} />
      </Sequence>
      {/* The mobile home opening back out of the middle of that word — see MobileIrisOpen.
          Mounted AFTER the card so it composites above it. The window is fully open by
          2577 and the phone then holds the frame to 2760 — 183 of the sequence's 195
          frames are that hold, so this is a shot the iris opens onto, not a transition. */}
      <Sequence
        name="Mobile iris open + hold (2565 - 2760)"
        from={2565}
        durationInFrames={2760 - 2565}>
        <MobileIrisOpen />
      </Sequence>
      {/* Hard cut at 2823 onto the brand field carrying the three category cards alone,
          growing in one at a time; the row then settles into the modal while the modal
          fades up around it from 2840. Same ground the words were standing on, so the cut
          takes the sentence away and leaves the colour. See WidgetStoreRevealScene.

          The four cards the hero row does not stand in for are held off the whole way and
          pop in around it between 2857 and 2870. Four, not five: the grid holds seven and
          three of them are the row.

      {/* Hard cut at 2823 onto the brand field carrying the three category cards alone,
          growing in one at a time; the row then settles into the modal while the modal
          fades up around it from 2840. See WidgetStoreRevealScene. */}
      <Sequence
        name="Widget Store reveal (2823 - 2883)"
        from={2823}
        durationInFrames={60}>
        <WidgetStoreRevealScene
          brand={theme.brand}
          settleFrom={2840 - 2823}
          popFrom={2857 - 2823}
          popTo={2870 - 2823}
        />
      </Sequence>
      {/* At 2883, the left row of widgets animates top-down, and the right row animates bottom-up (settles at 3009).
          At 3011, both columns reverse direction and exit with motion blur by 3019.
          Green brand background extends through 3109. */}
      <Sequence
        name="Widget List (2883 - 3109)"
        from={2883}
        durationInFrames={3109 - 2883}>
        <WorkvivoWidgetListScene
          brand={theme.brand}
          entranceDuration={3009 - 2883}
          exitFrom={3011 - 2883}
          exitTo={3019 - 2883}
        />
      </Sequence>
      {/* At 3022, "Create your own" animates in word-by-word (each word fades in and scales up). */}
      <Sequence
        name="Create your own (3022 - 3058)"
        from={3022}
        durationInFrames={3058 - 3022}>
        <CreateYourOwnScene text="Create your own" fontWeight={500} />
      </Sequence>
      {/* At 3058, "AI Widget Builder" animates in with the sparkle icon. The file carries
          its own glow, baked in — see the note in CreateYourOwnScene. This scene sits on
          the tenant's brand colour, so anything that had to be lifted off the field by a
          blend mode was never going to survive the export. */}
      <Sequence
        name="AI Widget Builder (3058 - 3109)"
        from={3058}
        durationInFrames={3109 - 3058}>
        <CreateYourOwnScene
          text="AI Widget Builder"
          fontWeight={500}
          icon="img/hq_sparkle_glow.png"
          iconWidth={544}
        />
      </Sequence>
      {/* At 3264, hard cut to #010320 background and animate up WorkvivoArticle.
          At local 50, it begins animating down, hard cutting out at local 62 (global 3326). */}
      <Sequence
        name="Workvivo Article (3264 - 3326)"
        from={3264}
        durationInFrames={62}>
        <WorkvivoArticleScene background="#010320" />
      </Sequence>
      {/* At 3388, hard cut to #010320 background and animate up WorkvivoAnalytics.
          At 3430, camera pans to bar charts.
          At 3475, zooms out to show full expanded screen and animates line charts.
          At 3534, animates down with cubic-bezier(0.81, -0.01, 1.00, 0.30) for 1500ms. */}
      <Sequence
        name="Workvivo Analytics (3388 - 3572)"
        from={3388}
        durationInFrames={3572 - 3388}>
        <WorkvivoAnalyticsScene background="#010320" />
      </Sequence>
      {/* Under layer (3702+): the sign-off the survey's iris opens onto. Mounted BELOW the
          survey so the mask reveals it, and five frames early so it is up before it is
          ever seen — the same arrangement as the livestream under the fullscreen scene at
          1275 and the Spotlight under the Space page at 1630.

          scaleFrom is the house title card read backwards: Ask / Answer / Job Done all
          grow in from 0.88, and this one settles down onto the frame instead. The inner
          Sequence starts that move on 3707, the frame the iris finishes shutting, so the
          whole gesture is on screen rather than half of it happening behind the mask.

          220, not the 320 those three use: that size is tuned for "Ask", and nine
          characters at it are already 1585px wide before any scaling. Sized so the phrase
          can start at 1.6 and still be whole on the frame — the alternative is a card that
          opens on the middle four letters.

          Sixty frames is my pick — no out point was given. */}
      {/* At 3758, animate up WorkvivoSeerManagerInsights with glass border. Mounted BEFORE
          the card below so the card's line can be pushed up ACROSS it — the two moves are
          one gesture and the words have to travel over the arriving device, not behind
          it. From 3758 this scene is also what paints the brand field.

          Trimmed to 36 frames, not 50: the cursor clicks the Rater tab at local 32
          (global 3790), and the sequence stops four frames later on the cut below — the
          same click-to-cut gap SpacePageShot uses at 1545/1549. */}
      <Sequence
        name="Workvivo Seer Manager Insights (3758 - 3794)"
        from={3758}
        durationInFrames={3794 - 3758}>
        <WorkvivoSeerManagerInsightsScene />
      </Sequence>
      {/* Hard cut on the click at 3790: no transition, the Rater tab simply replaces the
          frame when the sequence above ends four frames later. See SeerRaterClick2Shot
          for the framing and the cursor handoff.

          Trimmed to 49 frames, not held to 4067: this shot's own cursor clicks the
          Comments tab at local 45 (global 3839), and the sequence stops four frames
          later on the cut below — same click-to-cut gap as the 3790/3794 cut. */}
      <Sequence
        name="Workvivo Seer Rater, click 2 (3794 - 3843)"
        from={3794}
        durationInFrames={3843 - 3794}>
        <SeerRaterClick2Shot />
      </Sequence>
      {/* Hard cut on the click at 3839: no transition, the Comments tab
          (WorkvivoSeerInsights) simply replaces the frame when the sequence above ends
          four frames later. See SeerInsightsCutShot for the framing and the cursor
          lift-off. */}
      <Sequence
        name="Workvivo Seer Insights (Comments), click 3 (3843 - 3903)"
        from={3843}
        durationInFrames={3903 - 3843}>
        <SeerInsightsCutShot />
      </Sequence>
      {/* Hard cut at 3903 to Manager Insights on the phone, its two headline cards floated
          either side. Runs to 4072 — six frames past the Space Feed's iris at 4066, which
          is declared later in the tree and so shuts over this rather than under it. */}
      <Sequence
        name="Seer Manager Insights, mobile (3903 - 4072)"
        from={SEER_MOBILE_FROM}
        durationInFrames={4072 - SEER_MOBILE_FROM}>
        <SeerManagerMobileScene />
      </Sequence>
      {/* Runs to 3776 rather than stopping at 3758: its line is still on screen for the
          18 frames the device above takes to arrive, being pushed up and off by it. */}
      <Sequence name="Go beyond (3702 - 3776)" from={3702} durationInFrames={74}>
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
          rather than running on behind a zero-radius clip — the same convention as the
          Desktop scene at 738-896. See SurveySignOffShot for the shrink and the iris. */}
      <Sequence
        name="Workvivo Seer Survey Mobile (3571 - 3707)"
        from={3571}
        durationInFrames={3707 - 3571}>
        <SurveySignOffShot />
      </Sequence>
      <Sequence name="Space page (1549 - 1639)" from={1549} durationInFrames={91}>
        <SpacePageShot />
      </Sequence>
      {/* Top Layer (888 - 1285): Workvivo Desktop Fullscreen Scene with Rotational MatchCut to Quote Card at local 192 (global 1080) */}
      <Sequence
        name="Workvivo Desktop Fullscreen Scene & MatchCut (888 - 1285)"
        from={888}
        durationInFrames={398}>
        <VirginWorkvivoDesktopFullscreenScene />
      </Sequence>
      {/* At 4066, circular mask scales down completing at 4070, revealing brand green with WorkvivoSpaceFeed animating up. */}
      <Sequence
        name="Workvivo Space Feed on Brand (4066 - 4110)"
        from={4066}
        durationInFrames={4110 - 4066}>
        <WorkvivoSpaceFeedScene background={theme.brand} entranceDuration={18} />
      </Sequence>
      <Sequence
        name="Space Feed Iris Close (4066 - 4070)"
        from={4066}
        durationInFrames={4070 - 4066 + 1}>
        <SpaceFeedIrisTransition />
      </Sequence>
      {/* At 4110, hard cut from Space Feed to WorkvivoFeedbackArticle animating up on brand green. */}
      <Sequence
        name="Workvivo Feedback Article (4110 - 4253)"
        from={4110}
        durationInFrames={4253 - 4110}>
        <WorkvivoFeedbackArticleScene background={theme.brand} entranceDuration={36} />
      </Sequence>
      {/* At 4459, WorkvivoIntegrationsList animates in: top row from the right, bottom row from the left. */}
      <Sequence
        name="Workvivo Integrations List (4459 - 4554)"
        from={4459}
        durationInFrames={4554 - 4459}>
        <WorkvivoIntegrationsListScene background={theme.brand} entranceDuration={95} />
      </Sequence>
      {/* At 4397, WorkvivoIntegrationsMarketplace enters. At 4459 (local 62), animates down out of frame on top. */}
      <Sequence
        name="Workvivo Integrations Marketplace (4397 - 4480)"
        from={4397}
        durationInFrames={4480 - 4397}>
        <WorkvivoIntegrationsMarketplaceScene background={theme.brand} exitStartFrame={62} exitDuration={18} />
      </Sequence>
      {/* At 4553, WorkvivoAdminHub animates up on #000021 background. Sequence ends at 4591. */}
      <Sequence
        name="Workvivo Admin Hub (4553 - 4591)"
        from={4553}
        durationInFrames={4591 - 4553}>
        <WorkvivoAdminHubScene background="#000021" entranceDuration={24} />
      </Sequence>
      {/* At 4983, hard cut to the customer logo wall, lit with the tenant colour, ending
          at 5166. No `brand` prop: the scene takes it from the theme, and passing a
          literal here is what kept this shot green for every customer. */}
      <Sequence
        name="Workvivo Customer Grid (4983 - 5166)"
        from={4983}
        durationInFrames={5166 - 4983}>
        <WorkvivoCustomerGridScene />
      </Sequence>
    </AbsoluteFill>
  );
};
