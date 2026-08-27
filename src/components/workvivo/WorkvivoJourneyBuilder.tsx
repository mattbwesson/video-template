import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import "./WorkvivoJourneyBuilderStyles.css";
import "./WorkvivoGlassEdge.css";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoJourneyPhone, type WorkvivoJourneyPhoneProps } from "./WorkvivoJourneyPhone";

/**
 * Workvivo Journeys builder — the step palette either side of a live phone preview.
 *
 * Standalone: the brand colour is a prop, so the board can be dropped into a scene that
 * already knows the tenant without dragging the customisation context along.
 *
 * Two glyphs are not in the Workvivo icon library and are drawn as explicit gaps rather
 * than approximated — see `ACTIONS`.
 */

export const JOURNEY_BOARD_W = 1920;
export const JOURNEY_BOARD_H = 1080;

type Action = {
  title: string;
  sub: string;
  /** Sprite id, or null where the library has no glyph for it. */
  icon: string | null;
};

/**
 * The step palette, in the reference's order.
 *
 * `Share an Update` uses Workvivo's own send glyph, which is an arrow where the
 * reference draws a paper plane — same meaning, different drawing, and the library has
 * no plane. `Assign a Badge` has nothing at all: no badge, medal, rosette or ribbon in
 * any register, so it renders as a gap rather than as something invented.
 */
const LEFT: Action[] = [
  { title: "Share a Message", sub: "Create a custom message", icon: "#i-ui-chat" },
  { title: "Share Org Chart", sub: "Share your companies structure", icon: "#i-ui-org-chart" },
  { title: "Share an Update", sub: "Share an existing update", icon: "#i-ui-send" },
  { title: "Share Values", sub: "Share your companies values", icon: "#i-ui-post-a-value-update" },
  { title: "Share a Survey", sub: "Share an existing survey", icon: "#i-ui-surveys-and-forms" },
];

const RIGHT: Action[] = [
  { title: "Enroll to a Space", sub: "Automatically add to a space", icon: "#i-ui-spaces" },
  { title: "Share an Article", sub: "Share and existing article", icon: "#i-ui-news" },
  { title: "Share a Page", sub: "Share existing page", icon: "#i-ui-pages" },
  { title: "Share a Link", sub: "Share any URL", icon: "#i-ui-quick-links" },
  { title: "Assign a Badge", sub: "Reward with a badge", icon: null },
];

/** Two columns of three dots. Plain geometry, not a library glyph. */
const Grip: React.FC = () => (
  <span className="wjb-grip" aria-hidden>
    {Array.from({ length: 6 }, (_, i) => (
      <i key={i} />
    ))}
  </span>
);

const ActionCard: React.FC<{
  action: Action;
  /** 0 = fully out on its own side, 1 = settled. */
  progress: number;
  /** Which side it travels in from. */
  side: -1 | 1;
}> = ({ action, progress, side }) => (
  <div
    className="wjb-card"
    style={
      progress >= 1
        ? undefined
        : {
            opacity: progress,
            transform: `translateX(${side * (1 - progress) * 64}px)`,
          }
    }>
    <span className="wjb-card-tile">
      {action.icon ? (
        <Icon href={action.icon} className="" width={28} height={28} />
      ) : (
        <span className="wjb-glyph-missing" />
      )}
    </span>
    <span className="wjb-card-text">
      <span className="wjb-card-title" style={{ display: "block" }}>
        {action.title}
      </span>
      <span className="wjb-card-sub" style={{ display: "block" }}>
        {action.sub}
      </span>
    </span>
    <Grip />
  </div>
);

export interface WorkvivoJourneyBuilderProps {
  /** The board's field and the phone banner's burn. Per-tenant brand slot. */
  brand?: string;
  phone?: WorkvivoJourneyPhoneProps;
  /**
   * Local frame the side columns start arriving on. Omit and they are simply present,
   * which is what the gallery and any still wants — the board is only animated when a
   * scene asks it to be.
   *
   * The phone is deliberately NOT part of this: it holds the frame from the first frame
   * so the cut into the board lands on it, and the palette then assembles around it.
   */
  columnsFrom?: number;
  /** Frames between one card starting and the next. */
  columnsStagger?: number;
  /** Frames a single card takes to travel. */
  columnsDuration?: number;
}

export const WorkvivoJourneyBuilder: React.FC<WorkvivoJourneyBuilderProps> = ({
  brand = "#E10A0A",
  phone,
  columnsFrom,
  columnsStagger = 2,
  columnsDuration = 12,
}) => {
  const frame = useCurrentFrame();

  // Left column arrives top-to-bottom, right column arrives bottom-to-top.
  const cardProgress = (order: number) =>
    columnsFrom == null
      ? 1
      : interpolate(
          frame,
          [
            columnsFrom + order * columnsStagger,
            columnsFrom + order * columnsStagger + columnsDuration,
          ],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        );

  return (
    <div className="wjb-board" style={{ background: brand }}>
      <WorkvivoSvgDefs />

      <div className="wjb-col">
        {LEFT.map((a, i) => (
          <ActionCard action={a} key={a.title} progress={cardProgress(i)} side={-1} />
        ))}
      </div>

      <div className="wjb-phone wv-glass-phone">
        <GlassRing />
        <div className="wjb-screen">
          <div className="wjb-scaler">
            <WorkvivoJourneyPhone brand={brand} {...phone} />
          </div>
        </div>
      </div>

      <div className="wjb-col">
        {RIGHT.map((a, i) => (
          <ActionCard
            action={a}
            key={a.title}
            progress={cardProgress(RIGHT.length - 1 - i)}
            side={1}
          />
        ))}
      </div>
    </div>
  );
};
import { GlassRing } from "./GlassRing";
