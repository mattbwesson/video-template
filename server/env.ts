/**
 * Server-side configuration, read from `.env` once at startup.
 *
 * Nothing here is ever sent to the browser. The wizard calls our own route and this
 * process holds the key — the alternative, putting the key in `import.meta.env` so the
 * browser can call OpenAI directly, would ship it to anyone who opens devtools.
 */

import fs from "node:fs";
import path from "node:path";

let loaded = false;

/**
 * `process.loadEnvFile` (Node 20.12+) rather than dotenv: one fewer dependency, and it
 * has the same precedence rule — a variable already in the real environment wins over
 * the file, so a deployment can override without editing anything.
 */
const load = (): void => {
  if (loaded) return;
  loaded = true;
  const file = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  try {
    process.loadEnvFile(file);
  } catch {
    // A malformed .env should not take the dev server down; the missing-key error
    // below is a much clearer thing to hit.
  }
};

const str = (key: string, fallback: string): string => {
  load();
  const v = process.env[key];
  return v && v.trim() ? v.trim() : fallback;
};

const num = (key: string, fallback: number): number => {
  const v = Number(str(key, ""));
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const bool = (key: string, fallback: boolean): boolean => {
  const v = str(key, "").toLowerCase();
  if (!v) return fallback;
  return v === "1" || v === "true" || v === "yes" || v === "on";
};

export type LlmConfig = {
  apiKey: string;
  model: string;
  /** Cheap and fast by default — the guide's §5.9 "start here, not at full effort". */
  reasoningEffort: string;
  maxOutputTokens: number;
  webSearch: boolean;
  webSearchToolType: string;
  webSearchContextSize: string;
};

export const llmConfig = (): LlmConfig => ({
  apiKey: str("OPENAI_API_KEY", ""),
  model: str("OPENAI_MODEL", "gpt-5-mini"),
  reasoningEffort: str("OPENAI_REASONING_EFFORT", "low"),
  maxOutputTokens: num("OPENAI_MAX_OUTPUT_TOKENS", 6000),
  webSearch: bool("OPENAI_WEB_SEARCH", true),
  // The hosted search tool has been renamed across API versions
  // (`web_search_preview` -> `web_search`), so which one to send is configuration
  // rather than something to hardcode and rediscover when a call starts 400ing.
  webSearchToolType: str("OPENAI_WEB_SEARCH_TOOL_VERSION", "web_search"),
  webSearchContextSize: str("OPENAI_WEB_SEARCH_CONTEXT_SIZE", "low"),
});

/**
 * The shared passcode the wizard sends with each request. Empty means the route is open.
 *
 * `PASSCODE` and nothing else. It briefly fell back to `API_KEY`, which was a mistake:
 * in this project `API_KEY` means the OpenAI key, so the fallback would have quietly made
 * a paid credential the thing the gate compares typed input against. Wrong on its face,
 * and the sort of wrong that only shows up the day someone unsets the other variable.
 */
export const passcodeGuard = (): string => str("PASSCODE", "");

/**
 * Enforce `API_KEY` even for a request that arrives on the loopback interface.
 *
 * The research route exempts loopback, on the reasoning that a connection from this
 * machine is a property the browser cannot forge. That is true on a laptop and false
 * behind a reverse proxy running on the same host, where every request would look local
 * and the guard would silently open. Deployments set this to 1 and stop depending on
 * what their network topology happens to be today.
 */
export const requireApiKey = (): boolean => bool("REQUIRE_API_KEY", false);
