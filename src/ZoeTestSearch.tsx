import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { ZoeTestSearchCut } from "./ZoeTestSearchCut";

/**
 * The `Zoe-test-search` composition — a working copy of the full 5300-frame L2 cut, on
 * the same approved baseline as `L2VirginAirline`: Spotify's green, Spotify's wordmark,
 * Daniel Ek, the stock portraits.
 *
 * Identical to VirginAirline except for which timeline it mounts. This one gets
 * `ZoeTestSearchCut`, its own copy of the sequence list, so retiming or reordering here
 * leaves both `L2VirginAirline` and `Zoe-test-comms` untouched. The scene components
 * underneath are shared by all three — see the header of ZoeTestSearchCut.tsx for exactly
 * where the independence stops.
 */
export const ZoeTestSearch: React.FC = () => (
  <CustomizationProvider>
    <ZoeTestSearchCut />
  </CustomizationProvider>
);
