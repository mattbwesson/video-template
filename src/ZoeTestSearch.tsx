import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { CombinedCut } from "./CombinedCut";

/**
 * The `Zoe-test-search` composition — the film's opening, the Search & Knowledge chapter,
 * and the film's ending, on the same approved baseline as `L2VirginAirline`.
 *
 * A one-chapter plan, assembled by `CombinedCut`. It was a hand-forked timeline until that
 * fork fell behind the film it was cut from; see src/Zoetest.tsx for the whole story.
 */
export const ZoeTestSearch: React.FC = () => (
  <CustomizationProvider>
    <CombinedCut pillars={["zoe-test-search"]} />
  </CustomizationProvider>
);
