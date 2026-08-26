import React from "react";
import { CursorArrow } from "./components/CursorArrow";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  useNewsletters,
  NewsletterCard,
  WorkvivoNewsletters,
} from "./components/workvivo/WorkvivoNewsletters";
import "./components/workvivo/WorkvivoGlassEdge.css";

/** Same curve the rest of the cut's transitions use. */
const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Device box WorkvivoNewsletters draws, and the scale that seats it on the frame. */
const DEVICE_WIDTH = 1760;
const DEVICE_HEIGHT = 1080;
const DEVICE_SCALE = 0.86;

/**
 * Where the card row sits inside the device, relative to the device's own centre.
 *
 * Down the 1440-design body: 12 padding + 100 head + 16 + 40 field + 16 + 32 chips + 44 +
 * 20 label + 12 = 292 to the row's top, + 175 for half its 350 height = 467. The body is
 * scaled 1.2222 inside the shell, and the shell starts below the 62.857 top bar, so the
 * row's centre is 467 * 1.2222 + 62.857 = 633.7 down a 1080 device — 93.7 below centre.
 * Across: the row runs 88 -> 1408 of the 1440 body, centre 748 against the body's 720, so
 * 28 * 1.2222 = 34.2 right of centre.
 *
 * Negating both is what puts the row itself dead centre on the frame.
 */
const ROW_OFFSET_Y = 93.7;
const ROW_OFFSET_X = 34.2;

/**
 * How far the screen travels on the way in, in frame pixels.
 *
 * It arrives already three-quarters through that travel — the cut catches it mid-move
 * rather than starting it — so only the last quarter is ever seen.
 */
const TRAVEL = 520;
const ENTER_FROM = 0.25;
/** Frames the remaining quarter takes. */
const SETTLE_FRAMES = 22;

/** Local frame the row leaves its resting pose for its place in the layout. Global 2027 (local 49) to 2045 (local 67). */
const RESEAT_AT = 49;
const RESEAT_FRAMES = 18;
const RESEAT_EASE = Easing.bezier(0.61, 0.19, 0.18, 1.00);

/**
 * The four panels, given as percentages of the frame — centre-anchored, as authored.
 *
 * POSE_A is where they rest once they have travelled in (global 2000); POSE_B is where
 * they animate to across RESEAT. Both were authored on top of the frame, so they are used
 * verbatim rather than derived from the page's own layout.
 *
 * The size is identical in both poses, so only the centres move. Note the row also
 * *compresses* between them — the pitch goes 19.60% -> 18.56% — so this is four
 * independent moves, not one translation of a rigid row.
 */
const PANEL_W = 17;
const PANEL_H = 33.5;
const POSE_A = { y: 52.63, x: [20.75, 40.39, 59.95, 79.55] };
const POSE_B = { y: 65.3, x: [24.17, 42.95, 61.39, 79.85] };

/** Local frame the surrounding UI starts assembling on. Global 2034. */
const CHROME_AT = 56;
const CHROME_FRAMES = 20;

/** Cursor click target at Centre X: 84.1%, Centre Y: 25.8% clicking at global frame 2055 (local 77). */
const CURSOR_IN = 56;
const CLICK_AT = 77;

export interface NewslettersRevealSceneProps {
  /** The field behind it. The cut passes `theme.brand`. */
  background?: string;
  /** Local frame when the wave sweep begins. Default 16 (global 1994). */
  waveFrom?: number;
  /** Local frame when the wave sweep completes. Default 45 (global 2023). */
  waveTo?: number;
  /** Radius of influence across neighboring cards. Default 1.65. */
  waveSpread?: number;
  /** Local frame when cards move to POSE_B. Default 49 (global 2027). */
  reseatFrom?: number;
  /** Duration in frames for move to POSE_B. Default 18 (49 to 67 = global 2027 to 2045). */
  reseatDuration?: number;
}

/**
 * Newsletters arriving on the brand field.
 *
 * Two beats, deliberately separated. First the four Recent Newsletters cards travel down
 * on nothing but the brand colour — `chrome={0}` draws the row and literally nothing else,
 * no device, no page fill, no rail. Then from local 56 the rest of the screen fades in
 * around them.
 *
 * The cards do not move during the second beat. They are already at their final position
 * when the chrome starts arriving, so the UI assembles around a fixed anchor rather than
 * the row re-seating itself once the page exists.
 */
export const NewslettersRevealScene: React.FC<NewslettersRevealSceneProps> = ({
  background = "#E10A0A",
  waveFrom = 16,
  waveTo = 45,
  waveSpread = 1.65,
  reseatFrom = RESEAT_AT,
  reseatDuration = RESEAT_FRAMES,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  // The same four cards the page below draws, resolved once from the customisation so
  // the loose panels and the page's own hidden row cannot disagree.
  const newsletters = useNewsletters();

  /**
   * Where the page has to sit so its (hidden) card row lands on POSE_B.
   *
   * Centred, the page puts its row at half the frame plus ROW_OFFSET * DEVICE_SCALE. The
   * panels are at POSE_B. Anything other than translating the page by the difference
   * assembles the UI around a row slot the cards are not in — which is two rows of cards
   * ghosting over each other, because the page draws its own set 85px higher.
   *
   * Derived rather than hardcoded so it survives a change to POSE_B or DEVICE_SCALE.
   */
  const rowCentreX = (POSE_B.x[0] + POSE_B.x[POSE_B.x.length - 1]) / 2;
  const pageShiftX = (width * rowCentreX) / 100 - (width / 2 + ROW_OFFSET_X * DEVICE_SCALE);
  const pageShiftY = (height * POSE_B.y) / 100 - (height / 2 + ROW_OFFSET_Y * DEVICE_SCALE);

  // Picks up at 25% remaining, so the shot opens on movement already underway.
  const settle = interpolate(frame, [0, SETTLE_FRAMES], [ENTER_FROM, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });
  const y = -settle * TRAVEL;

  // 0 -> the panels sit at POSE_A, 1 -> at POSE_B. Runs global 2027 to 2045 (local 49 to 67).
  const pose = interpolate(frame, [reseatFrom, reseatFrom + reseatDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: RESEAT_EASE,
  });

  const chrome = interpolate(
    frame,
    [CHROME_AT, CHROME_AT + CHROME_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SCENE_EASE },
  );

  // Continuous linear traveling wave position from left to right
  const wavePos = interpolate(frame, [waveFrom, waveTo], [-waveSpread, 3 + waveSpread], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  const getWaveInfluence = (index: number) => {
    if (frame < waveFrom || frame > waveTo + 2) return 0;
    const dist = Math.abs(wavePos - index);
    if (dist >= waveSpread) return 0;
    // Cosine bell curve creates a completely smooth wave that influences neighboring cards
    return 0.5 * (1 + Math.cos((Math.PI * dist) / waveSpread));
  };

  // Cursor animation: clicks at Centre X: 84.1%, Centre Y: 25.8% at frame 2055 (local 77)
  const targetX = width * 0.841 - 12;
  const targetY = height * 0.258 - 3.75;

  const cursorX = interpolate(frame, [CURSOR_IN, CLICK_AT - 4], [width * 0.95, targetX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  const cursorY = interpolate(frame, [CURSOR_IN, CLICK_AT - 4], [height * 0.75, targetY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: SCENE_EASE,
  });

  const cursorPress = interpolate(
    frame,
    [CLICK_AT - 3, CLICK_AT, CLICK_AT + 3],
    [1, 0.84, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const cursorOpacity = interpolate(
    frame,
    [CURSOR_IN, CURSOR_IN + 6],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background, overflow: "hidden" }}>
      {/* The page, fading in around the panels. It draws its own card row, which is what
          the panels hand over to as `chrome` comes up. */}
      <AbsoluteFill
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          opacity: chrome,
          transform: `translate(${pageShiftX}px, ${pageShiftY}px)`,
        }}
      >
        <div
          className="wv-glass-edge"
          style={{
            position: "relative",
            width: DEVICE_WIDTH,
            height: DEVICE_HEIGHT,
            transform: `scale(${DEVICE_SCALE})`,
            transformOrigin: "center center",
            borderRadius: 16,
            ["--wv-glass-radius" as string]: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
          >
            <WorkvivoNewsletters chrome={chrome} cards={false} />
          </div>
        </div>
      </AbsoluteFill>

      {/* The four panels, placed on the frame directly so they can hit the authored
          percentages exactly rather than inheriting the page's internal layout. They
          carry the entry travel, then move A -> B, then cross-fade out as the page's own
          row takes over. They do NOT fade out — they are the only copy of those cards on
          screen, and the page is positioned around them with its own row hidden. */}
      <AbsoluteFill style={{ transform: `translateY(${y}px)`, willChange: "transform" }}>
        {newsletters.slice(0, POSE_A.x.length).map((n, i) => {
          const influence = getWaveInfluence(i);
          const cardScale = 1 + 0.14 * influence;
          const isAffected = influence > 0.005;

          return (
            <NewsletterCard
              key={n.title}
              item={n}
              slot={`newsletter.cover.${i}`}
              hoverProgress={influence}
              style={{
                position: "absolute",
                left: `${interpolate(pose, [0, 1], [POSE_A.x[i], POSE_B.x[i]])}%`,
                top: `${interpolate(pose, [0, 1], [POSE_A.y, POSE_B.y])}%`,
                width: `${PANEL_W}%`,
                height: `${PANEL_H}%`,
                transform: `translate(-50%, -50%) scale(${cardScale})`,
                transformOrigin: "center center",
                zIndex: isAffected ? Math.round(1 + 10 * influence) : 1,
              }}
            />
          );
        })}
      </AbsoluteFill>

      {/* Cursor in black clicking at Centre X 84.1%, Centre Y 25.8% at global frame 2055 */}
      {frame >= CURSOR_IN && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: `scale(${cursorPress})`,
            transformOrigin: "12px 3.75px",
            opacity: cursorOpacity,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
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
