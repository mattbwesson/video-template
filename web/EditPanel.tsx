import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileDrop } from "./Dropzone";
import { loadAssets, type AssetEntry } from "./assets";
import { readImages, type Upload } from "./uploads";
import { ICON_LIBRARY } from "../src/customize/icons";
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

type SectionId = "image" | "header" | "icon" | "text";

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
  icon: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
  text: "M4 7V5h16v2M9 19h6M12 5v14",
  header: "M3 5h18v14H3zM3 10h18",
  chev: "M6 9l6 6 6-6",
} as const;

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
  onAssignIcon: (path: string) => void;
  onResetIcon: () => void;
  onEditHeader: (patch: Partial<HeaderTreatment>) => void;
  onEditText: (path: string, value: string) => void;
  onClose: () => void;
}> = ({
  editable,
  shots,
  currentImage,
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

  const has = {
    image: Boolean(editable.image),
    header: Boolean(editable.header) && header !== null,
    icon: Boolean(editable.icon),
    text: editable.text.length > 0,
  };

  /**
   * Which section starts open.
   *
   * The first one this component actually has, rather than always "image": on a value
   * disc that section does not exist, and a panel that opens with everything collapsed
   * makes the operator click twice to do the one thing the panel is for.
   */
  const firstSection: SectionId = has.image
    ? "image"
    : has.header
      ? "header"
      : has.icon
        ? "icon"
        : "text";
  const [open, setOpen] = useState<SectionId | null>(firstSection);

  // A new component means a new panel, even though React reuses this instance.
  useEffect(() => setOpen(firstSection), [editable.key, firstSection]);

  useEffect(() => {
    if (!has.icon) return;
    let live = true;
    setIconError(null);
    loadAssets(ICON_LIBRARY)
      .then((list) => live && setIcons(list))
      .catch((err: Error) => live && setIconError(err.message));
    // Cleanup rather than an AbortController: the fetch is shared and cached across every
    // component, so cancelling it on close would throw away work the next click wants.
    return () => {
      live = false;
    };
  }, [has.icon]);

  const toggle = (id: SectionId) => setOpen((cur) => (cur === id ? null : id));

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
              {icons !== null && (
                <div className="vc-icgrid">
                  {/* The way back to the artwork the scene ships with. First, and marked
                      when nothing is pinned, so "I have not changed this" is visible. */}
                  <button
                    className={`vc-icbtn vc-icnone${currentIcon ? "" : " vc-on"}`}
                    title="The original icon"
                    aria-label="Use the original icon"
                    aria-pressed={!currentIcon}
                    onClick={onResetIcon}
                  >
                    —
                  </button>
                  {icons.map((ic) => {
                    const cur = ic.path === currentIcon;
                    return (
                      <button
                        key={ic.path}
                        className={`vc-icbtn${cur ? " vc-on" : ""}`}
                        title={ic.label}
                        aria-label={`Use ${ic.label}`}
                        aria-pressed={cur}
                        onClick={() => onAssignIcon(ic.path)}
                      >
                        <img src={ic.url} alt="" />
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="vc-dr-note vc-dr-foot">
                The disc behind the icon keeps the brand colour.
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
