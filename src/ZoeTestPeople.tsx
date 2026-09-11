import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { CombinedCut } from "./CombinedCut";

/**
 * The `Zoe-test-people` composition — the film's opening, the People Intelligence chapter
 * and the integrations and admin run that follows it, then the film's ending, on the same
 * approved baseline as `L2VirginAirline`.
 *
 * A one-chapter plan, assembled by `CombinedCut`. It was a hand-forked timeline until that
 * fork fell behind the film it was cut from — this cut was the worst affected of the three,
 * carrying nearly six hundred frames of footage the film had already rebuilt as scenes. See
 * src/Zoetest.tsx.
 */
export const ZoeTestPeople: React.FC = () => (
  <CustomizationProvider>
    <CombinedCut pillars={["zoe-test-people"]} />
  </CustomizationProvider>
);
