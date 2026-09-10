import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { ZoeTestPeopleCut } from "./ZoeTestPeopleCut";
import type { VideoInputProps } from "./customize/videoCopy";

/**
 * The People Intelligence cut, as the wizard drives it.
 *
 * Same relationship `CustomizedZoetest` and `CustomizedZoeTestSearch` have to their own
 * Studio compositions: one serialisable customisation object flows from the wizard's state
 * into the `<Player>` and then into the render.
 *
 * `reference="wizard"` for the same load-bearing reason as the other two — the deployed
 * container ships only the 45 MB CRF 24 re-encode, not the 310 MB master, so a template
 * pointing at the master would work locally and 404 in production.
 */
export const CustomizedZoeTestPeople: React.FC<Partial<VideoInputProps>> = (input) => (
  <CustomizationProvider input={input}>
    <ZoeTestPeopleCut reference="wizard" />
  </CustomizationProvider>
);
