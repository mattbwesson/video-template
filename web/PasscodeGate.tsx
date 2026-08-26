import React, { useState } from "react";
import { checkPasscode, rememberPasscode } from "./passcode";

/**
 * The one screen in front of the deployed wizard.
 *
 * It guards the research call, not the app: the bundle is public either way, and saying
 * so is better than implying the whole thing is private. What is behind it is the OpenAI
 * key, which every research run spends.
 */
export const PasscodeGate: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "wrong" | "error">(
    "idle",
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || state === "checking") return;
    setState("checking");
    try {
      if (await checkPasscode(value)) {
        rememberPasscode(value);
        onUnlock();
        return;
      }
      setState("wrong");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="vc-stage vc-gate">
      <div className="vc-eyebrow vc-mono">Video Customizer</div>
      <h1>Enter the passcode.</h1>
      <p className="vc-lede">
        The copywriting step runs against a paid API, so it sits behind a shared
        passcode. Ask whoever sent you the link.
      </p>

      <form className="vc-field" onSubmit={submit}>
        <label className="vc-sr" htmlFor="passcode">
          Passcode
        </label>
        <input
          id="passcode"
          className="vc-bigin"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="••••••••"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (state !== "checking") setState("idle");
          }}
        />
        {state === "wrong" && (
          <p className="vc-gate-err">That passcode is not right.</p>
        )}
        {state === "error" && (
          <p className="vc-gate-err">
            Could not reach the server. Try again in a moment.
          </p>
        )}
        <div className="vc-foot">
          <button
            className="vc-btn"
            type="submit"
            disabled={!value.trim() || state === "checking"}
          >
            {state === "checking" ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
    </section>
  );
};
