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
  /** Tried in order after `exact` misses; `$1` etc. refer to capture groups. */
  patterns?: ReadonlyArray<readonly [RegExp, string]>;
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
export const useT = (): (<T extends Text>(s: T) => T) => {
  const strings = useContext(UiContext);
  return useCallback(
    <T extends Text>(s: T): T => {
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
      const hit = strings.exact[core];
      if (hit !== undefined) return put(hit);
      for (const [re, out] of strings.patterns ?? []) {
        if (re.test(core)) return put(core.replace(re, out));
      }
      return s;
    },
    [strings],
  );
};
