import React from "react";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { WorkvivoCut } from "./WorkvivoCut";
import type { VideoInputProps } from "./customize/videoCopy";

/**
 * The composition the wizard drives.
 *
 * It takes the whole customisation as `inputProps` — one serialisable object, no
 * per-scene props — so the same value flows unchanged from the wizard's state into the
 * `<Player>` and, later, into a server render. Every field is optional: a half-filled
 * wizard renders the approved baseline demo for everything it has not reached yet,
 * which is what makes the preview useful from the first keystroke rather than only once
 * the form is complete.
 */
export const CustomizedWorkvivo: React.FC<Partial<VideoInputProps>> = (input) => (
  <CustomizationProvider input={input}>
    <WorkvivoCut reference="wizard" />
  </CustomizationProvider>
);
