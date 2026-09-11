import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { CombinedCut } from "./CombinedCut";
import { PILLAR_IDS } from "./cuts/plan";

/**
 * The `Zoe-test-all-pillars` composition — every chapter of the film between one intro and
 * one ending, on the same approved baseline as `L2VirginAirline`: Spotify's green,
 * Spotify's wordmark, Daniel Ek, the stock portraits.
 *
 * It is here so a combined cut can be scrubbed and reviewed in the Studio, which is where
 * every other cut in this repo gets looked at. All three pillars is the longest and busiest
 * of the four combinations the wizard can produce and carries every join the others do
 * except the two that only appear when a chapter is skipped, so it is the one worth having
 * a permanent composition for. The other combinations are reachable by editing the
 * `pillars` prop below, or by ticking boxes in the wizard.
 *
 * Nothing about the wizard's output depends on this file — that route goes through
 * `customizedCombined`, which mounts the same `CombinedCut` with the operator's
 * customisation flowed into it. See src/CustomizedCombined.tsx.
 */
export const ZoeTestAllPillars: React.FC = () => (
  <CustomizationProvider>
    <CombinedCut pillars={PILLAR_IDS} />
  </CustomizationProvider>
);
