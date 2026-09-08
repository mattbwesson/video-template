import type React from "react";
import { CustomizedZoetest } from "../src/CustomizedZoetest";
import { CustomizedZoeTestSearch } from "../src/CustomizedZoeTestSearch";
import { ZOETEST_CUT_DURATION } from "../src/ZoetestCut";
import { SEARCH_CUT_DURATION } from "../src/ZoeTestSearchCut";
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
 * stays a Studio composition; the wizard customises the two derived cuts. Putting it back
 * is one entry — `CustomizedWorkvivo` and `CUSTOMIZED_CUT_DURATION`, both already
 * exported — if a full-length option is ever wanted.
 *
 * The components are imported statically rather than lazily. `Reveal` already imported
 * one of them at module scope, so the scene tree is in the wizard's initial bundle either
 * way; pretending otherwise here would only hide that.
 */

export type TemplateId = "zoe-test-comms" | "zoe-test-search";

export type VideoTemplate = {
  id: TemplateId;
  /** Shown on the chooser card and in the step rail's summary. */
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

const FPS = 25;
const WIDTH = 1920;
const HEIGHT = 1080;

export const TEMPLATES: readonly VideoTemplate[] = [
  {
    id: "zoe-test-comms",
    label: "Zoe-test-comms",
    blurb: "A shortened cut of the L2 Virgin Airline film.",
    detail:
      "About 102 seconds of the full 212-second film: the home feed and desktop, the livestream, spaces, the space page, journeys and newsletters, then the customer wall and the workvivo HQ endcard.",
    component: CustomizedZoetest,
    durationInFrames: ZOETEST_CUT_DURATION,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  },
  {
    id: "zoe-test-search",
    label: "Zoe-test-search",
    blurb: "A shorter cut of the same film, on Search & Knowledge.",
    detail:
      "About 49 seconds. The film's own opening, then the pillar card, Ask HQ, the HQ Agent and the mobile answer, then its ending. The two joins are a dissolve and a dip through the brand colour.",
    component: CustomizedZoeTestSearch,
    durationInFrames: SEARCH_CUT_DURATION,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
  },
];

/** The one an operator lands on. The longer of the two shortened cuts. */
export const DEFAULT_TEMPLATE_ID: TemplateId = "zoe-test-comms";

/**
 * Look a template up by id, falling back to the default.
 *
 * Total rather than partial on purpose: this is called from the render path, and a
 * `TemplateId` that has been removed from the table since a project was started should
 * produce the default film rather than a crash three minutes into an encode.
 */
export const templateById = (id: TemplateId): VideoTemplate =>
  TEMPLATES.find((t) => t.id === id) ??
  (TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID) as VideoTemplate);
