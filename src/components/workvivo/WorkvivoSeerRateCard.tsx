import React from "react";
import { Donut } from "./WorkvivoSeerManagerInsights";
import "./WorkvivoSeerRateCardStyles.css";

/**
 * The Response Rate card that floats beside the phone at global 3903-4072.
 *
 * It is the desktop manager screen's rate card with its title swapped for the tabbed
 * control the mobile capture shows, so the ring itself is the same `Donut` that screen
 * draws — imported rather than copied, since the round-cap correction inside it is the
 * kind of detail that silently drifts when duplicated.
 */

/** The circular-arrow mark the capture sets before the company score. */
const RefreshMark: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
    <path
      d="M11.2 6.5a4.7 4.7 0 1 1-1.5-3.44"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M11.5 1.2v3.1H8.4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface WorkvivoSeerRateCardProps {
  /** 0..1, threaded into the donut so the ring can sweep on entrance. */
  progress?: number;
  style?: React.CSSProperties;
}

export const WorkvivoSeerRateCard: React.FC<WorkvivoSeerRateCardProps> = ({
  progress = 1,
  style,
}) => (
  <div className="wsrc-card" style={style}>
    <div className="wsrc-tabs">
      <span className="wsrc-tab wsrc-on">Response Rate</span>
      <span className="wsrc-tab">Completion Rate</span>
    </div>

    <div className="wsrc-body">
      <span className="wsrc-donut">
        <Donut pct={75} progress={progress} />
      </span>

      <div className="wsrc-stats">
        <div className="wsrc-box">
          <div className="wsrc-num">10,395/13,860</div>
          <div className="wsrc-label">Responses</div>
        </div>
        <div className="wsrc-box">
          <div className="wsrc-figure">
            <span className="wsrc-mark">
              <RefreshMark />
            </span>
            <span className="wsrc-num">75%</span>
          </div>
          <div className="wsrc-label">Company Score</div>
        </div>
      </div>
    </div>
  </div>
);
