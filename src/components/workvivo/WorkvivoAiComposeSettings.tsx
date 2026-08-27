import React from "react";
import { SymbolSvg, registerSymbolJsx } from "./symbolRegistry";
import "./WorkvivoAiComposeSettingsStyles.css";

/**
 * Native port of public/refs/workvivo-ai-compose-settings.html (the white admin panel).
 * The ref remains the design source — see docs/PORTING-HTML-REFS.md.
 *
 * The component is just the 880px .acs-panel; positioning/scaling is the caller's job
 * (AiComposeSettings.tsx places it directly at its resting stage coordinates, which is
 * simpler than the old iframe's body-padding + offset arithmetic). Sprite ids prefixed acs-.
 */

const SpriteDefs: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    aria-hidden
  >
    <symbol id="acs-i-ui-favorite-star" viewBox="0 0 35 34" fill="none">
      <path d="M18.4841 2.12657L22.3806 9.99303C22.4692 10.1927 22.6086 10.3656 22.7849 10.4946C22.9612 10.6236 23.1682 10.7042 23.3853 10.7282L31.987 12.0025C32.236 12.0345 32.4708 12.1368 32.664 12.2972C32.8571 12.4577 33.0006 12.6698 33.0777 12.9088C33.1548 13.1478 33.1623 13.4038 33.0993 13.6468C33.0364 13.8899 32.9056 14.1101 32.7222 14.2816L26.5221 20.4326C26.3639 20.5805 26.2451 20.7655 26.1766 20.971C26.1082 21.1764 26.0921 21.3957 26.13 21.6089L27.6249 30.2596C27.6682 30.5081 27.6408 30.7639 27.5459 30.9977C27.451 31.2314 27.2924 31.4339 27.0882 31.582C26.8839 31.7301 26.6422 31.8179 26.3904 31.8354C26.1387 31.8529 25.8872 31.7994 25.6644 31.6809L17.9205 27.5884C17.7222 27.4911 17.5042 27.4404 17.2833 27.4404C17.0624 27.4404 16.8445 27.4911 16.6462 27.5884L8.90223 31.6809C8.67944 31.7994 8.42789 31.8529 8.17618 31.8354C7.92448 31.8179 7.68274 31.7301 7.47847 31.582C7.27419 31.4339 7.11559 31.2314 7.02071 30.9977C6.92582 30.7639 6.89846 30.5081 6.94175 30.2596L8.43662 21.5109C8.4745 21.2977 8.45848 21.0784 8.39 20.8729C8.32152 20.6675 8.20276 20.4824 8.04452 20.3346L1.77096 14.2816C1.58536 14.1054 1.45483 13.8791 1.3952 13.6303C1.33556 13.3814 1.34937 13.1205 1.43495 12.8794C1.52054 12.6382 1.67422 12.427 1.87739 12.2713C2.08057 12.1157 2.32451 12.0223 2.57966 12.0025L11.1813 10.7282C11.3984 10.7042 11.6054 10.6236 11.7817 10.4946C11.958 10.3656 12.0974 10.1927 12.1861 9.99303L16.0825 2.12657C16.1886 1.89746 16.3581 1.70349 16.5708 1.56755C16.7836 1.43161 17.0308 1.35938 17.2833 1.35938C17.5358 1.35938 17.783 1.43161 17.9958 1.56755C18.2086 1.70349 18.378 1.89746 18.4841 2.12657V2.12657Z" stroke="#FACC15" strokeWidth={2.71743} strokeLinecap="round" strokeLinejoin="round" />
    </symbol>
    <symbol id="acs-i-ui-summarise-content" viewBox="0 0 20 20" fill="none">
      <mask id="acs-i-ui-summarise-content__mask" maskUnits="userSpaceOnUse" x={1} y={1} width={18} height={18} style={{ maskType: "luminance" }}>
        <path d="M18.3327 1.66602H1.66602V18.3327H18.3327V1.66602Z" fill="white" />
      </mask>
      <g mask="url(#acs-i-ui-summarise-content__mask)">
        <path fillRule="evenodd" clipRule="evenodd" d="M13.5475 2.40842C13.7628 1.42231 15.1586 1.42231 15.3878 2.40148C15.3878 2.40148 15.4086 2.50565 15.4156 2.53342C15.6586 3.57509 16.5059 4.3737 17.5614 4.5612C18.5892 4.74176 18.5892 6.21398 17.5614 6.38759C16.4989 6.57509 15.6517 7.38065 15.4086 8.42926L15.3809 8.54731C15.1586 9.52645 13.7559 9.51951 13.5406 8.54037L13.5197 8.44315C13.2906 7.38759 12.4434 6.57509 11.3739 6.39453C10.3531 6.21398 10.3531 4.7487 11.3739 4.56815C12.4364 4.38065 13.2767 3.57509 13.5128 2.52648L13.5475 2.40842ZM6.53364 7.38759C6.79753 6.16537 8.53364 6.15842 8.81141 7.38065L8.8253 7.45009C8.83919 7.4987 8.84614 7.54731 8.86002 7.60287C9.30447 9.49867 10.8392 10.9431 12.7559 11.2765C14.0197 11.4987 14.0197 13.3112 12.7559 13.5334C10.8253 13.8667 9.29058 15.3251 8.85308 17.2348L8.81141 17.4292C8.53364 18.6445 6.79753 18.6376 6.53364 17.4223L6.49891 17.2556C6.08225 15.339 4.54058 13.8667 2.61003 13.5334C1.34614 13.3112 1.34614 11.4987 2.61003 11.2834C4.53364 10.9501 6.06836 9.48478 6.49197 7.58203C6.49891 7.54037 6.5128 7.4987 6.51975 7.45703L6.53364 7.39453V7.38759Z" fill="currentColor" />
      </g>
    </symbol>
  </svg>
);

const PROFILES = ["CEO Voice", "Brand Voice", "Internal Comms"];

interface WorkvivoAiComposeSettingsProps {
  ceoVoiceOn?: boolean;
}

export const WorkvivoAiComposeSettings: React.FC<WorkvivoAiComposeSettingsProps> = ({
  ceoVoiceOn = false,
}) => (
  <div className="acs-panel">
    <SpriteDefs />

    <div className="acs-phead">
      <SymbolSvg paint="#6103ED" paintFrom="#FACC15" width="34" height="34" href="#acs-i-ui-favorite-star" />
      <h1>AI Compose Settings</h1>
    </div>

    <h2>Compose</h2>
    <p className="acs-lede">
      Use Workvivo AI assistance and prompts to create and revise updates, articles and comments.
    </p>

    <div className="acs-row">
      <div className="acs-tx">
        <h3>Workvivo AI for your Organization</h3>
        <p>
          By enabling AI, users in your organization can access and utilize Workvivo AI.{" "}
          <a>Learn more</a>
        </p>
      </div>
      <span className="acs-tog acs-on"><i /></span>
    </div>

    <div className="acs-row acs-sub">
      <SymbolSvg className="acs-spark" paint="#6103ED" width="30" height="30" href="#acs-i-ui-summarise-content" />
      <div className="acs-tx">
        <h3>Writing Profiles</h3>
        <p>Allow users to choose a writing profile to tailor AI output to a specific role or audience.</p>
      </div>
      <span className="acs-tog acs-on"><i /></span>
    </div>

    <div className="acs-addwrap"><button className="acs-add">Add new profile</button></div>

    <div className="acs-table">
      <div className="acs-thead"><span>Name</span><span>Default</span><span /></div>
      {PROFILES.map((name) => (
        <div className="acs-trow" key={name}>
          <a className="acs-pname">{name}</a>
          <span className="acs-cell">
            <span className={`acs-tog ${name === "CEO Voice" && ceoVoiceOn ? "acs-on" : ""}`}><i /></span>
          </span>
          <span className="acs-kebab"><i /><i /><i /></span>
        </div>
      ))}
    </div>
  </div>
);

// Feed this file's symbols into the inline registry (symbolRegistry.tsx): the hidden
// sprite above cannot be referenced across <svg> roots in the in-browser export, so
// every icon is drawn inlined instead and the sprite is kept only as a fallback.
registerSymbolJsx(<SpriteDefs />);
