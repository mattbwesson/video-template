import React from "react";
import { Icon } from "./WorkvivoIcons";
import "./WorkvivoHqSidebarStyles.css";

/**
 * The HQ Agent overlay's chat-history rail.
 *
 * Shared by WorkvivoHqSearch and WorkvivoHqChat: the two are the same overlay in two
 * states and the rail is identical in both, down to which row carries the grey active
 * pill. Kept as one component so the two cannot drift apart.
 */

export const HQ_SIDEBAR_W = 208;

export interface WorkvivoHqSidebarProps {
  /** Which row carries the active pill. */
  active?: "search" | "new-chat";
  /**
   * The recent-prompts rail. Comes from `FIXED_COPY.hqChat.history` at every call site in
   * the film; the search overlay drops the first entry, which is the conversation the chat
   * state opens on and does not yet exist while search is on screen.
   *
   * `readonly` because that source is a frozen literal — the rail only ever maps over it.
   */
  history?: readonly string[];
  /** The empty account strip at the foot of the rail. */
  footer?: boolean;
}

export const WorkvivoHqSidebar: React.FC<WorkvivoHqSidebarProps> = ({
  active = "search",
  history,
  footer = false,
}) => (
  <aside className="whq-side">
    <div className="whq-side-top">
      <span className="whq-spark">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6.92311 2.33302C7.12369 1.7643 7.92691 1.76702 8.12916 2.33204C8.61157 3.68402 9.22832 4.90423 10.1526 5.8711L10.1721 5.89161C11.1093 6.86022 12.4166 7.43846 13.6848 7.87599C14.2597 8.07483 14.2552 8.89235 13.677 9.08399C12.3956 9.50608 11.0622 10.0787 10.0774 11.0449C9.09334 12.0108 8.49752 13.3205 8.07154 14.665C7.88673 15.2477 7.06541 15.2667 6.85865 14.6885C6.39271 13.3812 5.88049 12.0986 4.89674 11.1162C3.9181 10.1393 2.61111 9.52589 1.32057 9.07813C0.752511 8.88059 0.738975 8.07555 1.3108 7.87208C2.57949 7.42314 3.93327 6.8309 4.89674 5.86915C5.86122 4.90611 6.47761 3.60158 6.92311 2.33302Z"
            fill="#7915f0"
          />
          <path
            d="M12.346 1.08985C12.4421 0.819095 12.8237 0.821608 12.9202 1.08985L12.9739 1.23341C13.0324 1.38509 13.0971 1.53294 13.1682 1.67188C13.1846 1.70395 13.2016 1.73687 13.219 1.76856C13.3381 1.98486 13.4777 2.18352 13.6438 2.35743L13.6458 2.35841C13.8048 2.52448 13.9966 2.66111 14.2053 2.77442C14.2424 2.79451 14.2816 2.81424 14.3196 2.83302C14.466 2.90528 14.6196 2.96814 14.7727 3.02442C14.8175 3.04088 14.8632 3.05796 14.9075 3.07325C15.1791 3.16827 15.1817 3.55804 14.9046 3.64942C14.859 3.66439 14.8124 3.68027 14.7669 3.6963C14.6149 3.7498 14.4615 3.81028 14.3147 3.87989C14.2757 3.89839 14.2363 3.91828 14.1975 3.93849C13.984 4.04991 13.7848 4.18434 13.6165 4.34962C13.4424 4.52065 13.3028 4.72017 13.1878 4.93751C13.1674 4.97594 13.1478 5.01472 13.1292 5.05372C13.0599 5.19853 12.9997 5.3503 12.9465 5.50489L12.9006 5.64161C12.8125 5.91841 12.4225 5.92905 12.3235 5.65333C12.3072 5.60756 12.2904 5.56113 12.2737 5.51563C12.2165 5.3601 12.1552 5.20601 12.0862 5.05958C12.0667 5.01834 12.0466 4.97668 12.0256 4.93653C11.918 4.73032 11.7886 4.53962 11.6233 4.37501C11.4496 4.20218 11.2471 4.06058 11.0296 3.94239C10.9964 3.92439 10.9616 3.90653 10.928 3.88966C10.7845 3.81773 10.6347 3.75442 10.4846 3.69825C10.4378 3.68072 10.3897 3.66271 10.343 3.64649C10.0755 3.55225 10.0644 3.16913 10.3391 3.0713C10.3872 3.05429 10.4369 3.03589 10.4856 3.01759C10.633 2.96217 10.7825 2.89992 10.926 2.83009C10.9625 2.81233 10.9993 2.79494 11.0344 2.77638C11.2532 2.66081 11.4556 2.52336 11.6223 2.35645C11.7913 2.18726 11.9318 1.98651 12.0501 1.77052C12.0675 1.73857 12.0845 1.7061 12.1008 1.67384C12.1726 1.53227 12.2365 1.38441 12.2922 1.23731C12.3106 1.18879 12.3291 1.13821 12.346 1.08985Z"
            fill="#7915f0"
          />
        </svg>
      </span>
      <span className="whq-side-collapse">
        <Icon href="#i-ui-sidebar-toggle" className="" width={15} height={15} />
      </span>
    </div>

    <div className={active === "search" ? "whq-nav whq-on" : "whq-nav"}>
      <Icon href="#i-ui-explore" className="" width={14} height={14} />
      Search
    </div>
    <div className={active === "new-chat" ? "whq-nav whq-on" : "whq-nav"}>
      <Icon href="#i-ui-start-new-chat" className="" width={14} height={14} />
      New chat
    </div>

    <div className="whq-hist-label">History</div>
    {(history ?? []).map((h, i) => (
      // Keyed by index as well as text: the reference's list repeats an entry, and two
      // identical keys would collapse into one row.
      <div className="whq-hist" key={`${h}-${i}`}>
        {h}
      </div>
    ))}

    {footer ? <div className="whq-side-foot" /> : null}
  </aside>
);
