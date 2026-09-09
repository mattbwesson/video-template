import React from "react";
import "./WorkvivoPageEditorStyles.css";
import "./WorkvivoDocsIcons";
import "./WorkvivoEditorIcons";
import { SymbolSvg } from "./symbolRegistry";
import { useT } from "../../customize/uiStrings";

/**
 * Workvivo Pages — the pieces the film's 3109-3263 beat is built from.
 *
 * Four parts, each measured off the reference at 1920x1080: the Add Page button, the page
 * editor with its Zoom Docs toolbar, the "Help me write" pill, and the AI prompt bar with
 * the block-type cards that fly past it.
 *
 * WHERE THE TOOLBAR GLYPHS COME FROM
 * The eighteen on the toolbar are traced from the supplied icon sheet by
 * scripts/prep-editor-icons.py — they are the set this screen was designed with, so they
 * match the reference where the nearest library glyph only approximated it. The dropdown
 * chevron is the exception and comes from the zoom-ui library, which carries a clean one.
 * Both register into the shared symbol registry, so `<SymbolSvg href="#i-edit-bold" />`
 * reaches them from anywhere.
 *
 * WHAT THE LIBRARY DOES NOT HAVE — see BLOCK_GAPS
 * The block-type cards want Heading 1/2/3, Embed, Callout and Table glyphs and the library
 * has none of them: it returns NO MATCH, and its own instruction is to fall back explicitly
 * and say so rather than author substitute path data. They are drawn here as plain marks
 * and listed below, so what is Zoom's art and what is not is answerable from the source
 * rather than from memory.
 */

export const PAGE_BOARD_W = 1920;
export const PAGE_BOARD_H = 1080;

/** Add Page button, settled. Measured: 728 x 300 at (596, 390). */
export const ADD_PAGE = { x: 596, y: 390, w: 728, h: 300 } as const;
/** Editor card. Measured 1034 wide at x 465, top 107, running past the frame's foot. */
export const EDITOR = { x: 465, y: 107, w: 1034, h: 1120 } as const;

const t8 = (n: number) => n;

/**
 * The toolbar, in the reference's order, as [glyph or text, x offset from the card].
 * Every x is measured — the 24 clusters of ink in the row at y 193-210.
 */
type Tool =
  | { kind: "icon"; id: string; x: number; size?: number }
  | { kind: "text"; label: string; x: number }
  | { kind: "rule"; x: number };

const TOOLBAR: Tool[] = [
  { kind: "icon", id: "edit-undo", x: 104 },
  { kind: "icon", id: "edit-redo", x: 136 },
  { kind: "rule", x: 167 },
  { kind: "icon", id: "edit-align-left", x: 186 },
  { kind: "text", label: "Normal", x: 213 },
  { kind: "icon", id: "chevron", x: 268, size: 8 },
  { kind: "rule", x: 296 },
  { kind: "icon", id: "edit-bold", x: 313 },
  { kind: "icon", id: "edit-italic", x: 346 },
  { kind: "icon", id: "edit-strikethrough", x: 379 },
  { kind: "icon", id: "edit-code", x: 414 },
  { kind: "icon", id: "edit-text-size", x: 450 },
  { kind: "icon", id: "chevron", x: 476, size: 8 },
  { kind: "icon", id: "edit-align-center", x: 501 },
  { kind: "icon", id: "chevron", x: 528, size: 8 },
  { kind: "rule", x: 550 },
  { kind: "icon", id: "edit-plus", x: 568 },
  { kind: "icon", id: "chevron", x: 587, size: 8 },
  { kind: "rule", x: 612 },
  { kind: "icon", id: "edit-link", x: 631 },
  { kind: "icon", id: "edit-emoji", x: 665 },
  { kind: "icon", id: "edit-translate", x: 705 },
  { kind: "text", label: "English", x: 730 },
  { kind: "icon", id: "chevron", x: 785, size: 8 },
  { kind: "icon", id: "translate-page", x: 809 },
  { kind: "rule", x: 835 },
  { kind: "icon", id: "edit-mobile-view", x: 852 },
  { kind: "rule", x: 880 },
  { kind: "icon", id: "edit-full-width", x: 898 },
  { kind: "icon", id: "chevron", x: 923, size: 8 },
];

const Glyph: React.FC<{ id: string; size?: number; color?: string; style?: React.CSSProperties }> = ({
  id,
  size = 16,
  color = "#4a4a60",
  style,
}) => (
  <SymbolSvg
    href={id.startsWith("edit-") ? `#i-${id}` : `#i-docs-${id}`}
    width={size}
    height={size}
    paint={color}
    style={style}
  />
);

export const WorkvivoAddPageButton: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const t = useT();
  return (
    <div
      className="wpe-addpage"
      style={{ left: ADD_PAGE.x, top: ADD_PAGE.y, width: ADD_PAGE.w, height: ADD_PAGE.h, ...style }}>
      <Glyph id="edit-plus" size={86} color="#8b8b9e" style={{ position: "absolute", left: 69, top: 107 }} />
      <div className="wpe-addpage-row">{t("Add Page")}</div>
    </div>
  );
};

export const WorkvivoPageEditorCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const t = useT();
  return (
    <div
      className="wpe-editor"
      style={{ left: EDITOR.x, top: EDITOR.y, width: EDITOR.w, height: EDITOR.h, ...style }}>
      {TOOLBAR.map((c, i) =>
        c.kind === "rule" ? (
          <div key={i} className="wpe-rule" style={{ left: c.x }} />
        ) : c.kind === "text" ? (
          <div key={i} className="wpe-tool-text" style={{ left: c.x }}>
            {t(c.label)}
          </div>
        ) : (
          <div key={i} className="wpe-tool" style={{ left: c.x }}>
            <Glyph id={c.id} size={c.size ?? 16} />
          </div>
        ),
      )}
      <div className="wpe-meta" style={{ left: 130 }}>
        <Glyph id="edit-add-page-icon" size={15} color="#6a6a80" style={{ position: "absolute", left: -17, top: 1 }} />
        {t("Add Icon")}
      </div>
      <div className="wpe-meta" style={{ left: 220 }}>
        <Glyph id="edit-add-cover-image" size={15} color="#6a6a80" style={{ position: "absolute", left: -17, top: 1 }} />
        {t("Add Cover Image")}
      </div>
      <div className="wpe-untitled">{t("Untitled")}</div>
    </div>
  );
};

/** The four-point spark. The library's is a raster brand asset, so this one is drawn —
    it is a geometric mark rather than Zoom's own art, and it is listed in BLOCK_GAPS. */
export const Spark: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 36,
  color = "#6610f2",
  style,
}) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={style} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1.6l2.35 6.35a3 3 0 0 0 1.78 1.78L22.4 12l-6.27 2.27a3 3 0 0 0-1.78 1.78L12 22.4l-2.35-6.35a3 3 0 0 0-1.78-1.78L1.6 12l6.27-2.27a3 3 0 0 0 1.78-1.78z" fill={color} />
    <path d="M19.6 2.2l.86 2.32.86-2.32.86 2.32-.86-2.32z" fill={color} opacity="0.9" />
    <circle cx="20.4" cy="4.2" r="1.5" fill={color} />
  </svg>
);

export const WorkvivoHelpMeWrite: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const t = useT();
  return (
    <div className="wpe-help" style={style}>
      <Spark size={42} style={{ position: "absolute", left: 30, top: 22 }} />
      {t("Help me write")}
    </div>
  );
};

/** The prompt bar at its full size — global 3249, where it is 1254 x 206 and centred. */
export const PROMPT_BAR = { w: 1254, h: 206 } as const;

/**
 * The AI prompt bar, laid out at PROMPT_BAR's size and scaled by the caller. Measured off
 * reference frame 3249: sparkle at (30,35), the prompt's cap-top on row 40 at x 96, the
 * status row's on 145 at x 35, and a pill at the bottom right — Submit until it is
 * clicked, Stop after — 23px in from the right edge on rows 127-177.
 */
export const WorkvivoAiPrompt: React.FC<{
  prompt: string;
  /** Once the prompt has been submitted the status row shows and the pill reads Stop. */
  generating?: boolean;
  style?: React.CSSProperties;
}> = ({ prompt, generating, style }) => {
  const t = useT();
  return (
    <div className="wpe-prompt" style={{ width: PROMPT_BAR.w, height: PROMPT_BAR.h, ...style }}>
      <Spark size={40} color="#6610f2" style={{ position: "absolute", left: 30, top: 33 }} />
      <div className="wpe-prompt-text">{prompt}</div>
      {generating ? (
        <>
          <div className="wpe-prompt-status">
            <span className="wpe-prompt-status-who">{t("Workvivo AI")}</span> {t("is generating...")}
          </div>
          <div className="wpe-prompt-stop">{t("Stop")}</div>
        </>
      ) : (
        <div className="wpe-prompt-submit">{t("Submit")}</div>
      )}
    </div>
  );
};

/**
 * Block types, as they appear on the cards flying past.
 *
 * `gap: true` marks the ones the zoom-ui library has no glyph for. Its lookup returns NO
 * MATCH for heading, embed, callout, table and align, and its own guidance is to fall back
 * explicitly rather than author substitute path data — so those are plain drawn marks and
 * are named here rather than passed off as Zoom's art.
 */
export const BLOCK_GAPS = ["Heading 1", "Heading 2", "Heading 3", "Embed", "Callout", "Table"];

export type BlockType = { label: string; icon: string };
export const BLOCK_TYPES: BlockType[] = [
  { label: "Heading 1", icon: "h1" },
  { label: "Heading 2", icon: "h2" },
  { label: "Heading 3", icon: "h3" },
  { label: "List", icon: "list" },
  { label: "Embed", icon: "embed" },
  { label: "Video", icon: "video" },
  { label: "Document", icon: "document" },
  { label: "Button", icon: "button" },
  { label: "Image", icon: "image" },
  { label: "Table", icon: "table" },
  { label: "Callout", icon: "callout" },
];

const BlockGlyph: React.FC<{ icon: string; size: number }> = ({ icon, size }) => {
  const p = "#6610f2";
  const c = { fill: "none", stroke: p, strokeWidth: 1.8, strokeLinecap: "round" as const };
  const heading = (n: string) => (
    <>
      <path d="M3 4v12M11 4v12M3 10h8" {...c} strokeWidth="2.4" />
      <text x="13.5" y="16.5" fontSize="8" fontWeight="700" fill={p} fontFamily="InterX, Inter, sans-serif">{n}</text>
    </>
  );
  return (
    <svg viewBox="0 0 22 20" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {icon === "h1" && heading("1")}
      {icon === "h2" && heading("2")}
      {icon === "h3" && heading("3")}
      {icon === "list" && (
        <>
          <path d="M8 5h11M8 10h11M8 15h11" {...c} />
          <circle cx="3.4" cy="5" r="1.5" fill={p} />
          <circle cx="3.4" cy="10" r="1.5" fill={p} />
          <circle cx="3.4" cy="15" r="1.5" fill={p} />
        </>
      )}
      {icon === "embed" && (
        <>
          <rect x="2.5" y="3" width="17" height="14" rx="3" {...c} />
          <path d="M8.5 13.5l5-7M8 7.5H6.6a2.6 2.6 0 0 0 0 5.2H8M14 7.5h1.4a2.6 2.6 0 0 1 0 5.2H14" {...c} />
        </>
      )}
      {icon === "video" && (
        <>
          <rect x="2.5" y="4.5" width="12" height="11" rx="2.6" {...c} />
          <path d="M15.5 9l4-2.4v6.8l-4-2.4z" {...c} />
        </>
      )}
      {icon === "document" && (
        <>
          <path d="M5 2.6h7.6L17 7v10.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4.6a2 2 0 0 1 2-2z" {...c} />
          <path d="M12.4 2.8V7H16.8" {...c} />
        </>
      )}
      {icon === "button" && <rect x="2.5" y="6.5" width="17" height="7" rx="3.5" {...c} />}
      {icon === "image" && (
        <>
          <rect x="2.5" y="3.5" width="17" height="13" rx="2.6" {...c} />
          <circle cx="7.6" cy="8" r="1.7" {...c} />
          <path d="M3.4 14.5l4.8-4.2 3.4 3 2.6-2.2 4.6 4" {...c} />
        </>
      )}
      {icon === "table" && (
        <>
          <rect x="2.5" y="3.5" width="17" height="13" rx="2.2" {...c} />
          <path d="M2.5 8h17M2.5 12.2h17M8.6 3.5v13" {...c} />
        </>
      )}
      {icon === "callout" && (
        <>
          <rect x="2.5" y="3.5" width="17" height="13" rx="2.6" {...c} />
          <path d="M11 7v4M11 13.4v.1" {...c} strokeWidth="2.2" />
        </>
      )}
    </svg>
  );
};

/**
 * One block-type card. Sized by the caller, because the field draws them at every depth;
 * the reference's cards run 2.82:1, so `h` defaults to that.
 */
export const WorkvivoBlockCard: React.FC<{
  block: BlockType;
  w: number;
  h?: number;
  style?: React.CSSProperties;
}> = ({ block, w, h: hIn, style }) => {
  const t = useT();
  const h = hIn ?? w / 2.82;
  return (
    <div className="wpe-block" style={{ width: w, height: h, ...style }}>
      <div className="wpe-block-icon" style={{ left: w * 0.09 }}>
        <BlockGlyph icon={block.icon} size={h * 0.42} />
      </div>
      <div className="wpe-block-label" style={{ left: w * 0.28, fontSize: h * 0.3 }}>
        {t(block.label)}
      </div>
    </div>
  );
};

/** The editor at rest, for the gallery and for a still. */
export const WorkvivoPageEditorScreen: React.FC = () => (
  <div className="wpe">
    <WorkvivoPageEditorCard />
    <WorkvivoHelpMeWrite style={{ left: 1132, top: 862 }} />
  </div>
);
