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
import { useCustomization } from "./customize/CustomizationProvider";
import { FIXED_COPY } from "./customize/videoCopy";
import type { ImageSlotKey } from "./customize/imagery";

interface AvatarItem {
  id: string;
  /** Which of the ten face positions this circle is — see `IMAGE_SLOTS`. */
  slot: ImageSlotKey;
  /** The baseline demo's portrait, used until the operator uploads enough photos. */
  fallback: string;
  xPercent: number; // Center X as %
  yPercent: number; // Center Y as %
  size: number; // Diameter in px
}

// The two groups are listed largest-first and foreground-first, and `IMAGE_SLOTS` deals
// uploads out in that order, so the operator's earliest photos land on the biggest,
// nearest circles rather than on an 86px one at the edge of frame.

// Group 1: Near / Foreground Z-plane (larger circles)
const FOREGROUND_AVATARS: AvatarItem[] = [
  {
    id: "top-left-large",
    slot: "hq.face.0",
    fallback: staticFile("img/vatar-2.jpeg"),
    xPercent: 32.5,
    yPercent: 17.5,
    size: 185,
  },
  {
    id: "top-right-large",
    slot: "hq.face.1",
    fallback: staticFile("img/avatar-4.jpeg"),
    xPercent: 71.0,
    yPercent: 12.0,
    size: 170,
  },
  {
    id: "bottom-left-large",
    slot: "hq.face.2",
    fallback: staticFile("img/avatar-6.jpeg"),
    xPercent: 23.5,
    yPercent: 69.0,
    size: 155,
  },
  {
    id: "bottom-center-left",
    slot: "hq.face.3",
    fallback: staticFile("img/avatar-1.jpeg"),
    xPercent: 42.5,
    yPercent: 76.0,
    size: 150,
  },
  {
    id: "bottom-right-med",
    slot: "hq.face.4",
    fallback: staticFile("img/avatar-4.jpeg"),
    xPercent: 68.0,
    yPercent: 69.5,
    size: 130,
  },
];

// Group 2: Midground / Deeper Z-plane (smaller circles)
const BACKGROUND_AVATARS: AvatarItem[] = [
  {
    id: "top-far-left",
    slot: "hq.face.5",
    fallback: staticFile("img/avatar-1.jpeg"),
    xPercent: 14.5,
    yPercent: 31.5,
    size: 86,
  },
  {
    id: "top-center-med",
    slot: "hq.face.6",
    fallback: staticFile("img/avatar-3.jpeg"),
    xPercent: 48.5,
    yPercent: 29.0,
    size: 120,
  },
  {
    id: "top-far-right",
    slot: "hq.face.7",
    fallback: staticFile("img/avatar-5.jpeg"),
    xPercent: 79.0,
    yPercent: 23.0,
    size: 86,
  },
  {
    id: "bottom-center-small",
    slot: "hq.face.8",
    fallback: staticFile("img/avatar-3.jpeg"),
    xPercent: 55.0,
    yPercent: 70.0,
    size: 92,
  },
  {
    id: "bottom-far-right",
    slot: "hq.face.9",
    fallback: staticFile("img/avatar-5.jpeg"),
    xPercent: 83.5,
    yPercent: 81.0,
    size: 96,
  },
];

export const HeadquartersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { theme, image } = useCustomization();
  // Fixed, like the headline it answers — see FIXED_COPY in videoCopy.ts.
  const [word0, word1, word2, word3] = FIXED_COPY.headquartersRevealWords;

  // Local frame 0 = Global frame 33
  // Global frame 75 = Local frame 42
  // Global frame 80 = Local frame 47
  // Global frame 98 = Local frame 65
  // Global frame 105 = Local frame 72 ('they')
  // Global frame 109 = Local frame 76 ('have')
  // Global frame 117 = Local frame 84 ('one.')
  // Global frame 132 = Local frame 99 (start quick scale down match cut)
  // Global frame 135 = Local frame 102 (scene ends)

  // ----------------------------------------------------
  // ENTRANCE ANIMATIONS (Local frames 0 to 26 / Global 33 to 59)
  // ----------------------------------------------------
  const textEnterProgress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const enterTextScale = interpolate(textEnterProgress, [0, 1], [9.5, 1]);

  const fgEnterProgress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.18, 1, 0.32, 1),
  });
  const enterFgScale = interpolate(fgEnterProgress, [0, 1], [3.6, 1]);

  const bgEnterProgress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.24, 1, 0.38, 1),
  });
  const enterBgScale = interpolate(bgEnterProgress, [0, 1], [2.4, 1]);

  // ----------------------------------------------------
  // STAGGERED 3D EXIT: 700ms duration (~18 frames)
  // using cubic-bezier(0.67, 0.01, 0.86, 0.04)
  // Staggered starting points across FG, Text, and BG for depth illusion
  // ----------------------------------------------------
  const exitEasing = Easing.bezier(0.67, 0.01, 0.86, 0.04);

  // 1. Foreground Z-Plane Exit (Starts first: local 38 to 56 / global 71 to 89)
  const fgExitProgress = interpolate(frame, [38, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });
  const fgExitMultiplier = interpolate(fgExitProgress, [0, 1], [1, 5.5]);
  const finalFgScale = enterFgScale * fgExitMultiplier;
  const fgOpacity = frame > 56 ? 0 : 1;

  // 2. Headline Text Exit (Starts mid: local 39 to 57 / global 72 to 90)
  const textExitProgress = interpolate(frame, [39, 57], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });
  const exitTextMultiplier = interpolate(textExitProgress, [0, 1], [1, 6.0]);
  const finalHeadlineScale = enterTextScale * exitTextMultiplier;
  const headlineOpacity = interpolate(frame, [42, 47], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. Background Z-Plane Exit (Starts trailing: local 40 to 57 / global 73 to 90)
  const bgExitProgress = interpolate(frame, [40, 57], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });
  const bgExitMultiplier = interpolate(bgExitProgress, [0, 1], [1, 4.2]);
  const finalBgScale = enterBgScale * bgExitMultiplier;
  const bgOpacity = frame > 57 ? 0 : 1;

  // ----------------------------------------------------
  // SEQUENTIAL WORD CUTS (Global 80 -> 105 -> 109 -> 117 -> 135)
  // ----------------------------------------------------
  // 'Now' fades in 80 to 98 (local 47 to 65), scales up 0.88 -> 1.0
  const nowOpacity = interpolate(frame, [47, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nowScale = interpolate(frame, [47, 65], [0.88, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Determine current word. Only the first fades and scales up; the other three are hard
  // cuts onto the brand field, which is what gives the line its rhythm.
  // Annotated because FIXED_COPY is `as const`: without it this infers the literal type
  // "Now" and the reassignments below fail to typecheck.
  let currentWord: string = word0;
  let wordOpacity = nowOpacity;
  let wordScale = nowScale;

  if (frame >= 72 && frame < 76) {
    // Global 105 to 108
    currentWord = word1;
    wordOpacity = 1;
    wordScale = 1;
  } else if (frame >= 76 && frame < 84) {
    // Global 109 to 116
    currentWord = word2;
    wordOpacity = 1;
    wordScale = 1;
  } else if (frame >= 84) {
    // Global 117 to 135
    currentWord = word3;
    wordOpacity = 1;
    wordScale = 1;
  }

  // ----------------------------------------------------
  // QUICK SCALE DOWN MATCH CUT AT GLOBAL 133 to 136 (Local 100 to 103)
  // ----------------------------------------------------
  const endMatchCutScale = interpolate(frame, [100, 103], [1, 0.05], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.brand,
        overflow: "hidden",
      }}
    >
      {/* Central Headline Text: Fades out 75 to 80 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          pointerEvents: "none",
          opacity: headlineOpacity,
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            fontSize: 78,
            fontWeight: 600,
            letterSpacing: "0.025em",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            textAlign: "center",
            margin: 0,
            padding: "0 40px",
            whiteSpace: "nowrap",
            transform: `scale(${finalHeadlineScale})`,
            transformOrigin: "center center",
          }}
        >
          {FIXED_COPY.headquartersHeadline}
        </h1>
      </div>

      {/* Z-PLANE 2: Background / Deeper Avatar Group */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${finalBgScale})`,
          opacity: bgOpacity,
          transformOrigin: "center center",
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        {BACKGROUND_AVATARS.map((avatar) => {
          const borderWidth = avatar.size > 100 ? 4 : 3.5;
          return (
            <div
              key={avatar.id}
              style={{
                position: "absolute",
                left: `${avatar.xPercent}%`,
                top: `${avatar.yPercent}%`,
                width: avatar.size,
                height: avatar.size,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `${borderWidth}px solid #ffffff`,
                overflow: "hidden",
                backgroundColor: "#fff",
              }}
            >
              <Img
                data-vc-slot={avatar.slot}
                src={image(avatar.slot, avatar.fallback)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Z-PLANE 1: Foreground / Closer Avatar Group */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${finalFgScale})`,
          opacity: fgOpacity,
          transformOrigin: "center center",
          zIndex: 6,
          pointerEvents: "none",
        }}
      >
        {FOREGROUND_AVATARS.map((avatar) => {
          const borderWidth = avatar.size > 140 ? 5 : 4;
          return (
            <div
              key={avatar.id}
              style={{
                position: "absolute",
                left: `${avatar.xPercent}%`,
                top: `${avatar.yPercent}%`,
                width: avatar.size,
                height: avatar.size,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                border: `${borderWidth}px solid #ffffff`,
                overflow: "hidden",
                backgroundColor: "#fff",
              }}
            >
              <Img
                data-vc-slot={avatar.slot}
                src={image(avatar.slot, avatar.fallback)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Sequential Words: 'Now' -> 'they' (105) -> 'have' (109) -> 'one.' (117) */}
      {frame >= 47 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 12,
            pointerEvents: "none",
            opacity: wordOpacity,
            transform: `scale(${wordScale * endMatchCutScale})`,
            transformOrigin: "center center",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: 300,
              fontWeight: 500,
              letterSpacing: "0.025em",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              textAlign: "center",
              textShadow:
                "0 0 25px rgba(255, 255, 255, 0.6), 0 0 50px rgba(255, 255, 255, 0.3)",
            }}
          >
            {currentWord}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
