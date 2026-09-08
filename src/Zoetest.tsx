import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { ZoetestCut } from "./ZoetestCut";

/**
 * The `Zoetest` composition — a working copy of the full 5300-frame L2 cut, on the same
 * approved baseline as `L2VirginAirline`: Spotify's green, Spotify's wordmark, Daniel Ek,
 * the stock portraits.
 *
 * Identical to VirginAirline except for which timeline it mounts. This one gets
 * `ZoetestCut`, its own copy of the sequence list, so retiming or reordering here leaves
 * `L2VirginAirline` untouched. The scene components underneath are still shared — see the
 * header of ZoetestCut.tsx for exactly where the independence stops.
 */
export const Zoetest: React.FC = () => (
  <CustomizationProvider>
    <ZoetestCut />
  </CustomizationProvider>
);
