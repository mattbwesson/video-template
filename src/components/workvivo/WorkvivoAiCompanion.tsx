import React from "react";
import { SymbolSvg, registerSymbolJsx } from "./symbolRegistry";
import { Icon } from "./WorkvivoIcons";
import "./WorkvivoStyles.css";
import "./WorkvivoAiCompanionStyles.css";

/**
 * AI Companion — the HQ agent's empty state on the phone, at its native 393pt.
 *
 * The mobile counterpart to WorkvivoHqChat, which is the same agent on desktop. It is a
 * separate component rather than a responsive mode of that one: the desktop overlay is a
 * 988x680 modal with the history rail beside the thread, and this is a phone screen with
 * that rail collapsed to three icons — they share no layout, only the composer.
 *
 * That composer is deliberately the desktop one's construction and palette (`.whqc-*`
 * borders, greys and the same `#i-ui-filter-posts` / `#i-ui-send` glyphs) at mobile
 * scale. It is one product surface; the two drifting apart is what a shared library is
 * for.
 *
 * The component is just the screen's contents — the caller owns the phone shell, exactly
 * as WorkvivoSeerManagerMobile and WorkvivoPhonesScene do with `.wm-phone` / `.wm-screen`.
 *
 * Standalone: no `CustomizationProvider` above it. Nothing here is the tenant's — there
 * is no logo, no photograph and no name on this screen, only Workvivo's own chrome and
 * the agent's suggested prompts, so there is nothing for an operator to fill.
 */

export const AI_COMPANION_W = 393;
export const AI_COMPANION_H = 852;

/**
 * Status-bar glyphs, prefixed wac- rather than reusing #i-signal or #sm-i-signal.
 *
 * Two reasons, and the second is the one that forced it. Those ids belong to
 * WorkvivoMobileHome's and WorkvivoSeerManagerMobile's defs blocks, which only register
 * when those components' modules load — importing a whole phone for three icons is a
 * side-effect dependency that breaks the moment someone tree-shakes it. And both sets
 * bake `fill="white"`, because every other phone in the library wears its status bar over
 * a dark hero. This screen is white behind the bar, so the glyphs are authored with
 * `currentColor` and take their colour from `.wac-status`.
 *
 * Same source art in every other respect — the paths are the ones already in the repo,
 * not a redrawing. Same convention WorkvivoLiveReplay follows with its lr- prefix.
 */
const WorkvivoAiCompanionSvgDefs: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    aria-hidden
  >
    <symbol id="wac-i-signal" viewBox="0 0 17 11" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 0H15C14.4477 0 14 0.447715 14 1V9.66667C14 10.219 14.4477 10.6667 15 10.6667H16C16.5523 10.6667 17 10.219 17 9.66667V1C17 0.447715 16.5523 0 16 0ZM10.3333 2.33333H11.3333C11.8856 2.33333 12.3333 2.78105 12.3333 3.33333V9.66667C12.3333 10.219 11.8856 10.6667 11.3333 10.6667H10.3333C9.78106 10.6667 9.33334 10.219 9.33334 9.66667V3.33333C9.33334 2.78105 9.78106 2.33333 10.3333 2.33333ZM6.66666 4.66667H5.66666C5.11437 4.66667 4.66666 5.11438 4.66666 5.66667V9.66667C4.66666 10.219 5.11437 10.6667 5.66666 10.6667H6.66666C7.21894 10.6667 7.66666 10.219 7.66666 9.66667V5.66667C7.66666 5.11438 7.21894 4.66667 6.66666 4.66667ZM2 6.66667H1C0.447715 6.66667 0 7.11438 0 7.66667V9.66667C0 10.219 0.447715 10.6667 1 10.6667H2C2.55228 10.6667 3 10.219 3 9.66667V7.66667C3 7.11438 2.55228 6.66667 2 6.66667Z"
        fill="currentColor"
      />
    </symbol>
    <symbol id="wac-i-wifi" viewBox="0 0 16 11" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.63661 2.27733C9.8525 2.27742 11.9837 3.12886 13.5896 4.65566C13.7105 4.77354 13.9038 4.77205 14.0229 4.65233L15.1789 3.48566C15.2392 3.42494 15.2729 3.34269 15.2724 3.25711C15.2719 3.17153 15.2373 3.08967 15.1763 3.02966C10.9612 -1.00989 4.31137 -1.00989 0.0962725 3.02966C0.0352139 3.08963 0.00057 3.17146 6.97078e-06 3.25704C-0.000556058 3.34262 0.0330082 3.42489 0.0932725 3.48566L1.24961 4.65233C1.36863 4.77223 1.56208 4.77372 1.68294 4.65566C3.28909 3.12876 5.4205 2.27732 7.63661 2.27733ZM7.63659 6.07299C8.85408 6.07292 10.0281 6.52545 10.9306 7.34266C11.0527 7.45864 11.2449 7.45613 11.3639 7.33699L12.5186 6.17033C12.5794 6.10913 12.6131 6.02612 12.6123 5.93985C12.6114 5.85359 12.576 5.77127 12.5139 5.71133C9.76573 3.15494 5.50979 3.15494 2.76159 5.71133C2.69952 5.77127 2.6641 5.85363 2.66328 5.93992C2.66247 6.02621 2.69633 6.10922 2.75726 6.17033L3.91159 7.33699C4.03058 7.45613 4.22286 7.45864 4.34493 7.34266C5.2468 6.52599 6.41991 6.0735 7.63659 6.07299ZM9.94959 8.62681C9.95136 8.71332 9.91735 8.79672 9.8556 8.85733L7.85826 10.873C7.79971 10.9322 7.71989 10.9656 7.6366 10.9656C7.55331 10.9656 7.47348 10.9322 7.41493 10.873L5.41726 8.85733C5.35555 8.79668 5.3216 8.71325 5.32343 8.62674C5.32526 8.54023 5.36271 8.45831 5.42693 8.40033C6.7025 7.32144 8.57069 7.32144 9.84626 8.40033C9.91044 8.45836 9.94783 8.5403 9.94959 8.62681Z"
        fill="currentColor"
      />
    </symbol>
    <symbol id="wac-i-battery" viewBox="0 0 25 12" fill="none">
      <path
        opacity={0.35}
        d="M2.66699 0.5H19.333C20.5296 0.5 21.5 1.47038 21.5 2.66699V8.66699C21.4998 9.86346 20.5295 10.833 19.333 10.833H2.66699C1.47048 10.833 0.500176 9.86346 0.5 8.66699V2.66699L0.510742 2.44531C0.621596 1.35265 1.54509 0.5 2.66699 0.5Z"
        stroke="currentColor"
      />
      <path
        opacity={0.4}
        d="M23 3.66669V7.66669C23.8047 7.32791 24.328 6.53982 24.328 5.66669C24.328 4.79355 23.8047 4.00546 23 3.66669Z"
        fill="currentColor"
      />
      <path
        d="M2 3.33333C2 2.59695 2.59695 2 3.33333 2H18.6667C19.403 2 20 2.59695 20 3.33333V8C20 8.73638 19.403 9.33333 18.6667 9.33333H3.33333C2.59695 9.33333 2 8.73638 2 8V3.33333Z"
        fill="currentColor"
      />
    </symbol>
  </svg>
);

registerSymbolJsx(<WorkvivoAiCompanionSvgDefs />);

/* The three glyphs below are drawn from primitives — `polyline`, `line`, `circle` — and
   not sprited, because none of them exists in the Workvivo library: it is nav-rail and
   feed focused and carries no back chevron, no composer plus and no slider control. That
   is the third icon-provenance case in the library README, and the right answer here
   rather than a fallback: a chevron is two straight segments and a plus is two crossed
   rules, so there is no brand art to get wrong. */

const ChevronLeft: React.FC = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
    <polyline
      points="15 18 9 12 15 6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** The composer's add control. Two crossed rules, sized to the 26px box around them. */
const PlusMark: React.FC = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" aria-hidden>
    <line
      x1="6"
      y1="1.6"
      x2="6"
      y2="10.4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <line
      x1="1.6"
      y1="6"
      x2="10.4"
      y2="6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * The agent-settings control in the title bar — two rules with the knobs that ride on
 * them. `#i-ui-filter-posts` is a funnel and already means "filter the sources" one row
 * below, in the composer; using it here as well would say the same word twice about two
 * different things.
 */
const TuneSliders: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden>
    <line
      x1="3"
      y1="6.5"
      x2="17"
      y2="6.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <line
      x1="3"
      y1="13.5"
      x2="17"
      y2="13.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle
      cx="12.5"
      cy="6.5"
      r="2.3"
      fill="#ffffff"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle
      cx="7"
      cy="13.5"
      r="2.3"
      fill="#ffffff"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

export type AiCompanionPrompt = {
  title: string;
  sub: string;
};

/**
 * The agent's suggested openers.
 *
 * Product chrome, not a customisation slot: these are the prompts Workvivo ships the
 * companion with, and "Catch Me Up" in particular is a named product feature that appears
 * under that exact label elsewhere in the film (WorkvivoCatchMeUp). They stay a prop so a
 * scene can stage a different set, but nothing researched should land here.
 */
export const AI_COMPANION_PROMPTS: readonly AiCompanionPrompt[] = [
  { title: "Catch Me Up", sub: "Summarise key updates from the last 5 days." },
  { title: "From my Teams", sub: "Summarise updates from my teams and spaces." },
  { title: "New Joiners", sub: "Show intros and onboarding posts from this week." },
];

/** Which of the three rail icons carries the active pill. */
export type AiCompanionTool = "panel" | "search" | "compose";

const RAIL: { tool: AiCompanionTool; href: string; label: string }[] = [
  { tool: "panel", href: "#i-ui-sidebar-toggle", label: "Conversations" },
  { tool: "search", href: "#i-ui-explore", label: "Search" },
  { tool: "compose", href: "#i-ui-start-new-chat", label: "New chat" },
];

export interface WorkvivoAiCompanionProps {
  /** The title-bar label. */
  title?: string;
  placeholder?: string;
  /** The composer's source filter. Workvivo's own wording, as on the desktop overlay. */
  sources?: string;
  /** Defaults to `AI_COMPANION_PROMPTS`, which is a frozen literal — hence readonly. */
  prompts?: readonly AiCompanionPrompt[];
  activeTool?: AiCompanionTool;
  /** The "Show more" affordance under the prompt list. */
  showMore?: boolean;
}

export const WorkvivoAiCompanion: React.FC<WorkvivoAiCompanionProps> = ({
  title = "AI Companion",
  placeholder = "Write a message",
  sources = "All sources",
  prompts = AI_COMPANION_PROMPTS,
  activeTool = "compose",
  showMore = true,
}) => (
  <div className="wac-screen">
    <WorkvivoAiCompanionSvgDefs />

    <div className="wac-top">
      <div className="wac-status">
        <div className="wac-time">9:41</div>
        <div className="wac-sysico">
          <SymbolSvg width="17" height="11" href="#wac-i-signal" />
          <SymbolSvg width="16" height="11" href="#wac-i-wifi" />
          <SymbolSvg width="25" height="12" href="#wac-i-battery" />
        </div>
      </div>
      <div className="wac-island" />
    </div>

    <div className="wac-head">
      <span className="wac-back">
        <ChevronLeft />
      </span>
      <div className="wac-title">{title}</div>
      <span className="wac-tune">
        <TuneSliders />
      </span>
    </div>

    <div className="wac-body">
      <div className="wac-rail">
        {RAIL.map((item) => (
          <span
            className={item.tool === activeTool ? "wac-railbtn wac-on" : "wac-railbtn"}
            key={item.tool}
            aria-label={item.label}
          >
            <Icon href={item.href} className="" width={18} height={18} />
          </span>
        ))}
      </div>

      <div className="wac-pane">
        <div className="wac-composer">
          <div className="wac-ph">{placeholder}</div>
          <div className="wac-tools">
            <span className="wac-plus">
              <PlusMark />
            </span>
            <span className="wac-sources">
              <Icon href="#i-ui-filter-posts" className="" width={12} height={12} />
              {sources}
            </span>
            <span className="wac-send">
              <Icon href="#i-ui-send" className="" width={14} height={14} />
            </span>
          </div>
        </div>

        <div className="wac-prompts">
          {prompts.map((prompt) => (
            <div className="wac-prompt" key={prompt.title}>
              <div className="wac-prompt-title">{prompt.title}</div>
              <div className="wac-prompt-sub">{prompt.sub}</div>
            </div>
          ))}
        </div>

        {showMore ? <div className="wac-more">Show more</div> : null}
      </div>
    </div>
  </div>
);
