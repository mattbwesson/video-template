import React from "react";
import { InlineSvg } from "../InlineSvg";
import { staticFile } from "remotion";
import { Icon } from "./WorkvivoIcons";
import { useCustomization } from "../../customize/CustomizationProvider";

export const WorkvivoTopbar: React.FC = () => {
  const { person, logo, copy } = useCustomization();
  return (
    <div className="topbar">
      {/* The topbar is dark, so this asks for the on-dark logo — which is the operator's
          knockout when they supplied one, and their colour mark when they did not. */}
      <img className="tlogo" src={logo.onDark} alt={copy.companyName} />
      <div className="tsearch">
        <Icon href="#i-ui-explore" width="17.14" height="17.14" />
        <span>Search</span>
      </div>
      <div className="tacts">
        <Icon href="#i-ui-notifications" width="21.43" height="21.43" />
        <InlineSvg
          src={staticFile("img/more.svg")}
          width="18"
          height="18"
          alt=""
          style={{ display: "block" }}
        />
        <img
          className="tav"
          src={person.avatarUrl}
          alt=""
          style={{ width: 37.14, height: 37.14, ...person.avatarFit }}
        />
      </div>
    </div>
  );
};
