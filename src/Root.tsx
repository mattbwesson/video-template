import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";

const FPS = 24;
const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION_IN_FRAMES = 30 * FPS;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
