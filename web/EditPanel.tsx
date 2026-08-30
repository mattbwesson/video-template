import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileDrop } from "./Dropzone";
import { FramingStage } from "./FramingStage";
import { loadAssets, type AssetEntry } from "./assets";
import { isDefaultFraming, type Framing } from "./framing";
import { readIcon, readImages, type Upload } from "./uploads";
import { iconLibraryFor } from "../src/customize/icons";
import { textSlotAt, readCopyText } from "../src/customize/copyPaths";
import type { Editable } from "../src/customize/editables";
import type { ResolvedHeader, HeaderTreatment } from "../src/customize/headers";
import type { WorkvivoCopy } from "../src/customize/videoCopy";

/**
 * One panel for one component: its photograph, its icon and its copy.
 *
 * Ported from public/refs/video-review-component2.html. The reference's three collapsible
 * sections are kept exactly — Image, Icon, Text, one open at a time — with one rule added
 * that the reference did not need: a section is drawn only if the clicked component
 * actually has that part. The reference had four scenes and every slot was a photograph
 * with an optional badge and caption drawn ON it, so all three sections always applied.
 * This cut has real Workvivo screens, where a member avatar is a photograph and nothing
 * else and a value disc is an icon and nothing else. Showing them an empty Text section
 * would be offering an edit that has nowhere to land.
 *
 * One behaviour from the FIRST reference is still deliberately absent: picking a shot
 * already in the cut does not trade the two positions' places. That is right when shots
 * and positions are roughly one-to-one; here there are sixty-six positions and about
 * twelve photos, so every photo already appears five or six times and there is no single
 * "other place" to trade with. Picking PINS this position instead.
 */

type SectionId = "image" | "frame" | "header" | "icon" | "text";

const UiIcon: React.FC<{ d: string; size?: number }> = ({ d, size = 14 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const GLYPH = {
  image: "M3 3h18v18H3zM8.7 9.1a1.7 1.7 0 1 0 0 .1M21 15.6l-4.5-4.2a1.7 1.7 0 0 0-2.3 0L4.3 21",
  // The reference's crop mark.
  frame: "M6.5 2v15.5H22M2 6.5h15.5V22",
  icon: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
  text: "M4 7V5h16v2M9 19h6M12 5v14",
  header: "M3 5h18v14H3zM3 10h18",
  chev: "M6 9l6 6 6-6",
} as const;

/** "Centered" / "180% zoom" / "38% 62%" — the reference's `frameVal()`. */
const framingSummary = (f: Framing): string => {
  if (isDefaultFraming(f)) return "Centered";
  if (f.z !== 1) return `${Math.round(f.z * 100)}% zoom`;
  return `${Math.round(f.x)}% ${Math.round(f.y)}%`;
};

/**
 * A frame's shape in words, for the hint under the drag stage.
 *
 * Bands rather than exact ratios: the operator is being told why the photo is cut off, and
 * "1.78:1" answers a question nobody asked.
 */
const shapeLabelOf = (aspect: number): string => {
  if (aspect > 1.25) return "widescreen";
  if (aspect < 0.8) return "tall";
  return "square";
};

const Section: React.FC<{
  id: SectionId;
  label: string;
  summary: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}> = ({ id, label, summary, open, onToggle, children }) => (
  <div className={`vc-sec${open ? " vc-open" : ""}`}>
    <button
      className="vc-sec-h"
      aria-expanded={open}
      onClick={() => onToggle(id)}
    >
      <span className="vc-sec-ic">
        <UiIcon d={GLYPH[id]} />
      </span>
      <b>{label}</b>
      <span className="vc-sec-val">{summary}</span>
      <span className="vc-sec-chev">
        <UiIcon d={GLYPH.chev} />
      </span>
    </button>
    {/* The 0fr -> 1fr grid trick from the ref: it animates to the content's real height
        without anybody having to measure it. */}
    <div className="vc-sec-b">
      <div className="vc-sec-inner">
        <div className="vc-sec-pad">{children}</div>
      </div>
    </div>
  </div>
);

export const EditPanel: React.FC<{
  editable: Editable;
  shots: Upload[];
  /** URL currently painted at this component's image position, pinned or dealt. */
  currentImage: string;
  /** How that photo is cropped in this position, and the shape it is cropped to. */
  framing: Framing;
  /**
   * Aspect ratio (w/h) of this position as measured from the live Player.
   *
   * Measured rather than declared: the cut's positions are laid out by the Workvivo
   * stylesheets inside device frames inside scaled stages, so their real shapes exist only
   * once rendered. 0 when it could not be measured, which hides the section rather than
   * offering a crop against a guessed frame.
   */
  frameAspect: number;
  onEditFraming: (next: Framing) => void;
  /** `public/`-relative path pinned to its icon position, or "" for the original. */
  currentIcon: string;
  /** The banner's live treatment, defaults included. Null when this is not a banner. */
  header: ResolvedHeader | null;
  /** The brand colour, shown as the swatch behind "Brand colour" in the wash picker. */
  brandHex: string;
  /** The copy the video is actually rendering, for reading each field's live value. */
  copy: WorkvivoCopy;
  /** Only the lines the operator has typed, so an emptied box can stay empty. */
  copyOverrides: Record<string, string>;
  onAssignImage: (url: string) => void;
  onAddShots: (added: Upload[]) => void;
  /** `label` is the icon's name, derived from its filename — see `labelFor` in
   *  server/assetsRoute.ts. The Quick Links tiles write it into their own caption. */
  onAssignIcon: (path: string, label: string) => void;
  onResetIcon: () => void;
  onEditHeader: (patch: Partial<HeaderTreatment>) => void;
  onEditText: (path: string, value: string) => void;
  onClose: () => void;
}> = ({
  editable,
  shots,
  currentImage,
  framing,
  frameAspect,
  onEditFraming,
  currentIcon,
  header,
  brandHex,
  copy,
  copyOverrides,
  onAssignImage,
  onAddShots,
  onAssignIcon,
  onResetIcon,
  onEditHeader,
  onEditText,
  onClose,
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [icons, setIcons] = useState<AssetEntry[] | null>(null);
  const [iconError, setIconError] = useState<string | null>(null);
  const [iconQuery, setIconQuery] = useState("");

  const has = {
    image: Boolean(editable.image),
    // Framing needs three things to be worth offering: a photo position, a photo actually
    // in it, and a measured shape to crop against. All three, or the section is a stage
    // with nothing on it.
    frame: Boolean(editable.image) && Boolean(currentImage) && frameAspect > 0,
    header: Boolean(editable.header) && header !== null,
    icon: Boolean(editable.icon),
    text: editable.text.length > 0,
  };

  /**
   * Every section starts CLOSED.
   *
   * This used to auto-open the first section the component had, on the reasoning that a
   * fully collapsed panel makes the operator click twice to do the one thing the panel is
   * for. That trade stopped paying once the panel grew past two sections: auto-opening
   * Image means the picker's scrolling thumbnail grid is expanded every time, which pushes
   * Framing, Icon and Text below the fold and hides the fact that they exist at all.
   *
   * Collapsed, the whole panel is a four-line contents page — and each row already shows
   * its current value in the summary, so the state is readable without opening anything.
   */
  const [open, setOpen] = useState<SectionId | null>(null);

  // A new component means a new panel, even though React reuses this instance.
  useEffect(() => setOpen(null), [editable.key]);

  // Which set to offer depends on the position: a space badge gets Workvivo's own
  // artwork, a Quick Links tile gets vendor marks. Keyed on the slot so switching between
  // two components with different libraries refetches rather than showing the last one.
  const iconLibrary = editable.icon ? iconLibraryFor(editable.icon) : null;

  useEffect(() => {
    if (!iconLibrary) return;
    let live = true;
    setIconError(null);
    setIcons(null);
    loadAssets(iconLibrary)
      .then((list) => live && setIcons(list))
      .catch((err: Error) => live && setIconError(err.message));
    // Cleanup rather than an AbortController: the fetch is shared and cached across every
    // component, so cancelling it on close would throw away work the next click wants.
    return () => {
      live = false;
    };
  }, [iconLibrary]);

  // A new component means an empty box, not last component's search still applied.
  useEffect(() => setIconQuery(""), [editable.key]);

  /**
   * Live filter over the icon set.
   *
   * Matches the tidied label AND the raw filename, because they differ often enough to
   * matter — "icon-sharepoint" labels as "Sharepoint", and someone typing "x-twitter"
   * from memory of the file should still find it. Case- and separator-insensitive, so
   * "activedirectory" finds `active-directory.svg`.
   */
  const shownIcons = useMemo(() => {
    if (!icons) return null;
    const q = iconQuery.trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (!q) return icons;
    return icons.filter((ic) =>
      `${ic.label} ${ic.file}`.toLowerCase().replace(/[\s_-]+/g, "").includes(q),
    );
  }, [icons, iconQuery]);

  /**
   * Only worth a search box when the set is big enough to scroll past.
   *
   * The values-and-spaces set is a dozen icons the operator can see at once; the
   * integrations set is fifty-odd. A box over twelve tiles is clutter.
   */
  const iconSearchable = (icons?.length ?? 0) > 16;

  const toggle = (id: SectionId) => setOpen((cur) => (cur === id ? null : id));

  const addIcon = async (files: FileList | File[]) => {
    const picked = await readIcon(files);
    if (picked) onAssignIcon(picked.url, picked.name);
  };

  const addShots = async (files: FileList | File[]) => {
    const added = await readImages(files);
    if (!added.length) return;
    onAddShots(added);
    // New photos land at the end of a scrolling grid, so show them.
    requestAnimationFrame(() => {
      const el = scroller.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const iconSummary = useMemo(() => {
    if (!currentIcon) return "Original";
    return icons?.find((i) => i.path === currentIcon)?.label ?? "Custom";
  }, [currentIcon, icons]);

  const textSummary =
    editable.text
      .map((f) => copyOverrides[f.path] ?? readCopyText(copy, f.path))
      .find((v) => v.trim()) ?? "None";

  return (
    <aside className="vc-drawer" aria-label={`Edit ${editable.label}`}>
      <div className="vc-dr-in">
        <div className="vc-dr-head">
          <div>
            <span className="vc-mono vc-dr-slot">{editable.label}</span>
            <h3>Edit this component</h3>
          </div>
          <button className="vc-dr-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="vc-secs">
          {has.image && (
            <Section
              id="image"
              label="Image"
              summary={`${shots.length} available`}
              open={open === "image"}
              onToggle={toggle}
            >
              <p className="vc-dr-note">
                Pins this photo here. The rest of the cut keeps dealing photos
                automatically, so this one may still appear elsewhere.
              </p>
              <div className="vc-dr-grid" ref={scroller}>
                {shots.map((shot) => {
                  const cur = shot.url === currentImage;
                  return (
                    <button
                      key={shot.id}
                      className={`vc-pick${cur ? " vc-cur" : ""}`}
                      aria-label={`Use ${shot.name}`}
                      aria-pressed={cur}
                      onClick={() => onAssignImage(shot.url)}
                    >
                      <img src={shot.url} alt="" />
                      <span className="vc-tick" aria-hidden="true">
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
              <FileDrop
                className="vc-dr-add"
                multiple
                label="Add more images"
                onFiles={addShots}
              >
                <span>Add more images</span>
              </FileDrop>
            </Section>
          )}

          {has.frame && (
            <Section
              id="frame"
              label="Framing"
              summary={framingSummary(framing)}
              open={open === "frame"}
              onToggle={toggle}
            >
              <FramingStage
                // Remount on a photo swap. The stage caches the photo's natural aspect,
                // and reusing the instance would drag the new photo against the old one's
                // slack for a frame.
                key={currentImage}
                src={currentImage}
                aspect={frameAspect}
                value={framing}
                onChange={onEditFraming}
                shapeLabel={shapeLabelOf(frameAspect)}
              />
              <p className="vc-dr-note vc-dr-foot">
                {/* Says "this position" deliberately. The reference framed per photo and
                    told the operator so; here the same photo is dealt to five or six
                    places at different shapes, and a drag that silently re-cropped all of
                    them would be a worse surprise than an honest limit. */}
                Crops this position only. The same photo elsewhere in the cut keeps its own
                framing.
              </p>
            </Section>
          )}

          {has.header && header && (
            <Section
              id="header"
              label="Header"
              summary={`${Math.round(header.overlayOpacity * 100)}% wash${header.showLogo ? " · logo" : ""}`}
              open={open === "header"}
              onToggle={toggle}
            >
              <p className="vc-dr-note">
                The wash sits between the photo and the page. Drop it to nothing to
                show the photograph on its own.
              </p>

              <div className="vc-hdr-row">
                <span className="vc-hdr-lbl">Overlay colour</span>
                <div className="vc-hdr-colors">
                  {/* "Brand" is not a colour here, it is the ABSENCE of a choice — it
                      keeps the header following the brand picker, so changing the brand
                      later still moves all three banners. */}
                  <button
                    className={`vc-hdr-sw${header.overlayHex ? "" : " vc-on"}`}
                    style={{ background: `#${brandHex}` }}
                    title="Follow the brand colour"
                    aria-label="Follow the brand colour"
                    aria-pressed={!header.overlayHex}
                    onClick={() => onEditHeader({ overlayHex: "" })}
                  />
                  <label
                    className={`vc-hdr-sw vc-hdr-pick${header.overlayHex ? " vc-on" : ""}`}
                    style={{
                      background: header.overlayHex
                        ? `#${header.overlayHex}`
                        : undefined,
                    }}
                    title="Pick a colour"
                  >
                    <input
                      type="color"
                      value={`#${header.overlayHex || brandHex}`}
                      aria-label="Overlay colour"
                      onChange={(e) =>
                        onEditHeader({ overlayHex: e.target.value.replace("#", "") })
                      }
                    />
                  </label>
                  <span className="vc-mono vc-hdr-hex">
                    {header.overlayHex ? `#${header.overlayHex}` : "Brand"}
                  </span>
                </div>
              </div>

              <label className="vc-hdr-row">
                <span className="vc-hdr-lbl">
                  Overlay opacity
                  <i className="vc-fld-count">
                    {Math.round(header.overlayOpacity * 100)}%
                  </i>
                </span>
                <input
                  className="vc-hdr-range"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(header.overlayOpacity * 100)}
                  onChange={(e) =>
                    onEditHeader({ overlayOpacity: Number(e.target.value) / 100 })
                  }
                />
              </label>

              <label className="vc-hdr-row vc-hdr-toggle">
                <span className="vc-hdr-lbl">Centred white logo</span>
                <input
                  type="checkbox"
                  checked={header.showLogo}
                  onChange={(e) => onEditHeader({ showLogo: e.target.checked })}
                />
                <span className="vc-hdr-sw-track" aria-hidden="true">
                  <i />
                </span>
              </label>
              <p className="vc-dr-note vc-dr-foot">
                Uses the white knockout of your logo, the same one the top bars show.
              </p>
            </Section>
          )}
          {has.icon && (
            <Section
              id="icon"
              label="Icon"
              summary={iconSummary}
              open={open === "icon"}
              onToggle={toggle}
            >
              {iconError && <p className="vc-dr-err">{iconError}</p>}
              {!iconError && icons === null && (
                <p className="vc-dr-note">Loading icons…</p>
              )}
              {icons !== null && iconSearchable && (
                <input
                  className="vc-icsearch"
                  type="search"
                  value={iconQuery}
                  placeholder={`Search ${icons.length} icons…`}
                  aria-label="Filter icons"
                  onChange={(e) => setIconQuery(e.target.value)}
                />
              )}
              {shownIcons !== null && shownIcons.length === 0 && (
                <p className="vc-dr-note">
                  Nothing matches &ldquo;{iconQuery.trim()}&rdquo;.
                </p>
              )}
              {shownIcons !== null && (
                <div
                  className={`vc-icgrid${iconLibrary === "integrations" ? " vc-icgrid-logos" : ""}`}
                >
                  {/* The way back to the artwork the scene ships with. First, and marked
                      when nothing is pinned, so "I have not changed this" is visible. It
                      is not filtered out by a search — it is not one of the icons, and
                      losing the undo because you typed is the wrong trade. */}
                  <button
                    className={`vc-icbtn vc-icnone${currentIcon ? "" : " vc-on"}`}
                    title="The original icon"
                    aria-label="Use the original icon"
                    aria-pressed={!currentIcon}
                    onClick={onResetIcon}
                  >
                    —
                  </button>
                  {shownIcons.map((ic) => {
                    const cur = ic.path === currentIcon;
                    return (
                      <button
                        key={ic.path}
                        className={`vc-icbtn${cur ? " vc-on" : ""}`}
                        title={ic.label}
                        aria-label={`Use ${ic.label}`}
                        aria-pressed={cur}
                        onClick={() => onAssignIcon(ic.path, ic.label)}
                      >
                        <img src={ic.url} alt="" />
                      </button>
                    );
                  })}
                </div>
              )}
              {/* An app the library does not carry. The upload sets the tile's label
                  from the file's own name, exactly as a library pick does — the label and
                  the mark are never set separately. */}
              {iconLibrary === "integrations" && (
                <FileDrop
                  className="vc-icupload"
                  label="Upload an app icon"
                  onFiles={addIcon}
                >
                  <span>Upload your own app icon</span>
                </FileDrop>
              )}
              <p className="vc-dr-note vc-dr-foot">
                {iconLibrary === "integrations"
                  ? "The label under the tile comes from the icon's filename."
                  : "The disc behind the icon keeps the brand colour."}
              </p>
            </Section>
          )}

          {has.text && (
            <Section
              id="text"
              label="Text"
              summary={textSummary}
              open={open === "text"}
              onToggle={toggle}
            >
              {editable.text.map((field) => {
                const slot = textSlotAt(field.path);
                const live = readCopyText(copy, field.path);
                // The raw override when there is one, so a box the operator emptied stays
                // empty while the video falls back to the baseline line underneath it.
                const shown = copyOverrides[field.path] ?? live;
                const long = (slot?.max ?? 0) > 60 || slot?.multiline;
                return (
                  <label className="vc-fld" key={field.path}>
                    <span>
                      {field.label}
                      {slot && (
                        <i className="vc-fld-count">
                          {shown.length}/{slot.max}
                        </i>
                      )}
                    </span>
                    {long ? (
                      <textarea
                        rows={slot && slot.max > 200 ? 5 : 3}
                        maxLength={slot?.max}
                        value={shown}
                        onChange={(e) => onEditText(field.path, e.target.value)}
                      />
                    ) : (
                      <input
                        maxLength={slot?.max}
                        value={shown}
                        onChange={(e) => onEditText(field.path, e.target.value)}
                      />
                    )}
                  </label>
                );
              })}
            </Section>
          )}
        </div>
      </div>
    </aside>
  );
};
