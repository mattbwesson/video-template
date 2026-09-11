import type React from "react";
import { customizedCombined } from "../src/CustomizedCombined";
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
 * Every template takes the whole customisation as its props (`Partial<VideoInputProps>`), so
 * the same wizard state drives any of them with no per-template plumbing.
 *
 * EVERY ENTRY IS A PLAN NOW, single pillar or not. There used to be three hand-forked
 * compositions here, one per pillar, named as the approved cuts; they were copies of a
 * timeline taken before the film rebuilt its last stretches of reference footage, so they
 * went on playing that footage — a Virgin-branded title card and strapline at either end of
 * every customer's video. `customizedCombined` derives all of them from the same windows
 * instead, which is why the durations below are computed rather than imported.
 *
 * `L2VirginAirline` is deliberately NOT here. It is the approved 212-second film and it
 * stays a Studio composition; the wizard customises cuts of it, one per pillar of the wheel
 * the film itself puts up. Putting it back is one entry — `CustomizedWorkvivo` and
 * `CUSTOMIZED_CUT_DURATION`, both already exported — if a full-length option is ever wanted.
 *
 * The components are built statically rather than lazily. `Reveal` already imported one at
 * module scope, so the scene tree is in the wizard's initial bundle either way; pretending
 * otherwise here would only hide that.
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
  /**
   * One line under the name: what is IN this chapter.
   *
   * Contents rather than description — "Home feed, livestream, spaces, journeys and
   * newsletters", not "a shortened cut of the film". The first step asks an operator to
   * turn chapters off, and the only thing that helps them decide is knowing what they lose.
   */
  blurb: string;
  /** The longer list, behind "What is in it". Still a chooser, not a manual. */
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
    blurb: "Home feed, livestream, spaces, journeys and newsletters.",
    detail:
      "The home feed and desktop, the livestream, spaces and the space page, journeys, the signage, and the newsletters.",
    component: customizedCombined(["zoe-test-comms"]),
    durationInFrames: combinedDuration(["zoe-test-comms"]),
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  },
  {
    id: "zoe-test-search",
    pillar: "Search & Knowledge",
    label: "Search & Knowledge Focus",
    blurb: "Ask HQ, the HQ Agent and the mobile answer.",
    detail:
      "The pillar card, the Ask bar, HQ Search and the HQ Agent answering, then the answer opening out onto mobile.",
    component: customizedCombined(["zoe-test-search"]),
    durationInFrames: combinedDuration(["zoe-test-search"]),
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  },
  {
    id: "zoe-test-people",
    pillar: "People Intelligence",
    label: "People Intelligence Focus",
    blurb: "Analytics, the Seer run and the survey on mobile.",
    detail:
      "The pillar card, Analytics, and the Seer run — manager insights, the rater, comments and the survey on mobile — then the space feed, the AI survey builder, integrations, the Admin Hub and the governance run.",
    component: customizedCombined(["zoe-test-people"]),
    durationInFrames: combinedDuration(["zoe-test-people"]),
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
 * ONE pillar returns its entry from the table above, which is itself a one-chapter plan, so
 * a single tick and a combination are the same machinery with a different chapter list.
 * They were not always: a single pillar used to play a hand-forked composition, which is
 * how those three came to be months out of date with the film they were cut from.
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
