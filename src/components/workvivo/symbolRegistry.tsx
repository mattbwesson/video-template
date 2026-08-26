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
 * An `<svg>` with the referenced symbol's content inlined — the export-safe replacement
 * for `<svg><use href="#id"/></svg>`. Accepts the same props the raw element did, so a
 * call site converts by renaming the tag and nothing else.
 *
 * Unknown ids fall back to a real `<use>`: wrong in the export but visible in the Player,
 * which is the failure mode that gets noticed and fixed rather than shipped.
 */
export const SymbolSvg: React.FC<
  { href: string } & React.SVGProps<SVGSVGElement>
> = ({ href, children, ...svgProps }) => {
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
  return (
    <svg
      viewBox={def.viewBox}
      {...(fill ? { fill } : {})}
      {...rest}
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: def.inner }}
    />
  );
};
