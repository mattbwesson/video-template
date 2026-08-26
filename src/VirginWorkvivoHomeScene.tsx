import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { WorkvivoHomeContainer } from "./components/workvivo/WorkvivoHomeContainer";
import { WorkvivoMobileHome } from "./components/workvivo/WorkvivoMobileHome";
import "./components/workvivo/WorkvivoGlassEdge.css";
import { invertEase } from "./match-cut";
import { useCustomization } from "./customize/CustomizationProvider";
import { FIXED_COPY } from "./customize/videoCopy";

// --- card swap timing --------------------------------------------------------
// Every card swap in this scene is two objects trading places, and they all share one
// shape: the leader sets off, and once it is 80% of the way into its new slot the
// follower starts into the slot the leader is vacating. The pair spans 34 frames.

/** One curve for every swap, leader and follower alike. */
const SWAP_EASE = Easing.bezier(0.34, 0.65, 0.18, 1.0);

/** Frames from the leader setting off to the follower settling. */
const SWAP_TOTAL_FRAMES = 34;

/** How far into its new slot the leader is before the follower moves. */
const SWAP_HANDOFF = 0.8;

// "80% into place" is 80% of the DISTANCE covered, which is the curve's OUTPUT — not 80%
// of the elapsed time. On this curve those are very different: output hits 0.8 at about
// t=0.36, so reading it as a time fraction would start the follower more than twice as
// late as intended. Invert the curve numerically to get the real handoff moment, so the
// stagger stays correct if the curve is ever retuned.
const SWAP_HANDOFF_TIME = invertEase(SWAP_EASE, SWAP_HANDOFF);

/** Both objects move for the same span; the follower is simply offset by the handoff.
 *  total = move * handoffTime + move  =>  move = total / (1 + handoffTime).
 *  For this curve that works out to ~25 frames each, offset by ~9. */
const SWAP_MOVE_FRAMES = SWAP_TOTAL_FRAMES / (1 + SWAP_HANDOFF_TIME);
const SWAP_STAGGER = SWAP_MOVE_FRAMES * SWAP_HANDOFF_TIME;

/** The two 0->1 progresses for one swap starting on `start`. The follower's window ends on
 *  start + SWAP_TOTAL_FRAMES by construction. */
const swapProgress = (frame: number, start: number) => {
  const ramp = (from: number) =>
    interpolate(frame, [from, from + SWAP_MOVE_FRAMES], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: SWAP_EASE,
    });
  return { lead: ramp(start), follow: ramp(start + SWAP_STAGGER) };
};

// --- the headline beat --------------------------------------------------------
// At local 130 the phone pushes left and the headline arrives from the right. Both ride one
// progress on one curve, so the phone leaving the centre and the text filling the space it
// opens are the same move rather than two that happen to overlap.
const HEADLINE_START = 130;
const HEADLINE_FRAMES = 20; // 800ms at 25fps
const HEADLINE_EASE = Easing.bezier(0.82, 0.02, 0.12, 1.0);

/** The phone is 393x852, so at scale 1.5 it is 589.5 wide and rests centred on the stage at
 *  x=960. -434 recentres it on x=526, which is where the reference puts it. */
const PHONE_PUSH_X = -434;

/** Where the headline's left edge and first line sit once settled, measured off the
 *  reference against the 1920x1080 stage. */
const HEADLINE_LEFT = 964;
/** Nudged up from 408 as the type grew, so the three-line block keeps the same visual
 *  centre rather than drifting down as its line height increases. */
const HEADLINE_TOP = 386;
const HEADLINE_FONT_SIZE = 104;
const HEADLINE_LINE_HEIGHT = 129;

/** How far right of its resting place the headline starts. */
const HEADLINE_ENTER_X = 140;

const HEADLINE_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif';

export interface VirginWorkvivoHomeSceneProps {
  /**
   * Overrides the phone's own two-burst scroll with a value from outside.
   *
   * The mobile iris at 2565 needs exactly this: it freezes the scene at local 128 to get
   * that frame's framing back, and a frozen scene cannot scroll itself. Passing the scroll
   * in from above the <Freeze> leaves everything else pinned and moves only the page.
   *
   * Left undefined the scene scrolls itself, which is what the 417-600 run does.
   */
  mobileScrollTop?: number;
}

export const VirginWorkvivoHomeScene: React.FC<VirginWorkvivoHomeSceneProps> = ({
  mobileScrollTop: mobileScrollTopOverride,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { copy } = useCustomization();

  // Shrunk 5% (85% of composition) and moved down 20px further (+70px down from center)
  const COMPONENT_WIDTH = width * 0.85; // 1632px
  const COMPONENT_HEIGHT = height * 0.85 + 50; // 968px
  const COMPONENT_TOP = (height - COMPONENT_HEIGHT) / 2 + 70; // 126px (centered 56px + 70px down)

  // Entrance animation: Animate up smoothly with top 100px already visible on screen at frame 0
  const slideProgress = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const initialTranslateY = height - COMPONENT_TOP - 100; // 100px visible on screen at start
  const translateY = interpolate(slideProgress, [0, 1], [initialTranslateY, 0]);

  // Staggered panel shift animations. Each of the three swaps starts on its own frame but
  // runs the identical internal timing (see SWAP_* above):
  // 1. Top cards (billboards): Starts at local frame 14
  const topSwap = swapProgress(frame, 14);
  // 2. Spaces and News (left column): Starts at local frame 22
  const leftSwap = swapProgress(frame, 22);
  // 3. Posts and Weather (right column): Starts at local frame 32
  const rightSwap = swapProgress(frame, 32);

  // Two-burst scroll animation, each burst on its own curve.
  // Burst 1: local frame 58 to local frame 89
  // Burst 2: local frame 89 to local frame 125 -> stops at local 125
  //
  // The scroll is held off until 58 so it begins after the top and left card swaps have
  // settled (14+34=48 and 22+34=56); only the right column's swap, which runs to 66, is
  // still finishing under it.
  const SCROLL_START = 58;
  const SCROLL_HANDOFF = 89;
  const SCROLL_END = 125;

  const burst1 = interpolate(frame, [SCROLL_START, SCROLL_HANDOFF], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.53, 0.27, 0.26, 0.86),
  });

  const burst2 = interpolate(frame, [SCROLL_HANDOFF, SCROLL_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.58, 0.15, 0.18, 1.0),
  });

  // Total scroll distance: Burst 1 scrolls 680px, Burst 2 scrolls another 820px (total 1500px)
  const BURST_1_SCROLL = 680;
  const BURST_2_SCROLL = 820;
  const scrollTop = Math.round(burst1 * BURST_1_SCROLL + burst2 * BURST_2_SCROLL);

  // Downward exit & scale down animation: Starts at local frame 107, 400ms (10 frames at 25fps) -> completes at local frame 117
  const exitProgress = interpolate(frame, [107, 117], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.61, 0.17, 0.87, 0.36),
  });

  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.75]);
  const exitTranslateY = interpolate(exitProgress, [0, 1], [0, 240]);
  const totalTranslateY = translateY + exitTranslateY;

  const NATIVE_WIDTH = 1760;
  const SCALE_RATIO = COMPONENT_WIDTH / NATIVE_WIDTH; // 1632 / 1760 ≈ 0.9273

  // Hard cut at local frame 117
  const isMobile = frame >= 117;

  // Mobile entrance animation starting at local frame 117:
  // Scale 1.5, resting position moved 300px higher (+200px offset from center).
  // Rendered phone height = 852 * 1.5 = 1278px.
  // 20% of height visible at frame 117 = 0.20 * 1278 = 255.6px above bottom edge (y = 1080 - 255.6 = 824.4px).
  // At rest (frame 141), top is at 540 + 200 - (1278 / 2) = 101px.
  // Offset to slide up = 824.4 - 101 ≈ 723px.
  const mobileSlideOffset = interpolate(frame, [117, 141], [723, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const totalMobileTranslateY = 200 + mobileSlideOffset;

  // Two-part mobile scroll animation:
  // Part 1: cubic-bezier(0.30, 0.92, 0.58, 0.85) 1100ms (27.5 frames from 125 to 152.5)
  // Part 2: cubic-bezier(0.69, 0.08, 0.50, 1.05) 1100ms (27.5 frames from 152.5 to 180)
  const mobileBurst1 = interpolate(frame, [125, 152.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.30, 0.92, 0.58, 0.85),
  });

  const mobileBurst2 = interpolate(frame, [152.5, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.69, 0.08, 0.50, 1.05),
  });

  // One progress drives the phone's push AND the headline's arrival.
  const headlineProgress = interpolate(
    frame,
    [HEADLINE_START, HEADLINE_START + HEADLINE_FRAMES],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: HEADLINE_EASE,
    },
  );

  const phonePushX = interpolate(headlineProgress, [0, 1], [0, PHONE_PUSH_X]);
  const headlineX = interpolate(headlineProgress, [0, 1], [HEADLINE_ENTER_X, 0]);

  const MOBILE_BURST_1_SCROLL = 280;
  const MOBILE_BURST_2_SCROLL = 280;
  const mobileScrollTop =
    mobileScrollTopOverride ??
    Math.round(
      mobileBurst1 * MOBILE_BURST_1_SCROLL + mobileBurst2 * MOBILE_BURST_2_SCROLL
    );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#010026",
        overflow: "hidden",
      }}
    >
      {!isMobile ? (
        /* Desktop Workvivo Component (Hard Cut at local 117) */
        // The glass edge goes HERE rather than inside WorkvivoHomeContainer: this wrapper is
        // what actually owns the frame's rounded corner and its overflow clip, so it is the
        // real outside edge. .device inside is a square, transparent box.
        <div
          className="wv-glass-edge"
          style={{
            position: "absolute",
            top: COMPONENT_TOP,
            left: "50%",
            width: COMPONENT_WIDTH,
            height: COMPONENT_HEIGHT,
            transform: `translateX(-50%) translateY(${totalTranslateY}px) scale(${exitScale})`,
            transformOrigin: "center center",
            borderRadius: 16,
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.65)",
            ["--wv-glass-radius" as string]: "16px",
          } as React.CSSProperties}
        >
          {/* The clip lives on this inner box, not the one above: `overflow: hidden` on the
              glass-edge host would cut away the rings it draws outside itself. */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#F6F5F8",
            }}
          >
          <div
            style={{
              width: NATIVE_WIDTH,
              height: COMPONENT_HEIGHT / SCALE_RATIO,
              transform: `scale(${SCALE_RATIO})`,
              transformOrigin: "top left",
              backgroundColor: "#F6F5F8",
            }}
          >
            <WorkvivoHomeContainer
              topSwap={topSwap}
              leftSwap={leftSwap}
              rightSwap={rightSwap}
              scrollTop={scrollTop}
            />
          </div>
          </div>
        </div>
      ) : (
        /* Mobile Workvivo Component (1.5x scale, elevated, scrolls at local 125) */
        <>
          {/* Headline, arriving from the right into the space the phone opens up. Drawn
              BEFORE the phone so the device occludes it where the two cross mid-move —
              they settle clear of each other, but the text's leading edge would otherwise
              ghost across the phone's white body on the way in. */}
          <div
            style={{
              position: "absolute",
              left: HEADLINE_LEFT,
              top: HEADLINE_TOP,
              opacity: headlineProgress,
              transform: `translateX(${headlineX}px)`,
              fontFamily: HEADLINE_FONT,
              fontSize: HEADLINE_FONT_SIZE,
              lineHeight: `${HEADLINE_LINE_HEIGHT}px`,
              fontWeight: 600,
              letterSpacing: -2,
              color: "#FFFFFF",
              whiteSpace: "pre",
            }}
          >
            {/* Joined rather than three <div>s so the block keeps one line box and the
                HEADLINE_LINE_HEIGHT above stays the only thing setting the leading. */}
            {FIXED_COPY.homeHeadlineLines.join("\n")}
          </div>

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translate(${phonePushX}px, ${totalMobileTranslateY}px) scale(1.5)`,
              transformOrigin: "center center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <WorkvivoMobileHome scrollTop={mobileScrollTop} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
