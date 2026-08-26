import React from "react";
import { Img, staticFile } from "remotion";
import { loadRenderer } from "./browserRender";
import { CHAT_ICON_SRC } from "../src/contentListAssets";
import { InlineSvg } from "../src/components/InlineSvg";
import { CursorArrow } from "../src/components/CursorArrow";

/**
 * A fidelity probe for the in-browser export — dev harness, nothing ships through it.
 *
 * One 1920x1080 frame carrying an exemplar of each construction under investigation, so
 * `renderStillOnWeb` can answer "does X survive the canvas renderer?" in seconds instead
 * of the minutes a full-composition still costs. Labels are plain text (always renders),
 * so the output reads as a checklist even when the thing beside a label is missing.
 *
 * Current investigation: SVG files loaded through <img> come out corner-cropped (the
 * cursor, the Add-modal post-type icons), and the glass 3D icons show their source tile
 * because mask-image and mix-blend-mode are dropped. Cells are current-construction /
 * candidate-fix pairs.
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

const CURSOR_FILTER =
  "brightness(0) invert(1) drop-shadow(0 10px 20px rgba(0,0,0,0.5))";

/** The cursor's single path, inlined — candidate replacement for <Img src=cursor.svg>. */
const CURSOR_PATH =
  "M90.03.04c16.97-.65,32.79,6.47,48.24,15.24,197.2,111.95,394.45,223.83,591.68,335.73,54.31,30.81,108.87,61.21,162.85,92.59,39.07,22.71,54.48,64.61,39.8,105.86-10.96,30.81-32.71,50.36-64.93,56.56-109.14,20.99-218.32,41.77-327.6,62-30.62,5.67-53.03,21.08-69.12,47.68-56.69,93.76-113.69,187.33-171,280.71-32.85,53.53-103.89,60.37-143.72,14.52-11.52-13.26-17.79-28.88-20.46-45.92-26.74-170.98-53.28-341.99-80-512.97C37.77,336.79,19.8,221.54,1.33,106.37-7.9,48.79,31.8-.09,90.03.04Z";

/** Bisect helper: `window.__cells = [1,2]` limits which cells mount. Default: all. */
const wants = (n: number): boolean => {
  const sel = (window as unknown as { __cells?: number[] }).__cells;
  return !sel || sel.includes(n);
};

export const RenderProbe: React.FC = () => (
  <div
    style={{
      width: 1920,
      height: 1080,
      background: "#131038",
      display: "flex",
      flexWrap: "wrap",
      gap: 30,
      padding: 40,
      boxSizing: "border-box",
      alignContent: "flex-start",
    }}
  >
    {wants(1) && (
    <Cell label="1. Img svg, viewBox only (current tiles)">
      <Img
        src={staticFile("img/post types/post-image.svg")}
        style={{ width: 80, height: 80, objectFit: "contain", background: "#fff" }}
      />
    </Cell>
    )}
    {wants(2) && (
    <Cell label="2. Img svg + width/height attrs">
      <Img
        src={staticFile("img/probe-post-image-sized.svg")}
        style={{ width: 80, height: 80, objectFit: "contain", background: "#fff" }}
      />
    </Cell>
    )}
    {wants(3) && (
    <Cell label="3. cursor: Img svg + filters (current)">
      <Img
        src={staticFile("img/cursor.svg")}
        style={{ width: 85.5, height: 85.5, filter: CURSOR_FILTER }}
      />
    </Cell>
    )}
    {wants(4) && (
    <Cell label="4. cursor: sized svg + filters">
      <Img
        src={staticFile("img/probe-cursor-sized.svg")}
        style={{ width: 85.5, height: 85.5, filter: CURSOR_FILTER }}
      />
    </Cell>
    )}
    {wants(5) && (
    <Cell label="5. cursor: inline svg, fill white">
      <svg width={85.5} height={85.5} viewBox="0 0 938.07 1041.37">
        <path d={CURSOR_PATH} fill="#ffffff" />
      </svg>
    </Cell>
    )}
    {wants(6) && (
    <Cell label="6. glass icon: img + masked wash + plus-lighter (current)">
      <div style={{ position: "relative", width: 150, height: 150, mixBlendMode: "plus-lighter" }}>
        <img
          src={CHAT_ICON_SRC}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", mixBlendMode: "plus-lighter" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(139,92,246,0.75) 50%, rgba(109,40,217,0.85) 100%)",
            mixBlendMode: "plus-lighter",
            opacity: 0.5,
            WebkitMaskImage: `url(${CHAT_ICON_SRC})`,
            WebkitMaskSize: "100% 100%",
            maskImage: `url(${CHAT_ICON_SRC})`,
            maskSize: "100% 100%",
          }}
        />
      </div>
    </Cell>
    )}
    {wants(7) && (
    <Cell label="7. mask-image alone: solid div masked by icon">
      <div
        style={{
          width: 150,
          height: 150,
          background: "#a855f7",
          WebkitMaskImage: `url(${CHAT_ICON_SRC})`,
          WebkitMaskSize: "100% 100%",
          maskImage: `url(${CHAT_ICON_SRC})`,
          maskSize: "100% 100%",
        }}
      />
    </Cell>
    )}
    {wants(8) && (
    <Cell label="8. plus-lighter img alone on dark">
      <img
        src={CHAT_ICON_SRC}
        alt=""
        style={{ width: 150, height: 150, mixBlendMode: "plus-lighter" }}
      />
    </Cell>
    )}
    {wants(9) && (
    <Cell label="9. plain img, no blend (baseline)">
      <img src={CHAT_ICON_SRC} alt="" style={{ width: 150, height: 150 }} />
    </Cell>
    )}
    {wants(10) && (
    <Cell label="10. InlineSvg: post-image tile">
      <InlineSvg
        src={staticFile("img/post types/post-image.svg")}
        style={{ width: 80, height: 80, background: "#fff", color: "#16A34A" }}
      />
    </Cell>
    )}
    {wants(12) && (
    <Cell label="12. radial 120% 130% at 50% 15% (mobile wash)">
      <div style={{ width: 260, height: 150, background: "radial-gradient(120% 130% at 50% 15%, #44D760 0%, #2ECC71 45%, #1E824C 100%)" }} />
    </Cell>
    )}
    {wants(13) && (
    <Cell label="13. radial ellipse-keyword same">
      <div style={{ width: 260, height: 150, background: "radial-gradient(ellipse 120% 130% at 50% 15%, #44D760 0%, #2ECC71 45%, #1E824C 100%)" }} />
    </Cell>
    )}
    {wants(14) && (
    <Cell label="14. radial circle at (simple)">
      <div style={{ width: 260, height: 150, background: "radial-gradient(circle at 50% 15%, #44D760 0%, #1E824C 100%)" }} />
    </Cell>
    )}
    {wants(15) && (
    <Cell label="15. linear 120deg (desktop wash)">
      <div style={{ width: 260, height: 150, background: "linear-gradient(120deg, #44D760 0%, #2ECC71 45%, #1E824C 100%)" }} />
    </Cell>
    )}
    {wants(11) && (
    <Cell label="11. CursorArrow white / black">
      <CursorArrow color="white" style={{ width: 85.5, height: 85.5 }} />
      <span style={{ display: "inline-block", background: "#ddd" }}>
        <CursorArrow color="black" style={{ width: 85.5, height: 85.5 }} />
      </span>
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
