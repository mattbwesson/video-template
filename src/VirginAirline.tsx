import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { WorkvivoCut } from "./WorkvivoCut";

/**
 * The full 5300-frame L2 cut, on the approved baseline: Spotify's green, Spotify's
 * wordmark, Daniel Ek, the stock portraits.
 *
 * It goes through the same provider as the customised composition with no input, so the
 * baseline is not a separate code path — it is the customised path with every slot left
 * at its default. That is what makes "the demo still renders as signed off" something
 * the type system enforces rather than something to remember.
 */
export const VirginAirline: React.FC = () => (
  <CustomizationProvider>
    <WorkvivoCut />
  </CustomizationProvider>
);
