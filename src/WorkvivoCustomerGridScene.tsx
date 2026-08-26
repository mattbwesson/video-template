import React from "react";
import { AbsoluteFill } from "remotion";
import { WorkvivoCustomerGrid } from "./components/workvivo/WorkvivoCustomerGrid";
import { useCustomization } from "./customize/CustomizationProvider";

export interface WorkvivoCustomerGridSceneProps {
  /** Overrides the tenant colour. Omit inside the cut. */
  brand?: string;
}

/**
 * The customer logo wall, lit with the tenant colour — global 4983-5166.
 *
 * `brand` used to default to a hardcoded "#00e676", which is neither Workvivo's green nor
 * anybody's brand; it was passed down from the edit list as a literal too, so the closing
 * wall stayed that colour whatever the operator picked. It reads from the theme now, and
 * the prop is only for a caller staging the wall on a colour of its own.
 *
 * Needs a <CustomizationProvider> above it, like every other scene in the cut.
 */
export const WorkvivoCustomerGridScene: React.FC<WorkvivoCustomerGridSceneProps> = ({
  brand,
}) => {
  const { theme } = useCustomization();

  return (
    <AbsoluteFill>
      <WorkvivoCustomerGrid brand={brand ?? theme.brand} />
    </AbsoluteFill>
  );
};
