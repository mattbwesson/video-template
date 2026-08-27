import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { CustomizationProvider } from "../src/customize/CustomizationProvider";
import { HeadquartersScene } from "../src/HeadquartersScene";
import { loadRenderer } from "./browserRender";

/**
 * A fidelity probe for the in-browser export — dev harness, nothing ships through it.
 *
 * One 1920x1080 frame carrying an exemplar of each construction under investigation, so
 * `renderStillOnWeb` can answer "does X survive the canvas renderer?" in seconds instead
 * of the minutes a full-composition still costs. Labels are plain text (always renders),
 * so the output reads as a checklist even when the thing beside a label is missing.
 *
 * Current investigation: the white rings around the HeadquartersScene avatar circles
 * (global frame 75) and the pills that come out as ovals (frames 509, 1718, 1788). Cells
 * are current-construction / candidate-fix pairs.
 *
 * TWO TRAPS, both cost an afternoon:
 *
 *  - Remotion's `<Img>` stalls `renderStillOnWeb` here FOREVER — past
 *    `delayRenderTimeoutInMilliseconds`, which never fires. Cell `ImgProbe` is the
 *    minimal repro. Probe with a plain `<img>`; the ring/pill questions are about the
 *    box, not about what is inside it.
 *  - A plain `<img>` paints as nothing on the first render of a page session. Preload
 *    each src into a live, attached DOM node (a bare `new Image()` can be collected),
 *    then render the composition two or three times and keep the LAST blob.
 *
 * The harness also degrades over a long session — a stalled render holds the queue and
 * every later one waits behind it. Reload the page between runs; if renders start
 * hanging that never hung before, reload rather than debugging the composition.
 */
const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div style={{ width: 430, color: "#fff", fontFamily: "sans-serif" }}>
    <div style={{ fontSize: 20, marginBottom: 8 }}>{label}</div>
    <div style={{ height: 170, position: "relative" }}>{children}</div>
  </div>
);

/** Bisect helper: `window.__cells = [1,2]` limits which cells mount. Default: all. */
const wants = (n: number): boolean => {
  const sel = (window as unknown as { __cells?: number[] }).__cells;
  return !sel || sel.includes(n);
};

/** The same photo every ring cell wraps, so only the ring construction varies. */
const FACE = staticFile("img/avatar-4.jpeg");

const SIZE = 155;
const RING = 4;

export const RenderProbe: React.FC = () => (
  <div
    style={{
      width: 1920,
      height: 1080,
      // The scene's brand field, not a dark backdrop — a white ring only reads as missing
      // against the colour it actually sits on.
      background: "#E5A428",
      display: "flex",
      flexWrap: "wrap",
      gap: 30,
      padding: 40,
      boxSizing: "border-box",
      alignContent: "flex-start",
    }}
  >
    {wants(1) && (
    <Cell label="1. border + overflow hidden (current scene)">
      <div
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          border: `${RING}px solid #ffffff`,
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <img src={FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </Cell>
    )}
    {wants(2) && (
    <Cell label="2. border longhands, no shorthand">
      <div
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          borderWidth: RING,
          borderStyle: "solid",
          borderColor: "#ffffff",
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <img src={FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </Cell>
    )}
    {wants(3) && (
    <Cell label="3. border, NO overflow hidden">
      <div
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          border: `${RING}px solid #ffffff`,
          backgroundColor: "#fff",
        }}
      >
        <img
          alt=""
          src={FACE}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
        />
      </div>
    </Cell>
    )}
    {wants(4) && (
    <Cell label="4. border alone, no child at all">
      <div
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          border: `${RING}px solid #ffffff`,
          overflow: "hidden",
        }}
      />
    </Cell>
    )}
    {wants(5) && (
    <Cell label="5. nested: white disc + inset clipped photo">
      <div
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: "50%",
          backgroundColor: "#fff",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: RING,
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          <img src={FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
    </Cell>
    )}
    {wants(6) && (
    <Cell label="6. ring as a sibling overlay div">
      <div style={{ width: SIZE, height: SIZE, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden" }}>
          <img src={FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `${RING}px solid #ffffff`,
            boxSizing: "border-box",
          }}
        />
      </div>
    </Cell>
    )}
    {wants(7) && (
    <Cell label="7. current, inside translate(-50%,-50%) + scale(1.04)">
      <div style={{ position: "absolute", inset: 0, transform: "scale(1.04)" }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: SIZE,
            height: SIZE,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: `${RING}px solid #ffffff`,
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          <img src={FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
    </Cell>
    )}
    {/* Pills: the reaction chips, View more, Featured podcast, and the onboarding
        progress bar all come out as ovals. Same question, different shape — how the
        renderer clamps an over-large radius. */}
    {wants(30) && (
    <Cell label="30. pill: borderRadius 999">
      <div style={{ width: 220, height: 40, borderRadius: 999, background: "#4B2AAD" }} />
    </Cell>
    )}
    {wants(31) && (
    <Cell label="31. pill: borderRadius 50%">
      <div style={{ width: 220, height: 40, borderRadius: "50%", background: "#4B2AAD" }} />
    </Cell>
    )}
    {wants(32) && (
    <Cell label="32. pill: borderRadius = half the height (20)">
      <div style={{ width: 220, height: 40, borderRadius: 20, background: "#4B2AAD" }} />
    </Cell>
    )}
    {wants(33) && (
    <Cell label="33. progress bar: 8px tall, radius 999">
      <div style={{ width: 300, height: 8, borderRadius: 999, background: "#4B2AAD" }} />
    </Cell>
    )}
    {wants(34) && (
    <Cell label="34. progress bar: 8px tall, radius 4">
      <div style={{ width: 300, height: 8, borderRadius: 4, background: "#4B2AAD" }} />
    </Cell>
    )}
    {wants(20) && (
    <Cell label="20. plain div, no Img (baseline at 1920x1080)">
      <div style={{ width: SIZE, height: SIZE, background: "#fff" }} />
    </Cell>
    )}
    {wants(21) && (
    <Cell label="21. bare Img, no ring">
      <img src={FACE} alt="" style={{ width: SIZE, height: SIZE, objectFit: "cover" }} />
    </Cell>
    )}
    {wants(8) && (
    <Cell label="8. nested disc, inside translate + scale">
      <div style={{ position: "absolute", inset: 0, transform: "scale(1.04)" }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: SIZE,
            height: SIZE,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: RING,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <img src={FACE} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </div>
    </Cell>
    )}
  </div>
);

/**
 * Render the probe through the REAL export pipeline and show the PNG fullscreen.
 * Console usage: `const m = await import('/renderProbe.tsx'); await m.probeStill()`
 */
export const probeStill = async (): Promise<void> => {
  const { renderStillOnWeb } = await loadRenderer();
  const still = await renderStillOnWeb({
    composition: {
      id: "RenderProbe",
      component: RenderProbe,
      durationInFrames: 1,
      fps: 25,
      width: 1920,
      height: 1080,
    },
    frame: 0,
    inputProps: {},
  });
  const blob = await still.blob({ format: "png" });
  const url = URL.createObjectURL(blob);
  let img = document.getElementById("__probe") as HTMLImageElement | null;
  if (!img) {
    img = document.createElement("img");
    img.id = "__probe";
    img.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;z-index:99999";
    document.body.appendChild(img);
  }
  img.src = url;
};

/** Smoke test: does `renderStillOnWeb` complete at all in this environment? */
export const TinyProbe: React.FC = () => (
  <div style={{ width: 200, height: 100, background: "red" }} />
);

/**
 * The real HeadquartersScene, on its own, at global 75 (local 42).
 *
 * The full composition's still takes minutes — it decodes the 212-second reference video
 * underneath every scene. Mounting just this scene under the customisation context and a
 * `<Sequence from={-42}>` puts it on its own local frame 42 in about a second, which is
 * what makes "is the ring there?" a question worth asking repeatedly.
 */
export const HqProbe: React.FC = () => (
  <CustomizationProvider input={{}}>
    <AbsoluteFill style={{ background: "#E5A428" }}>
      <Sequence from={-42}>
        <HeadquartersScene />
      </Sequence>
    </AbsoluteFill>
  </CustomizationProvider>
);

/** Is Remotion's `<Img>` itself what stalls a still in this harness? */
export const ImgProbe: React.FC = () => (
  <AbsoluteFill style={{ background: "#E5A428" }}>
    <Img src={FACE} style={{ width: 300, height: 300, objectFit: "cover" }} />
  </AbsoluteFill>
);

/**
 * The HeadquartersScene avatar field at global frame 75, rebuilt with plain `<img>`.
 *
 * Remotion's `<Img>` stalls `renderStillOnWeb` here (see ImgProbe), so the scene cannot be
 * mounted directly — but the ring is a property of the wrapper, not of what is inside it,
 * and every number below is the scene's own: both Z-plane scales at local frame 42, the
 * ten sizes, and the `size > 140 ? 5 : 4` / `size > 100 ? 4 : 3.5` border widths.
 */
const HQ_FG = [
  { s: 185, x: 32.5, y: 17.5, f: "vatar-2" },
  { s: 170, x: 71.0, y: 12.0, f: "avatar-4" },
  { s: 155, x: 23.5, y: 69.0, f: "avatar-6" },
  { s: 150, x: 42.5, y: 76.0, f: "avatar-1" },
  { s: 130, x: 68.0, y: 69.5, f: "avatar-4" },
];
const HQ_BG = [
  { s: 86, x: 14.5, y: 31.5, f: "avatar-1" },
  { s: 120, x: 48.5, y: 29.0, f: "avatar-3" },
  { s: 86, x: 79.0, y: 23.0, f: "avatar-5" },
  { s: 92, x: 55.0, y: 70.0, f: "avatar-3" },
  { s: 96, x: 83.5, y: 81.0, f: "avatar-5" },
];

export const HqRingProbe: React.FC = () => (
  <AbsoluteFill style={{ background: "#E5A428" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: "scale(1.026)",
        opacity: 1,
        transformOrigin: "center center",
        zIndex: 4,
        pointerEvents: "none",
      }}
    >
      {HQ_BG.map((a, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${a.x}%`,
            top: `${a.y}%`,
            width: a.s,
            height: a.s,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: a.s > 100 ? 4 : 3.5,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <img
              alt=""
              src={staticFile(`img/${a.f}.jpeg`)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: "scale(1.09)",
        opacity: 1,
        transformOrigin: "center center",
        zIndex: 6,
        pointerEvents: "none",
      }}
    >
      {HQ_FG.map((a, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${a.x}%`,
            top: `${a.y}%`,
            width: a.s,
            height: a.s,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: a.s > 140 ? 5 : 4,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <img
              alt=""
              src={staticFile(`img/${a.f}.jpeg`)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
