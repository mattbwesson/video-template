import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GlassRing } from "./components/workvivo/GlassRing";
import { SeerScoreCard } from "./components/workvivo/WorkvivoSeerManagerInsights";
import { WorkvivoSeerManagerMobile } from "./components/workvivo/WorkvivoSeerManagerMobile";
import { WorkvivoSeerRateCard } from "./components/workvivo/WorkvivoSeerRateCard";
import "./components/workvivo/WorkvivoMobileStyles.css";
import "./components/workvivo/WorkvivoGlassEdge.css";
import "./components/workvivo/WorkvivoSeerManagerInsightsStyles.css";

/**
 * Manager Insights on the phone, with its two headline cards floated either side —
 * global 3903-4072.
 *
 * Everything on screen is an existing component: the phone shell is `.wm-phone` with the
 * glass bezel the other phones wear, the screen is WorkvivoSeerManagerMobile, the right
 * card is the desktop manager screen's own score card (SeerScoreCard, exported from it so
 * the two cannot drift), the left is that screen's Donut inside the tabbed frame the
 * mobile capture shows, and the speech bubble is the pre-baked glass PNG that
 * ContentListScreen and QuoteCard already use.
 *
 * The cards are authored at the desktop screen's body scale and scaled up here rather
 * than restated at hero size, so a measurement only ever exists in one place.
 *
 * Both props are pre-baked glass PNGs. Nothing here recolours at render time: a CSS filter
 * is not scoped to the element that sets it in the browser export and bleeds onto later
 * draws, and a blend mode is not composited at all.
 */

/**
 * The shot, in local frames.
 *
 *   0  - 13   the phone rises into the close framing
 *   13 - 85   it holds there and the page scrolls the whole way down
 *   85 - 105  it pulls back to its resting size in 800ms, the page scrolling home with it
 *   97 - 139  the two cards and two props arrive in the room the pull-back opened
 *   139+      held, which is what the iris at local 163 shuts on
 *
 * The pull-back is specified in MILLISECONDS, so it is converted against the composition's
 * own fps rather than written down as a frame count — 800ms is 20 frames only while this
 * renders at 25.
 */
const T_SETTLE = 13;
const T_SCROLL_END = 85;
const ZOOM_OUT_MS = 800;

/**
 * The props outlast the phone's move on purpose. Compressed into the same 800ms they read
 * as one clatter of things appearing; running on past it, the camera settles first and the
 * supporting elements populate after, which is the order the eye wants them in.
 */
const PROP_LEAD = 8;
const PROP_STAGGER = 8;
const PROP_RAMP = 18;

/**
 * Placement, as supplied: centre and size in percent of the 1920x1080 frame.
 *
 * Held in percentages rather than converted to px because that is the form they were
 * measured in — a later tweak lands here as the same number that was read off the design.
 *
 * The phone takes its box literally, being a CSS shell that can be any size. The two cards
 * cannot: they are the desktop screen's own components at its body scale, with a fixed
 * internal aspect, so each is scaled by its WIDTH and centred on the given centre. Their
 * rendered heights therefore land near the supplied heights rather than on them — see the
 * scale constants below.
 */
const PLACE = {
  phone: { cx: 50.9, cy: 52.9, w: 21.0, h: 77.0 },
  score: { cx: 77.6, cy: 32.9, w: 28.0, h: 15.7 },
  rate: { cx: 26.9, cy: 60.5, w: 22.0, h: 27.5 },
} as const;

const FRAME_W = 1920;
const FRAME_H = 1080;

const pxW = (pct: number) => (pct / 100) * FRAME_W;
const pxH = (pct: number) => (pct / 100) * FRAME_H;

/** Natural widths of the two borrowed cards, at the desktop screen's body scale. */
const SCORE_NATURAL_W = 342;
const RATE_NATURAL_W = 290;

const SCORE_SCALE = pxW(PLACE.score.w) / SCORE_NATURAL_W;
const RATE_SCALE = pxW(PLACE.rate.w) / RATE_NATURAL_W;

/**
 * The close framing the shot opens on: 32.5% of the frame wide, 16% down from the top.
 *
 * Derived rather than written out, because the phone keeps its aspect. 32.5 against its
 * resting 21.0 is a uniform 1.548, which takes its 77.0% height to 119.2% — taller than the
 * frame. Starting 16% down therefore leaves exactly 84% of the frame filled, which is the
 * height that was measured: it is a consequence of the other two numbers, not a third
 * input, and the three agreeing is what says the framing is right.
 *
 * X stays at the resting centre, so the pull-back is scale and rise only — no sideways
 * drift to distract from the page still scrolling underneath it.
 */
const ZOOM_W = 32.5;
const ZOOM_TOP = 16.0;
const ZOOM_SCALE = ZOOM_W / PLACE.phone.w;
const ZOOM = {
  cx: PLACE.phone.cx,
  cy: ZOOM_TOP + (PLACE.phone.h * ZOOM_SCALE) / 2,
  scale: ZOOM_SCALE,
};

/** How far the phone travels up into that framing over the first 13 frames. */
const RISE = 190;

/**
 * The glass props, positioned off the reference's own proportions and nudged 25px right of
 * it. Sizes are half again the reference's, which is what lets them read as objects in the
 * room rather than as icons pinned to the background.
 */
const PROP_DX = 25;
const BUBBLE = { cx: 25.0, cy: 31.4, size: 294 };
const ARROW = { cx: 65.9, cy: 73.4, size: 285 };

/**
 * The ambient float the glass props never quite settle out of, lifted from
 * ContentListScreen so the two scenes' props behave alike: a 13-second loop, with the
 * horizontal running at twice the vertical's rate so the path is a lazy figure-of-eight
 * rather than a circle. `seed` staggers the two so they are never in step.
 */
const floatAt = (seconds: number, seed: number) => {
  const phase = (((seconds + seed) % 13) / 13) * Math.PI * 2;
  return {
    dx: Math.sin(phase * 2) * 7,
    dy: Math.sin(phase) * 14,
    rot: Math.sin(phase) * 3,
  };
};

/** The overshoot a card lands on — past its mark, then back. */
const settleEase = Easing.bezier(0.22, 1.25, 0.5, 1);

/**
 * How far the phone's page travels, in screen px — the column's height less the window
 * between the fixed head and the fixed nav. Verified against a render at the end of the
 * travel: the last row should sit just clear of the nav, with no empty white below it.
 */
const SCROLL_END = 671;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * The pull-back's own curve, and a markedly different shape from the house easing: where
 * that one is 97% done by its midpoint, this holds low and then leaves late and hard. Over
 * 800ms that reads as a camera being pulled back rather than a card snapping to a mark.
 *
 * The -0.01 control point is nominal anticipation only — the curve barely dips below zero,
 * so nothing visibly undershoots. Remotion constrains the two x values to [0, 1] and leaves
 * y alone, so this is accepted as written.
 */
const easeOut = Easing.bezier(0.81, -0.01, 0.16, 1.0);

export const SeerManagerMobileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  /** 800ms in this composition's frames. */
  const zoomOutEnd = T_SCROLL_END + Math.round((ZOOM_OUT_MS / 1000) * fps);
  const seconds = frame / fps;

  /**
   * The pull-back, 0 at the close framing and 1 at rest. Everything about the phone's
   * placement is this one number, so the move cannot come apart into a scale that finishes
   * before the position does.
   */
  const out = interpolate(frame, [T_SCROLL_END, zoomOutEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const lerp = (from: number, to: number) => from + (to - from) * out;

  // The rise into the close framing. No fade: 3903 is a hard cut, and an anchor starting
  // at opacity 0 would put an empty navy frame on the cut itself.
  const rise = interpolate(frame, [0, T_SETTLE], [RISE, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  /**
   * Down the whole page while the shot is close, then home again as it pulls back. One
   * interpolate across three stops rather than two, so the turn at 85 is a single eased
   * reversal instead of two moves meeting.
   */
  const scrollY = interpolate(
    frame,
    [T_SETTLE, T_SCROLL_END, zoomOutEnd],
    [0, SCROLL_END, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    },
  );

  /**
   * One arrival, with four things moving at once rather than a fade and a rise: it comes up,
   * drifts in toward the phone, and lands on a scale that goes a little past its mark before
   * settling. `dx` is signed, so each card travels in from its own side of the frame.
   */
  const arrive = (index: number, dx: number) => {
    const start = zoomOutEnd - PROP_LEAD + index * PROP_STAGGER;
    const t = interpolate(frame, [start, start + PROP_RAMP], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const s = interpolate(t, [0, 1], [0, 1], { easing: settleEase });
    return {
      // Opacity leads the movement slightly, so nothing is still fading once it has landed.
      opacity: interpolate(t, [0, 0.55], [0, 1], { extrapolateRight: "clamp", easing: ease }),
      x: (1 - s) * dx,
      y: (1 - s) * 30,
      scale: 0.9 + 0.1 * s,
    };
  };

  const bubble = arrive(0, -34);
  const rate = arrive(1, -46);
  const score = arrive(2, 46);
  const arrow = arrive(3, 34);

  // The props never fully settle: a slow figure-of-eight, seeded apart so they are never
  // in step with each other.
  const bubbleFloat = floatAt(seconds, 0);
  const arrowFloat = floatAt(seconds, 6.5);

  // Two rings, two jobs. The one inside the phone fills as the scroll brings it into view;
  // the one on the card beside it fills as that card arrives.
  const phoneDonut = interpolate(frame, [28, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const cardDonut = interpolate(frame, [zoomOutEnd, zoomOutEnd + 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  return (
    <AbsoluteFill style={{ background: "#010420", overflow: "hidden" }}>
      {/* ---- left: the glass speech bubble ---- */}
      <div
        style={{
          position: "absolute",
          left: `${BUBBLE.cx}%`,
          top: `${BUBBLE.cy}%`,
          width: BUBBLE.size,
          height: BUBBLE.size,
          opacity: bubble.opacity,
          transform:
            `translate(-50%, -50%)` +
            ` translate(${PROP_DX + bubble.x + bubbleFloat.dx}px, ${bubble.y + bubbleFloat.dy}px)` +
            ` rotate(${bubbleFloat.rot}deg) scale(${bubble.scale})`,
          willChange: "transform, opacity",
        }}
      >
        <Img
          src={staticFile("img/glass/chat.png")}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>

      {/* ---- left: Response Rate ---- */}
      <div
        style={{
          position: "absolute",
          left: `${PLACE.rate.cx}%`,
          top: `${PLACE.rate.cy}%`,
          transform: `translate(-50%, -50%) translate(${rate.x}px, ${rate.y}px) scale(${RATE_SCALE * rate.scale})`,
          // The card is width:100% so the phone's copy can go full-bleed; the floating one
          // needs its natural width stated, which is what RATE_SCALE is derived from.
          width: RATE_NATURAL_W,
          opacity: rate.opacity,
          borderRadius: 12,
          boxShadow: "0 30px 70px rgba(2, 1, 20, 0.55)",
          willChange: "transform, opacity",
        }}
      >
        <WorkvivoSeerRateCard progress={cardDonut} />
      </div>

      {/* ---- centre: the phone ---- */}
      <div
        style={{
          position: "absolute",
          left: `${lerp(ZOOM.cx, PLACE.phone.cx)}%`,
          top: `${lerp(ZOOM.cy, PLACE.phone.cy)}%`,
          width: pxW(PLACE.phone.w),
          height: pxH(PLACE.phone.h),
          // translate(-50%,-50%) is in the parent's px and unaffected by the scale that
          // follows it, so the SCALED phone's centre lands exactly on left/top.
          transform: `translate(-50%, -50%) translateY(${rise}px) scale(${lerp(ZOOM.scale, 1)})`,
          willChange: "transform",
        }}
      >
        <div
          className="wm-phone wv-glass-phone"
          style={{
            width: "100%",
            height: "100%",
            boxShadow: "0 0 90px rgba(150, 96, 255, 0.4), 0 34px 90px rgba(6, 2, 24, 0.6)",
          }}
        >
          <GlassRing />
          <div className="wm-screen">
            <WorkvivoSeerManagerMobile scrollY={scrollY} donutProgress={phoneDonut} />
          </div>
        </div>
      </div>

      {/* ---- right: Team Engagement Score ----
          `wsmi-scope` carries the desktop screen's custom properties and reset. Without it
          the card's `background: var(--wsmi-card)` resolves to nothing and it paints
          straight onto the navy. */}
      <div
        className="wsmi-scope"
        style={{
          position: "absolute",
          left: `${PLACE.score.cx}%`,
          top: `${PLACE.score.cy}%`,
          transform: `translate(-50%, -50%) translate(${score.x}px, ${score.y}px) scale(${SCORE_SCALE * score.scale})`,
          // `.wsmi-score` sizes itself with `flex: 0 0 342px`, which only binds as a flex
          // item. Standalone it shrank to content and rendered 2.5% narrow, so its designed
          // width is restated here — the value SCORE_SCALE is derived from.
          width: SCORE_NATURAL_W,
          opacity: score.opacity,
          borderRadius: 12,
          boxShadow: "0 30px 70px rgba(2, 1, 20, 0.55)",
          willChange: "transform, opacity",
        }}
      >
        <SeerScoreCard />
      </div>

      {/* ---- right: the climb ---- */}
      <div
        style={{
          position: "absolute",
          left: `${ARROW.cx}%`,
          top: `${ARROW.cy}%`,
          width: ARROW.size,
          height: ARROW.size,
          opacity: arrow.opacity,
          transform:
            `translate(-50%, -50%)` +
            ` translate(${PROP_DX + arrow.x + arrowFloat.dx}px, ${arrow.y + arrowFloat.dy}px)` +
            ` rotate(${arrowFloat.rot}deg) scale(${arrow.scale})`,
          willChange: "transform, opacity",
        }}
      >
        {/* glass/scale.png, not the neutral hq-scale.png it was made from: the supplied
            render is dark grey glass, which beside the purple bubble read as a different
            material. scripts/prep-glass-tint.py matches it to this family. */}
        <Img
          src={staticFile("img/glass/scale.png")}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
    </AbsoluteFill>
  );
};
