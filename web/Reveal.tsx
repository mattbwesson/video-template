import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { CustomizedWorkvivo } from "../src/CustomizedWorkvivo";
import { CUSTOMIZED_CUT_DURATION } from "../src/WorkvivoCut";
import { toInputProps, type WizardState } from "./wizardState";
import { SwapOverlay } from "./SwapOverlay";
import { EditPanel } from "./EditPanel";
import { RenderButton } from "./RenderButton";
import { ExportProjectButton } from "./ExportProjectButton";
import { assignImagery } from "../src/customize/imagery";
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

/**
 * The project file — build the video here, render it at full quality elsewhere.
 *
 * Shipped everywhere, because this is how a finished video actually gets made: the reveal
 * screen is where someone decides the film is right, and this is the button that carries
 * that decision to a renderer. Gating it to dev would mean the deployed wizard could
 * author a video and then offer no way to produce one, and an SE would have to rebuild
 * their work locally just to press a button.
 *
 * It is safe to expose because it exports data, not a video: whoever holds the file still
 * needs a machine set up to render it. The site is behind a shared passcode in any case.
 * See docs/local-render.md.
 */
const SHOW_PROJECT_EXPORT = true;

/**
 * The in-tab encode. Local only.
 *
 * It uses `@remotion/web-renderer`, a canvas renderer with emulated CSS that the film does
 * not survive intact — sprite icons, blend modes and CSS background photos all come out
 * wrong. Useful for a rough look while developing, and precisely the wrong thing to hand
 * someone who might send the result to a customer.
 *
 * `import.meta.env.DEV` is statically false in the production build, so Vite drops the
 * component from the shipped bundle rather than merely hiding it.
 */
const SHOW_BROWSER_RENDER = import.meta.env.DEV;

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

  const assignIcon = useCallback(
    (path: string) => {
      if (!editing?.icon) return;
      patch({ iconOverrides: { ...state.iconOverrides, [editing.icon]: path } });
    },
    [editing, patch, state.iconOverrides],
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
    const next = { ...state.iconOverrides };
    delete next[editing.icon];
    patch({ iconOverrides: next });
  }, [editing, patch, state.iconOverrides]);

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
                : "Click anything in the video to edit it"}
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
              {/* Writes the project file for a local render in real Chromium — the
                  renderer the preview above and every approved still come from — so it is
                  the one that produces a sendable video. */}
              {SHOW_PROJECT_EXPORT && (
                <ExportProjectButton
                  inputProps={inputProps}
                  company={state.company}
                />
              )}
              {/* The in-tab encode: instant, but a different renderer, so the file does
                  not match the preview. Dev only — see browserRender.ts. */}
              {SHOW_BROWSER_RENDER && (
                <RenderButton
                  inputProps={inputProps}
                  company={state.company}
                  durationInFrames={CUSTOMIZED_CUT_DURATION}
                  fps={FPS}
                  width={1920}
                  height={1080}
                />
              )}
            </span>
          </div>
        </div>

        {editing && (
          <EditPanel
            editable={editing}
            shots={state.shots}
            currentImage={currentImage}
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
