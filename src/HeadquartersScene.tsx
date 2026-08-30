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

interface AvatarItem {
  id: string;
  /**
   * The portrait, fixed. These ten are NOT customisable and are not meant to be: the
   * opening is a wall of faces that says "people", before the film has said whose people.
   * Dealing the operator's uploads into it put a handful of the same company's staff on
   * the biggest circles and stock on the rest, which read as a mistake rather than a mix.
   */
  src: string;
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
    src: staticFile("img/avatars/avatar-1.png"),
    xPercent: 32.5,
    yPercent: 17.5,
    size: 185,
  },
  {
    id: "top-right-large",
    src: staticFile("img/avatars/avatar-2.png"),
    xPercent: 71.0,
    yPercent: 12.0,
    size: 170,
  },
  {
    id: "bottom-left-large",
    src: staticFile("img/avatars/avatar-3.png"),
    xPercent: 23.5,
    yPercent: 69.0,
    size: 155,
  },
  {
    id: "bottom-center-left",
    src: staticFile("img/avatars/avatar-4.png"),
    xPercent: 42.5,
    yPercent: 76.0,
    size: 150,
  },
  {
    id: "bottom-right-med",
    src: staticFile("img/avatars/avatar-5.png"),
    xPercent: 68.0,
    yPercent: 69.5,
    size: 130,
  },
];

// Group 2: Midground / Deeper Z-plane (smaller circles)
const BACKGROUND_AVATARS: AvatarItem[] = [
  {
    id: "top-far-left",
    src: staticFile("img/avatars/avatar-6.png"),
    xPercent: 14.5,
    yPercent: 31.5,
    size: 86,
  },
  {
    id: "top-center-med",
    src: staticFile("img/avatars/avatar-7.png"),
    xPercent: 48.5,
    yPercent: 29.0,
    size: 120,
  },
  {
    id: "top-far-right",
    src: staticFile("img/avatars/avatar-8.png"),
    xPercent: 79.0,
    yPercent: 23.0,
    size: 86,
  },
  {
    id: "bottom-center-small",
    src: staticFile("img/avatars/avatar-9.png"),
    xPercent: 55.0,
    yPercent: 70.0,
    size: 92,
  },
  {
    id: "bottom-far-right",
    src: staticFile("img/avatars/avatar-10.png"),
    xPercent: 83.5,
    yPercent: 81.0,
    size: 96,
  },
];

/**
 * One face: a white disc with the photo clipped into a smaller circle on top of it.
 *
 * The ring used to be a `border` on the same element that clipped the photo. That reads
 * correctly in the Player but comes out ringless in the in-browser export — see
 * docs/browser-render-best-practices.md §5. Painting the ring as the disc *underneath*
 * asks nothing of the canvas renderer beyond `background-color`, `border-radius` and
 * `overflow: hidden`, all of which it draws faithfully, and it cannot be overdrawn by the
 * photo because the photo's box is `ringWidth` smaller on every side.
 */
const AvatarCircle: React.FC<{
  avatar: AvatarItem;
  ringWidth: number;
}> = ({ avatar, ringWidth }) => (
  <div
    style={{
      position: "absolute",
      left: `${avatar.xPercent}%`,
      top: `${avatar.yPercent}%`,
      width: avatar.size,
      height: avatar.size,
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      backgroundColor: "#ffffff",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: ringWidth,
        borderRadius: "50%",
        overflow: "hidden",
      }}
    >
      <Img
        src={avatar.src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  </div>
);

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
  // Global frame 133 = Local frame 100 (start quick scale down match cut)
  // Global frame 138 = Local frame 105 (scene ends — `from={33} durationInFrames={106}`)

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
  // QUICK SCALE DOWN MATCH CUT AT GLOBAL 133 to 138 (Local 100 to 105)
  // ----------------------------------------------------
  // The whole run of the sequence's last six frames, and the scale moves EXPONENTIALLY
  // across them rather than linearly.
  //
  // What the eye reads as the speed of a scale is the frame-to-frame RATIO, not the
  // difference — so any polynomial ease down to 0.05 collapses at the end however wide
  // its range. The previous curve (cubic-in over 100-103) shrank the word 14x between
  // global 135 and 136 and then sat still for two frames, which is the jump. Simply
  // widening that same curve to 105 still leaves a 10x final frame.
  //
  // Raising the target to an eased power keeps the ratio near-constant instead: the
  // steps come out 0.89, 0.70, 0.55, 0.43, 0.34, so the worst single frame is under 3x
  // and every frame moves. `Easing.in(Easing.quad)` on the exponent is what keeps it
  // starting from rest — the word is static until 133, so a constant-ratio decay from
  // the first frame would read as motion switching on rather than beginning.
  const END_MATCH_CUT_MIN = 0.05;
  const endMatchCutProgress = interpolate(frame, [100, 105], [0, 1], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const endMatchCutScale = Math.pow(END_MATCH_CUT_MIN, endMatchCutProgress);

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
        {BACKGROUND_AVATARS.map((avatar) => (
          <AvatarCircle
            key={avatar.id}
            avatar={avatar}
            ringWidth={avatar.size > 100 ? 4 : 3.5}
          />
        ))}
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
        {FOREGROUND_AVATARS.map((avatar) => (
          <AvatarCircle
            key={avatar.id}
            avatar={avatar}
            ringWidth={avatar.size > 140 ? 5 : 4}
          />
        ))}
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
