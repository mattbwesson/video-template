import React from "react";
import { Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import "./WorkvivoStyles.css";
import "./WorkvivoIntegrationsListStyles.css";

/**
 * Workvivo Integrations List — the connector grid, full-bleed on the tenant brand field.
 */

export interface WorkvivoIntegrationsListProps {
  /** Per-tenant brand colour for the field behind the grid. */
  brand?: string;
  /** Extra class on the stage. */
  className?: string;
  /** Whether rows animate in from sides. Default true. */
  animated?: boolean;
  /** Explicit frame override (defaults to useCurrentFrame()). */
  frame?: number;
  /** Local start frame for row entrance animation. Default 0. */
  entranceStartFrame?: number;
  /** Duration of row entrance animation in frames. Default 18. */
  entranceDuration?: number;
}

type Status = "setup" | "active" | "manage";

type App = {
  name: string;
  category: "Productivity" | "Calendar";
  tags: string;
  desc: string;
  status: Status;
  /** Filename (without extension) under public/img/integrations/. */
  logo: string;
};

const APPS: App[] = [
  {
    name: "Zoom",
    category: "Productivity",
    tags: "Quick Access widget, Zoom Mail, Zoom Calendar, Zoom Whiteboards +2",
    desc: "Start or join meetings, share screens, and collaborate in real-time with this integration.",
    status: "setup",
    logo: "zoom",
  },
  {
    name: "Microsoft 365",
    category: "Productivity",
    tags: "Outlook Mail, Outlook Calendar, MS Teams Chat, Sharepoint +5",
    desc: "Quickly access Outlook, Teams, and other Microsoft 365 apps with a single click.",
    status: "active",
    logo: "microsoft",
  },
  {
    name: "Google Workspace",
    category: "Productivity",
    tags: "Gmail, Drive, Calendar,",
    desc: "Jump directly into your favorite Google apps and files with convenient, time-saving shortcuts.",
    status: "active",
    logo: "workspace",
  },
  {
    name: "Confluence",
    category: "Productivity",
    tags: "Content Search",
    desc: "Connect to Jira and Confluence to streamline workflows and enhance team collaboration.",
    status: "setup",
    logo: "confluence",
  },
  {
    name: "Workday",
    category: "Productivity",
    tags: "People Directory",
    desc: "Connect to Workday to sync employee profiles, organizational data, and workforce information.",
    status: "setup",
    logo: "workday",
  },
  {
    name: "Jira",
    category: "Productivity",
    tags: "Content Search",
    desc: "Connect Jira to Workvivo to streamline project tracking and enhance team collaboration.",
    status: "manage",
    logo: "jira",
  },
  {
    name: "Box",
    category: "Productivity",
    tags: "Content Search",
    desc: "Securely share, manage, and collaborate on files with team members and external partners.",
    status: "setup",
    logo: "box",
  },
  {
    name: "Apple",
    category: "Calendar",
    tags: "Apple Calendar",
    desc: "Sync your Apple Calendar to view events and schedules directly within the platform.",
    status: "setup",
    logo: "apple",
  },
  {
    name: "Yahoo",
    category: "Calendar",
    tags: "Yahoo Calendar",
    desc: "Keep track of your schedule and events with ease using the Yahoo Calendar integration.",
    status: "setup",
    logo: "yahoo",
  },
  {
    name: "ServiceNow",
    category: "Productivity",
    tags: "IT Service Management",
    desc: "Connect to ServiceNow to sync IT tickets, employee service requests, and workflows.",
    status: "setup",
    logo: "servicenow",
  },
];

/** Checkmark. Two line segments — not in the Workvivo library under any queried term. */
const CheckMark: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <polyline points="2.2,6.2 5,9 9.8,3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WorkvivoIntegrationsList: React.FC<WorkvivoIntegrationsListProps> = ({
  brand = "#d40000",
  className,
  animated = true,
  frame: frameProp,
  entranceStartFrame = 0,
}) => {
  const currentFrame = useCurrentFrame();
  const frame = animated ? (frameProp ?? currentFrame) : 100;

  // Local frame 0 to 84 (global 4459 to 4543): Identical speed (25.137 px/frame) and distance (2111.5px) for both rows
  const exitStartFrame = entranceStartFrame + 84;
  const exitEndFrame = entranceStartFrame + 94; // Global 4553 (4459 + 94 = 4553)

  // Top row (starts 50px off-screen right at +1970px, moves left to settled -141.5px)
  const topRowEntranceX = animated
    ? interpolate(frame, [entranceStartFrame, exitStartFrame], [1970, -141.5], {
        easing: Easing.linear,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : -141.5;

  const topRowExitX = animated
    ? interpolate(frame, [exitStartFrame, exitEndFrame], [0, -2250], {
        easing: Easing.in(Easing.quad),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Bottom row (starts 50px off-screen left at -2253px, moves right to settled -141.5px)
  const bottomRowEntranceX = animated
    ? interpolate(frame, [entranceStartFrame, exitStartFrame], [-2253, -141.5], {
        easing: Easing.linear,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : -141.5;

  const bottomRowExitX = animated
    ? interpolate(frame, [exitStartFrame, exitEndFrame], [0, 2250], {
        easing: Easing.in(Easing.quad),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const topRowX = topRowEntranceX + topRowExitX;
  const bottomRowX = bottomRowEntranceX + bottomRowExitX;

  // Circular mask starting at local frame 84 (global 4543) expanding smoothly from 0 to 1200px to cover screen by global 4553 (local 94)
  const maskRadius = animated
    ? interpolate(frame, [exitStartFrame, exitEndFrame], [0, 1200], {
        easing: Easing.linear,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const topApps = APPS.slice(0, 5);
  const bottomApps = APPS.slice(5);

  const renderCard = (a: App) => (
    <div key={a.name} className="wil-card">
      <span className={"wil-chip wil-chip-" + a.category.toLowerCase()}>{a.category}</span>

      <div className="wil-card-head">
        {/* Inline, not <img src="…svg">. Every one of these files is viewBox-only artwork
            with its fills in a <defs><style> block, and an SVG delivered through an
            image element exports corner-cropped — so each logo came out as whatever
            solid block sits in its top-left, and the ones with white corners
            (Microsoft, Google Workspace, Box) came out as nothing at all. */}
          <InlineSvg
            className="wil-logo"
            src={staticFile(`img/integrations/${a.logo}.svg`)}
          />
        <div className="wil-card-name">{a.name}</div>
      </div>

      <div className="wil-tags">
        <Icon href="#i-ui-apps-widget" width={26} height={26} style={{ flex: "none" }} />
        <span>{a.tags}</span>
      </div>

      <div className="wil-desc">{a.desc}</div>

      <div className="wil-actions">
        {a.status === "setup" && <span className="wil-btn wil-btn-outline">Setup</span>}
        {a.status === "manage" && <span className="wil-btn wil-btn-solid">Manage</span>}
        {a.status === "active" && (
          <>
            <span className="wil-status">
              <CheckMark />
              Active
            </span>
            <span className="wil-btn wil-btn-solid">Manage</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={"wil-stage" + (className ? ` ${className}` : "")}
      style={{ "--wil-brand": brand } as React.CSSProperties}>
      <WorkvivoSvgDefs />

      {/* Dark field (#000021) revealed via expanding circular mask behind cards starting at local frame 84 */}
      {maskRadius > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#000021",
            clipPath: `circle(${maskRadius}px at 50% 50%)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Top Row: Zoom, Microsoft 365, Google Workspace, Confluence, Workday */}
      <div
        className="wil-row wil-row-top"
        style={{
          transform: `translateX(${topRowX}px)`,
          willChange: "transform",
          zIndex: 2,
        }}
      >
        {topApps.map(renderCard)}
      </div>

      {/* Bottom Row: Jira, Box, Apple, Yahoo, ServiceNow */}
      <div
        className="wil-row wil-row-bottom"
        style={{
          transform: `translateX(${bottomRowX}px)`,
          willChange: "transform",
          zIndex: 2,
        }}
      >
        {bottomApps.map(renderCard)}
      </div>
    </div>
  );
};
import { InlineSvg } from "../InlineSvg";
