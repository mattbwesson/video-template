import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Why every icon in this library is INLINED into its consuming `<svg>` at render time.
 *
 * The icon system was authored as SVG sprites: each defs file mounts a hidden `<svg>`
 * full of `<symbol>`s once, and every icon is `<svg><use href="#id"/></svg>`. That is the
 * right shape for a web page and the wrong shape for the in-browser export:
 * `@remotion/web-renderer` rasterizes each `<svg>` root on its own, and a `<use>` that
 * points into a *different* root resolves to nothing — the icon comes out blank
 * (docs/browser-render-best-practices.md §3.1). Measured, not theoretical: the first
 * still through the export pipeline lost every glyph on screen.
 *
 * The doc's fix is "inline the `<path>` data into every consuming `<svg>`". Done by hand
 * that is ~100 call sites and 110+ symbols; done here it is one mechanism. Each defs file
 * registers its symbols into this map at module scope, and `SymbolSvg` renders the
 * symbol's own markup *inside* the consuming `<svg>` — so the DOM the exporter sees never
 * contains a cross-root reference at all. The hidden defs blocks can keep mounting;
 * they're just inert once nothing points at them.
 *
 * The Player, Studio and CLI paint the inlined form identically to the sprite form —
 * it is the same geometry in the same place — so this is not a gated degrade, it is the
 * export-safe construction used everywhere.
 *
 * KNOWN LIMIT, accepted: symbols whose internals use `clip-path="url(#…)"` now duplicate
 * those clipPath ids once per icon instance. Browsers resolve `url(#id)` to the first
 * match in the document, and every copy is byte-identical, so the geometry cannot differ.
 * The export may drop those clips entirely (§5) — harmless here, because in this library
 * they are full-bounds crop rects from the Figma export, not shape-defining masks.
 */

type SymbolDef = {
  viewBox: string;
  /** Attributes on the `<symbol>` other than id/viewBox — usually `fill="none"`. */
  attrs: Record<string, string>;
  /** The symbol's children, as raw markup for dangerouslySetInnerHTML. */
  inner: string;
};

const registry = new Map<string, SymbolDef>();

/** Parse every `<symbol>` out of a markup string and register it. */
export const registerSymbolMarkup = (markup: string): void => {
  const symbolRe = /<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/g;
  for (const [, rawAttrs, inner] of markup.matchAll(symbolRe)) {
    const attrs: Record<string, string> = {};
    for (const [, name, value] of rawAttrs.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) {
      // The stored attrs are spread onto a JSX <svg>, which wants camelCase for
      // presentation attributes (stroke-width → strokeWidth). data-*/aria-* keep dashes.
      const propName = /^(data|aria)-/.test(name)
        ? name
        : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      attrs[propName] = value;
    }
    const { id, viewBox = "0 0 24 24", ...rest } = attrs;
    if (!id) continue;
    registry.set(id, { viewBox, attrs: rest, inner });
  }
};

/**
 * Register a JSX-authored defs component (`() => <svg><symbol…/></svg>`).
 *
 * `renderToStaticMarkup` flattens the JSX to the same markup string the string-based defs
 * files already carry, so both formats land in one registry without rewriting the eight
 * files that author their symbols as elements. The defs components are static — no hooks,
 * no context — which is what makes rendering them outside a tree legal.
 */
export const registerSymbolJsx = (element: React.ReactElement): void => {
  registerSymbolMarkup(renderToStaticMarkup(element));
};

/**
 * The declarations the export must not see on an <svg> root, lifted onto a wrapper.
 * See the note in SymbolSvg. ONE list, consumed only through PlacedSvg below, so every
 * inline-SVG component in the film lifts the same declarations.
 *
 * No margin keys: the renderer resets the margins on the root before it serialises it
 * (see SymbolSvg), so they are safe where they are, and lifting one onto a `display:block`
 * wrapper would turn an inline glyph into a block box and change the flow around it.
 */
const PLACEMENT_KEYS = new Set<string>([
  "position", "left", "top", "right", "bottom", "inset", "opacity", "transform",
  "transformOrigin", "zIndex",
]);

const splitPlacement = (
  style: React.CSSProperties | undefined,
): { wrapperStyle: React.CSSProperties | null; svgStyle: React.CSSProperties } => {
  if (!style) return { wrapperStyle: null, svgStyle: {} };
  const wrapper: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(style)) {
    if (PLACEMENT_KEYS.has(k)) wrapper[k] = v;
    else rest[k] = v;
  }
  return {
    wrapperStyle: Object.keys(wrapper).length ? (wrapper as React.CSSProperties) : null,
    svgStyle: rest as React.CSSProperties,
  };
};

/**
 * THE one way an inline `<svg>` takes a caller's style.
 *
 * The export draws an inline <svg> by serialising it — inline `style` attribute and all —
 * into a standalone SVG image and drawing that into the element's box. It resets
 * `transform` and the margins on the root first, and nothing else. So `position:absolute;
 * left:69px; top:107px` on the root is carried into an 86x86 image, where it offsets the
 * root clean out of its own viewport: the Add Page button's plus exported as nothing at
 * all. Measured directly — the same path with the same style attribute yields 0 ink
 * pixels, and 1820 without it. Inline `opacity` is worse in a quieter way: it is baked
 * into the image AND applied again by the renderer, so an icon at 0.35 draws at 0.12.
 *
 * So the style is split: the placement declarations (PLACEMENT_KEYS) go on a block wrapper
 * the renderer walks like any other box, and everything else — the size, a `filter`, a
 * `color` — reaches the svg through `children`, which receives it and puts it on the root.
 * `box` is the CSS size, stated on the wrapper AND handed to the svg: the export's layout
 * engine reads the box from CSS, not from the width/height attributes, and an absolutely
 * positioned glyph with no CSS size came out as nothing. With no placement in the style
 * the svg renders bare, exactly as it did before any of this.
 *
 * `display:block` goes on the svg only when the caller gave a style at all. A glyph with
 * none is inline, and inline is what its layout was measured with — the page editor's
 * toolbar chevrons sit on the text baseline as inline svgs and rose 4px as blocks.
 *
 * Every inline-svg component goes through here — SymbolSvg, Spark, CursorArrow, the
 * survey's glyphs — so a change to what the renderer tolerates lands in one place.
 */
export const PlacedSvg: React.FC<{
  style?: React.CSSProperties;
  box?: { width?: number | string; height?: number | string };
  className?: string;
  children: (svgStyle: React.CSSProperties) => React.ReactElement;
}> = ({ style, box, className, children }) => {
  const { wrapperStyle, svgStyle } = splitPlacement(style);
  const svg = children({ ...(style ? { display: "block" } : {}), ...box, ...svgStyle });
  return wrapperStyle || className ? (
    <span className={className} style={{ display: "block", ...box, ...wrapperStyle }} aria-hidden>
      {svg}
    </span>
  ) : (
    svg
  );
};

/**
 * An `<svg>` with the referenced symbol's content inlined — the export-safe replacement
 * for `<svg><use href="#id"/></svg>`. Accepts the same props the raw element did, so a
 * call site converts by renaming the tag and nothing else.
 *
 * Unknown ids fall back to a real `<use>`: wrong in the export but visible in the Player,
 * which is the failure mode that gets noticed and fixed rather than shipped.
 */
export const SymbolSvg: React.FC<
  { href: string } & React.SVGProps<SVGSVGElement> & {
      /**
       * Substitute this colour for `currentColor` in the symbol's markup.
       *
       * For recolouring a glyph WITHOUT a CSS `filter`. A hue-rotate filter is the usual
       * trick for this, and it is the wrong tool twice over in the export: the renderer
       * does not scope the canvas filter to the element that set it, so it bleeds onto
       * everything drawn after — a filtered icon turned the heading and body text beside
       * it purple too (global 1217).
       *
       * Substituted into the markup rather than set as a `color` on the root, because
       * `currentColor` reaching a path is inheritance, and inheritance is the thing the
       * rasterizer cannot be relied on to resolve. `fill="none"` is left alone so stroked
       * shapes keep their holes.
       */
      paint?: string;
      /**
       * What `paint` replaces. Defaults to `currentColor`; name a literal colour for a
       * glyph that bakes its own (the header star ships stroke="#FACC15").
       */
      paintFrom?: string;
    }
> = ({ href, children, paint, paintFrom = "currentColor", ...svgProps }) => {
  const def = registry.get(href.replace(/^#/, ""));
  if (!def) {
    return (
      <svg {...svgProps}>
        <use href={href} />
        {children}
      </svg>
    );
  }
  const { fill, ...rest } = def.attrs;
  const inner = paint ? def.inner.split(paintFrom).join(paint) : def.inner;
  /*
   * The size goes in CSS as well as on the attributes.
   *
   * Chromium lays an `<svg width={86} height={86}>` out at 86 square from the attributes
   * alone. The export's layout engine reads the box from CSS, and an absolutely-positioned
   * glyph with no CSS size came out as nothing at all — the Add Page button's plus was
   * simply missing from every exported MP4 while the same component's toolbar glyphs, which
   * sit in normal flow, rendered fine. Stating it twice costs nothing and removes the
   * dependency on which of the two a given renderer happens to read.
   *
   * `svgProps.style` still comes last, so a caller can override either value.
   */
  const boxed =
    typeof svgProps.width === "number" && typeof svgProps.height === "number"
      ? { width: svgProps.width, height: svgProps.height }
      : {};
  // Positioning and opacity never go on the <svg> itself — see PlacedSvg.
  return (
    <PlacedSvg style={svgProps.style} box={boxed}>
      {(svgStyle) => (
        <svg
          viewBox={def.viewBox}
          {...(fill ? { fill } : {})}
          {...rest}
          {...svgProps}
          style={svgStyle}
          dangerouslySetInnerHTML={{ __html: inner }}
        />
      )}
    </PlacedSvg>
  );
};
