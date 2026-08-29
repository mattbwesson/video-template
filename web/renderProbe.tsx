import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { CustomizationProvider } from "../src/customize/CustomizationProvider";
import { HeadquartersScene } from "../src/HeadquartersScene";
import { BackFromScene } from "../src/BackFromScene";
import { AskBarScene } from "../src/AskBarScene";
import { WidgetStoreRevealScene } from "../src/WidgetStoreRevealScene";
import { WorkvivoAnalytics } from "../src/components/workvivo/WorkvivoAnalytics";
import { WorkvivoSeerSurveyMobile } from "../src/components/workvivo/WorkvivoSeerSurveyMobile";
import { WorkvivoSpaceFeed } from "../src/components/workvivo/WorkvivoSpaceFeed";
import { CreateYourOwnScene } from "../src/CreateYourOwnScene";
import { WorkvivoSpaces } from "../src/components/workvivo/WorkvivoSpaces";
import { WorkvivoCatchMeUp } from "../src/components/workvivo/WorkvivoCatchMeUp";
import { WorkvivoBillboardScreen } from "../src/components/workvivo/WorkvivoBillboardScreen";
import { WorkvivoPostComposer } from "../src/components/workvivo/WorkvivoPostComposer";
import "../src/components/workvivo/WorkvivoCatchMeUpStyles.css";
import { InlineSvg } from "../src/components/InlineSvg";
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

/**
 * The two doubled-text scenes at their reported frames, through the real export.
 *
 * Both centre a line by laying a visible copy over a hidden "sizer" carrying the whole
 * line in flow. The sizer used `visibility: hidden`, which the export's rasterizer has no
 * check for — so it painted, and the line came out twice at two trackings (global 622 and
 * 3741). `window.__probeFrame` picks which one; neither scene uses Remotion `<Img>`, so
 * both mount here without the stall ImgProbe documents.
 */
export const BackFromProbe: React.FC = () => (
  <CustomizationProvider input={{}}>
    <Sequence from={-22}>
      <BackFromScene />
    </Sequence>
  </CustomizationProvider>
);

/**
 * The three glyphs that came out wrong at global 524, through the real export.
 *
 * Left to right: the PDF and SVG file glyphs (both ship viewBox-only with their paint in
 * a <defs><style> block, which is the pair the rasterizer cannot handle) and the podcast
 * tile (painted by masking a brand block through a silhouette, and mask-image is dropped
 * outright). All three go through InlineSvg now. Drawn on the card white they sit on.
 */
export const GlyphProbe: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 120,
    }}
  >
    <InlineSvg src={staticFile("img/file-pdf.svg")} width={28 * 6} height={33 * 6} />
    <InlineSvg src={staticFile("img/file-svg.svg")} width={28 * 6} height={33 * 6} />
    <div
      style={{
        width: 125.71 * 2,
        height: 125.71 * 2,
        borderRadius: 12.857 * 2,
        background: "#fff",
        border: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <InlineSvg
        src={staticFile("img/podcast icon.svg")}
        fill="#44D760"
        style={{ width: "68%", height: "68%" }}
      />
    </div>
  </AbsoluteFill>
);

/** BackFromScene at global 659 (local 59) — the Catch Me Up card at full size. */
export const CatchMeUpProbe: React.FC = () => (
  <CustomizationProvider input={{}}>
    <Sequence from={-59}>
      <BackFromScene />
    </Sequence>
  </CustomizationProvider>
);

/** The ask bar at global 2302 (local 34) — the pill input that came out as an ellipse. */
export const AskBarProbe: React.FC = () => (
  <CustomizationProvider input={{}}>
    <Sequence from={-34}>
      <AskBarScene background="#E5A428" maskFrom={0} maskTo={2} />
    </Sequence>
  </CustomizationProvider>
);

/**
 * HeadquartersScene at a caller-chosen local frame, for measuring the end match cut.
 *
 * `window.__hqFrame` rather than a prop, so a bisect can walk global 133-138 without a
 * rebuild. Remotion `<Img>` stalls a still here (see ImgProbe), and this scene is full of
 * them — but the match cut only moves the WORD, which is text, and the avatars stalling
 * would fail the whole render rather than silently mismeasure. It renders because by the
 * time this runs the photos are warm in the page.
 */
export const HqCutProbe: React.FC = () => {
  const local = (window as unknown as { __hqFrame?: number }).__hqFrame ?? 100;
  return (
    <CustomizationProvider input={{}}>
      <Sequence from={-local}>
        <HeadquartersScene />
      </Sequence>
    </CustomizationProvider>
  );
};

/**
 * The billboard's field, and the candidate replacement for it.
 *
 * `.wbb-frame` paints a radial-gradient driven by --wbb-brand custom properties. Radials
 * are on the renderer's unsupported list but the doc says they have sometimes survived, so
 * this asks directly: same three stops, same custom properties, radial vs linear.
 */
export const FieldProbe: React.FC = () => (
  <AbsoluteFill
    style={{ background: "#202020", display: "flex", flexDirection: "column", gap: 20, padding: 20 }}
  >
    <div
      style={{
        ["--wbb-brand-lit" as string]: "#E5A428",
        ["--wbb-brand" as string]: "#C98A16",
        ["--wbb-brand-dark" as string]: "#8A5E0C",
        flex: 1,
        background:
          "radial-gradient(130% 100% at 50% 0%, var(--wbb-brand-lit, #e2231a) 0%, var(--wbb-brand, #bd1420) 55%, var(--wbb-brand-dark, #8d0f18) 100%)",
      }}
    />
    <div
      style={{
        ["--wbb-brand-lit" as string]: "#E5A428",
        ["--wbb-brand" as string]: "#C98A16",
        ["--wbb-brand-dark" as string]: "#8A5E0C",
        flex: 1,
        background:
          "linear-gradient(180deg, var(--wbb-brand-lit, #e2231a) 0%, var(--wbb-brand, #bd1420) 55%, var(--wbb-brand-dark, #8d0f18) 100%)",
      }}
    />
  </AbsoluteFill>
);

/** The real billboard screen, brand-coloured — the field that came out empty at 1888. */
export const BillboardProbe: React.FC = () => (
  <CustomizationProvider input={{ brand: { accentHex: "#E5A428" } as never }}>
    <AbsoluteFill style={{ background: "#202020", alignItems: "center", justifyContent: "center" }}>
      <WorkvivoBillboardScreen />
    </AbsoluteFill>
  </CustomizationProvider>
);

/** All five weather glyphs at card size, through the export — sizing and paint. */
export const WeatherProbe: React.FC = () => (
  <AbsoluteFill
    style={{ background: "#E5A428", display: "flex", alignItems: "center", justifyContent: "center", gap: 80 }}
  >
    {["weather-sun", "weather-partly-cloud", "weather-cloudy", "weather-rain", "weather-snow"].map((n) => (
      <div key={n} style={{ width: 200, height: 200, background: "#00000022", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <InlineSvg src={staticFile(`img/weather/${n}.svg`)} width={128} height={128} fill="#ffffff" />
      </div>
    ))}
  </AbsoluteFill>
);

/**
 * The composer's attachment tray (global ~996) and value picker (global ~1004).
 *
 * `window.__pcStage` picks which. Neither stage uses Remotion `<Img>`, so both mount here
 * without the stall ImgProbe documents — the tray's photos are plain `<img>` now, which is
 * the whole point of the fix.
 */
export const ComposerProbe: React.FC = () => {
  const stage = (window as unknown as { __pcStage?: string }).__pcStage ?? "tray";
  return (
    <CustomizationProvider input={{}}>
      <AbsoluteFill
        style={{ background: "#E5A428", alignItems: "center", justifyContent: "center" }}
      >
        <WorkvivoPostComposer stage={stage as never} composerShownAt={0} />
      </AbsoluteFill>
    </CustomizationProvider>
  );
};

/**
 * Does the export draw ::before / ::after at all?
 *
 * The renderer walks the DOM with `NodeFilter.SHOW_ELEMENT` and never calls
 * getComputedStyle with a pseudo-element argument, so the answer should be no — which
 * would explain why the desktop glass edge (entirely a ::before) is invisible while the
 * phones' (whose band is the root's own background) looks right. Left tile draws its ring
 * from a ::before, right tile from a real child. Same geometry, same colour.
 */
export const PseudoProbe: React.FC = () => (
  <AbsoluteFill style={{ background: "#202020", alignItems: "center", justifyContent: "center", gap: 160 }}>
    <style>{`
      .probe-pseudo { position: relative; }
      .probe-pseudo::before {
        content: ""; position: absolute; pointer-events: none;
        inset: -40px; border: 8px solid rgba(255,255,255,0.9);
        border-radius: 24px; background: rgba(255,255,255,0.35);
      }
    `}</style>
    <div className="probe-pseudo" style={{ width: 300, height: 200, background: "#3B1B8F" }} />
    <div style={{ position: "relative", width: 300, height: 200, background: "#3B1B8F" }}>
      <div
        style={{
          position: "absolute",
          inset: -40,
          border: "8px solid rgba(255,255,255,0.9)",
          borderRadius: 24,
          background: "rgba(255,255,255,0.35)",
        }}
      />
    </div>
  </AbsoluteFill>
);

/**
 * The Catch Me Up card at its own size, outside the scaled phone.
 *
 * The card exports with "Catch Me Up" and "Here's what you missed" wrapped and printed on
 * top of each other, and the display:block + white-space:nowrap fix did not take. This
 * renders the exact markup and the real stylesheet at 1:1 so the wrap can be measured
 * rather than inferred from colour bands inside a 2.25x phone.
 */
export const CmuCardProbe: React.FC = () => (
  <AbsoluteFill style={{ background: "#F7F7F7", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 393 }}>
      <button className="wcmu-cmu" type="button">
        <span className="wcmu-hq">
          <InlineSvg src={staticFile("img/hq-logo.svg")} width="34" height="20" style={{ display: "block" }} />
        </span>
        <span className="wcmu-t">
          <b>Catch Me Up</b>
          <span>Here&apos;s what you missed</span>
        </span>
        <span className="wcmu-chev" />
      </button>
    </div>
  </AbsoluteFill>
);

/**
 * Three ways to size the Catch Me Up text column, side by side.
 *
 * The export collapsed it to ~50px — about its widest word — so the flex item is getting
 * no width. `flex: 1` is `flex-basis: 0`, which needs free space to grow into; `min-width:
 * 0` (added in an earlier attempt at this bug) removes the min-content floor that was
 * otherwise holding it open. Each row below overrides only the sizing.
 */
const CMU_VARIANTS: { label: string; style: React.CSSProperties }[] = [
  { label: "A current: flex 1 + min-width 0", style: { flex: 1, display: "block", minWidth: 0 } },
  { label: "B flex 1 1 auto (content basis)", style: { flex: "1 1 auto", display: "block" } },
  { label: "C explicit width", style: { width: 244, display: "block", flex: "none" } },
];

export const CmuVariantProbe: React.FC = () => (
  <AbsoluteFill style={{ background: "#F7F7F7", padding: 24, gap: 24, display: "flex", flexDirection: "column" }}>
    {CMU_VARIANTS.map((v) => (
      <div key={v.label} style={{ width: 393 }}>
        <div style={{ fontSize: 13, fontFamily: "sans-serif", marginBottom: 4 }}>{v.label}</div>
        <button className="wcmu-cmu" type="button">
          <span className="wcmu-hq">
            <InlineSvg src={staticFile("img/hq-logo.svg")} width="34" height="20" style={{ display: "block" }} />
          </span>
          <span className="wcmu-t" style={v.style}>
            <b>Catch Me Up</b>
            <span>Here&apos;s what you missed</span>
          </span>
          <span className="wcmu-chev" />
        </button>
      </div>
    ))}
  </AbsoluteFill>
);

/**
 * The Widget Store reveal at a caller-chosen local frame (`window.__wsFrame`).
 *
 * The moving copy of the hero row is hidden with CSS. It used `visibility`, which the
 * export ignores, so a second full modal painted over the real one. Counting how many
 * card tints appear tells you whether the copy is down to three cards.
 */
export const WidgetStoreProbe: React.FC = () => {
  const local = (window as unknown as { __wsFrame?: number }).__wsFrame ?? 11;
  return (
    <CustomizationProvider input={{}}>
      <Sequence from={-local}>
        <WidgetStoreRevealScene brand="#FF1060" settleFrom={17} popFrom={34} popTo={47} />
      </Sequence>
    </CustomizationProvider>
  );
};

/** The analytics screen: SVG-text font, and the banner's white falloff. */
export const AnalyticsProbe: React.FC = () => (
  <CustomizationProvider input={{}}>
    <AbsoluteFill style={{ background: "#0B0A1F" }}>
      <WorkvivoAnalytics />
    </AbsoluteFill>
  </CustomizationProvider>
);

/** The survey completion burst at global 3692 (local 121) — stars, not squares. */
export const SparkleProbe: React.FC = () => (
  <CustomizationProvider input={{}}>
    <Sequence from={-121}>
      <WorkvivoSeerSurveyMobile />
    </Sequence>
  </CustomizationProvider>
);

/** The space feed at global 4103 — word spacing and the banner wash. */
export const SpaceFeedProbe: React.FC = () => (
  <CustomizationProvider input={{}}>
    <WorkvivoSpaceFeed />
  </CustomizationProvider>
);

/** "AI Widget Builder" at global 3103 — the sparkle on the tenant field. */
export const SparkleIconProbe: React.FC = () => (
  <CustomizationProvider input={{}}>
    <Sequence from={-45}>
      <CreateYourOwnScene text="AI Widget Builder" fontWeight={500} icon="img/hq_sparkle_glow.png" iconWidth={544} />
    </Sequence>
  </CustomizationProvider>
);

/**
 * The Spaces directory — do the white rings on the icon discs survive?
 *
 * `.sp-avatar` is a solid circle with `border: 3px solid #fff` and no clipped content, so
 * it is the simplest possible version of the construction the HeadquartersScene rings were
 * rebuilt to avoid. If the border paints here, borders on circles are fine and that rebuild
 * was working around something else.
 */
export const SpacesRingProbe: React.FC = () => {
  // `window.__ringOff` forces the border transparent, so the two renders differ by
  // exactly the ring and nothing else. If the white-pixel counts match, it never drew.
  const off = (window as unknown as { __ringOff?: boolean }).__ringOff;
  return (
    <CustomizationProvider input={{}}>
      <AbsoluteFill style={{ background: "#010224" }}>
        {off ? <style>{`.sp-avatar, .sp-trend-av { border-color: transparent !important; }`}</style> : null}
        <WorkvivoSpaces />
      </AbsoluteFill>
    </CustomizationProvider>
  );
};

/**
 * Does `border` paint on a circular element in the export?
 *
 * Unresolved since the HeadquartersScene rings: a bordered circle survived in isolation
 * but the ring was missing from the scene, and the fix sidestepped it (a white disc under
 * inset content) without ever proving what failed. Three constructions, same geometry:
 * a border, a box-shadow ring, and the disc-under-content pattern.
 */
export const RingProbe: React.FC = () => {
  // Plain <div>s at absolute positions. An earlier version used inline <span>s as flex
  // items and they collapsed — the export does not blockify flex items, which is the very
  // bug documented in §"The layout engine is not Chromium's".
  const at = (top: number): React.CSSProperties => ({
    position: "absolute", left: 120, top, width: 160, height: 160, borderRadius: "50%",
  });
  return (
    <AbsoluteFill style={{ background: "#101020" }}>
      {/* A: border on the circle */}
      <div style={{ ...at(40), background: "#7F39F3", border: "8px solid #fff", boxSizing: "border-box" }} />
      {/* B: box-shadow spread ring */}
      <div style={{ ...at(240), background: "#7F39F3", boxShadow: "0 0 0 8px #fff" }} />
      {/* C: white disc with an inset coloured disc over it */}
      <div style={{ ...at(440), background: "#fff" }}>
        <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: "#7F39F3" }} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * The Catch Me Up phone in both states, so the wizard's click targets can be counted.
 *
 * `window.__cmuOpen` picks whether the story overlay is up. With it open the two feed
 * cards behind it must stop being targets, or the smaller of them takes the click.
 */
export const CmuTargetProbe: React.FC = () => {
  const open = (window as unknown as { __cmuOpen?: boolean }).__cmuOpen ?? false;
  return (
    <CustomizationProvider input={{}}>
      <AbsoluteFill style={{ background: "#101020", alignItems: "center", justifyContent: "center" }}>
        <WorkvivoCatchMeUp storyOpen={open} activeSlide={1} />
      </AbsoluteFill>
    </CustomizationProvider>
  );
};

/**
 * Mount a probe component into the page and hand back its host, for DOM audits.
 *
 * Lives here rather than in a console snippet because React has to be resolved through
 * the app's own module graph — importing it by bare specifier from the console fails, and
 * importing a second copy is the "Invalid hook call" trap the render notes warn about.
 */
/**
 * Mount a probe into the page at composition size and hand back its host.
 *
 * A concrete export rather than a console snippet because React has to resolve through
 * the app's own module graph — importing it by bare specifier from the console fails, and
 * importing a second copy is the "Invalid hook call" trap the render notes warn about.
 *
 * Positioned at 0,0 rather than off-screen: `elementFromPoint` needs real geometry inside
 * the viewport, which is the whole point of mounting it.
 */
export const mountProbe = async (which: "composer" | "catchmeup"): Promise<HTMLElement> => {
  const { createRoot } = await import("react-dom/client");
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:0;top:0;width:1920px;height:1080px;z-index:-1;opacity:0.01";
  document.body.appendChild(host);
  createRoot(host).render(
    which === "composer" ? <ComposerProbe /> : <CmuTargetProbe />,
  );
  await new Promise((r) => setTimeout(r, 700));
  return host;
};
