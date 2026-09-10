import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { ZoeTestPeopleCut } from "./ZoeTestPeopleCut";

/**
 * The `Zoe-test-people` composition — the People Intelligence chapter of the L2 cut, on
 * the same approved baseline as `L2VirginAirline`: Spotify's green, Spotify's wordmark,
 * Daniel Ek, the stock portraits.
 *
 * Identical to VirginAirline except for which timeline it mounts. This one gets
 * `ZoeTestPeopleCut`, its own copy of the sequence list and of every shot helper those
 * sequences use, so retiming or reordering here leaves `L2VirginAirline`, `Zoe-test-comms`
 * and `Zoe-test-search` untouched. The scene components underneath are shared by all four
 * — see the header of ZoeTestPeopleCut.tsx for exactly where the independence stops.
 */
export const ZoeTestPeople: React.FC = () => (
  <CustomizationProvider>
    <ZoeTestPeopleCut />
  </CustomizationProvider>
);
