import React from "react";
import { SymbolSvg, registerSymbolJsx } from "./symbolRegistry";
import {
  Easing,
  Img,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "./WorkvivoPostComposerStyles.css";
import { useCustomization } from "../../customize/CustomizationProvider";
import { SlotIcon } from "../../customize/SlotIcon";
import type { IconSlotKey } from "../../customize/icons";

/**
 * Native port of public/refs/workvivo-post-composer.html — the seed card, composer modal,
 * Add grid, attachment tray and Select Value overlay. The ref remains the design source;
 * see docs/PORTING-HTML-REFS.md for the rules this file follows.
 *
 * Two behaviours changed IN KIND from the ref, on purpose:
 *
 * • The ref was driven by postMessage (SHOW_SEED/SHOW_COMPOSER/SHOW_ADD/SHOW_TRAY/
 *   SHOW_VALUES/CLOSE_VALUES) fired from an effect in the overlay. That is replaced by the
 *   `stage` prop — pure data, no effect, no iframe handshake. CLOSE_VALUES is not a stage:
 *   closing the values modal lands back on "tray", so the caller just passes "tray".
 *   The tray persists once shown (as the ref's class toggling did), so "values" draws it too.
 *
 * • The ref's entrance animations were CSS @keyframes on wall-clock time — non-deterministic
 *   under Remotion (previews played them once on load; renders captured arbitrary states).
 *   They are re-expressed here off useCurrentFrame(), same curves, same durations and delays,
 *   anchored to `composerShownAt` — the frame the composer view (re)appeared, since CSS
 *   restarts animations on display:none -> block and the video leans on that when the view
 *   returns from the Add grid. Pass null to render everything settled.
 */

export type PostComposerStage = "seed" | "composer" | "add" | "tray" | "values";

interface WorkvivoPostComposerProps {
  stage: PostComposerStage;
  /** Frame (in this component's frame-space) the composer view most recently became
   *  visible; anchors the entrance animations. null = settled, no entrance. */
  composerShownAt?: number | null;
  /**
   * Whether the tagged value's row is ticked.
   *
   * Defaults to true so a still of this screen shows a made choice. In the cut it is
   * false until the cursor presses the box — the modal used to open with the row already
   * ticked while the pointer was still travelling toward it, which read as the app having
   * decided for itself and made the click that follows look like it did nothing.
   */
  valueChecked?: boolean;
}

// The ref's two entrance curves.
const ENTER_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const POP_EASE = Easing.bezier(0.34, 1.56, 0.64, 1);

const SpriteDefs: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    aria-hidden
  >
    <symbol id="pc-i-ui-add-gif" viewBox="0 0 40.89 31.86">
      <path fill="currentColor" d="M32.92,31.86l-25.42-.02c-3.56,0-7.32-2.75-7.35-6.38L0,7.81C-.03,4.3,2.25.05,6.53.05L34.24,0c4.26,0,6.7,4.66,6.65,8.31l-.23,16.97c-.05,3.73-4.03,6.58-7.74,6.57ZM11.54,14.6c-.83.08-2.04,2.3-1.41,2.76l2.78,2.01c-.95.35-3.19.34-4.33-.22l.02-6.44c3.42-1.47,6.55,1.9,7.85.16.43-.57.38-2.54-.15-3.12-3.03-3.34-9.03-2.99-11.76.88l-.04,9.18c-.02,3.27,3.57,4.21,6.27,4.08,2.33-.11,4.81-.18,5.94-2.59.83-1.77.71-4.32.12-6.46-1.6-.35-3.21-.41-5.3-.22ZM23.26,21.25l-.1-11.86c0-.8-1.73-1.96-2.48-1.74-.68.2-1.77,1.44-1.77,2.2v11.55c0,1.38.96,2.55,2.09,2.49,1.44-.08,2.28-1.02,2.27-2.64ZM34.02,14.16l-4.61-.33c-.37-.03-.31-1.88.07-1.89l6.16-.18c.44-.46.76-2.22.46-2.83s-1.58-1.31-2.25-1.32l-6.67-.04c-.93,0-2.31,1.29-2.31,2.25v11.61c-.01,1.65.99,2.64,2.64,2.38,2.74-.43.76-5.39,2.03-5.47l2.31-.13c1.25-.07,2.45-.5,3.06-1.36.44-.62-.1-2.65-.9-2.71Z" />
    </symbol>
    <symbol id="pc-i-ui-add-image" viewBox="0 0 37.67 37.62">
      <path fill="currentColor" d="M35.76,37.62l-34.04-.02C.96,36.71,0,35.12,0,34.03V4.13C.01,1.51,2.18,0,4.56,0l29.49.04c2.1,0,3.62,2.05,3.62,4.01v29.97c0,1.19-.89,2.7-1.91,3.59ZM30.93,12.39c0-3.04-2.46-5.5-5.5-5.5s-5.5,2.46-5.5,5.5,2.46,5.5,5.5,5.5,5.5-2.46,5.5-5.5ZM26.63,34.51c-3.09-10.75-12.87-16.83-23.42-15.79l-.05,15.84,23.47-.06ZM34.57,34.58l-.24-8.77c-2.88-.16-5.3-.17-7.9-.05l3.56,8.62,4.59.19Z" />
    </symbol>
    <symbol id="pc-i-ui-ask-a-question" viewBox="0 0 24 24">
      <path d="M12 3.60711C7.36472 3.60711 3.60711 7.36472 3.60711 12C3.60711 16.6352 7.36472 20.3928 12 20.3928C16.6352 20.3928 20.3928 16.6352 20.3928 12C20.3928 7.36472 16.6352 3.60711 12 3.60711ZM1.89282 12C1.89282 6.41794 6.41794 1.89282 12 1.89282C17.582 1.89282 22.1071 6.41794 22.1071 12C22.1071 17.582 17.582 22.1071 12 22.1071C6.41794 22.1071 1.89282 17.582 1.89282 12ZM12.2488 8.61237C12.001 8.56308 11.7441 8.58838 11.5107 8.68506C11.2773 8.78175 11.0778 8.94549 10.9374 9.15557C10.797 9.36565 10.7221 9.61263 10.7221 9.86529C10.7221 10.3387 10.3383 10.7224 9.86496 10.7224C9.39157 10.7224 9.00781 10.3387 9.00781 9.86529C9.00781 9.27358 9.18328 8.69515 9.51201 8.20316C9.84075 7.71117 10.308 7.32771 10.8547 7.10127C11.4013 6.87483 12.0029 6.81558 12.5832 6.93102C13.1636 7.04646 13.6967 7.3314 14.1151 7.7498C14.5335 8.16821 14.8184 8.70129 14.9338 9.28163C15.0493 9.86198 14.99 10.4635 14.7636 11.0102C14.5372 11.5569 14.1537 12.0241 13.6617 12.3528C13.4124 12.5194 13.1409 12.6467 12.8567 12.7316V13.423C12.8567 13.8964 12.473 14.2801 11.9996 14.2801C11.5262 14.2801 11.1424 13.8964 11.1424 13.423V11.9999C11.1424 11.5265 11.5262 11.1428 11.9996 11.1428C12.2522 11.1428 12.4992 11.0678 12.7093 10.9275C12.9194 10.7871 13.0831 10.5876 13.1798 10.3542C13.2765 10.1207 13.3018 9.86388 13.2525 9.61607C13.2032 9.36827 13.0815 9.14064 12.9029 8.96198C12.7242 8.78333 12.4966 8.66166 12.2488 8.61237ZM11.407 15.7377C11.5825 15.6205 11.7888 15.5579 11.9999 15.5579C12.2818 15.5615 12.5512 15.6752 12.7505 15.8745C12.9499 16.0739 13.0635 16.3432 13.0672 16.6252C13.0672 16.8363 13.0046 17.0426 12.8874 17.2181C12.7701 17.3937 12.6034 17.5304 12.4084 17.6112C12.2133 17.692 11.9987 17.7132 11.7917 17.672C11.5847 17.6308 11.3945 17.5291 11.2452 17.3799C11.096 17.2306 10.9943 17.0404 10.9531 16.8334C10.9119 16.6264 10.9331 16.4118 11.0139 16.2167C11.0946 16.0217 11.2314 15.855 11.407 15.7377Z" style={{ fill: "currentcolor", fillRule: "evenodd" }} />
    </symbol>
    <symbol id="pc-i-ui-emoji-reaction" viewBox="0 0 18 18" fill="none">
      <path d="M7.81386 15.0909C4.0507 14.8349 1.20768 11.5768 1.4637 7.8136C1.71972 4.05049 4.97781 1.20743 8.74097 1.46345C12.5041 1.71946 15.3471 4.97761 15.0911 8.74072" style={{ stroke: "currentcolor", strokeWidth: 1.35, strokeLinecap: "round", strokeLinejoin: "round" }} />
      <path d="M4.80859 9.32764C5.33394 11.2189 7.43531 12.3746 9.32655 11.8493C10.4823 11.429 11.4279 10.4834 11.7431 9.32764" style={{ stroke: "currentcolor", strokeWidth: 1.35, strokeLinecap: "round", strokeLinejoin: "round" }} />
      <path d="M5.9658 6.64888C5.82073 6.64888 5.70312 6.53128 5.70312 6.38621C5.70312 6.24114 5.82073 6.12354 5.9658 6.12354" style={{ stroke: "currentcolor", strokeWidth: 1.35, strokeLinecap: "round", strokeLinejoin: "round" }} />
      <path d="M5.96484 6.64888C6.10991 6.64888 6.22752 6.53128 6.22752 6.38621C6.22752 6.24114 6.10991 6.12354 5.96484 6.12354" style={{ stroke: "currentcolor", strokeWidth: 1.35, strokeLinecap: "round", strokeLinejoin: "round" }} />
      <path d="M10.5888 6.64888C10.4438 6.64888 10.3262 6.53128 10.3262 6.38621C10.3262 6.24114 10.4438 6.12354 10.5888 6.12354" style={{ stroke: "currentcolor", strokeWidth: 1.35, strokeLinecap: "round", strokeLinejoin: "round" }} />
      <path d="M10.5879 6.64888C10.733 6.64888 10.8506 6.53128 10.8506 6.38621C10.8506 6.24114 10.733 6.12354 10.5879 6.12354" style={{ stroke: "currentcolor", strokeWidth: 1.35, strokeLinecap: "round", strokeLinejoin: "round" }} />
      <path d="M14.4516 12V16.9032M16.9032 14.4516L12 14.4516" style={{ stroke: "currentcolor", strokeWidth: 1.35, strokeLinecap: "round", strokeLinejoin: "round" }} />
    </symbol>
    <symbol id="pc-i-ui-everyone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </symbol>
    <symbol id="pc-i-ui-post-a-value-update" viewBox="0 0 40.25 40.18">
      <path fill="currentColor" d="M33.04,30.82c4.23-4.78,3.22-11.49,5.84-11.38,2.3.11,2.46,8.4-5.46,15.67-5.41,4.97-13.22,6.41-20.41,3.74C6.54,36.45,1.77,30.81.33,23.27c-1.36-7.08,1.58-13.98,7.07-18.82C12.21.22,19.91-1.14,20.62,1c.17.51-.26,1.67-.7,2.16-7.72.38-14.13,5.55-15.99,13.36-1.9,7.96,3.06,16.91,11.26,19.34,6.39,1.89,13.24.16,17.85-5.04Z" />
      <path fill="currentColor" d="M34.26,14.78c-1.66,1.67-3.66-2.98-8.35,1.81l-3.45,3.52c-.34.35-1.55.75-2.02.61-.57-.17-1.32-1.33-1.28-1.95l6.89-6.98-.66-5.72L30.62.75c.29-.29,1.22-.7,1.6-.6s.99.95,1.07,1.37l.8,4.11,4.51,1.42,1.4.44c.31.1.06,1.47-.17,1.7l-5.57,5.61Z" />
      <path fill="currentColor" d="M20.26,26.64c6.13.28,5.59-5.56,8.02-5.48.56.02,1.62,1.58,1.48,2.25-.68,3.23-4.76,6.47-7.96,6.82-4.37.49-8.36-1.16-10.34-4.88-5.02-9.44,4.81-15.72,5.86-15.09.55.32,1.33,1.23,1.53,1.78s-.95,1.69-1.48,1.91c-4.24,1.75-4.7,7.62-2.38,10.43,1.27,1.54,2.88,2.16,5.27,2.27Z" />
    </symbol>
    <symbol id="pc-i-ui-shout-out" viewBox="0 0 40.79 36.34">
      <path fill="currentColor" d="M38.72,30.83c-.43,2.61-3.59,5.47-6.15,5.47l-17.44.03c-1.81,0-5-1.93-5.01-3.95l-.16-17.97,6.44-11.64c1.1-2,3.28-3.18,5.19-2.65,2.65.75,3.68,2.61,3.67,5.29l-.02,6.36,10.84.2c3.37.06,5.11,4.03,4.63,6.88l-1.99,11.98Z" />
      <path fill="currentColor" d="M5.38,33.58c-.14,1.81-5.23,1.17-5.24-.75L0,16.33c0-.84,1.37-2.07,2.12-2.3.95-.29,2.76.14,3.5,1,.04,6.12.25,12.1-.25,18.55Z" />
    </symbol>
    <symbol id="pc-i-ui-wellbeing-heart" viewBox="0 0 51 50" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M0.998317 23.6476C-1.88228 14.4342 1.48423 3.9035 10.926 0.787458C15.8926 -0.854445 21.3746 0.113646 25.5035 3.29569C29.4097 0.201654 35.093 -0.843444 40.0542 0.787458C49.496 3.9035 52.884 14.4342 50.0061 23.6476C45.5227 38.2514 25.5035 49.5 25.5035 49.5C25.5035 49.5 5.63197 38.422 0.998317 23.6476Z" fill="white" />
    </symbol>
  </svg>
);

const AddTile: React.FC<{ bg: string; color: string; label: string; children: React.ReactNode }> = ({
  bg,
  color,
  label,
  children,
}) => (
  <div className="pc-tile">
    <span className="pc-disc" style={{ background: bg, color }}>{children}</span>
    <span>{label}</span>
  </div>
);

/**
 * The four rows of the Select Value overlay — artwork only.
 *
 * The NAMES come from `copy.composed.values`, because a company's stated values are the
 * most recognisable internal language it has and the research step goes looking for them.
 * What stays here is what a model has no business choosing: `slot` is what makes each
 * disc swappable in the wizard, and `size` is the size the ref drew that particular piece
 * of art at, kept per-row because they differ (the heart is 42px, the smiley 44px) so a
 * swapped icon lands where the original sat.
 */
const VALUE_ROWS: Array<{
  slot: IconSlotKey;
  size: number;
  art: React.ReactNode;
}> = [
  { slot: "value.disc.0", size: 42, art: <SymbolSvg width="42" height="42" href="#pc-i-ui-wellbeing-heart" /> },
  { slot: "value.disc.1", size: 38, art: <span className="pc-g-up"><i /><i /><i /></span> },
  { slot: "value.disc.2", size: 44, art: <SymbolSvg width="44" height="44" href="#pc-i-ui-emoji-reaction" /> },
  { slot: "value.disc.3", size: 44, art: <span className="pc-g-self"><i /><i /><u /><b /></span> },
];

/** Split a shout-out body around the recipient's name, keeping the surrounding text. */
const splitAroundName = (body: string, name: string): { before: string; after: string } => {
  const at = name ? body.indexOf(name) : -1;
  if (at < 0) return { before: body, after: "" };
  return { before: body.slice(0, at), after: body.slice(at + name.length) };
};

export const WorkvivoPostComposer: React.FC<WorkvivoPostComposerProps> = ({
  stage,
  valueChecked = true,
  composerShownAt = null,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { person, image, copy } = useCustomization();
  const { before, after } = splitAroundName(copy.composed.body, copy.composed.recipient);

  const showTray = stage === "tray" || stage === "values";

  // 0 -> 1 through one entrance, replicating `animation: <dur> <ease> <delay> both` off the
  // frame the composer view appeared. `both` fill = clamped at each end, exactly interpolate's
  // clamp. Null anchor = everything settled.
  const enter = (delaySec: number, durSec: number, ease: (t: number) => number): number => {
    if (composerShownAt === null) return 1;
    return interpolate(
      frame - composerShownAt,
      [delaySec * fps, (delaySec + durSec) * fps],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
    );
  };

  // .top — slideDownFade .45s ease .05s
  const topT = enter(0.05, 0.45, ENTER_EASE);
  // .fmt — scaleInFade .48s ease .1s
  const fmtT = enter(0.1, 0.48, ENTER_EASE);
  // .doc — slideUpFade .5s ease .15s
  const docT = enter(0.15, 0.5, ENTER_EASE);
  // .doc b — namePop .55s pop .25s (scale .8 -> 1.12@60% -> 1, violet -> purple)
  const nameLinear = enter(0.25, 0.55, (t) => t);
  // .acts — slideUpFade .5s ease .2s
  const actsT = enter(0.2, 0.5, ENTER_EASE);
  // .post — pulsePop .6s pop .28s (scale .85 -> 1.06@70% -> 1, purple glow swells then rests)
  const postLinear = enter(0.28, 0.6, (t) => t);

  // The two three-stop keyframe pops. CSS eases each keyframe SEGMENT independently, so the
  // pop curve is applied within [0, mid] and again within [mid, 1] rather than once overall.
  const nameScale =
    nameLinear < 0.6
      ? 0.8 + (1.12 - 0.8) * POP_EASE(nameLinear / 0.6)
      : 1.12 + (1 - 1.12) * POP_EASE((nameLinear - 0.6) / 0.4);
  const nameColor = interpolateColors(Math.min(nameLinear / 0.6, 1), [0, 1], ["#8B5CF6", "#6103ED"]);
  const nameOpacity = interpolate(nameLinear, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const postScale =
    postLinear < 0.7
      ? 0.85 + (1.06 - 0.85) * POP_EASE(postLinear / 0.7)
      : 1.06 + (1 - 1.06) * POP_EASE((postLinear - 0.7) / 0.3);
  const postShadow =
    postLinear < 0.7
      ? `0 ${8 * (postLinear / 0.7)}px ${24 * (postLinear / 0.7)}px rgba(97, 3, 237, ${0.45 * (postLinear / 0.7)})`
      : `0 ${interpolate(postLinear, [0.7, 1], [8, 4])}px ${interpolate(postLinear, [0.7, 1], [24, 14])}px rgba(97, 3, 237, ${interpolate(postLinear, [0.7, 1], [0.45, 0.3])})`;
  const postOpacity = interpolate(postLinear, [0, 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const composerView = (
    <div>
      <div
        className="pc-top"
        style={{ opacity: topT, transform: `translateY(${(1 - topT) * -16}px)` }}
      >
        <img className="pc-av" src={person.avatarUrl} style={person.avatarFit} alt="" />
        <div className="pc-aud">
          <SymbolSvg width="20" height="20" href="#pc-i-ui-everyone" />
          <span>Everyone</span>
          <span className="pc-caret" />
        </div>
        <span className="pc-close"><i /><i /></span>
      </div>

      <div
        className="pc-fmt"
        style={{
          opacity: fmtT,
          transform: `scale(${0.92 + 0.08 * fmtT}) translateY(${(1 - fmtT) * -8}px)`,
        }}
      >
        <div className="pc-style"><span>Normal Text</span><span className="pc-caret" /></div>
        <span className="pc-divider" />
        <span className="pc-fb pc-b pc-on">B</span>
        <span className="pc-fb pc-i">I</span>
        <span className="pc-fb pc-u">U</span>
        <span className="pc-fb pc-s">S</span>
        <span className="pc-fb pc-code">{"</>"}</span>
        <span className="pc-divider" />
        <span className="pc-fb"><span className="pc-lnk"><i /><i /></span></span>
        <span className="pc-fb"><SymbolSvg width="21" height="21" href="#pc-i-ui-emoji-reaction" /></span>
      </div>

      <div
        className="pc-doc"
        style={{ opacity: docT, transform: `translateY(${(1 - docT) * 18}px)` }}
      >
        {/* The recipient's name is its own animated element — it fades and scales in as
            the value is applied — so the body is split around it rather than rendered as
            one string. `splitAroundName` falls back to putting the whole body before the
            name if a rewritten post does not contain it, which loses the animation but
            never loses the text. */}
        {before}
        <b style={{ opacity: nameOpacity, transform: `scale(${nameScale})`, color: nameColor }}>
          {copy.composed.recipient}
        </b>
        {after}
      </div>

      {showTray && (
        <div className="pc-tray">
          <div data-vc-slot="app.post.0"
            className="pc-thumb"
            style={{ background: `url('${image("app.post.0", staticFile("img/workvivo/hero_banner.png"))}') center/cover no-repeat` }}
          >
            <span className="pc-badge pc-edit"><span className="pc-g-pen"><i /><i /></span></span>
            <span className="pc-badge pc-kill"><span className="pc-g-x"><i /><i /></span></span>
          </div>
          <div data-vc-slot="composer.tray.0"
            className="pc-thumb"
            style={{ background: `url('${image("composer.tray.0", staticFile("img/workvivo/post_virgin.png"))}') center/cover no-repeat` }}
          >
            <span className="pc-badge pc-edit"><span className="pc-g-pen"><i /><i /></span></span>
            <span className="pc-badge pc-kill"><span className="pc-g-x"><i /><i /></span></span>
          </div>
        </div>
      )}

      <div className="pc-chip" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px 12px" }}>
        <svg width="20" height="20" style={{ color: "#4B5563" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <img data-vc-slot="composer.face.0"
          src={image("composer.face.0", staticFile("img/avatar-3.jpeg"))}
          alt={copy.composed.recipient}
          style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div
        className="pc-acts"
        style={{ opacity: actsT, transform: `translateY(${(1 - actsT) * 18}px)` }}
      >
        <span className="pc-ab"><SymbolSvg width="24" height="24" href="#pc-i-ui-add-image" /></span>
        <span className="pc-ab"><SymbolSvg width="24" height="24" href="#pc-i-ui-add-gif" /></span>
        <span className="pc-divider" />
        <span className="pc-ab"><SymbolSvg width="24" height="24" href="#pc-i-ui-shout-out" /></span>
        <span className="pc-ab"><SymbolSvg width="24" height="24" href="#pc-i-ui-post-a-value-update" /></span>
        <span className="pc-ab"><span className="pc-plus"><i /><i /></span></span>
        <span className="pc-kebab"><i /><i /><i /></span>
        <button
          className="pc-post"
          style={{ opacity: postOpacity, transform: `scale(${postScale})`, boxShadow: postShadow }}
        >
          Post
        </button>
      </div>
    </div>
  );

  const addView = (
    <div>
      <div className="pc-ahead">
        <span className="pc-back"><i /><i /><i /></span>
        <h2>Add</h2>
        <span className="pc-close"><i /><i /></span>
      </div>
      <div className="pc-agrid">
        <AddTile bg="#E6F7EE" color="#16A34A" label="Image">
          <Img src={staticFile("img/post types/post-image.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#FFF0E0" color="#F97316" label="Video">
          <Img src={staticFile("img/post types/post-video.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#E4F0FF" color="#2E7CF6" label="GIF">
          <Img src={staticFile("img/post types/post-gif.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#F3ECFF" color="#7C3AED" label="Attachment">
          <Img src={staticFile("img/post types/post-attachment.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#FDE8F1" color="#EC4899" label="Hooray">
          <Img src={staticFile("img/post types/post-hooray.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#E4F1FD" color="#0EA5E9" label="Value">
          <Img src={staticFile("img/post types/post-value.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#FEF3DC" color="#F59E0B" label="Poll">
          <Img src={staticFile("img/post types/post-poll.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#E9E9FD" color="#6366F1" label="Campaign">
          <Img src={staticFile("img/post types/post-campaign.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#F3E8FF" color="#A855F7" label="Tag">
          <Img src={staticFile("img/post types/post-tag.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#E6F7EE" color="#16A34A" label="Acknowled...">
          <Img src={staticFile("img/post types/post-acknowledgement.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
        <AddTile bg="#E0F5F5" color="#06B6D4" label="Translations">
          <Img src={staticFile("img/post types/post-translation.svg")} style={{ width: 40, height: 40, objectFit: "contain" }} />
        </AddTile>
      </div>
    </div>
  );

  return (
    <div className="pc-root">
      <SpriteDefs />

      {stage === "seed" ? (
        <div className="pc-seed">
          <div className="pc-seedtop">
            <img className="pc-seedav" src={person.avatarUrl} style={person.avatarFit} alt="" />
            <span className="pc-seedph">What&rsquo;s going on, {person.firstName}?</span>
            <button className="pc-golive">Go Live <i /></button>
          </div>
          <div className="pc-seedacts">
            <button className="pc-sact">
              <SymbolSvg width="19" height="19" href="#pc-i-ui-shout-out" />Give a Shout-Out
            </button>
            <button className="pc-sact">
              <SymbolSvg width="19" height="19" href="#pc-i-ui-post-a-value-update" />Post a Value Update
            </button>
            <button className="pc-sact">
              <SymbolSvg width="19" height="19" href="#pc-i-ui-ask-a-question" />Ask a Question
            </button>
          </div>
        </div>
      ) : (
        <div className="pc-modal">{stage === "add" ? addView : composerView}</div>
      )}

      {stage === "values" && (
        <div className="pc-scrim">
          <div className="pc-vmodal">
            <div className="pc-vhead">
              Select Value
              <span className="pc-g-x"><i /><i /></span>
            </div>
            {VALUE_ROWS.map((row, i) => (
              <div className="pc-vrow" key={row.slot}>
                <span className="pc-vdisc">
                  <SlotIcon slot={row.slot} size={row.size}>
                    {row.art}
                  </SlotIcon>
                </span>
                <span className="pc-vtx">
                  <b>{copy.composed.values[i]}</b>
                  <span>Organization Value</span>
                </span>
                {/* Ticked on the row the post is tagged with, and only once the pointer
                    has actually pressed it — see `valueChecked`. */}
                <span
                  className={`pc-vbox${
                    valueChecked && copy.composed.values[i] === copy.composed.value
                      ? " pc-on"
                      : ""
                  }`}
                />
              </div>
            ))}
            <div className="pc-vfoot"><button className="pc-ok">OK</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Feed this file's symbols into the inline registry (symbolRegistry.tsx): the hidden
// sprite above cannot be referenced across <svg> roots in the in-browser export, so
// every icon is drawn inlined instead and the sprite is kept only as a fallback.
registerSymbolJsx(<SpriteDefs />);
