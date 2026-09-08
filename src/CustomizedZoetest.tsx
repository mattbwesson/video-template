import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { ZoetestCut } from "./ZoetestCut";
import type { VideoInputProps } from "./customize/videoCopy";

/**
 * The comms cut, as the wizard drives it.
 *
 * Exactly what `CustomizedWorkvivo` is to `WorkvivoCut`: the same timeline, taking the
 * whole customisation as `inputProps` so one serialisable object flows from the wizard's
 * state into the `<Player>` and then into the render.
 *
 * `reference="wizard"` is the load-bearing difference from `Zoetest`, which the Studio
 * composition uses. That one lays down the 310 MB master; this lays down the 45 MB CRF 24
 * re-encode, which is the only one the deployed container ships — `public/img/L2
 * Video(Virgin Airline).mp4` is pruned by .dockerignore precisely because it is over
 * GitHub's and the image's limits. A wizard template on the master would work locally and
 * 404 in production.
 */
export const CustomizedZoetest: React.FC<Partial<VideoInputProps>> = (input) => (
  <CustomizationProvider input={input}>
    <ZoetestCut reference="wizard" />
  </CustomizationProvider>
);
