import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { SLOT_ATTR } from "../src/customize/imagery";
import { ICON_SLOT_ATTR } from "../src/customize/icons";
import { editableForDomKey, type Editable } from "../src/customize/editables";

/**
 * Hit targets over every editable component currently on screen in the `<Player>`.
 *
 * The reference implementation could put its `.slot` buttons straight into the scene
 * markup, because it authored that markup. Ours is a Remotion composition: the wizard
 * does not own its DOM and must not reach into it. So the composition marks each picture
 * with `data-vc-slot` and each swappable icon with `data-vc-icon`, and this measures
 * those elements and lays absolutely-positioned buttons over them.
 *
 * A target is a COMPONENT, not a picture. Several marked elements can resolve to the same
 * editable — a space card's photo and its badge both open that card — so the rects are
 * keyed by the DOM element they came from while the click reports the component.
 *
 * Measuring beats computing. The pictures sit inside device frames that are scaled
 * inside stages that are themselves scaled, and one shot rotates through a match cut —
 * `getBoundingClientRect()` resolves all of that for free, where reconstructing it would
 * mean re-implementing every scene's geometry out here and keeping the two in step.
 */

export type SlotRect = {
  /** The marked element this came from; unique on screen, so it keys the button. */
  domKey: string;
  editable: Editable;
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Below this, a target is more likely to be a sliver of a shot mid-transition than
 * something worth clicking. The smallest real position is a 20px member avatar drawn
 * inside a stage that is itself scaled down, so the floor has to be low.
 */
const MIN_TARGET_PX = 14;

/**
 * Icons get a lower floor than photos.
 *
 * The sliver-mid-transition problem the floor exists for is a photo problem — icons do
 * not slide in from off-stage, they appear with the card they sit on. Meanwhile they are
 * genuinely tiny: the in-app space badge is a 26px glyph inside a desktop stage that is
 * itself scaled down inside the 1920-wide composition, and at a typical preview width
 * that lands just under 14px. The photo floor would silently drop it.
 */
const MIN_ICON_TARGET_PX = 9;

export const SwapOverlay: React.FC<{
  /** The element the Player renders into; targets are positioned relative to it. */
  screenRef: React.RefObject<HTMLDivElement>;
  playerRef: React.RefObject<PlayerRef>;
  /** Key of the component the panel is open on, so its target stays lit. */
  editing: string | null;
  onPick: (editable: Editable) => void;
}> = ({ screenRef, playerRef, editing, onPick }) => {
  const [rects, setRects] = useState<SlotRect[]>([]);
  const lastRun = useRef(0);
  const trailing = useRef(0);

  const measure = useCallback(() => {
    const host = screenRef.current;
    if (!host) return;
    const base = host.getBoundingClientRect();
    const found: SlotRect[] = [];

    for (const el of host.querySelectorAll(`[${SLOT_ATTR}],[${ICON_SLOT_ATTR}]`)) {
      const iconKey = el.getAttribute(ICON_SLOT_ATTR);
      const domKey = iconKey ?? el.getAttribute(SLOT_ATTR);
      if (!domKey) continue;
      const editable = editableForDomKey(domKey);
      // A marked element with no entry in the table is a slot somebody added to the
      // composition and not to `editables.ts`. Skipping it leaves the shot uneditable,
      // which is visible, rather than opening a panel with nothing in it.
      if (!editable) continue;

      const r = el.getBoundingClientRect();
      const floor = iconKey ? MIN_ICON_TARGET_PX : MIN_TARGET_PX;
      if (r.width < floor || r.height < floor) continue;
      // Clipped away by a mask, scrolled out of its card, or off-stage entirely.
      if (r.right < base.left || r.left > base.right) continue;
      if (r.bottom < base.top || r.top > base.bottom) continue;
      found.push({
        domKey,
        editable,
        left: r.left - base.left,
        top: r.top - base.top,
        width: r.width,
        height: r.height,
      });
    }

    // Smallest last so a member avatar sitting on top of a card photo — or a space badge
    // overlapping the photo it hangs off — is the one that receives the click, rather
    // than being buried under its own background.
    found.sort((a, b) => b.width * b.height - a.width * a.height);
    setRects(found);
  }, [screenRef]);

  useEffect(() => {
    /**
     * Re-measure on every frame the Player paints, so a target follows a shot that is
     * mid-transition instead of lagging behind it. A few dozen `getBoundingClientRect`
     * calls is cheap; the throttle only stops a burst of events — a seek fires several —
     * repeating the same work within one frame.
     *
     * Deliberately synchronous rather than deferred into `requestAnimationFrame`. rAF
     * does not run while the page is not compositing, and a first measurement that never
     * arrives leaves the video looking like nothing on it is clickable. That is how this
     * was first written, and it took a throttled preview pane to catch it.
     */
    const run = () => {
      const now = performance.now();
      if (now - lastRun.current >= 8) {
        lastRun.current = now;
        measure();
      }
      /**
       * …and again once this frame has actually been committed to the DOM.
       *
       * `frameupdate` fires when the Player's frame number changes, which is BEFORE React
       * has rendered that frame, so the synchronous read above can measure the previous
       * scene. While playing, the next event corrects it a frame later and nobody sees
       * it. Paused, no further event ever comes — so a seek left the targets describing
       * whatever was on screen before it, and clicking a space card opened the panel for
       * a page card from the scene the operator had just scrubbed away from.
       *
       * Latest-wins, so a burst of events costs one extra measurement rather than one
       * each.
       */
      if (trailing.current) cancelAnimationFrame(trailing.current);
      trailing.current = requestAnimationFrame(() => {
        trailing.current = 0;
        measure();
      });
    };

    const player = playerRef.current;
    player?.addEventListener("frameupdate", run);
    window.addEventListener("resize", run);

    /**
     * The panel slides the video narrower over 0.46s and nothing about the Player changes
     * while it does, so without this the targets sit where the wider video used to be for
     * the whole transition — including the one that is lit as "being edited".
     */
    const host = screenRef.current;
    const ro = host ? new ResizeObserver(run) : null;
    if (host && ro) ro.observe(host);

    measure();

    return () => {
      player?.removeEventListener("frameupdate", run);
      window.removeEventListener("resize", run);
      ro?.disconnect();
      if (trailing.current) cancelAnimationFrame(trailing.current);
    };
  }, [measure, playerRef, screenRef]);

  return (
    <div className="vc-slots">
      {rects.map((r) => {
        const label = `Edit ${r.editable.label}`;
        return (
          <button
            key={r.domKey}
            className={[
              "vc-slotbtn",
              // A badge and a value disc are circles; a square outline round one reads as
              // a different, larger element than the thing about to be edited.
              r.domKey === r.editable.icon ? "vc-slotico" : "",
              editing === r.editable.key ? "vc-editing" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
            title={label}
            aria-label={label}
            onClick={(e) => {
              e.preventDefault();
              onPick(r.editable);
            }}
          >
            {/* One generic edit mark for every target. The old picture glyph promised a
                photo picker, and most targets now open a panel that also carries an icon
                and the card's copy. */}
            <span className="vc-swapchip" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 20h4.2L19 9.2a2.1 2.1 0 0 0-3-3L5.2 17z" />
                <path d="M14.4 7.8l1.8 1.8" />
              </svg>
            </span>
          </button>
        );
      })}
    </div>
  );
};
