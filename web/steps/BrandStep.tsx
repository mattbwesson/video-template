import React, { useRef } from "react";
import { FileDrop } from "../Dropzone";
import { acceptLogoFile, logoPatch } from "../applyLogo";
import { processReversedLogo } from "../logoProcess";
import { isImageFile, newUploadId } from "../uploads";
import { brandReady, type WizardState } from "../wizardState";
import {
  clampBrandAccentHex,
  cleanHex,
  css,
  isHex,
  type Hex,
} from "../../src/customize/color";

export const BrandStep: React.FC<{
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
  backLabel: string;
}> = ({ state, patch, onNext, onBack, backLabel }) => {
  const swatchRef = useRef<HTMLDivElement>(null);

  const setLogo = async (files: FileList | File[]) => {
    const accepted = await acceptLogoFile(files);
    if (!accepted) return;
    patch(logoPatch(accepted, state));
    // The swatch pulses only when the drop actually changed the colour, so a logo swap
    // after the operator picked their own does not flash a colour that did not move.
    if (!state.colorTouched && accepted.palette.length) {
      swatchRef.current?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }],
        { duration: 560, easing: "cubic-bezier(.2,.9,.3,1.2)" },
      );
    }
  };

  /**
   * The reversed logo, supplied by hand when the derived one is wrong.
   *
   * Kept separate from `setLogo` on purpose: this file is white already, so it must not
   * go through the matte pass, which would erase it. See `processReversedLogo`.
   */
  const setWhiteLogo = async (files: FileList | File[]) => {
    const file = Array.from(files).find(isImageFile);
    if (!file) return;
    const url = await processReversedLogo(file);
    if (!url) return;
    patch({ logoWhiteUpload: { id: newUploadId(), url, name: file.name } });
  };

  /** The white mark the video is using right now — theirs if given, else the derived one. */
  const whiteInUse = state.logoWhiteUpload?.url || state.logoWhite;

  const setColor = (raw: string) => {
    const v = cleanHex(raw);
    if (!isHex(v)) return;
    patch({ color: v, colorTouched: true });
  };

  /** Promote a palette colour to the brand, demoting the current one into its place. */
  const promote = (index: number) => {
    const next = [...state.palette];
    const chosen = next[index];
    next[index] = state.color;
    patch({ color: chosen, palette: next, colorTouched: true });
  };

  const addSwatch = (raw: string) => {
    const v = cleanHex(raw);
    if (!isHex(v) || v === state.color || state.palette.includes(v)) return;
    patch({ palette: [...state.palette, v] });
  };

  const clamped: Hex = clampBrandAccentHex(state.color);
  const wasDarkened = clamped !== state.color;

  const note = state.palette.length
    ? "Used for accents in the video. Click one to make it the main colour."
    : state.logo
      ? "Nothing else in the logo. Add colours with the plus."
      : "Drop the logo and we will pull these out of it.";

  return (
    <section className="vc-stage">
      <div className="vc-eyebrow vc-mono">
        Step three <b>of four</b>
      </div>
      <h1>Bring your brand in.</h1>
      <p className="vc-lede">
        Drop the logo and we will pull the colours straight out of it. Adjust if
        we get it wrong.
      </p>

      <div className="vc-brandgrid">
        <div className="vc-dropwrap">
          <FileDrop
            className={`vc-drop${state.logo ? " vc-has" : ""}`}
            label="Your logo"
            onFiles={setLogo}
          >
            {state.logo ? (
              <img src={state.logo.url} alt="Your logo" />
            ) : (
              <span>
                <strong>Drop your logo</strong>
                <br />
                <span className="vc-mono">or click to browse</span>
              </span>
            )}
          </FileDrop>
          {state.logo && <span className="vc-replace vc-mono">click to replace</span>}

          {/* The white version, shown on dark ground because that is the only place it
              is ever used and the only ground it can be judged on. It is a preview as
              much as an input: the derived knockout is a guess, and seeing it here is
              how an operator finds out it filled in their logo's cut-outs. */}
          {state.logo && (
            <div className="vc-whitewrap">
              <FileDrop
                className={`vc-drop2${whiteInUse ? " vc-has" : ""}`}
                label="White version of your logo"
                onFiles={setWhiteLogo}
              >
                {whiteInUse ? (
                  <img src={whiteInUse} alt="White version of your logo" />
                ) : (
                  <span className="vc-mono">add white version</span>
                )}
              </FileDrop>
              <div className="vc-whitefoot">
                <span className="vc-mono">
                  {state.logoWhiteUpload ? "Your white version" : "Made from your logo"}
                </span>
                {state.logoWhiteUpload ? (
                  <button
                    className="vc-link"
                    onClick={() => patch({ logoWhiteUpload: null })}
                  >
                    Use the made one
                  </button>
                ) : (
                  <span className="vc-mono vc-dim">click to replace</span>
                )}
              </div>
              <p className="vc-swatchnote">
                Used on every dark header. If the made one has filled in a cut-out or
                lost detail, drop your brand kit&rsquo;s reversed logo here.
              </p>
            </div>
          )}
        </div>

        <div className="vc-colorpane">
          <div
            className="vc-bigswatch"
            ref={swatchRef}
            style={{ background: css(state.color) }}
          >
            <input
              type="color"
              value={css(state.color)}
              aria-label="Pick brand colour"
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="vc-hexrow">
            <span>#</span>
            <label className="vc-sr" htmlFor="hex">
              Brand colour hex code
            </label>
            <input
              id="hex"
              maxLength={6}
              spellCheck={false}
              value={state.color}
              onChange={(e) => {
                const v = cleanHex(e.target.value);
                // Track every keystroke so the field can be cleared and retyped; only
                // a complete six-digit value reaches the video.
                patch({ color: v as Hex, ...(isHex(v) ? { colorTouched: true } : {}) });
              }}
            />
          </div>

          {wasDarkened && (
            <p className="vc-clampnote">
              <i style={{ background: css(clamped) }} />
              Darkened for the full-frame shots, so white type still reads on it.
            </p>
          )}

          <div className="vc-pulled">
            <span className="vc-mono">Additional palette</span>
            <div className="vc-sws">
              {state.palette.map((h, i) => (
                <span
                  className="vc-swrap"
                  key={`${h}-${i}`}
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  <button
                    className="vc-sw"
                    style={{ background: css(h) }}
                    title={`Make #${h} the main colour`}
                    aria-label={`Make #${h} the main colour`}
                    onClick={() => promote(i)}
                  />
                  <button
                    className="vc-swx"
                    title={`Remove #${h}`}
                    aria-label={`Remove #${h}`}
                    onClick={() =>
                      patch({ palette: state.palette.filter((_, j) => j !== i) })
                    }
                  >
                    ✕
                  </button>
                </span>
              ))}
              <label className="vc-addsw" title="Add a colour">
                ＋
                <input
                  type="color"
                  defaultValue={css(state.color)}
                  aria-label="Add a colour to the palette"
                  onChange={(e) => addSwatch(e.target.value)}
                />
              </label>
            </div>
            <p className="vc-swatchnote">{note}</p>
          </div>
        </div>
      </div>

      <div className="vc-foot">
        <button className="vc-btn" disabled={!brandReady(state)} onClick={onNext}>
          Continue
        </button>
        <button className="vc-back" onClick={onBack}>
          ← {backLabel}
        </button>
      </div>
    </section>
  );
};
