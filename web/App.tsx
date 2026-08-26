import React, { useCallback, useEffect, useRef, useState } from "react";
import { Backdrop } from "./Backdrop";
import { CompanyStep } from "./steps/CompanyStep";
import { PersonStep } from "./steps/PersonStep";
import { BrandStep } from "./steps/BrandStep";
import { ImageryStep } from "./steps/ImageryStep";
import { Reveal } from "./Reveal";
import { readImages, readOneImage } from "./uploads";
import { INITIAL_STATE, STEPS, type WizardState } from "./wizardState";
import { acceptLogoFile, logoPatch } from "./applyLogo";
import { PasscodeGate } from "./PasscodeGate";
import { passcodeRequired, storedPasscode } from "./passcode";
import { runResearch } from "./research";
import { ResearchChip } from "./ResearchChip";
import {
  cleanHex,
  css,
  inkOn,
  isHex,
  rgba,
  uiAccentOf,
} from "../src/customize/color";

/**
 * The wizard's own chrome takes the brand colour too, but not the same value the video
 * gets. The page is near-black, so a customer's navy or maroon would disappear against
 * it; `uiAccentOf` lifts it to something readable HERE while the composition keeps the
 * operator's actual colour. Two derivations, one source.
 */
const applyUiAccent = (hex: string) => {
  const clean = cleanHex(hex);
  if (!isHex(clean)) return;
  const accent = uiAccentOf(clean);
  const root = document.documentElement.style;
  root.setProperty("--brand", css(clean));
  root.setProperty("--accent", css(accent));
  root.setProperty("--accent-ink", inkOn(accent));
  root.setProperty("--accent-soft", rgba(accent, 0.13));
  root.setProperty("--accent-glow", rgba(accent, 0.2));
};

export const App: React.FC = () => {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [step, setStep] = useState(0);
  /** Furthest step reached, so the rail can jump back but not skip ahead. */
  const [seen, setSeen] = useState(0);
  const [revealing, setRevealing] = useState(false);
  /**
   * null while we are asking the server whether this deployment wants a passcode.
   *
   * Three states rather than a boolean: rendering the wizard and then yanking it away
   * when the answer comes back would flash the form at someone who is not allowed to use
   * it, and rendering the gate first would flash it at every local run.
   */
  const [locked, setLocked] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    passcodeRequired().then((required) => {
      if (live) setLocked(required && !storedPasscode());
    });
    return () => {
      live = false;
    };
  }, []);

  const patch = useCallback(
    (p: Partial<WizardState>) => setState((s) => ({ ...s, ...p })),
    [],
  );

  const show = useCallback((i: number) => {
    setStep(i);
    setSeen((s) => Math.max(s, i));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => applyUiAccent(state.color), [state.color]);

  /**
   * The company the in-flight (or finished) research belongs to.
   *
   * Guards against two things: firing the same expensive call twice when the operator
   * steps back and forward, and leaving a finished result attached to a company they
   * have since renamed.
   */
  const researchedFor = useRef<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  /**
   * Start the copywriting pass in the background.
   *
   * Called on leaving the COMPANY step — the first moment the pass has what it actually
   * needs, which is a company name and the operator's free-text context. It used to fire
   * a step later, off the Character step, so that the main character's name could go into
   * the prompt; that bought one small prompt improvement and cost the whole Character
   * step's worth of latency, which is the wrong trade on a pass that now makes five model
   * calls across a three-and-a-half-minute film.
   *
   * What that name was protecting — the shout-out not thanking the person writing it — is
   * now enforced in `toInputProps`, where both halves are known regardless of when the
   * pass ran. See src/customize/shoutOut.ts.
   */
  const startResearch = useCallback((s: WizardState) => {
    const company = s.company.trim();
    if (!company || researchedFor.current === company) return;

    researchedFor.current = company;
    inFlight.current?.abort();
    const ctrl = new AbortController();
    inFlight.current = ctrl;

    setState((cur) => ({ ...cur, research: { status: "running", company } }));

    runResearch(
      {
        company,
        context: s.context,
        person: { name: s.person.name, title: s.person.title },
      },
      ctrl.signal,
    )
      .then((res) =>
        setState((cur) =>
          // Only land the result if it is still the company being worked on — the
          // operator may have gone back and renamed it while this was in the air.
          cur.company.trim() === company
            ? { ...cur, research: { status: "done", company, ...res } }
            : cur,
        ),
      )
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        researchedFor.current = null; // let a retry through
        setState((cur) =>
          cur.company.trim() === company
            ? {
                ...cur,
                research: {
                  status: "error",
                  company,
                  error: err instanceof Error ? err.message : "Research failed.",
                },
              }
            : cur,
        );
      });
  }, []);

  const retryResearch = useCallback(() => {
    researchedFor.current = null;
    setState((cur) => {
      startResearch(cur);
      return cur;
    });
  }, [startResearch]);

  useEffect(() => () => inFlight.current?.abort(), []);

  // Paste goes to whichever drop target the current step is about. The company step has
  // none, so a paste there is ignored rather than guessed at.
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (!files.length || revealing) return;
      if (step === 3) {
        const ups = await readImages(files);
        setState((s) => ({ ...s, shots: [...s.shots, ...ups] }));
      } else if (step === 2) {
        // Same path as dropping it on the Brand step — matte knocked out, knockout
        // derived, palette pulled. Pasting used to store the raw file, which put a
        // white-boxed colour mark in every dark header.
        const accepted = await acceptLogoFile(files);
        if (accepted) setState((s) => ({ ...s, ...logoPatch(accepted, s) }));
      } else if (step === 1) {
        const up = await readOneImage(files);
        if (up) setState((s) => ({ ...s, person: { ...s.person, photo: up } }));
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [step, revealing]);

  if (locked === null) {
    // One paint of the backdrop while the check is in flight. Short enough that a
    // spinner would be noise.
    return (
      <div className="vc">
        <Backdrop />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="vc">
        <Backdrop />
        <main>
          <PasscodeGate onUnlock={() => setLocked(false)} />
        </main>
      </div>
    );
  }

  return (
    <>
      {/* The wizard's chrome. Scoped styles hang off this wrapper; the reveal is
          deliberately OUTSIDE it, because it hosts the composition's own DOM. */}
      <div className="vc">
        <Backdrop />

        <header className="vc-hud">
          <div className="vc-mark">
            <i /> Video Customizer
          </div>
          <nav className="vc-rail">
            {STEPS.map((label, i) => (
              <button
                key={label}
                className={[
                  i === step ? "vc-now" : "",
                  i < seen || i < step ? "vc-seen" : "",
                  i < step ? "vc-done" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => i <= seen && show(i)}
              >
                <span className="vc-lab">{label}</span>
                <span className="vc-bar">
                  <i />
                </span>
              </button>
            ))}
          </nav>
        </header>

        <ResearchChip state={state.research} onRetry={retryResearch} />

        <main>
          {step === 0 && (
            <CompanyStep
              state={state}
              patch={patch}
              onNext={() => {
                startResearch(state);
                show(1);
              }}
            />
          )}
          {step === 1 && (
            <PersonStep
              state={state}
              patch={patch}
              onNext={() => show(2)}
              onBack={() => show(0)}
              backLabel={STEPS[0]}
            />
          )}
          {step === 2 && (
            <BrandStep
              state={state}
              patch={patch}
              onNext={() => show(3)}
              onBack={() => show(1)}
              backLabel={STEPS[1]}
            />
          )}
          {step === 3 && (
            <ImageryStep
              state={state}
              patch={patch}
              onBuild={() => setRevealing(true)}
              onBack={() => show(2)}
              backLabel={STEPS[2]}
            />
          )}
        </main>
      </div>

      {revealing && (
        <Reveal
          state={state}
          patch={patch}
          onEdit={() => setRevealing(false)}
        />
      )}
    </>
  );
};
