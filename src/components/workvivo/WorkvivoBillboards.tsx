import React from "react";
import { staticFile } from "remotion";
import type { SwapProgress } from "./WorkvivoHomeContainer";
import { useCustomization } from "../../customize/CustomizationProvider";

interface WorkvivoBillboardsProps {
  swap: SwapProgress;
}

/**
 * Distance from one billboard's left edge to the next one's — the ONLY offset that swaps
 * two adjacent cards cleanly, since it lands each exactly where its neighbour sits.
 *
 * Derived from the CSS rather than eyeballed, because getting it wrong is invisible at
 * shiftProgress 1 (both offsets are 0 there, so the settled row always looks right) and
 * only shows up before the swap:
 *   .shell 1760 - .rail 235.714           = 1524.286 of .main
 *   - .content padding 91.429 x 2         = 1341.428 of track
 *   - 2 gaps of 17.143                    = 1307.142 across three cards
 *   => card 435.714, pitch = card + gap   = 452.857
 *
 * The previous 531.43 overshot by 78.57 in BOTH directions: it opened a 174px hole between
 * the left and centre cards and drove the centre card 61px underneath the right-hand one.
 */
const BILLBOARD_PITCH = 452.857;

export const WorkvivoBillboards: React.FC<WorkvivoBillboardsProps> = ({ swap }) => {
  const { image, copy } = useCustomization();
  const bb = copy.feed.billboards;
  // Before the swap the first two cards are held in each other's slots; progress 1 releases
  // them to their natural DOM order, which is the correct resting layout.
  //
  // bb1 leads — it is the card carrying the Billboards pill and it ends in the left slot,
  // so the row reads as that card claiming the lead position and the other filling in
  // behind it, rather than two cards sliding past each other at once.
  const bb1OffsetX = BILLBOARD_PITCH * (1 - swap.lead);
  const bb2OffsetX = -BILLBOARD_PITCH * (1 - swap.follow);

  return (
    <div className="billboards">
      <div data-vc-slot="home.billboard.0"
        className="bb"
        id="bb1"
        style={{
          transform: `translateX(${bb1OffsetX}px)`,
          willChange: "transform",
        }}
      >
        <img
          src={image( "home.billboard.0", staticFile("fillers/spotify.Bloomberg.11.27.17.jpg"), )}
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
          alt=""
        />
        <div className="bpill">
          <img
            className="gi"
            src="data:image/png;base64,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"
            width="18.57"
            height="18.57"
            alt=""
          />
          <span>Billboards</span>
        </div>
        <div className="bgrad" />
        <div className="btx">
          <div className="bt">{bb[0].title}</div>
          <div className="bs">{bb[0].blurb}</div>
        </div>
      </div>
      <div data-vc-slot="home.billboard.1"
        className="bb"
        id="bb2"
        style={{
          transform: `translateX(${bb2OffsetX}px)`,
          willChange: "transform",
        }}
      >
        <img
          src={image( "home.billboard.1", staticFile("fillers/5b72ef3f8ea82faf108b4be0.webp"), )}
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
          alt=""
        />
        <div className="bgrad" />
        <div className="btx">
          <div className="bt">{bb[1].title}</div>
          <div className="bs">{bb[1].blurb}</div>
        </div>
      </div>
      <div data-vc-slot="home.billboard.2"
        className="bb"
        id="bb3"
        style={{
        }}
      >
        <img
          src={image( "home.billboard.2", staticFile("fillers/spotify-for-artists-in-focus-logo-billboard-pro-1260.webp"), )}
          style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
          alt=""
        />
        <div className="bgrad" />
        <div className="btx">
          <div className="bt">{bb[2].title}</div>
          <div className="bs">{bb[2].blurb}</div>
        </div>
      </div>
    </div>
  );
};
