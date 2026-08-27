import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { SLOT_ATTR } from "../src/customize/imagery";
import { ICON_HIT_ATTR, ICON_SLOT_ATTR } from "../src/customize/icons";
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
 * editable — a space card's photo and its badge both open that card — so each marked
 * element gets its own rect while the click reports the component behind it.
 *
 * Measuring beats computing. The pictures sit inside device frames that are scaled
 * inside stages that are themselves scaled, and one shot rotates through a match cut —
 * `getBoundingClientRect()` resolves all of that for free, where reconstructing it would
 * mean re-implementing every scene's geometry out here and keeping the two in step.
 *
 * Two rules keep the targets honest, both learned from operators hovering over edits that
 * were not there:
 *
 *  - **Only while paused.** A moving shot takes its hit target with it, so a chip that
 *    appears mid-playback is pointing at wherever that thing was a frame ago. The video
 *    is clickable-to-pause anyway, so the gesture is now pause-then-click.
 *  - **Only what is actually being drawn.** A rect is not the same as a picture. A scene
 *    mid-crossfade is fully laid out at opacity 0.02, an irised-out shot is fully laid
 *    out behind a `clip-path` closed to nothing, and a feed card scrolled out of its
 *    device frame is fully laid out under the frame's `overflow: hidden`. All three
 *    measured beautifully and all three put a chip over blank screen.
 */

export type SlotRect = {
  /**
   * The slot name the marked element carries. NOT unique on screen — the same face is
   * dealt to more than one card, and a transition has two scenes mounted at once.
   */
  domKey: string;
  editable: Editable;
  /** Draw the outline as a circle: this target is a badge or a value disc, not a card. */
  round: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
};

/** A viewport-space rectangle in the edges form the clipping maths wants. */
type Box = { left: number; top: number; right: number; bottom: number };

const boxOf = (r: DOMRect): Box => ({
  left: r.left,
  top: r.top,
  right: r.right,
  bottom: r.bottom,
});

const intersect = (a: Box, b: Box): Box => ({
  left: Math.max(a.left, b.left),
  top: Math.max(a.top, b.top),
  right: Math.min(a.right, b.right),
  bottom: Math.min(a.bottom, b.bottom),
});

const isEmpty = (b: Box) => b.right <= b.left || b.bottom <= b.top;

/**
 * Below this cumulative opacity a target counts as not on screen.
 *
 * Half is not a hedge, it is the crossfade's own crossing point: both match-cut
 * presentations swap opacity across the same 0.45-0.55 window, so at every instant of a
 * transition exactly one of the two scenes is above 0.5. Pause anywhere in a cut and you
 * get the scene you can see, never both and never neither.
 */
const MIN_OPACITY = 0.5;

/**
 * How much of a target has to survive clipping before it is worth a chip.
 *
 * The button is drawn on the CLIPPED rect, so a half-visible card is already labelled
 * where its visible half is rather than over the frame edge. This only throws out the
 * slivers — the top 2mm of a card scrolled almost out of a feed, which is on screen in
 * the letter of it and is not something anybody is aiming at.
 */
const MIN_VISIBLE_FRACTION = 0.3;

/** Keyword positions `circle()` accepts, as the percentages they stand for. */
const CLIP_KEYWORDS: Record<string, number> = {
  left: 0,
  top: 0,
  center: 50,
  right: 100,
  bottom: 100,
};

const clipOffset = (token: string | undefined, extent: number, fallback: number) => {
  if (!token) return fallback;
  const keyword = CLIP_KEYWORDS[token];
  if (keyword !== undefined) return (keyword / 100) * extent;
  if (token.endsWith("%")) return (parseFloat(token) / 100) * extent;
  if (token.endsWith("px")) return parseFloat(token);
  return fallback;
};

/**
 * The bounding box of a `circle(Rpx at X Y)` clip, or null for a shape we cannot read.
 *
 * The cut irises between shots with circles and nothing else, so circles are all this
 * parses; anything more exotic returns null and clips nothing, which errs towards showing
 * a target rather than silently swallowing one. The box is the circle's square rather
 * than the circle, so a target tucked in a corner of a closing iris survives a few frames
 * longer than it strictly should — the case that matters is the radius reaching zero, and
 * a zero-radius box is empty either way.
 */
const circleClipBox = (clipPath: string, rect: DOMRect): Box | null => {
  const parsed = /^circle\(([-\d.]+)px(?:\s+at\s+(.+))?\)$/.exec(clipPath.trim());
  if (!parsed) return null;
  const radius = parseFloat(parsed[1]);
  if (!Number.isFinite(radius)) return null;
  const [x, y] = (parsed[2] ?? "").split(/\s+/).filter(Boolean);
  const cx = rect.left + clipOffset(x, rect.width, rect.width / 2);
  const cy = rect.top + clipOffset(y, rect.height, rect.height / 2);
  return {
    left: cx - radius,
    top: cy - radius,
    right: cx + radius,
    bottom: cy + radius,
  };
};

/**
 * What of `el` a viewer can actually see, or null if the answer is nothing.
 *
 * Walks el and its ancestors up to the player host, accumulating opacity and intersecting
 * the rect with everything that clips it on the way. This is the whole of the
 * "is it really there" test — deliberately geometric, with no hit-testing against what
 * sits on top, because the scenes layer gradient scrims and copy over their photographs
 * and `elementFromPoint` would report every one of those photographs as covered.
 */
const visibleBox = (el: Element, rect: DOMRect, host: HTMLElement): Box | null => {
  let box = boxOf(rect);
  let opacity = 1;
  let node: Element | null = el;

  while (node) {
    const cs = getComputedStyle(node);
    if (cs.display === "none" || cs.visibility !== "visible") return null;

    const own = parseFloat(cs.opacity);
    if (Number.isFinite(own)) opacity *= own;
    if (opacity < MIN_OPACITY) return null;

    // Own rect for the ancestors; the one already measured for the element itself, which
    // is the expensive call in this loop and is made once per target as it is.
    const nodeRect = node === el ? rect : node.getBoundingClientRect();

    // An element's own overflow clips its children, not itself — so this only applies
    // from the first ancestor up. Per axis, because a feed that scrolls vertically is
    // `overflow-y: auto` with a visible x.
    if (node !== el) {
      if (cs.overflowX !== "visible") {
        box = intersect(box, { ...box, left: nodeRect.left, right: nodeRect.right });
      }
      if (cs.overflowY !== "visible") {
        box = intersect(box, { ...box, top: nodeRect.top, bottom: nodeRect.bottom });
      }
    }

    if (cs.clipPath !== "none") {
      const clip = circleClipBox(cs.clipPath, nodeRect);
      if (clip) box = intersect(box, clip);
    }

    if (isEmpty(box)) return null;
    if (node === host) break;
    node = node.parentElement;
  }

  return box;
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
  /**
   * Whether the Player is stopped. Targets only exist while it is — see the file note.
   *
   * Starts true and is corrected on mount: the overlay is mounted at the same moment the
   * reveal starts playing, and asking the Player outright beats guessing.
   */
  const [paused, setPaused] = useState(true);
  const lastRun = useRef(0);
  const trailing = useRef(0);

  const measure = useCallback(() => {
    const host = screenRef.current;
    if (!host) return;
    const base = boxOf(host.getBoundingClientRect());
    const found: SlotRect[] = [];

    /**
     * Icon positions whose target is drawn somewhere other than the glyph.
     *
     * Gathered first because the glyph is still marked — it has to be, it is what says a
     * swapped icon goes there — and measuring both would put two chips on one value.
     */
    const hitAreas = new Set(
      Array.from(host.querySelectorAll(`[${ICON_HIT_ATTR}]`), (el) =>
        el.getAttribute(ICON_HIT_ATTR),
      ),
    );

    for (const el of host.querySelectorAll(
      `[${SLOT_ATTR}],[${ICON_SLOT_ATTR}],[${ICON_HIT_ATTR}]`,
    )) {
      const hitKey = el.getAttribute(ICON_HIT_ATTR);
      const glyphKey = el.getAttribute(ICON_SLOT_ATTR);
      if (glyphKey && hitAreas.has(glyphKey)) continue;
      const iconKey = hitKey ?? glyphKey;
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

      // Faded out, irised away, scrolled out of its frame, or off-stage entirely.
      const seen = visibleBox(el, r, host);
      if (!seen) continue;
      const box = intersect(seen, base);
      if (isEmpty(box)) continue;

      const width = box.right - box.left;
      const height = box.bottom - box.top;
      if (width < floor || height < floor) continue;
      if ((width * height) / (r.width * r.height) < MIN_VISIBLE_FRACTION) continue;

      found.push({
        domKey,
        editable,
        // The GLYPH of an icon-only component is a disc; a hit area drawn around it is a
        // row. Deciding this here, off the element that was measured, rather than from
        // the key at render time, which cannot tell the two apart.
        round: Boolean(glyphKey) && domKey === editable.icon,
        left: box.left - base.left,
        top: box.top - base.top,
        width,
        height,
      });
    }

    // Smallest last so a member avatar sitting on top of a card photo — or a space badge
    // overlapping the photo it hangs off — is the one that receives the click, rather
    // than being buried under its own background.
    found.sort((a, b) => b.width * b.height - a.width * a.height);
    setRects(found);
  }, [screenRef]);

  /**
   * Follow the Player's transport.
   *
   * `ended` as well as `pause`, because a cut that runs off its last frame stops without
   * anybody having paused it — and that frame is one of the ones an operator is most
   * likely to want to edit.
   */
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    setPaused(!player.isPlaying());

    const onPlay = () => setPaused(false);
    const onStop = () => setPaused(true);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onStop);
    player.addEventListener("ended", onStop);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onStop);
      player.removeEventListener("ended", onStop);
    };
  }, [playerRef]);

  useEffect(() => {
    /**
     * Nothing to measure while it plays: the targets are gone, and measuring for them
     * would be a per-frame walk of the DOM whose results nobody sees. Dropping the rects
     * matters as much as hiding them, so that the first thing a pause paints is the
     * frame it landed on rather than the frame it left.
     */
    if (!paused) {
      setRects([]);
      return;
    }

    /**
     * Re-measure on every frame the Player paints, so a target follows a scrub instead of
     * lagging behind it. A few dozen `getBoundingClientRect` calls is cheap; the throttle
     * only stops a burst of events — a seek fires several — repeating the same work
     * within one frame.
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

    // `run`, not `measure` — this is the pass that answers a pause, and the Player can
    // still commit the frame it stopped on after telling us it stopped, so the trailing
    // read is exactly as necessary here as it is after a seek.
    run();

    return () => {
      player?.removeEventListener("frameupdate", run);
      window.removeEventListener("resize", run);
      ro?.disconnect();
      if (trailing.current) cancelAnimationFrame(trailing.current);
    };
  }, [measure, paused, playerRef, screenRef]);

  return (
    <div className="vc-slots">
      {rects.map((r, i) => {
        const label = `Edit ${r.editable.label}`;
        return (
          <button
            /**
             * Position in the list, not the slot name.
             *
             * The slot name is NOT unique on screen, whatever this file used to claim: a
             * face is dealt to more than one card, and mid-transition both scenes are
             * mounted with a full set of marks each. React was therefore reconciling a
             * list with repeated keys, which it does by keeping the first of each and
             * dropping the rest — so a duplicate slot pinned a button in place and it
             * survived every later measurement. That is the "hover chip over nothing"
             * this file's whole visibility pass exists to prevent, arriving by a
             * completely different route: not a target that was measured wrong, but one
             * that was measured right and then never let go of.
             */
            key={`${r.domKey}#${i}`}
            className={[
              "vc-slotbtn",
              // A badge and a value disc are circles; a square outline round one reads as
              // a different, larger element than the thing about to be edited.
              r.round ? "vc-slotico" : "",
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
