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
 * The trending arrow is drawn flat rather than as a glass PNG: there is no arrow in
 * public/img/glass, and a filter or blend to fake the depth would either bleed onto later
 * draws or be dropped outright by the browser export.
 */

/** Frame the composition is at rest by; everything before this is the entrance. */
const SETTLED = 34;

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
   * The phone is NOT faded in. 3903 is a hard cut, and a scene whose anchor starts at
   * opacity 0 puts an empty navy frame on the cut itself. It arrives the way SpacePageShot
   * arrives on its own hard cut at 1549: already there, settling from 0.94 over 18 frames.
   * The four supporting elements fade in behind it, which is what reads as movement.
   */
  const phoneSettle = interpolate(frame, [0, 18], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const bubble = useEntrance(8, 26);
  const rate = useEntrance(12, 30);
  const score = useEntrance(16, 30);
  const arrow = useEntrance(22, 26);

  // The ring sweeps to 75% as the card arrives, then holds.
  const donutProgress = interpolate(frame, [14, SETTLED + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  /**
   * The phone's own scroll: it holds on the top of the page while the props arrive, then
   * travels once, easing out so it comes to rest rather than stopping dead. SCROLL_END is
   * the page's overflow past the viewport, measured off a render rather than computed —
   * the content is a column of cards whose height depends on how the copy wraps.
   */
  const scrollY = interpolate(frame, [SETTLED + 10, 150], [0, SCROLL_END], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
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
        <WorkvivoSeerRateCard progress={donutProgress} />
      </div>

      {/* ---- centre: the phone ---- */}
      <div
        style={{
          position: "absolute",
          left: `${PLACE.phone.cx}%`,
          top: `${PLACE.phone.cy}%`,
          width: pxW(PLACE.phone.w),
          height: pxH(PLACE.phone.h),
          transform: `translate(-50%, -50%) scale(${phoneSettle})`,
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
            <WorkvivoSeerManagerMobile scrollY={scrollY} donutProgress={donutProgress} />
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
        <Img
          src={staticFile("img/hq-scale.png")}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
    </AbsoluteFill>
  );
};
