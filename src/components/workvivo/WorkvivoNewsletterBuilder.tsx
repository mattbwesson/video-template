import React from "react";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import "./WorkvivoStyles.css";
import "./WorkvivoNewsletterBuilderStyles.css";

/**
 * Workvivo newsletter builder — component palette, canvas and save bar, on the tenant
 * brand field.
 *
 * Authored at a natural desktop scale (280px palette, 12-13px UI type) inside a 1299x731
 * stage, then scaled once by the wrapper to fill the composition. Every value therefore
 * sits on the 4px grid instead of being a list of scale artifacts.
 *
 * The editor panel deliberately bleeds past the stage on the right and bottom: the
 * builder is a full-height surface and the reference is a crop of it. The email preview
 * is centred in a 630px content column rather than in the panel, which is why it reads
 * left of the panel's own centre — matching the reference.
 *
 * ICON PROVENANCE
 *   i-ui-*  Workvivo's own library: Image, Update, Event, Article, and the preview's
 *           empty-image placeholder glyph.
 *   drawn   The layout glyphs (Full Width, 2/3 Columns, One/Two Thirds), Heading, Text,
 *           Button, Hero, Spacer, Divider, and the four toolbar controls. These are
 *           diagrams, not brand marks — a "2 Columns" icon IS two rectangles — so they
 *           are built from rect/ellipse/circle/polygon primitives. No path data is
 *           authored anywhere in this file.
 */

export interface WorkvivoNewsletterBuilderProps {
  /** Composition size. The 1299x731 stage is scaled to fill it. */
  width?: number;
  height?: number;
  /** Per-tenant brand colour for the field behind the builder. */
  brand?: string;
}

const STAGE_W = 1299;
const STAGE_H = 731;

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud " +
  "exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

/** Layout diagrams: an outer frame with columns weighted like the layout they describe. */
const LayoutGlyph: React.FC<{ cols: number[] }> = ({ cols }) => {
  const total = cols.reduce((a, b) => a + b, 0);
  const gap = 1.1;
  const inner = 12 - gap * (cols.length - 1);
  let x = 2;
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="0.6"
        y="0.6"
        width="14.8"
        height="14.8"
        rx="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      {cols.map((c, i) => {
        const w = (inner * c) / total;
        const r = <rect key={i} x={x} y="3.4" width={w} height="9.2" rx="0.8" fill="currentColor" />;
        x += w + gap;
        return r;
      })}
    </svg>
  );
};

const HeadingGlyph: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="3" y="3" width="1.7" height="10" rx="0.6" fill="currentColor" />
    <rect x="11.3" y="3" width="1.7" height="10" rx="0.6" fill="currentColor" />
    <rect x="4.7" y="7.2" width="6.6" height="1.6" fill="currentColor" />
  </svg>
);

const TextGlyph: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="3" y="3" width="10" height="1.7" rx="0.6" fill="currentColor" />
    <rect x="7.2" y="4" width="1.7" height="9" rx="0.6" fill="currentColor" />
  </svg>
);

const ButtonGlyph: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <rect
      x="1.4"
      y="5"
      width="13.2"
      height="6"
      rx="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    />
  </svg>
);

const HeroGlyph: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <rect
      x="0.6"
      y="1.6"
      width="14.8"
      height="12.8"
      rx="2.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <rect x="2.6" y="3.6" width="10.8" height="4.6" rx="0.8" fill="currentColor" />
    <rect x="2.6" y="9.6" width="7" height="1.5" rx="0.7" fill="currentColor" />
  </svg>
);

const SpacerGlyph: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="7.2" y="2.4" width="1.6" height="11.2" rx="0.8" fill="currentColor" />
    <rect x="2.4" y="7.2" width="11.2" height="1.6" rx="0.8" fill="currentColor" />
    <polygon points="8,0.9 10.4,3.6 5.6,3.6" fill="currentColor" />
    <polygon points="8,15.1 10.4,12.4 5.6,12.4" fill="currentColor" />
  </svg>
);

const DividerGlyph: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="1.6" y="7.2" width="12.8" height="1.6" rx="0.8" fill="currentColor" />
  </svg>
);

const DeviceGlyph: React.FC = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true">
    <rect
      x="6"
      y="2.2"
      width="8"
      height="15.6"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <rect x="8.7" y="15.1" width="2.6" height="1.1" rx="0.55" fill="currentColor" />
  </svg>
);

const EyeGlyph: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <ellipse
      cx="10"
      cy="10"
      rx="8.4"
      ry="5.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <circle cx="10" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

/**
 * Undo / redo. Neither library has a curved arrow, and a dashed circle reads as a plain
 * circle at 17px. Drawn as a polyline arc instead — still a primitive, and sampling the
 * curve myself means the head can sit exactly on the arc's end rather than near it.
 */
const arcPoints = (cx: number, cy: number, r: number, from: number, to: number) =>
  Array.from({ length: 21 }, (_, i) => {
    const a = ((from + ((to - from) * i) / 20) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

const UndoGlyph: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 20 20"
    aria-hidden="true"
    style={flip ? { transform: "scaleX(-1)" } : undefined}
  >
    {/* 270deg sweep starting at due north, travelling anticlockwise. */}
    <polyline
      points={arcPoints(10, 10.6, 6, 270, 0)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Head sits on that start point, pointing the way the sweep leaves it. */}
    <polygon points="6.4,4.6 10.6,2.3 10.6,6.9" fill="currentColor" />
  </svg>
);

const LAYOUTS: Array<[string, number[]]> = [
  ["Full Width", [1]],
  ["2 Columns", [1, 1]],
  ["One Third", [1, 2]],
  ["Two Thirds", [2, 1]],
  ["3 Columns", [1, 1, 1]],
];

const CONTENT: Array<[string, React.ReactNode]> = [
  ["Heading", <HeadingGlyph key="h" />],
  ["Text", <TextGlyph key="t" />],
  ["Image", <Icon key="i" href="#i-ui-add-image" width={15} height={15} />],
  ["Button", <ButtonGlyph key="b" />],
  ["Hero", <HeroGlyph key="he" />],
  ["Spacer", <SpacerGlyph key="s" />],
  ["Divider", <DividerGlyph key="d" />],
];

const POST: Array<[string, React.ReactNode]> = [
  ["Update", <Icon key="u" href="#i-ui-post-a-value-update" width={15} height={15} />],
  ["Event", <Icon key="e" href="#i-ui-events-nav-rail" width={15} height={15} />],
  ["Article", <Icon key="a" href="#i-ui-news" width={15} height={15} />],
];

const PaletteItem: React.FC<{ label: string; glyph: React.ReactNode }> = ({
  label,
  glyph,
}) => (
  <div className="wnb-item">
    {glyph}
    <span>{label}</span>
  </div>
);

/** The builder's empty-image state — peach fill with the picture glyph, not photography. */
const Placeholder: React.FC<{ className?: string }> = ({ className }) => (
  <div className={"wnb-ph" + (className ? " " + className : "")}>
    <Icon href="#i-ui-add-image" width={30} height={30} />
  </div>
);

export const WorkvivoNewsletterBuilder: React.FC<WorkvivoNewsletterBuilderProps> = ({
  width = 1920,
  height = 1080,
  brand = "#e30613",
}) => {
  // Cover the composition from the natural-scale stage, so the crop matches the
  // reference whatever size the composition is registered at.
  const scale = Math.max(width / STAGE_W, height / STAGE_H);

  return (
    <div style={{ width, height, overflow: "hidden", background: brand }}>
      <div
        className="wnb-stage"
        style={
          {
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            "--wnb-brand": brand,
          } as React.CSSProperties
        }
      >
        <WorkvivoSvgDefs />

        {/* ---------- component palette ---------- */}
        <aside className="wnb-palette">
          <div className="wnb-seg">
            <div className="is-on">Components</div>
            <div>Design</div>
          </div>

          <div className="wnb-sec">Layouts</div>
          <div className="wnb-grid">
            {LAYOUTS.map(([label, cols]) => (
              <PaletteItem key={label} label={label} glyph={<LayoutGlyph cols={cols} />} />
            ))}
          </div>

          <div className="wnb-sec">Content</div>
          <div className="wnb-grid">
            {CONTENT.map(([label, glyph]) => (
              <PaletteItem key={label} label={label} glyph={glyph} />
            ))}
          </div>

          <div className="wnb-sec">Post</div>
          <div className="wnb-grid">
            {POST.map(([label, glyph]) => (
              <PaletteItem key={label} label={label} glyph={glyph} />
            ))}
          </div>
        </aside>

        {/* ---------- editor ---------- */}
        <section className="wnb-editor">
          <div className="wnb-toolbar">
            <div className="wnb-col">
              <div className="wnb-tools">
                <DeviceGlyph />
                <span style={{ color: "#6103ed" }}>
                  <EyeGlyph />
                </span>
                <UndoGlyph />
                <UndoGlyph flip />
              </div>
            </div>
          </div>

          <div className="wnb-canvas">
            <div className="wnb-preview">
              <div className="wnb-spacer" />

              <div className="wnb-block">
                <Placeholder className="wnb-ph-hero" />
              </div>

              <div className="wnb-block">
                <div className="wnb-h1">Heading text</div>
              </div>

              <div className="wnb-row">
                <div className="wnb-cell">
                  <Placeholder />
                </div>
                <div className="wnb-cell">
                  <div className="wnb-h2">Heading text</div>
                  <div className="wnb-body">{LOREM}</div>
                  <div className="wnb-btn">Button</div>
                </div>
              </div>

              {/* Runs off the bottom of the frame, as in the reference. */}
              <div className="wnb-row">
                <div className="wnb-cell">
                  <div className="wnb-h2">Heading text</div>
                  <div className="wnb-body">{LOREM}</div>
                </div>
                <div className="wnb-cell">
                  <Placeholder />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- save bar ---------- */}
        <div className="wnb-save">
          <div className="wnb-save-primary">Save as Draft</div>
          <div className="wnb-save-ghost">Save as Template</div>
        </div>
      </div>
    </div>
  );
};
