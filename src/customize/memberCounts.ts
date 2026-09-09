/**
 * How many people are in a space, derived from the company's size rather than written.
 *
 * These numbers used to be researched copy — a `members` slot per space with a guide
 * asking the model to "scale it to this company's real headcount". That asks a language
 * model to be consistent about arithmetic across a dozen independent fields, which it is
 * not: a 300-person agency would get a space with 28,000 members in it, and the ten
 * directory cards would not agree with each other or with the Space page that opens from
 * one of them.
 *
 * So the model answers the one question it is actually good at — is this a small, medium
 * or large employer — and the counts come from here. Every number in the film is then
 * consistent by construction, and the ceiling is a fact about the code rather than a
 * request in a prompt.
 */

import type { WorkvivoCopy } from "./videoCopy";

export type CompanySize = WorkvivoCopy["companySize"];

/**
 * The hard ceiling per band. No space in the film may exceed its company's number.
 *
 * Set by the client. A company-wide space holds most of the workforce, so the largest
 * space sits just under the cap and everything else scales beneath it.
 */
export const MEMBER_CAP: Record<CompanySize, number> = {
  small: 800,
  medium: 5_000,
  large: 50_000,
};

/**
 * The relative size of each space, taken from the approved baseline and normalised so the
 * biggest is 1.
 *
 * Written as the baseline's own numbers divided by the largest of them, at FULL precision,
 * rather than as tidied decimals. That is what keeps the output looking like a real member
 * count: a ratio of 0.78 lands on 36,000, a ratio of 22024/28163 lands on 36,208. The
 * spread is the one the film was designed around either way — a couple of company-wide
 * spaces, several departmental ones, a few small clubs.
 */
const BASELINE = [28163, 3655, 22024, 3296, 12655, 3824, 9412, 5108, 1977, 14206];
const SHAPE = BASELINE.map((n) => n / BASELINE[0]);

/**
 * How close the biggest space gets to the cap.
 *
 * Deliberately not a round fraction. At 0.92 the largest space in a 50,000-person company
 * came out as exactly 46,000, and every count derived from it inherited the roundness —
 * a set of numbers that reads as generated rather than counted. 0.9263 costs nothing and
 * makes the same space 26,085.
 */
const HEADROOM = 0.9263;

/** `4632` -> `"4,632 Members"`. */
const format = (n: number): string =>
  `${n.toLocaleString("en-US")} Members`;

/**
 * Whole people, and nothing else.
 *
 * This used to round to the nearest 10 under a thousand and the nearest 100 above, on the
 * reasoning that a tidy number reads as a real one. It does the opposite: every count in
 * the film ended in "00" at once, which no real directory does.
 */
const tidy = (n: number): number => Math.round(n);

/**
 * The Nth space in the directory, and anywhere else that shows one of the same spaces.
 *
 * `index` is the position in `spaces.directory`, so the same space reports the same count
 * wherever it appears — the directory, the Trending cards on the homepage, the Spotlight
 * tab and the Space page all read the same entry.
 */
const spaceCount = (size: CompanySize, index: number): number =>
  tidy(MEMBER_CAP[size] * HEADROOM * SHAPE[index % SHAPE.length]);

export const spaceMembers = (size: CompanySize, index: number): string =>
  format(spaceCount(size, index));

/**
 * A space that everyone is in — the survey space at global 4066-4253.
 *
 * The one place the count should read as "the whole company", so it sits at the cap
 * rather than under the shape. Still never above it.
 */
const companyWideCount = (size: CompanySize): number =>
  tidy(MEMBER_CAP[size] * 0.9863);

export const companyWideMembers = (size: CompanySize): string =>
  format(companyWideCount(size));

/**
 * A small interest group — the Run Club on the homepage, and its like.
 *
 * Its own ratio rather than a position in SHAPE, because SHAPE describes the DIRECTORY,
 * whose smallest entry is still a department. A club is an order of magnitude below that
 * (the baseline's Run Club is 648 against a biggest space of 28,163), and reusing a
 * departmental ratio for it made every club in the film look like a division.
 */
export const clubMembers = (size: CompanySize): string =>
  format(tidy(MEMBER_CAP[size] * HEADROOM * 0.02307));

/**
 * The engagement survey behind the Seer dashboard at global 3758-3903: who it went to, how
 * many answered, and how many finished.
 *
 * WHY THESE ARE DERIVED WHEN THE REST OF THAT SCREEN IS NOT
 * The `seer` group's own note in videoCopy.ts says every number on those screens is fixed
 * on purpose. That rule is about a MODEL inventing plausible-looking figures, and it still
 * holds — scores, the NPS split, the heatmap and the timeline are all still fixed. These
 * three are different in kind: they are HEADCOUNTS, and a headcount that does not follow
 * `companySize` is the exact failure this file exists to prevent. Left hard-coded, an
 * employer of under 800 people got a dashboard reporting a survey audience of 13,860.
 *
 * NOT THE WHOLE COMPANY
 * The audience is a share of it, not all of it: the screen is a manager's view with a
 * Segments control on it, and the survey's own space elsewhere in the film carries the
 * whole company. The share is the captured screen's own 13,860 against the large band's
 * 50,000 cap — the band those screens were captured at — so the large band renders exactly
 * what the reference does and only the bands that were previously unreachable move.
 *
 * The two RATES are the source, not a fourth and fifth number: the cards print 75% and 95%
 * beside these rows, and deriving each row from the rate above it is what stops the two
 * from ever disagreeing. Rounding can move a row by half a person and nothing else.
 */
const SURVEY_SHARE = 0.2772;
export const SURVEY_RESPONSE_RATE = 0.75;
export const SURVEY_COMPLETION_RATE = 0.95;

export const surveyAudience = (size: CompanySize): number =>
  tidy(MEMBER_CAP[size] * SURVEY_SHARE);
export const surveyResponses = (size: CompanySize): number =>
  tidy(surveyAudience(size) * SURVEY_RESPONSE_RATE);
export const surveyCompletions = (size: CompanySize): number =>
  tidy(surveyResponses(size) * SURVEY_COMPLETION_RATE);

/**
 * A bare count, no "Members" after it.
 *
 * `separator` is not decoration. The captured dashboard prints its audience and response
 * figures with thousands separators and its completions figure without one — "10,395" next
 * to "9875" — and that is the product's own inconsistency, reproduced rather than tidied,
 * because tidying it would put the one band the screen was captured at out of step with the
 * reference for no gain.
 */
export const countText = (n: number, separator = true): string =>
  separator ? n.toLocaleString("en-US") : String(n);

/**
 * The "+N" chip at the end of an avatar row, derived from the count the row sits under.
 *
 * It was the string "12k+", hard-coded on the Space page. That number is the APPROVED
 * BASELINE's own count for that space — BASELINE[4] is 12,655 — so it was right when the
 * screen was captured and has been wrong ever since the counts started being derived: at
 * the large band that space holds 20,812 people and the chip still said twelve thousand.
 * At the small band it said "12k+" next to "333 Members", which is not a stale number, it
 * is a contradiction on screen. Nobody saw it because every video shipped at "large" until
 * `companySize` was given to the model.
 *
 * The rule is read off that same artwork: 12,655 members behind five faces is 12,650, and
 * the chip reads the thousands, floored. Below a thousand there is no artwork to copy, so
 * it shows what it actually means — the people the row is not showing.
 */
export const memberOverflow = (
  size: CompanySize,
  index: number,
  facesShown: number,
): string => {
  // From the same arithmetic the count above it uses, not by parsing that count back out
  // of its own formatted string: "20,812 Members" only reparses while the separator stays
  // a comma, and the two would drift apart silently the day it does not.
  const rest = Math.max(0, spaceCount(size, index) - facesShown);
  return rest >= 1000 ? `${Math.floor(rest / 1000)}k+` : `${rest}+`;
};

/**
 * Which SHAPE position each recurring space uses.
 *
 * The homepage's Trending cards, the Spotlight tab and the in-app screen all show the
 * SAME three spaces, so they share indices here — otherwise the same space would report a
 * different count depending on which screen it appeared on, which is exactly the
 * inconsistency this file exists to remove.
 */
export const TRENDING_INDEX = [8, 6, 1] as const;

/** The Space page opens from the fifth directory card, so it reads that entry's count. */
export const SPACE_PAGE_INDEX = 4;
