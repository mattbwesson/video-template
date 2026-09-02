import React from "react";
import { Composition } from "remotion";
import {
  HQOpening,
  HQ_OPENING_DURATION_IN_FRAMES,
  HQ_OPENING_FPS,
} from "./HQOpening";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HQOpening"
      component={HQOpening}
      durationInFrames={HQ_OPENING_DURATION_IN_FRAMES}
      fps={HQ_OPENING_FPS}
      width={1920}
      height={1080}
    />
  );
};
