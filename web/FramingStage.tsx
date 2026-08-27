import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FRAME0,
  clampPct,
  frameSlack,
  isDefaultFraming,
  previewBackgroundSize,
  type Framing,
} from "./framing";

/**
 * Drag to choose what the frame keeps.
 *
 * A direct port of the reference's `.fr-stage` / `wireFraming()`, kept close to it on
 * purpose: the pointer maths there is the non-obvious part and it is right. The one thing
 * to understand is that a drag is measured against SLACK — how far the photo hangs outside
 * the frame — so that dragging the full width of the stage moves the photo exactly to the
 * end of its travel, whatever the zoom. A fixed px-to-percent ratio would feel loose on a
 * barely-spilling photo and glacial on a heavily zoomed one.
 *
 * This is wizard chrome, not composition, so it draws with `background-image` /
 * `background-position` — the very properties that do not survive the export. That is fine
 * *here* and nowhere else; the video gets a baked crop instead (see framing.ts).
 */

const RULE_OF_THIRDS = "vc-fr-stage";

export const FramingStage: React.FC<{
  /** The photo being framed. */
  src: string;
  /** Aspect ratio (w/h) of the real frame in the cut, measured from the Player. */
  aspect: number;
  value: Framing;
  /** Fires continuously during a drag. */
  onChange: (next: Framing) => void;
  /** A human name for the frame's shape, for the hint line. */
  shapeLabel: string;
}> = ({ src, aspect, value, onChange, shapeLabel }) => {
  const stage = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  /** Natural aspect of the photo, 0 until it has loaded. */
  const [ar, setAr] = useState(0);

  useEffect(() => {
    let live = true;
    setAr(0);
    const img = new Image();
    img.onload = () => {
      if (live) setAr(img.naturalWidth / img.naturalHeight || 1);
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  /**
   * Move the photo by a pointer delta.
   *
   * `slack` is in frame units and negative where there is spill, so `dx / (slack.x * width)`
   * converts pixels of pointer travel into a fraction of the available travel. An axis with
   * no spill is skipped rather than clamped, so a photo that already fits does not jitter
   * against its own limits.
   */
  const nudge = useCallback(
    (dx: number, dy: number) => {
      const el = stage.current;
      if (!el || !ar) return;
      const box = el.getBoundingClientRect();
      const s = frameSlack(ar, aspect, value);
      const next = { ...value };
      // Slack is expressed against a frame one unit tall, so scale it back to pixels.
      const slackPxX = s.x * box.height;
      const slackPxY = s.y * box.height;
      if (slackPxX < -0.5) next.x = clampPct(value.x + (dx / slackPxX) * 100);
      if (slackPxY < -0.5) next.y = clampPct(value.y + (dy / slackPxY) * 100);
      if (next.x !== value.x || next.y !== value.y) onChange(next);
    },
    [ar, aspect, value, onChange],
  );

  const last = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    last.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    nudge(e.clientX - last.current.x, e.clientY - last.current.y);
    last.current = { x: e.clientX, y: e.clientY };
  };
  const endDrag = () => setDragging(false);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 16 : 5;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    nudge(d[0], d[1]);
  };

  const slack = ar ? frameSlack(ar, aspect, value) : { x: 0, y: 0 };
  const hasRoom = slack.x < -0.01 || slack.y < -0.01;

  return (
    <>
      <div
        ref={stage}
        className={`${RULE_OF_THIRDS}${dragging ? " vc-fr-drag" : ""}`}
        tabIndex={0}
        role="application"
        aria-label="Drag to reframe this photo. Arrow keys nudge it."
        style={{
          aspectRatio: `${aspect}`,
          backgroundImage: `url("${src.replace(/"/g, "%22")}")`,
          backgroundPosition: `${value.x}% ${value.y}%`,
          backgroundSize: previewBackgroundSize(ar, aspect, value.z),
          cursor: hasRoom ? undefined : "default",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      />

      <div className="vc-fr-row">
        <span>Zoom</span>
        <input
          type="range"
          min={100}
          max={240}
          step={1}
          value={Math.round(value.z * 100)}
          aria-label="Zoom"
          onChange={(e) => onChange({ ...value, z: Number(e.target.value) / 100 })}
        />
        <button
          className="vc-fr-reset"
          disabled={isDefaultFraming(value)}
          onClick={() => onChange({ ...FRAME0 })}
        >
          Reset
        </button>
      </div>

      {/* The reference's own hint, and worth keeping: a photo that already matches the
          frame has nothing to slide, and without being told so the operator drags at a
          stage that does not move and concludes the feature is broken. */}
      <p className="vc-fr-cap">
        {hasRoom
          ? `Drag to choose what the ${shapeLabel} frame keeps.`
          : `Nothing is cut off — this photo already fits the ${shapeLabel} frame. Zoom in if you want to crop it.`}
      </p>
    </>
  );
};
