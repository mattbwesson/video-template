/**
 * The deployed wizard's passcode.
 *
 * The app is a static bundle, so it cannot hold a secret — anything compiled into it is
 * readable in devtools. The passcode is therefore something a HUMAN types, kept only for
 * the length of the tab and sent as `x-api-key` on the one call that spends money.
 *
 * `sessionStorage`, not `localStorage`: a shared demo machine should not leave the
 * passcode behind for whoever opens the browser next.
 */

const KEY = "vc-passcode";

export const storedPasscode = (): string => {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    // Private browsing modes can throw on storage access. A wizard that works for one
    // session without remembering the passcode beats one that will not start.
    return "";
  }
};

export const rememberPasscode = (value: string): void => {
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    /* see above */
  }
};

export const forgetPasscode = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* see above */
  }
};

/** Does this deployment want a passcode at all? Local dev normally does not. */
export const passcodeRequired = async (): Promise<boolean> => {
  try {
    const res = await fetch("/api/session");
    if (!res.ok) return false;
    return Boolean(((await res.json()) as { required?: boolean }).required);
  } catch {
    // If the check itself fails there is nothing to unlock — let the wizard open and let
    // the research call report the real problem.
    return false;
  }
};

/** True when the passcode is accepted. Throws only on a network failure. */
export const checkPasscode = async (passcode: string): Promise<boolean> => {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });
  return res.ok;
};
