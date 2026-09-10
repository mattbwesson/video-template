import type React from "react";
import { CustomizedZoetest } from "../src/CustomizedZoetest";
import { CustomizedZoeTestSearch } from "../src/CustomizedZoeTestSearch";
import { CustomizedZoeTestPeople } from "../src/CustomizedZoeTestPeople";
import { customizedCombined } from "../src/CustomizedCombined";
import { ZOETEST_CUT_DURATION } from "../src/ZoetestCut";
import { SEARCH_CUT_DURATION } from "../src/ZoeTestSearchCut";
import { PEOPLE_CUT_DURATION } from "../src/ZoeTestPeopleCut";
import { combinedDuration, orderPillars } from "../src/cuts/plan";
import type { VideoInputProps } from "../src/customize/videoCopy";

/**
 * The templates an operator can choose between, and everything the wizard needs to know
 * about each one.
 *
 * ONE table, deliberately. Before this the composition was named in four places — the
 * `<Player>` in Reveal, the duration printed under it, the still probe and the render
 * itself — and every one of them said "CustomizedWorkvivo" as a literal. Adding a second
 * template that way means four edits per template and a silent class of bug where the
 * preview plays one film and the render encodes another. Both now read `component` and
 * `durationInFrames` off the entry the operator picked, so they cannot drift.
 *
 * Every template must:
 *
 *  - take the whole customisation as its props (`Partial<VideoInputProps>`), so the same
 *    wizard state drives any of them with no per-template plumbing; and
 *  - lay down `reference="wizard"` rather than the master encode, because the deployed
 *    image does not ship the 310 MB file. See CustomizedZoetest for the detail.
 *
 * `L2VirginAirline` is deliberately NOT here. It is the approved 212-second film and it
 * stays a Studio composition; the wizard customises the three derived cuts, one per
 * pillar of the wheel the film itself puts up. Putting it back
 * is one entry — `CustomizedWorkvivo` and `CUSTOMIZED_CUT_DURATION`, both already
 * exported — if a full-length option is ever wanted.
 *
 * The components are imported statically rather than lazily. `Reveal` already imported
 * one of them at module scope, so the scene tree is in the wizard's initial bundle either
 * way; pretending otherwise here would only hide that.
 */

export type TemplateId = "zoe-test-comms" | "zoe-test-search" | "zoe-test-people";

export type VideoTemplate = {
  /**
   * Stable key. Handed to the renderer as the composition id and recorded against every
   * render event — so it is deliberately NOT renamed when the operator-facing `label`
   * changes, and it does not have to match the Studio composition it derives from.
   *
   * A `string` rather than a `TemplateId` since the wizard started combining pillars: a
   * multi-pillar cut has no single-pillar id, and its key is the pillars it is made of
   * (`combo:zoe-test-comms+zoe-test-people`). That shape is deliberate — an analytics row
   * for a combined render says which chapters were in it without a lookup.
   */
  id: string;
  /** Operator-facing name. The only place either cut is named for a human. */
  label: string;
  /** One line under the label: what this cut is. */
  blurb: string;
  /** The longer note on the card. Two sentences at most — it is a chooser, not a manual. */
  detail: string;
  component: React.FC<Partial<VideoInputProps>>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
};

/**
 * One pillar as the chooser presents it.
 *
 * The first step is a multi-select over these rather than a single pick over the templates
 * below, which is the same list seen from the other end: a pillar IS a template when it is
 * the only one ticked. `pillar` is the short name — the words the film's own wheel puts on
 * screen — used wherever several of them have to be named in one line.
 */
export type Pillar = VideoTemplate & { pillar: string };

const FPS = 25;
const WIDTH = 1920;
const HEIGHT = 1080;

export const TEMPLATES: readonly Pillar[] = [
  {
    id: "zoe-test-comms",
    pillar: "Communication & Engagement",
    label: "Communications & Engagement Focus",
    blurb: "A shortened cut of the L2 Virgin Airline film.",
    detail:
      "About half of the full 212-second film: the home feed and desktop, the livestream, spaces, the space page, journeys and newsletters, then the customer wall and the workvivo HQ endcard.",
    component: CustomizedZoetest,
    durationInFrames: ZOETEST_CUT_DURATION,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  },
  {
    id: "zoe-test-search",
    pillar: "Search & Knowledge",
    label: "Search & Knowledge Focus",
    blurb: "A shorter cut of the same film, on Search & Knowledge.",
    detail:
      "The film's own opening, then the pillar card, Ask HQ, the HQ Agent and the mobile answer, then its ending. The two joins are a dissolve and a dip through the brand colour.",
    component: CustomizedZoeTestSearch,
    durationInFrames: SEARCH_CUT_DURATION,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  },
  {
    id: "zoe-test-people",
    pillar: "People Intelligence",
    label: "People Intelligence Focus",
    blurb: "A shorter cut of the same film, on People Intelligence.",
    detail:
      "The film's own opening, then the pillar card, Analytics and the Seer run — manager insights, the rater, comments and the survey on mobile — the space feed, integrations and Admin Hub, then its ending.",
    component: CustomizedZoeTestPeople,
    durationInFrames: PEOPLE_CUT_DURATION,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  },
];

/** The one an operator lands on. The longest of the three, so the default says the most. */
export const DEFAULT_TEMPLATE_ID: TemplateId = "zoe-test-comms";

/**
 * Look a template up by id, falling back to the default.
 *
 * Total rather than partial on purpose: this is called from the render path, and a
 * `TemplateId` that has been removed from the table since a project was started should
 * produce the default film rather than a crash three minutes into an encode.
 */
export const templateById = (id: TemplateId): Pillar =>
  TEMPLATES.find((t) => t.id === id) ??
  (TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) as Pillar);

/** "A, B and C" — the one place several pillars are named in a single line. */
const andList = (parts: readonly string[]): string =>
  parts.length <= 1
    ? (parts[0] ?? "")
    : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

/**
 * The one cut a selection of pillars produces.
 *
 * This is the seam the multi-select hangs off, and everything downstream — the `<Player>`,
 * the footer readout, the render button, the analytics row — takes the entry it returns
 * and asks no further questions. That is the point: a preview playing one film while the
 * render encodes another is the failure this shape exists to make impossible.
 *
 * ONE pillar returns its own approved cut rather than a one-chapter combined one.
 * `Zoe-test-comms`, `Zoe-test-search` and `Zoe-test-people` are signed off frame by frame,
 * and `CombinedCut` would re-derive each of them from the same windows to within a handful
 * of frames. "Within a handful" is not "identical", and there is nothing to gain by
 * re-deriving a film that already exists — so a single tick plays the film it has always
 * played. Only combinations, which had no cut before, go through `CombinedCut`.
 *
 * An empty selection falls back to the default single cut. The wizard will not send one —
 * Continue is gated on at least one pillar — but this is also on the render path, and the
 * fallback keeps a stale saved selection from producing a video with no chapters in it.
 */
export const templateForPillars = (picked: readonly TemplateId[]): VideoTemplate => {
  const chosen = orderPillars(picked).map(templateById);

  if (chosen.length <= 1) return chosen[0] ?? templateById(DEFAULT_TEMPLATE_ID);

  const ids = chosen.map((t) => t.id) as TemplateId[];
  return {
    id: `combo:${ids.join("+")}`,
    label: andList(chosen.map((t) => t.pillar)),
    blurb: `The film's opening, ${chosen.length} chapters, and its ending — as one video.`,
    detail:
      "One intro and one ending, whichever chapters are in between. The chapters play in " +
      "the film's own order, and the joins where two of them are already consecutive in " +
      "the film are left alone rather than dissolved.",
    component: customizedCombined(ids),
    durationInFrames: combinedDuration(ids),
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  };
};
