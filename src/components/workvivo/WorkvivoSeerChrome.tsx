import React from "react";
import { InlineSvg } from "../InlineSvg";
import { staticFile } from "remotion";
import "./WorkvivoStyles.css";
import "./WorkvivoSeerChromeStyles.css";
import { WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoTopbar } from "./WorkvivoTopbar";
import { WorkvivoSeerRail } from "./WorkvivoSeerRail";
import { useCustomization } from "../../customize/CustomizationProvider";

/**
 * The chrome every Seer screen shares: the device box, Workvivo's top bar, the collapsed
 * rail, and the page head — the Seer Insights title, the Manage button and the tab strip.
 *
 * WorkvivoSeerInsights, WorkvivoSeerManagerInsights and WorkvivoSeerRater each drew all
 * of that themselves, and at three different page scales, so cutting between the shots
 * moved the top bar, resized the rail and shifted the tabs. This is the Rater's geometry,
 * lifted out whole; the other two wear it and put their own page in as children.
 *
 * Mounting WorkvivoTopbar means this must render inside a <CustomizationProvider>.
 */

/** Left to right, with the tab the screen is on carrying the underline. */
export const SEER_TABS = ["Engagement", "Drivers", "Values", "Radar", "Comments"];

export interface WorkvivoSeerChromeProps {
  /** Which tab carries the underline. */
  activeTab?: string;
  tabs?: string[];
  /** Seer's accent. The deck drives this from the customer-brand override. */
  accent?: string;
  accentSoft?: string;
  /** The page below the tab strip. */
  children?: React.ReactNode;
}

export const WorkvivoSeerChrome: React.FC<WorkvivoSeerChromeProps> = ({
  activeTab,
  tabs = SEER_TABS,
  accent = "#EE6A35",
  accentSoft = "#FDECE5",
  children,
}) => {
  const { person } = useCustomization();

  return (
    <div className="device" style={{ width: 1760, height: 1080 }}>
      <WorkvivoSvgDefs />
      <div className="app">
        <div className="scaler">
          <WorkvivoTopbar />

          <div className="wsc-shell">
            <div
              className="wsc-body"
              style={
                {
                  "--wsc-accent": accent,
                  "--wsc-accent-soft": accentSoft,
                } as React.CSSProperties
              }
            >
              {/* Accent, not grey: the Seer rails carry orange all the way down.
                  `var(--wsc-accent)` rather than `accent` so a brand override set on
                  .wsc-body reaches the rail too. */}
              <WorkvivoSeerRail
                avatarUrl={person.avatarUrl}
                avatarFit={person.avatarFit}
                iconColor="var(--wsc-accent)"
              />

              <main className="wsc-main">
                <div className="wsc-head">
                  <div className="wsc-title">
                    <InlineSvg
                      src={staticFile("img/seer-insights.svg")}
                      alt=""
                      width={28}
                      height={28}
                      style={{ display: "block" }}
                    />
                    Seer Insights
                  </div>
                  <span className="wsc-manage">Manage Seer Insights</span>
                </div>

                <div className="wsc-tabs">
                  {tabs.map((t) => (
                    <span className={t === activeTab ? "wsc-tab wsc-on" : "wsc-tab"} key={t}>
                      {/* Only on the active tab — an inert span on the other fourteen
                          would add a zero-width inline box to each for nothing. */}
                      {t === activeTab && <span className="wsc-tab-underline" />}
                      {t}
                    </span>
                  ))}
                </div>

                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
