import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { InlineSvg } from "./components/InlineSvg";
import {
  CustomizationProvider,
  useCustomization,
} from "./customize/CustomizationProvider";
import type { VideoInputProps } from "./customize/videoCopy";
import { WorkvivoAiCompanion, WorkvivoHomeContainer } from "./components/workvivo";
import { HqSearchScene } from "./HqSearchScene";
import { HqChatScene } from "./HqChatScene";
import { WorkvivoSeerManagerInsightsScene } from "./WorkvivoSeerManagerInsightsScene";

/**
 * A 30-second product demo of Workvivo, assembled from the component library.
 *
 * Deliberately NOT a trim of the L2 cut. That film is a customer story on a licensed
 * reference edit; this is a product tour, so every beat is a live library component with
 * no reference footage underneath and no audio bed. It is also the only composition here
 * that can be re-rendered for a different prospect without touching the 5300-frame cut.
 *
 * The narration is Workvivo's OWN current positioning, taken from workvivo.com in
 * September 2026 — the "one digital headquarters" headline, the Ask HQ / HQ Agent /
 * Catch Me Up / Seer feature names and their one-line descriptions. It is written out as
 * the DEMO_SCRIPT table below rather than scattered through the JSX so it can be checked
 * against the site in one read when the messaging next changes. Nothing here is invented
 * marketing copy.
 *
 * Like `CustomizedWorkvivo`, it takes the whole customisation as `inputProps`, so the
 * same demo renders in a prospect's brand and logo with no code change. With no props it
 * renders the approved Spotify baseline, exactly as the other compositions do.
 */

export const DEMO_FPS = 25;
export const DEMO_DURATION = 750;
export const DEMO_WIDTH = 1920;
export const DEMO_HEIGHT = 1080;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * The beat list. `from` and `length` are in frames at 25fps and are contiguous by
 * construction — each `from` is the previous `from + length`, and they sum to
 * DEMO_DURATION. Retiming means editing one row and the two either side of it.
 */
const BEATS = {
  open: { from: 0, length: 105 },
  intranet: { from: 105, length: 125 },
  askHq: { from: 230, length: 125 },
  agent: { from: 355, length: 125 },
  catchUp: { from: 480, length: 115 },
  seer: { from: 595, length: 95 },
  close: { from: 690, length: 60 },
} as const;

/**
 * Workvivo's own words, from workvivo.com. Kept as one table so the whole script reads
 * top to bottom and can be diffed against the site.
 */
const DEMO_SCRIPT = {
  headline: "One digital headquarters for every employee",
  standfirst:
    "One place where people show up, communication happens, and knowledge lives.",
  intranet: {
    title: "A modern intranet",
    sub: "Scattered tools and systems, consolidated into a single workplace destination.",
  },
  askHq: {
    title: "Ask HQ",
    sub: "Ask questions in natural language and get trusted answers from across company knowledge.",
  },
  agent: {
    title: "HQ Agent",
    sub: "Not just answers — it completes the task and recommends the next step.",
  },
  catchUp: {
    title: "Catch Me Up",
    sub: "AI-powered summaries of the updates, conversations and activity you missed.",
  },
  seer: {
    title: "Seer",
    sub: "AI-powered people intelligence — employee feedback, turned into actionable insight.",
  },
  closer: "Built on Zoom's trusted AI infrastructure",
} as const;

/**
 * A beat's own 0..1 envelope: up over the first `inFrames`, down over the last
 * `outFrames`, flat in between.
 *
 * Every beat fades on the same curve, so the demo reads as one piece rather than as seven
 * clips that each happen to start with a different flourish.
 */
const useEnvelope = (length: number, inFrames = 12, outFrames = 10) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, inFrames], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fall = interpolate(frame, [length - outFrames, length], [1, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(rise, fall);
};

/**
 * The lower-third caption plate.
 *
 * A solid box, not a scrim over the artwork: it has to stay legible over a white intranet
 * screenshot and over a near-black phone field in the same film, and a translucent plate
 * cannot do both.
 *
 * Filled with `theme.d3` — the deep end of the brand ramp — rather than `theme.brand`. The
 * plate is wider than the device it captions, so it hangs off onto the brand field on every
 * beat; filled with the brand itself its left edge vanished into that field and the plate
 * lost its shape. The deep shade separates from both the bright field behind it and the
 * light product UI it overlaps, and it is still the prospect's own colour.
 *
 * Styles are inline rather than in a stylesheet on purpose. The export wraps every text
 * node — and every word — in an injected `<span>`, so any CSS rule of ours matching a bare
 * `span` would resize the very box the renderer is about to measure
 * (docs/browser-render-best-practices.md). Inline styles cannot match anything.
 */
const Caption: React.FC<{
  title: string;
  sub: string;
  length: number;
}> = ({ title, sub, length }) => {
  const { theme } = useCustomization();
  const envelope = useEnvelope(length, 14, 10);
  const rise = interpolate(envelope, [0, 1], [26, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        bottom: 84,
        maxWidth: 980,
        padding: "26px 34px 28px",
        borderRadius: 18,
        background: theme.d3,
        color: "#ffffff",
        opacity: envelope,
        transform: `translateY(${rise}px)`,
        willChange: "transform, opacity",
        fontFamily: "InterX, Inter, 'Segoe UI', system-ui, Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "block",
          fontSize: 52,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          // The feature names are short and fixed, but export text metrics differ from
          // Chromium's and a wrapped product name reads as a bug.
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "block",
          marginTop: 12,
          fontSize: 25,
          fontWeight: 400,
          lineHeight: 1.45,
          opacity: 0.9,
        }}
      >
        {sub}
      </div>
    </div>
  );
};

/** The HQ mark, sized by its wrapper. Inline markup, never an `<img>` — see InlineSvg. */
const HqMark: React.FC<{ width: number }> = ({ width }) => (
  <InlineSvg
    src={staticFile("img/hq-logo.svg")}
    width={width}
    height={width * 0.6}
    style={{ display: "block" }}
  />
);

/** Beat 1 — the headline card, on the brand field. */
const OpenCard: React.FC<{ length: number }> = ({ length }) => {
  const { theme, logo } = useCustomization();
  const envelope = useEnvelope(length, 16, 12);
  const rise = interpolate(envelope, [0, 1], [34, 0]);
  // The standfirst lands a beat after the headline, so the card reads in two moves.
  const subEnvelope = useEnvelope(length, 30, 12);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${theme.brand} 0%, ${theme.d2} 100%)`,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "InterX, Inter, 'Segoe UI', system-ui, Arial, sans-serif",
        color: theme.ink,
      }}
    >
      <div
        style={{
          width: 1360,
          opacity: envelope,
          transform: `translateY(${rise}px)`,
          willChange: "transform, opacity",
        }}
      >
        <img
          src={logo.onDark}
          alt=""
          style={{
            display: "block",
            width: 260,
            height: 78,
            objectFit: "contain",
            marginBottom: 54,
          }}
        />
        <div
          style={{
            display: "block",
            fontSize: 96,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.04,
          }}
        >
          {DEMO_SCRIPT.headline}
        </div>
        <div
          style={{
            display: "block",
            marginTop: 30,
            maxWidth: 1040,
            fontSize: 32,
            lineHeight: 1.45,
            opacity: 0.9 * subEnvelope,
          }}
        >
          {DEMO_SCRIPT.standfirst}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Beat 7 — the close card: the HQ lockup and the platform line. */
const CloseCard: React.FC<{ length: number }> = ({ length }) => {
  const { theme, logo } = useCustomization();
  const envelope = useEnvelope(length, 14, 12);
  const scale = interpolate(envelope, [0, 1], [0.965, 1]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${theme.brand} 0%, ${theme.d2} 100%)`,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "InterX, Inter, 'Segoe UI', system-ui, Arial, sans-serif",
        color: theme.ink,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          opacity: envelope,
          transform: `scale(${scale})`,
          willChange: "transform, opacity",
        }}
      >
        <HqMark width={340} />
        <img
          src={logo.onDark}
          alt=""
          style={{
            display: "block",
            width: 220,
            height: 66,
            objectFit: "contain",
            marginTop: 44,
          }}
        />
        <div
          style={{
            display: "block",
            marginTop: 40,
            fontSize: 27,
            letterSpacing: "0.01em",
            opacity: 0.85,
            whiteSpace: "nowrap",
          }}
        >
          {DEMO_SCRIPT.closer}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Beat 2 — the intranet home screen.
 *
 * `WorkvivoHomeContainer` is built at the 1760px app width and is 1080 tall, so it is
 * scaled to sit inside the frame with the brand field showing around it and room for the
 * caption plate. It scrolls slowly through the beat: a still screenshot of a feed reads as
 * a picture of software, and a moving one reads as software.
 */
const IntranetBeat: React.FC<{ length: number }> = ({ length }) => {
  const { theme } = useCustomization();
  const frame = useCurrentFrame();
  const envelope = useEnvelope(length, 14, 10);
  const scrollTop = interpolate(frame, [0, length], [0, 320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 0.74 and a 72px top inset, so the device's bottom edge lands just under the caption
  // plate's top rather than a third of the way up it.
  const zoom = 0.74;
  const lift = interpolate(envelope, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${theme.brand} 0%, ${theme.d1} 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 72,
          width: 1760 * zoom,
          height: 1080 * zoom,
          marginLeft: (-1760 * zoom) / 2,
          opacity: envelope,
          transform: `translateY(${lift}px)`,
          willChange: "transform, opacity",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <WorkvivoHomeContainer scrollTop={scrollTop} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Beat 5 — Catch Me Up, on the phone.
 *
 * `WorkvivoAiCompanion` is the agent's mobile empty state at its native 393x852, and the
 * caller owns the shell — so this beat supplies the field and the scale, as
 * WorkvivoPhonesScene does for the other phones.
 */
const CatchUpBeat: React.FC<{ length: number }> = ({ length }) => {
  const { theme } = useCustomization();
  const envelope = useEnvelope(length, 14, 10);
  const zoom = 1.02;
  const rise = interpolate(envelope, [0, 1], [90, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${theme.d1} 0%, ${theme.d3} 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 1290,
          top: 70,
          width: 393 * zoom,
          height: 852 * zoom,
          opacity: envelope,
          transform: `translateY(${rise}px)`,
          willChange: "transform, opacity",
          borderRadius: 44,
          overflow: "hidden",
        }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <WorkvivoAiCompanion />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * The demo itself.
 *
 * Each beat is its own `<Sequence>`, so every component below sees LOCAL frames starting
 * at 0 and can be moved on the timeline without editing the component. The three reused
 * film scenes (`HqSearchScene`, `HqChatScene`, `WorkvivoSeerManagerInsightsScene`) already
 * take their field colour as a prop, which is why they can be dropped in here on the
 * prospect's brand rather than the film's red.
 */
const ProductDemoBody: React.FC = () => {
  const { theme } = useCustomization();

  return (
    <AbsoluteFill style={{ backgroundColor: theme.d4, ...theme.vars }}>
      <Sequence
        name="Headline"
        from={BEATS.open.from}
        durationInFrames={BEATS.open.length}
      >
        <OpenCard length={BEATS.open.length} />
      </Sequence>

      <Sequence
        name="Modern intranet"
        from={BEATS.intranet.from}
        durationInFrames={BEATS.intranet.length}
      >
        <IntranetBeat length={BEATS.intranet.length} />
        <Caption
          title={DEMO_SCRIPT.intranet.title}
          sub={DEMO_SCRIPT.intranet.sub}
          length={BEATS.intranet.length}
        />
      </Sequence>

      <Sequence
        name="Ask HQ"
        from={BEATS.askHq.from}
        durationInFrames={BEATS.askHq.length}
      >
        <HqSearchScene background={theme.brand} />
        <Caption
          title={DEMO_SCRIPT.askHq.title}
          sub={DEMO_SCRIPT.askHq.sub}
          length={BEATS.askHq.length}
        />
      </Sequence>

      <Sequence
        name="HQ Agent"
        from={BEATS.agent.from}
        durationInFrames={BEATS.agent.length}
      >
        <HqChatScene brand={theme.brand} />
        <Caption
          title={DEMO_SCRIPT.agent.title}
          sub={DEMO_SCRIPT.agent.sub}
          length={BEATS.agent.length}
        />
      </Sequence>

      <Sequence
        name="Catch Me Up"
        from={BEATS.catchUp.from}
        durationInFrames={BEATS.catchUp.length}
      >
        <CatchUpBeat length={BEATS.catchUp.length} />
        <Caption
          title={DEMO_SCRIPT.catchUp.title}
          sub={DEMO_SCRIPT.catchUp.sub}
          length={BEATS.catchUp.length}
        />
      </Sequence>

      <Sequence name="Seer" from={BEATS.seer.from} durationInFrames={BEATS.seer.length}>
        <WorkvivoSeerManagerInsightsScene background={theme.d2} />
        <Caption
          title={DEMO_SCRIPT.seer.title}
          sub={DEMO_SCRIPT.seer.sub}
          length={BEATS.seer.length}
        />
      </Sequence>

      <Sequence
        name="Close"
        from={BEATS.close.from}
        durationInFrames={BEATS.close.length}
      >
        <CloseCard length={BEATS.close.length} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const WorkvivoProductDemo: React.FC<Partial<VideoInputProps>> = (input) => (
  <CustomizationProvider input={input}>
    <ProductDemoBody />
  </CustomizationProvider>
);
