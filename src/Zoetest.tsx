import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { CombinedCut } from "./CombinedCut";

/**
 * The `Zoe-test-comms` composition — the film's opening, the Communication & Engagement
 * chapter, and the film's ending, on the same approved baseline as `L2VirginAirline`.
 *
 * It used to be `ZoetestCut`, a hand-forked copy of the film's whole sequence list kept so
 * this cut could be retimed without moving `L2VirginAirline`. That independence is what
 * went wrong with it: the fork was taken before the film rebuilt its opening title card and
 * closing strapline as scenes, and a copied timeline does not follow. It is a one-chapter
 * plan now, assembled by `CombinedCut` from the same windows every other cut uses, so the
 * film and its cuts cannot drift apart again. See src/cuts/plan.ts.
 */
export const Zoetest: React.FC = () => (
  <CustomizationProvider>
    <CombinedCut pillars={["zoe-test-comms"]} />
  </CustomizationProvider>
);
