import React from "react";
import { InlineSvg } from "../InlineSvg";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
import { WorkvivoHqSidebar } from "./WorkvivoHqSidebar";
import "./WorkvivoHqChatStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import { FIXED_COPY } from "../../customize/videoCopy";

export const HQ_CHAT_W = 988;
export const HQ_CHAT_H = 680;

const SCENE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const CloseX: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3.5 3.5l9 9M12.5 3.5l-9 9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const Plus: React.FC = () => (
  <svg width={11} height={11} viewBox="0 0 11 11" fill="none" aria-hidden>
    <path
      d="M5.5 1.5v8M1.5 5.5h8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const ThumbsUp: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbsDown: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const RegenerateIcon: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const MoreDots: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const WorkdayAvatar = () => (
  <div
    style={{
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      padding: "2px 3px",
      boxSizing: "border-box",
      flexShrink: 0,
    }}
  >
    <InlineSvg
      src={staticFile("img/workday-logo.svg")}
      alt="Workday"
      style={{
        width: "100%",
        height: "auto",
        objectFit: "contain",
      }}
    />
  </div>
);

const WorkdayLogo = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 86,
      flexShrink: 0,
    }}
  >
    <InlineSvg
      src={staticFile("img/workday-logo.svg")}
      alt="Workday"
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        objectFit: "contain",
      }}
    />
  </div>
);

export interface WorkvivoHqChatProps {
  question?: string;
  thinkingFor?: string | null;
  trace?: string | null;
  placeholder?: string;
  sources?: string;
  note?: string;
  /** Defaults to `FIXED_COPY.hqChat.history`, which is a frozen literal — hence readonly. */
  history?: readonly string[];
}

export const WorkvivoHqChat: React.FC<WorkvivoHqChatProps> = ({
  question,
  thinkingFor = "Thinking for 3s",
  trace = "Searching.",
  placeholder = "Write a message",
  sources = "All sources",
  note = "AI can make mistakes. Review for accuracy.",
  history,
}) => {
  const frame = useCurrentFrame();
  // Fixed, not a slot: the agent's conversation is a locked beat of the film, so the same
  // task is asked, agreed, dated and confirmed on every run. See FIXED_COPY in videoCopy.ts.
  const chat = FIXED_COPY.hqChat;
  // The four other strings above are product chrome — the thinking state, the composer
  // placeholder, the source filter and the AI disclaimer are Workvivo's own words.
  const asked = question ?? chat.question;
  const rail = history ?? chat.history;

  // 1. Thinking block (visible and unconstrained from frame 0, smoothly fades out and collapses at frames 15-20)
  const thinkingOpacity = interpolate(frame, [15, 20], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const thinkingHeight = interpolate(frame, [15, 20], [80, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 2. AI Question 1 ("Sure! I will book the day off on Workday...")
  const ai1Opacity = interpolate(frame, [18, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ai1Y = interpolate(frame, [18, 28], [10, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. Person's Response ("20th of February") - animates in at global frame 2437 (local frame 45)
  const user2Opacity = interpolate(frame, [45, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const user2Y = interpolate(frame, [45, 55], [10, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 4. Pause (frames 55-65), then Attached Answer piece-by-piece:

  // Piece 1: Workday avatar + "Perfect! ✅"
  const p1Opacity = interpolate(frame, [65, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const p1Y = interpolate(frame, [65, 75], [10, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Piece 2: Description text
  const p2Opacity = interpolate(frame, [75, 84], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const p2Y = interpolate(frame, [75, 84], [10, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Piece 3: Confirmation card
  const p3Opacity = interpolate(frame, [84, 94], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const p3Y = interpolate(frame, [84, 94], [14, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const p3Scale = interpolate(frame, [84, 94], [0.97, 1], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Piece 4: Action toolbar
  const p4Opacity = interpolate(frame, [94, 102], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const p4Y = interpolate(frame, [94, 102], [6, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Morph entrance animations (local frames 0 to 16)
  const msg1Opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const msg1Y = interpolate(frame, [0, 14], [-12, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const msg1Scale = interpolate(frame, [0, 14], [0.95, 1], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const composerOpacity = interpolate(frame, [1, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const composerY = interpolate(frame, [1, 16], [28, 0], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const composerScale = interpolate(frame, [1, 16], [0.97, 1], {
    easing: SCENE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const noteOpacity = interpolate(frame, [4, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="whq-modal" style={{ width: HQ_CHAT_W, height: HQ_CHAT_H }}>
      <WorkvivoSvgDefs />

      <WorkvivoHqSidebar active="new-chat" history={rail} footer />

      <div className="whqc-main">
        <span className="whq-close">
          <CloseX />
        </span>

        <div className="whqc-col">
          {/* Message 1 (User bubble) - morphs in seamlessly */}
          <div
            className="whqc-msg-user"
            style={{
              opacity: msg1Opacity,
              transform: `translateY(${msg1Y}px) scale(${msg1Scale})`,
              willChange: "transform, opacity",
            }}
          >
            {asked}
          </div>

          {/* Thinking state right after the cut */}
          {frame < 21 && (
            <div
              style={{
                opacity: thinkingOpacity,
                height: frame < 15 ? "auto" : thinkingHeight,
                overflow: frame < 15 ? "visible" : "hidden",
                marginBottom: thinkingOpacity > 0 ? 14 : 0,
              }}
            >
              <div className="whqc-thinking">{thinkingFor}</div>
              <div className="whqc-trace">{trace}</div>
            </div>
          )}

          {/* Message 2 (HQ Agent response) */}
          {frame >= 18 && (
            <div
              className="whqc-msg-agent"
              style={{
                opacity: ai1Opacity,
                transform: `translateY(${ai1Y}px)`,
                willChange: "transform, opacity",
              }}
            >
              <div className="whqc-agent-spark">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6.92311 2.33302C7.12369 1.7643 7.92691 1.76702 8.12916 2.33204C8.61157 3.68402 9.22832 4.90423 10.1526 5.8711L10.1721 5.89161C11.1093 6.86022 12.4166 7.43846 13.6848 7.87599C14.2597 8.07483 14.2552 8.89235 13.677 9.08399C12.3956 9.50608 11.0622 10.0787 10.0774 11.0449C9.09334 12.0108 8.49752 13.3205 8.07154 14.665C7.88673 15.2477 7.06541 15.2667 6.85865 14.6885C6.39271 13.3812 5.88049 12.0986 4.89674 11.1162C3.9181 10.1393 2.61111 9.52589 1.32057 9.07813C0.752511 8.88059 0.738975 8.07555 1.3108 7.87208C2.57949 7.42314 3.93327 6.8309 4.89674 5.86915C5.86122 4.90611 6.47761 3.60158 6.92311 2.33302Z"
                    fill="#7915f0"
                  />
                  <path
                    d="M12.346 1.08985C12.4421 0.819095 12.8237 0.821608 12.9202 1.08985L12.9739 1.23341C13.0324 1.38509 13.0971 1.53294 13.1682 1.67188C13.1846 1.70395 13.2016 1.73687 13.219 1.76856C13.3381 1.98486 13.4777 2.18352 13.6438 2.35743L13.6458 2.35841C13.8048 2.52448 13.9966 2.66111 14.2053 2.77442C14.2424 2.79451 14.2816 2.81424 14.3196 2.83302C14.466 2.90528 14.6196 2.96814 14.7727 3.02442C14.8175 3.04088 14.8632 3.05796 14.9075 3.07325C15.1791 3.16827 15.1817 3.55804 14.9046 3.64942C14.859 3.66439 14.8124 3.68027 14.7669 3.6963C14.6149 3.7498 14.4615 3.81028 14.3147 3.87989C14.2757 3.89839 14.2363 3.91828 14.1975 3.93849C13.984 4.04991 13.7848 4.18434 13.6165 4.34962C13.4424 4.52065 13.3028 4.72017 13.1878 4.93751C13.1674 4.97594 13.1478 5.01472 13.1292 5.05372C13.0599 5.19853 12.9997 5.3503 12.9465 5.50489L12.9006 5.64161C12.8125 5.91841 12.4225 5.92905 12.3235 5.65333C12.3072 5.60756 12.2904 5.56113 12.2737 5.51563C12.2165 5.3601 12.1552 5.20601 12.0862 5.05958C12.0667 5.01834 12.0466 4.97668 12.0256 4.93653C11.918 4.73032 11.7886 4.53962 11.6233 4.37501C11.4496 4.20218 11.2471 4.06058 11.0296 3.94239C10.9964 3.92439 10.9616 3.90653 10.928 3.88966C10.7845 3.81773 10.6347 3.75442 10.4846 3.69825C10.4378 3.68072 10.3897 3.66271 10.343 3.64649C10.0755 3.55225 10.0644 3.16913 10.3391 3.0713C10.3872 3.05429 10.4369 3.03589 10.4856 3.01759C10.633 2.96217 10.7825 2.89992 10.926 2.83009C10.9625 2.81233 10.9993 2.79494 11.0344 2.77638C11.2532 2.66081 11.4556 2.52336 11.6223 2.35645C11.7913 2.18726 11.9318 1.98651 12.0501 1.77052C12.0675 1.73857 12.0845 1.7061 12.1008 1.67384C12.1726 1.53227 12.2365 1.38441 12.2922 1.23731C12.3106 1.18879 12.3291 1.13821 12.346 1.08985Z"
                    fill="#7915f0"
                  />
                </svg>
              </div>
              <div className="whqc-agent-text">{chat.offer}</div>
            </div>
          )}

          {/* Message 3 (User bubble) - animates in at global frame 2437 (local frame 45) */}
          {frame >= 45 && (
            <div
              className="whqc-msg-user"
              style={{
                opacity: user2Opacity,
                transform: `translateY(${user2Y}px)`,
                willChange: "transform, opacity",
              }}
            >
              {chat.reply}
            </div>
          )}

          {/* Attached Answer: Piece by piece entrance after the pause */}
          {frame >= 65 && (
            <div className="whqc-answer-block">
              {/* Piece 1: Workday avatar + "Perfect! ✅" */}
              <div
                className="whqc-answer-status"
                style={{
                  opacity: p1Opacity,
                  transform: `translateY(${p1Y}px)`,
                  willChange: "transform, opacity",
                }}
              >
                <WorkdayAvatar />
                <span>Perfect! ✅</span>
              </div>

              {/* Piece 2: Paragraph text */}
              {frame >= 75 && (
                <p
                  className="whqc-answer-desc"
                  style={{
                    opacity: p2Opacity,
                    transform: `translateY(${p2Y}px)`,
                    willChange: "transform, opacity",
                  }}
                >
                  {chat.confirmation}
                </p>
              )}

              {/* Piece 3: Confirmation card */}
              {frame >= 84 && (
                <div
                  className="whqc-card"
                  style={{
                    opacity: p3Opacity,
                    transform: `translateY(${p3Y}px) scale(${p3Scale})`,
                    willChange: "transform, opacity",
                  }}
                >
                  <div className="whqc-card-info">
                    <div className="whqc-card-row">
                      <strong>Request ID:</strong> #2026-02-20
                    </div>
                    <div className="whqc-card-row">
                      <strong>Status:</strong> Submitted to Manager for Approval
                    </div>
                    <div className="whqc-card-row">
                      <strong>Date Requested:</strong> Jan 15, 2026
                    </div>
                  </div>
                  <WorkdayLogo />
                </div>
              )}

              {/* Piece 4: Action toolbar */}
              {frame >= 94 && (
                <div
                  className="whqc-toolbar"
                  style={{
                    opacity: p4Opacity,
                    transform: `translateY(${p4Y}px)`,
                    willChange: "transform, opacity",
                  }}
                >
                  <span className="whqc-tool-btn">
                    <ThumbsUp />
                  </span>
                  <span className="whqc-tool-btn">
                    <ThumbsDown />
                  </span>
                  <span className="whqc-tool-btn">
                    <CopyIcon />
                  </span>
                  <span className="whqc-tool-btn">
                    <RegenerateIcon />
                  </span>
                  <span className="whqc-tool-btn" style={{ gap: 4 }}>
                    <EditIcon /> Edit
                  </span>
                  <span className="whqc-tool-btn" style={{ marginLeft: "auto" }}>
                    <MoreDots />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Composer - morphs up from bottom */}
          <div
            className="whqc-composer"
            style={{
              opacity: composerOpacity,
              transform: `translateY(${composerY}px) scale(${composerScale})`,
              willChange: "transform, opacity",
            }}
          >
            <div className="whqc-placeholder">{placeholder}</div>
            <div className="whqc-tools">
              <span className="whqc-plus">
                <Plus />
              </span>
              <span className="whqc-sources">
                <Icon href="#i-ui-filter-posts" className="" width={12} height={12} />
                {sources}
              </span>
              <span className="whqc-send">
                <Icon href="#i-ui-send" className="" width={12} height={12} />
              </span>
            </div>
          </div>

          <div
            className="whqc-note"
            style={{
              opacity: noteOpacity,
              willChange: "opacity",
            }}
          >
            {note}
          </div>
          <div className="whqc-tail" />
        </div>
      </div>
    </div>
  );
};
