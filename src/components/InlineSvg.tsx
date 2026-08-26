import React from "react";

/**
 * An SVG file rendered INLINE — the export-safe replacement for `<Img src="…svg">`.
 *
 * The in-browser export renderer cannot rasterize an SVG arriving through an image
 * element: the artwork comes out cropped to a corner, and in still mode the image load
 * never settles, hanging the render. Inline SVG markup renders correctly there
 * (web/renderProbe.tsx). So this fetches the file once, rewrites the root to fill its
 * styled box, and injects it — the DOM the exporter sees contains real <svg> children,
 * never an <img> pointing at one.
 *
 * `delayRender` holds the frame until the markup is in, exactly as Remotion's own <Img>
 * holds for a bitmap; the module-level cache means each file is fetched once per page,
 * and every mount after that is synchronous.
 *
 * The wrapper span takes the same style/className the <Img> did. The injected root gets
 * width/height 100% with its own viewBox, so the styled box scales the artwork the way
 * `objectFit: contain` scaled the image — SVG's default preserveAspectRatio is the same
 * meet-and-centre behaviour.
 */
const cache = new Map<string, Prepared>();

type Prepared = { viewBox: string; inner: string };

const prepare = (raw: string): Prepared => {
  let s = raw.replace(/<\?xml[^>]*\?>\s*/, "");

  // Illustrator/Figma exports carry their fills in a <style> block (`.cls-1 { fill: … }`)
  // and the export's rasterizer ignores <style> inside SVG — the shape draws with no
  // paint at all. Inline each class rule onto the elements that wear it, then drop the
  // block, so the markup carries only presentation attributes both renderers honour.
  const rules = new Map<string, string>();
  for (const styleBlock of s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    for (const rule of styleBlock[1].matchAll(/((?:\s*\.[\w-]+\s*,?)+)\{([^}]*)\}/g)) {
      const body = rule[2].replace(/\s+/g, " ").replace(/"/g, "'").trim();
      for (const sel of rule[1].split(",")) {
        const cls = sel.trim().replace(/^\./, "");
        if (cls) rules.set(cls, body);
      }
    }
  }
  if (rules.size) {
    s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");
    // Presentation attributes (`fill="…"`), not a style attribute: the icons the export
    // is already known to draw carry their paint as attributes, so this stays on the
    // verified path rather than betting on style-attribute support.
    s = s.replace(/class="([\w-]+)"/g, (m, cls: string) => {
      const body = rules.get(cls);
      if (!body) return m;
      return body
        .split(";")
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const [prop, ...rest] = d.split(":");
          return `${prop.trim()}="${rest.join(":").trim()}"`;
        })
        .join(" ");
    });
  }

  // Hand back viewBox + children rather than the whole <svg> as markup: the export
  // pipeline rasterizes an SVG whose root REACT created and whose children arrive via
  // dangerouslySetInnerHTML (the symbolRegistry pattern, verified), but not one whose
  // root itself came in through innerHTML.
  const viewBox = /viewBox="([^"]*)"/.exec(s)?.[1] ?? "0 0 24 24";
  const inner = /<svg[^>]*>([\s\S]*?)<\/svg>/.exec(s)?.[1] ?? "";
  return { viewBox, inner };
};

/**
 * Loaded SYNCHRONOUSLY, on purpose. The export renderer captures a component's first
 * committed state and never sees updates that land after mount — verified in
 * web/renderProbe.tsx: a fetch-then-setState version of this component exported as an
 * empty box on a cold cache and drew correctly the moment the cache was warm, with
 * delayRender held correctly throughout. So the markup has to exist at first render, and
 * a same-origin synchronous request is the one way to have it there without bundler
 * magic. The block is ~a millisecond per file, once per file per page, for a dozen small
 * files — imperceptible in the Player, irrelevant in a render.
 */
const load = (src: string): Prepared => {
  const hit = cache.get(src);
  if (hit) return hit;
  let prepared: Prepared = { viewBox: "0 0 24 24", inner: "" };
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", src, false);
    xhr.send();
    if (xhr.status >= 200 && xhr.status < 300) {
      prepared = prepare(xhr.responseText);
    }
  } catch {
    // A missing file renders as an empty box rather than a crash — visible in the
    // Player, which is the failure mode that gets noticed and fixed.
  }
  cache.set(src, prepared);
  return prepared;
};

export const InlineSvg: React.FC<{
  src: string;
  className?: string;
  style?: React.CSSProperties;
  /** Box size, accepted as props for drop-in compatibility with <Img width= height=>. */
  width?: number | string;
  height?: number | string;
  /** Accepted for drop-in compatibility with <Img>; SVGs need no alt in a film. */
  alt?: string;
}> = ({ src, className, style, width, height }) => {
  const svg = load(src);
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        lineHeight: 0,
        ...(width !== undefined ? { width } : null),
        ...(height !== undefined ? { height } : null),
        ...style,
      }}
    >
      <svg
        viewBox={svg.viewBox}
        width="100%"
        height="100%"
        dangerouslySetInnerHTML={{ __html: svg.inner }}
      />
    </span>
  );
};
