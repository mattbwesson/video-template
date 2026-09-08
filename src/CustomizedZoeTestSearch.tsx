import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { ZoeTestSearchCut } from "./ZoeTestSearchCut";
import type { VideoInputProps } from "./customize/videoCopy";

/**
 * The Search & Knowledge cut, as the wizard drives it.
 *
 * Same relationship `CustomizedZoetest` has to `Zoetest`: one serialisable customisation
 * object flows from the wizard's state into the `<Player>` and then into the render.
 *
 * `reference="wizard"` for the same load-bearing reason as the other two — the deployed
 * container ships only the 45 MB CRF 24 re-encode, not the 310 MB master, so a template
 * pointing at the master would work locally and 404 in production.
 *
 * Worth knowing about this one specifically: its intro and outro are largely REFERENCE
 * footage rather than rebuilt scenes — the workvivo HQ title card, both states of the
 * pillar wheel, the endcard and the strapline exist only in that encode. Those stretches
 * are therefore NOT customisable: a prospect's brand and logo appear in the chapter's
 * scenes and in the customer wall, and the framing at either end stays Workvivo's own.
 * That is a property of the cut, not a bug in the plumbing.
 */
export const CustomizedZoeTestSearch: React.FC<Partial<VideoInputProps>> = (input) => (
  <CustomizationProvider input={input}>
    <ZoeTestSearchCut reference="wizard" />
  </CustomizationProvider>
);
