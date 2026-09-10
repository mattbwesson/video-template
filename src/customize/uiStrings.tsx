import React, { createContext, useCallback, useContext } from "react";

/**
 * UI chrome strings — the words that belong to the PRODUCT, not to the customer.
 *
 * "View All", "Members", the side nav, "posted an article": none of it is in the copy
 * table, and none of it should be — the research pass rewrites what a customer's video
 * SAYS, not what Workvivo's buttons are called. But a localised cut needs all of it in
 * its language, and it lives as literals in forty components.
 *
 * So every string a component renders goes through `ui()`. With no provider above it,
 * `ui` is the identity and `ui("View All")` is the text node "View All" was — the English
 * cuts render byte-for-byte what they rendered before, which a hash test over four
 * frames checked when this landed. A localised composition mounts `UiStringsProvider`
 * and only its subtree changes.
 *
 * Keys are the English strings themselves, so a component stays readable and a missing
 * translation degrades to English rather than to a key like `nav.home`. `patterns` cover
 * the strings with a number in them — "3,251 Members", "1 day ago" — which cannot be
 * listed one by one.
 */
export type UiStrings = {
  exact: Readonly<Record<string, string>>;
  /**
   * How words are separated when a scene lays several out on one line.
   *
   * The kinetic scenes split a sentence into slots so each can animate on its own, and
   * put a gap between them — correct for English, where the slots are words, and wrong
   * for Japanese, where they are clause fragments that must butt together: 休暇 and 明け
   * are one word and a 0.20em gap inside it is a typo the animation happens to draw.
   *
   * Locale typography, not copy, which is why it rides with the strings rather than
   * being a prop threaded through ten scenes. Defaults reproduce the English exactly.
   */
  wordGap?: { sep: string; gapEm: string };
  /**
   * Tried in order after `exact` misses; `$1` etc. refer to capture groups.
   *
   * A replacement may be a FUNCTION instead, receiving the capture groups. A plain `$n`
   * substitutes the English text verbatim, which is right for a number and wrong for
   * anything that has to be translated on the way through: `"$1年$2月"` against
   * `/(\d+) (Jan|Feb)/` renders 2026年Jan月. Anything that maps a word rather than copying
   * it needs the function form.
   */
  patterns?: ReadonlyArray<
    readonly [RegExp, string | ((...groups: string[]) => string)]
  >;
};

const UiContext = createContext<UiStrings | null>(null);

export const UiStringsProvider: React.FC<{
  strings: UiStrings;
  children: React.ReactNode;
}> = ({ strings, children }) => (
  <UiContext.Provider value={strings}>{children}</UiContext.Provider>
);

type Text = string | number | null | undefined;

/**
 * The translator. Identity when no provider is mounted. Non-strings pass straight
 * through, so it can wrap any JSX child without changing what React would have done
 * with a number, a null, or an undefined.
 */
const DEFAULT_WORD_GAP = { sep: " ", gapEm: "0.20em" } as const;

/**
 * The inter-word separator and margin for scenes that lay slots out on one line.
 * Identity for English — `" "` and `0.20em` are the values those scenes hardcoded.
 */
export const useWordGap = (): { sep: string; gapEm: string } =>
  useContext(UiContext)?.wordGap ?? DEFAULT_WORD_GAP;

/**
 * Translate one string. Identity when no provider is mounted.
 *
 * `ctx` disambiguates a key that means two things. "Back" is the survey's back button
 * (戻る) and the first word of the "Back from time off?" card, and one flat dictionary
 * cannot serve both — the card came out 戻る休暇明け？. `ui("Back", "timeoff")` looks up
 * `timeoff/Back` first and falls back to the bare key, so a context only has to be given
 * where there is a clash.
 */
export const useT = (): (<T extends Text>(s: T, ctx?: string) => T) => {
  const strings = useContext(UiContext);
  return useCallback(
    <T extends Text>(s: T, ctx?: string): T => {
      if (!strings || typeof s !== "string") return s;
      // Same-line spaces around a JSX text node are part of it, so they arrive here.
      // Look up the trimmed core and hand the spaces back, so keys stay clean.
      const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s) as RegExpExecArray;
      const [, before, raw, after] = m;
      // JSX collapses a text node's internal newlines and indentation to single spaces
      // when it renders; do the same to the key, so a paragraph split across source lines
      // matches a dictionary entry written on one.
      const core = raw.replace(/\s+/g, " ");
      const put = (v: string) => (before + v + after) as T;
      const scoped = ctx ? strings.exact[`${ctx}/${core}`] : undefined;
      if (scoped !== undefined) return put(scoped);
      const hit = strings.exact[core];
      if (hit !== undefined) return put(hit);
      for (const [re, out] of strings.patterns ?? []) {
        if (re.test(core)) {
          return put(typeof out === "string" ? core.replace(re, out) : core.replace(re, out));
        }
      }
      return s;
    },
    [strings],
  );
};
