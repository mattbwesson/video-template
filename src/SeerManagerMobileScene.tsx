import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
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
 *   85 - 135  it pulls back to its resting size while the page scrolls home, and the two
 *             cards and two props arrive in the room the pull-back opens up
 *   135+      held, which is what the iris at local 163 shuts on
 */
const T_SETTLE = 13;
const T_SCROLL_END = 85;
const T_ZOOMOUT_END = 135;

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

/** The glass props, positioned off the reference's own proportions. */
const BUBBLE = { cx: 25.0, cy: 31.4, size: 196 };
const ARROW = { cx: 65.9, cy: 73.4, size: 190 };

/**
 * How far the phone's page travels, in screen px — the column's height less the window
 * between the fixed head and the fixed nav. Verified against a render at the end of the
 * travel: the last row should sit just clear of the nav, with no empty white below it.
 */
const SCROLL_END = 671;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** A staggered fade-and-rise. `delay` is in frames from the scene's own start. */
const useEntrance = (delay: number, rise = 34) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return { opacity: t, y: (1 - t) * rise };
};

export const SeerManagerMobileScene: React.FC = () => {
  const frame = useCurrentFrame();

  /**
   * The pull-back, 0 at the close framing and 1 at rest. Everything about the phone's
   * placement is this one number, so the move cannot come apart into a scale that finishes
   * before the position does.
   */
  const out = interpolate(frame, [T_SCROLL_END, T_ZOOMOUT_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
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
    [T_SETTLE, T_SCROLL_END, T_ZOOMOUT_END],
    [0, SCROLL_END, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    },
  );

  // The props arrive into the space the pull-back opens, staggered across it.
  const bubble = useEntrance(T_SCROLL_END + 3, 26);
  const rate = useEntrance(T_SCROLL_END + 11, 30);
  const score = useEntrance(T_SCROLL_END + 19, 30);
  const arrow = useEntrance(T_SCROLL_END + 27, 26);

  // Two rings, two jobs. The one inside the phone fills as the scroll brings it into view;
  // the one on the card beside it fills as that card arrives.
  const phoneDonut = interpolate(frame, [28, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const cardDonut = interpolate(frame, [T_SCROLL_END + 13, T_ZOOMOUT_END - 5], [0, 1], {
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
          transform: `translate(-50%, -50%) translateY(${bubble.y}px)`,
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
          transform: `translate(-50%, -50%) translateY(${rate.y}px) scale(${RATE_SCALE})`,
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
          transform: `translate(-50%, -50%) translateY(${score.y}px) scale(${SCORE_SCALE})`,
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
          transform: `translate(-50%, -50%) translateY(${arrow.y}px)`,
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
