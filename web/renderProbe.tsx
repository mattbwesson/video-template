import React from "react";
import { Img, staticFile } from "remotion";
import { SymbolSvg } from "../src/components/workvivo/symbolRegistry";
import { Icon } from "../src/components/workvivo/WorkvivoIcons";
import "../src/components/workvivo/WorkvivoGlassEdge.css";

/**
 * A fidelity probe for the in-browser export — dev harness, nothing ships through it.
 *
 * One 1920x1080 frame carrying an exemplar of each construction this repo leans on, so
 * `renderStillOnWeb` can answer "does X survive the canvas renderer?" in seconds. The full
 * composition can't do that job cheaply: the reference `<Video>` is mounted on every frame
 * and a single still spends ~3 minutes decoding it before drawing anything.
 *
 * Labels are plain text (always renders), so the output reads as a checklist even when the
 * thing beside a label is missing.
 */
const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div style={{ width: 400, color: "#fff", fontFamily: "sans-serif" }}>
    <div style={{ fontSize: 22, marginBottom: 8 }}>{label}</div>
    <div style={{ height: 150, position: "relative" }}>{children}</div>
  </div>
);

export const RenderProbe: React.FC = () => {
  const photo = staticFile("img/avatar-3.jpeg");
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: "#123",
        display: "flex",
        flexWrap: "wrap",
        gap: 40,
        padding: 60,
        boxSizing: "border-box",
        alignContent: "flex-start",
      }}
    >
      <Cell label="1. background-image cover">
        <div
          style={{
            width: 220,
            height: 140,
            backgroundImage: `url('${photo}')`,
            backgroundSize: "cover",
            backgroundPosition: "50% 15%",
            borderRadius: 12,
          }}
        />
      </Cell>
      <Cell label="2. background-image auto 175% (avatar)">
        <span
          style={{
            display: "block",
            width: 96,
            height: 96,
            borderRadius: "50%",
            backgroundImage: `url('${photo}')`,
            backgroundSize: "auto 175%",
            backgroundPosition: "50% 13%",
            backgroundRepeat: "no-repeat",
          }}
        />
      </Cell>
      <Cell label="3. Remotion Img cover (delays render until loaded)">
        <Img
          src={photo}
          style={{ width: 220, height: 140, objectFit: "cover", borderRadius: 12 }}
        />
      </Cell>
      <Cell label="3b. plain img cover (no delay)">
        <img
          src={photo}
          style={{ width: 220, height: 140, objectFit: "cover", borderRadius: 12 }}
        />
      </Cell>
      <Cell label="4. SymbolSvg inline icon">
        <SymbolSvg href="#i-ui-featured-news" width={80} height={80} style={{ color: "#fff" }} />
      </Cell>
      <Cell label="5. Icon (routed through registry)">
        <Icon href="#i-ui-spaces" width={80} height={80} style={{ color: "#7CF29C" }} />
      </Cell>
      <Cell label="6. glass edge (band + border stroke)">
        <div
          className="wv-glass-edge"
          style={
            {
              width: 260,
              height: 120,
              marginLeft: 40,
              marginTop: 20,
              background: "#fff",
              borderRadius: 14,
              color: "#123",
              padding: 12,
              ["--wv-glass-radius" as string]: "14px",
            } as React.CSSProperties
          }
        >
          opaque window content
        </div>
      </Cell>
      <Cell label="7. glass phone (band bg + border)">
        <div
          className="wv-glass-phone"
          style={{ width: 120, height: 140, borderRadius: 24, padding: 10 }}
        >
          <div style={{ background: "#fff", borderRadius: 16, height: "100%" }} />
        </div>
      </Cell>
      <Cell label="8. clip-path circle (iris)">
        <div
          style={{
            width: 200,
            height: 140,
            background: "#7CF29C",
            clipPath: "circle(60px at 50% 50%)",
          }}
        />
      </Cell>
    </div>
  );
};
