import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { CustomizedWorkvivo } from "../src/CustomizedWorkvivo";
import { CUSTOMIZED_CUT_DURATION } from "../src/WorkvivoCut";
import { resolveSlotSource, toInputProps, type WizardState } from "./wizardState";
import { SwapOverlay } from "./SwapOverlay";
import { EditPanel } from "./EditPanel";
import { RenderButton } from "./RenderButton";
import { assignImagery, SLOT_ATTR } from "../src/customize/imagery";
import { bakeFraming, FRAME0, isDefaultFraming, type Framing } from "./framing";
import { resolveHeader, type HeaderTreatment } from "../src/customize/headers";
import { clampBrandAccentHex } from "../src/customize/color";
import type { Editable } from "../src/customize/editables";
import type { Upload } from "./uploads";

/**
 * The payoff screen: their photos fly into the middle, the real composition plays, and
 * every component in it can be edited.
 *
 * The prototype stood a hand-animated slideshow in for the video. This is the actual
 * `CustomizedWorkvivo` composition running in `@remotion/player` on the same
 * `inputProps` a render would receive — so what the operator approves here is what comes
 * out the other end, rather than an impression of it.
 */

const FPS = 25;

/** How long the fly-in runs before the player is revealed underneath it. */
const ASSEMBLY_MS = 1500;

/** Deterministic scatter. `Math.random()` would re-place every tile on each re-render. */
const scatter = (i: number) => {
  const golden = 0.6180339887;
  const a = ((i + 1) * golden) % 1;
  const b = ((i + 1) * golden * golden) % 1;
  return {
    left: `${8 + a * 84}%`,
    top: `${8 + b * 84}%`,
    rotate: `${(b * 40 - 20).toFixed(1)}deg`,
  };
};

export const Reveal: React.FC<{
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  onEdit: () => void;
}> = ({ state, patch, onEdit }) => {
  const player = useRef<PlayerRef>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [assembling, setAssembling] = useState(true);
  const [run, setRun] = useState(0);
  /**
   * The component the panel is open on.
   *
   * The whole `Editable` rather than its key, because the panel needs its parts on every
   * render and a key would mean a lookup in three places that could each disagree.
   */
  const [editing, setEditing] = useState<Editable | null>(null);
  /**
   * The shape of the position the panel is open on, measured when it opened.
   *
   * Captured at open time rather than read on demand because it can only be measured while
   * the element is on screen, and the Player mounts one frame at a time — scrub away and
   * the element the panel is editing no longer exists in the DOM. The video is paused on
   * open (see `openDrawer`), so the measurement is of a still frame and stable.
   */
  const [frameAspect, setFrameAspect] = useState(0);

  const inputProps = useMemo(() => toInputProps(state), [state]);
  const flying = state.shots.slice(0, 14);

  /** What each position is showing right now: a pin if there is one, else the deal. */
  const dealt = useMemo(
    () => assignImagery(state.shots.map((u) => u.url)),
    [state.shots],
  );

  const currentImage = editing?.image
    ? (state.imageOverrides[editing.image] ?? dealt[editing.image] ?? "")
    : "";
  const currentIcon = editing?.icon
    ? (state.iconOverrides[editing.icon] ?? "")
    : "";
  /**
   * The banner's live treatment, resolved the same way the composition resolves it.
   *
   * Resolved rather than read raw off `headerOverrides`, so the panel opens showing the
   * values the video is ACTUALLY painting — a header nobody has touched shows 65% or 78%
   * and the right logo state, not a row of blanks.
   */
  const currentHeader = editing?.header
    ? resolveHeader(editing.header, state.headerOverrides)
    : null;

  useEffect(() => {
    setAssembling(true);
    const t = window.setTimeout(() => {
      setAssembling(false);
      player.current?.seekTo(0);
      player.current?.play();
    }, ASSEMBLY_MS);
    return () => window.clearTimeout(t);
  }, [run]);

  const closeDrawer = useCallback(() => setEditing(null), []);

  // Escape closes the panel first and only then leaves the reveal — otherwise the one
  // key that means "back out of this" would throw away the whole screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editing) closeDrawer();
      else onEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEdit, editing, closeDrawer]);

  /**
   * Opening the panel pauses the video.
   *
   * Not politeness — necessity. The targets are measured from the live DOM, so a shot
   * that is still moving takes its hit target with it and the thing being edited slides
   * out from under the cursor.
   */
  const openDrawer = useCallback((editable: Editable) => {
    player.current?.pause();
    setEditing(editable);

    // Measure the real frame before the panel draws, so the Framing stage opens at the
    // shape the cut actually uses rather than flashing a square and correcting itself.
    // The rect is the element's own box, which for a `cover`-fitted photo IS the frame.
    const slot = editable.image;
    const el = slot
      ? screen.current?.querySelector(`[${SLOT_ATTR}="${slot}"]`)
      : null;
    const rect = el?.getBoundingClientRect();
    setFrameAspect(
      rect && rect.width > 1 && rect.height > 1 ? rect.width / rect.height : 0,
    );
  }, []);

  const assignImage = useCallback(
    (url: string) => {
      if (!editing?.image) return;
      patch({
        imageOverrides: { ...state.imageOverrides, [editing.image]: url },
      });
    },
    [editing, patch, state.imageOverrides],
  );

  /**
   * The freshest state, for callbacks that fire after an await.
   *
   * `patch` merges into whatever `setState` holds, but the object being merged has to be
   * built from something — and building it from the `state` captured when a bake STARTED
   * would undo anything the operator did while the canvas was working. A ref is the
   * smallest way to read the current value at write time without threading a functional
   * setter down from App.
   */
  const latest = useRef(state);
  latest.current = state;

  /**
   * Attach finished bakes to their positions.
   *
   * Skips any entry that has since been deleted or re-dragged (`baked` non-empty means a
   * newer bake already landed), so a slow encode can never overwrite a newer crop.
   */
  const setBakes = useCallback(
    (pairs: ReadonlyArray<readonly [string, string]>) => {
      const framing = { ...latest.current.framing };
      let changed = false;
      for (const [slot, url] of pairs) {
        const cur = framing[slot];
        if (!cur || cur.baked) continue;
        framing[slot] = { ...cur, baked: url };
        changed = true;
      }
      if (changed) patch({ framing });
    },
    [patch],
  );

  /** This position's crop, or the untouched default. */
  const currentFraming: Framing = editing?.image
    ? (state.framing[editing.image] ?? FRAME0)
    : FRAME0;

  /**
   * Record a drag or a zoom.
   *
   * Only the NUMBERS are written here — `baked` is cleared, and the effect below picks the
   * entry up once the operator stops moving. Baking on every pointermove would re-encode a
   * JPEG sixty times a second and stall the drag; leaving the previous bake in place
   * instead would show a crop one drag behind the stage.
   *
   * Returning to the default deletes the entry rather than storing 50/50/1, so "I have not
   * cropped this" and "I cropped it back to centre" are the same state — and the video
   * goes back to the operator's own upload rather than a JPEG re-encode of it.
   */
  const editFraming = useCallback(
    (next: Framing) => {
      const slot = editing?.image;
      if (!slot) return;
      const framing = { ...state.framing };
      if (isDefaultFraming(next)) delete framing[slot];
      else
        framing[slot] = {
          ...next,
          src: currentImage,
          aspect: frameAspect,
          baked: "",
        };
      patch({ framing });
    },
    [editing, patch, state.framing, currentImage, frameAspect],
  );

  /**
   * Bake whatever framing is still unbaked, shortly after it stops changing.
   *
   * Every entry is checked, not just the one being edited: swapping a photo in the Image
   * section invalidates that position's bake (`src` no longer matches), and this is what
   * notices and re-crops it.
   *
   * The 220ms delay is the debounce — the effect re-runs on every drag frame and clears
   * its own timer, so the canvas work happens once the operator lets go.
   */
  useEffect(() => {
    const stale = Object.entries(state.framing).filter(
      ([slot, f]) =>
        !f.baked && f.aspect > 0 && f.src === resolveSlotSource(state, dealt, slot),
    );
    if (!stale.length) return;

    let live = true;
    const timer = window.setTimeout(async () => {
      const baked = await Promise.all(
        stale.map(async ([slot, f]) => {
          try {
            return [slot, await bakeFraming(f.src, f.aspect, f)] as const;
          } catch {
            // A photo the canvas cannot read is left unbaked; the position keeps showing
            // the uncropped original, which is wrong but visible, rather than blank.
            return [slot, ""] as const;
          }
        }),
      );
      if (!live) return;
      // Read through the CURRENT state rather than the closed-over copy: the operator can
      // have moved on during the encode, and writing the whole map back would resurrect
      // entries they deleted.
      setBakes(baked.filter(([, url]) => url));
    }, 220);

    return () => {
      live = false;
      window.clearTimeout(timer);
    };
    // `state` in full, because `resolveSlotSource` reads the overrides and the shots too.
  }, [state, dealt, setBakes]);

  /**
   * Pin an icon to the open position — and, for a Quick Links tile, rename it to match.
   *
   * A tile is a mark AND the name under it. Picking Slack and being left with a tile that
   * still says "Service Now" is not a swap, it is a bug the operator then has to notice
   * and fix by hand. The name comes from the icon's own filename (`labelFor`), which is
   * the only thing that actually knows what was picked.
   *
   * Written as an override rather than silently: it lands in `copyOverrides` like any
   * other edit, so the Text field shows it and the operator can still change it after.
   */
  /**
   * The copy path holding a Quick Links tile's label, given its icon slot.
   *
   * Derived from the slot rather than looked up in `editing.text`, which is where this
   * used to come from: the panel no longer offers a text field for these tiles — a label
   * is only ever right if it came from the icon — so there is nothing in `text` to find.
   */
  const captionPathFor = (icon: string): string | null =>
    icon.startsWith("app.quicklink.")
      ? `spotlight.apps.${icon.slice(icon.lastIndexOf(".") + 1)}`
      : null;

  const assignIcon = useCallback(
    (path: string, label: string) => {
      if (!editing?.icon) return;
      const next: Partial<WizardState> = {
        iconOverrides: { ...state.iconOverrides, [editing.icon]: path },
      };
      const caption = captionPathFor(editing.icon);
      if (caption) {
        next.copyOverrides = { ...state.copyOverrides, [caption]: label };
      }
      patch(next);
    },
    [editing, patch, state.iconOverrides, state.copyOverrides],
  );

  /**
   * Back to the artwork the scene ships with.
   *
   * Deletes the key rather than storing "", because the provider's fallback is "no entry
   * for this slot" — an empty string would be a swap to nothing, and the disc would draw
   * empty instead of drawing its own icon.
   */
  const resetIcon = useCallback(() => {
    if (!editing?.icon) return;
    const icons = { ...state.iconOverrides };
    delete icons[editing.icon];
    const next: Partial<WizardState> = { iconOverrides: icons };
    // The name that came WITH the icon goes back too, or "use the original" would restore
    // Workday's mark under whatever the last pick was called.
    const caption = captionPathFor(editing.icon);
    if (caption) {
      const copy = { ...state.copyOverrides };
      delete copy[caption];
      next.copyOverrides = copy;
    }
    patch(next);
  }, [editing, patch, state.iconOverrides, state.copyOverrides]);

  const editHeader = useCallback(
    // `next`, not `patch` — the outer `patch` is the wizard's own setter, and shadowing
    // it here made this function call itself.
    (next: Partial<HeaderTreatment>) => {
      if (!editing?.header) return;
      const slot = editing.header;
      patch({
        headerOverrides: {
          ...state.headerOverrides,
          [slot]: { ...(state.headerOverrides[slot] ?? {}), ...next },
        },
      });
    },
    [editing, patch, state.headerOverrides],
  );

  const editText = useCallback(
    (path: string, value: string) =>
      patch({ copyOverrides: { ...state.copyOverrides, [path]: value } }),
    [patch, state.copyOverrides],
  );

  const addShots = useCallback(
    (added: Upload[]) => patch({ shots: [...state.shots, ...added] }),
    [patch, state.shots],
  );

  const edits =
    Object.keys(state.imageOverrides).length +
    Object.keys(state.framing).length +
    Object.keys(state.iconOverrides).length +
    Object.keys(state.copyOverrides).length;

  return (
    <div className="vc-finale">
      {assembling && (
        <div className="vc-assembly">
          {flying.map((shot, i) => {
            const s = scatter(i);
            return (
              <div
                key={shot.id}
                className="vc-fly"
                style={{
                  left: s.left,
                  top: s.top,
                  ["--r" as string]: s.rotate,
                  backgroundImage: `url(${shot.url})`,
                  animationDelay: `${i * 55}ms`,
                }}
              />
            );
          })}
        </div>
      )}

      <div
        className={`vc-review${assembling ? "" : " vc-on"}${editing ? " vc-open" : ""}`}
      >
        <div className="vc-rv-main">
          <div className="vc-screen" ref={screen}>
            <Player
              ref={player}
              component={CustomizedWorkvivo}
              inputProps={inputProps}
              durationInFrames={CUSTOMIZED_CUT_DURATION}
              fps={FPS}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%" }}
              controls
              // The cut opens on a hard scale-down and a mask close in the first 33
              // frames. Looping straight back into that from the livestream reads as a
              // glitch, so it plays once and the operator replays deliberately.
              loop={false}
              acknowledgeRemotionLicense
            />
            {!assembling && (
              <SwapOverlay
                screenRef={screen}
                playerRef={player}
                editing={editing?.key ?? null}
                onPick={openDrawer}
              />
            )}
          </div>
          <div className="vc-pfoot">
            <span className="vc-mono">
              {CUSTOMIZED_CUT_DURATION} frames ·{" "}
              {(CUSTOMIZED_CUT_DURATION / FPS).toFixed(0)}s · 1920×1080
            </span>
            <span className="vc-mono vc-tip">
              {edits
                ? `${edits} edit${edits === 1 ? "" : "s"}`
                : "Pause the video, then click anything in the frame to edit it"}
            </span>
            <span className="vc-sp">
              <button
                className="vc-btn vc-quiet"
                onClick={() => {
                  closeDrawer();
                  setRun((r) => r + 1);
                }}
              >
                Replay
              </button>
              <button className="vc-btn vc-quiet" onClick={onEdit}>
                Back to editing
              </button>
              {/* The one way out of the wizard: the in-tab encode. It is a different
                  renderer from the preview above, so what it produces is still being
                  brought into line frame by frame — see the fidelity note in
                  browserRender.ts. */}
              <RenderButton
                inputProps={inputProps}
                company={state.company}
                durationInFrames={CUSTOMIZED_CUT_DURATION}
                fps={FPS}
                width={1920}
                height={1080}
              />
            </span>
          </div>
        </div>

        {editing && (
          <EditPanel
            editable={editing}
            shots={state.shots}
            currentImage={currentImage}
            framing={currentFraming}
            frameAspect={frameAspect}
            onEditFraming={editFraming}
            currentIcon={currentIcon}
            header={currentHeader}
            brandHex={clampBrandAccentHex(state.color)}
            copy={inputProps.copy}
            copyOverrides={state.copyOverrides}
            onAssignImage={assignImage}
            onAddShots={addShots}
            onAssignIcon={assignIcon}
            onResetIcon={resetIcon}
            onEditHeader={editHeader}
            onEditText={editText}
            onClose={closeDrawer}
          />
        )}
      </div>
    </div>
  );
};
