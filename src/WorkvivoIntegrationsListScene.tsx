import React from "react";
import { AbsoluteFill } from "remotion";
import { useCustomization } from "./customize/CustomizationProvider";
import {
  WorkvivoIntegrationsList,
  WorkvivoIntegrationsListProps,
} from "./components/workvivo/WorkvivoIntegrationsList";

export interface WorkvivoIntegrationsListSceneProps extends WorkvivoIntegrationsListProps {
  background?: string;
}

export const WorkvivoIntegrationsListScene: React.FC<
  WorkvivoIntegrationsListSceneProps
> = ({ background, ...props }) => {
  const { theme } = useCustomization();
  const bg = background ?? theme.brand;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <WorkvivoIntegrationsList brand={bg} {...props} />
    </AbsoluteFill>
  );
};
