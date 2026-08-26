import React from "react";

/**
 * The demo pointer, as an inline SVG — the export-safe form of `<Img src="img/cursor.svg">`.
 *
 * The film's pointer was an SVG file loaded through an image element and recoloured with
 * CSS filters (`brightness(0)` for black, `brightness(0) invert(1)` for white). The
 * in-browser export renderer cannot rasterize an SVG arriving via <img> — the shape comes
 * out corner-cropped, and in still mode the load never settles at all — and it drops CSS
 * filters, so even the colour was wrong. An inline <svg><path> renders correctly there
 * (web/renderProbe.tsx, cell 5), and colour becomes a fill instead of a filter trick.
 *
 * The drop-shadow the filter chain also carried is gone deliberately: CSS filters do not
 * survive the export, and a shadow that appears in one renderer and not the other is the
 * kind of quiet divergence this repo keeps finding the hard way. If the shadow is missed,
 * it should come back as verified-everywhere geometry, not as a filter.
 *
 * The path is cursor.svg's single path verbatim; viewBox 938.07x1041.37, tip at the
 * top-left (the same ~(12, 3.75) of an 85.5px box every call site already positions by).
 */
const CURSOR_PATH =
  "M90.03.04c16.97-.65,32.79,6.47,48.24,15.24,197.2,111.95,394.45,223.83,591.68,335.73,54.31,30.81,108.87,61.21,162.85,92.59,39.07,22.71,54.48,64.61,39.8,105.86-10.96,30.81-32.71,50.36-64.93,56.56-109.14,20.99-218.32,41.77-327.6,62-30.62,5.67-53.03,21.08-69.12,47.68-56.69,93.76-113.69,187.33-171,280.71-32.85,53.53-103.89,60.37-143.72,14.52-11.52-13.26-17.79-28.88-20.46-45.92-26.74-170.98-53.28-341.99-80-512.97C37.77,336.79,19.8,221.54,1.33,106.37-7.9,48.79,31.8-.09,90.03.04Z";

export const CursorArrow: React.FC<{
  color?: "white" | "black";
  className?: string;
  style?: React.CSSProperties;
}> = ({ color = "white", className, style }) => (
  <svg
    viewBox="0 0 938.07 1041.37"
    className={className}
    style={{ display: "block", ...style }}
    aria-hidden
  >
    <path d={CURSOR_PATH} fill={color === "white" ? "#ffffff" : "#000000"} />
  </svg>
);
