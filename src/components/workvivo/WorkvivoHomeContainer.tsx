import React from "react";
import "./WorkvivoStyles.css";
import { WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoTopbar } from "./WorkvivoTopbar";
import { WorkvivoSidebar } from "./WorkvivoSidebar";
import { WorkvivoHero } from "./WorkvivoHero";
import { WorkvivoBillboards } from "./WorkvivoBillboards";
import { WorkvivoLeftColumn } from "./WorkvivoLeftColumn";
import { WorkvivoRightColumn } from "./WorkvivoRightColumn";

/** One card swap: the object that moves first, and the one that follows it into the slot
 *  the leader vacates. Both are 0 -> 1 and already eased by the caller. */
export interface SwapProgress {
  lead: number;
  follow: number;
}

const NO_SWAP: SwapProgress = { lead: 0, follow: 0 };

interface WorkvivoHomeContainerProps {
  topSwap?: SwapProgress;
  leftSwap?: SwapProgress;
  rightSwap?: SwapProgress;
  scrollTop?: number;
}

export const WorkvivoHomeContainer: React.FC<WorkvivoHomeContainerProps> = ({
  topSwap = NO_SWAP,
  leftSwap = NO_SWAP,
  rightSwap = NO_SWAP,
  scrollTop = 0,
}) => {
  return (
    <div className="device" style={{ width: 1760, height: 1080 }}>
      <WorkvivoSvgDefs />
      <div className="app">
        <div className="scaler">
          <WorkvivoTopbar />
          <div className="shell">
            <WorkvivoSidebar />
            <main className="main">
              <div
                className="main-scroll-track"
                style={{
                  transform: `translateY(-${scrollTop}px)`,
                  willChange: "transform",
                }}
              >
                <WorkvivoHero />
                <div className="content">
                  <WorkvivoBillboards swap={topSwap} />
                  <div className="cols">
                    <WorkvivoLeftColumn swap={leftSwap} />
                    <WorkvivoRightColumn swap={rightSwap} />
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};
