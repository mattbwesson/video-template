import React from "react";
import "./WorkvivoAdminCategoriesStyles.css";
import { useT } from "../../customize/uiStrings";

/**
 * Admin category cards — the carousel that pops in and steps past at global 4585-4702.
 *
 * Measured off the reference at 1920x1080. The carousel holds five slots and the middle one
 * is focused: the centre card is 512 x 400 and its neighbours are 355 x 278, which is
 * 0.695x. The neighbours sit 473px either side of the middle; the outer pair another 397px
 * beyond that — the strip is five cards with a 40px gap, so the outer pitch is a side
 * card's width plus the gap, not another 473.
 *
 * THE EIGHT CATEGORY GLYPHS ARE DRAWN
 * Same call as the survey builder's, for the same reason. The Workvivo library owns a
 * `spaces` mark, a heart and a people mark, and nothing for Theming, Localization,
 * Integrations, Provisioning or Platform — five of eight. Mixing three library glyphs with
 * five strangers in a row that reads as one set looks worse than drawing eight that agree,
 * so they are drawn on a common 24px box at a 1.6 stroke, each tinted with the colour
 * sampled off its reference glyph.
 */

/** Card geometry at the focused size; every other card is this scaled. */
export const CARD_W = 512;
export const CARD_H = 400;
export const SLOT_PITCH = 473;
export const SLOT_OUTER_PITCH = 397;
export const SIDE_SCALE = 0.695;

/** Screen x for a card at continuous track position `t`, in slots from the middle. */
export const slotX = (t: number) => {
  const a = Math.abs(t);
  const off = SLOT_PITCH * Math.min(a, 1) + SLOT_OUTER_PITCH * Math.max(0, a - 1);
  return 960 + Math.sign(t) * off;
};
/** Scale for the same: full in the middle, SIDE_SCALE from one slot out. */
export const slotScale = (t: number) => 1 - (1 - SIDE_SCALE) * Math.min(1, Math.abs(t));
/**
 * Card centre y. The focused card is centred on 538 and its neighbours on 541 — three
 * pixels lower, measured at 4611 — so the centre line eases down as a card leaves the middle.
 */
export const slotY = (t: number) => 538 + 3 * Math.min(1, Math.abs(t));

export type AdminCategory = {
  title: string;
  chips: string[];
  icon: string;
  /** The icon's tint and the disc behind it. */
  ink: string;
  disc: string;
};

const CATEGORY: Record<string, AdminCategory> = {
  features: { title: "Features", chips: ["Chat", "AI"], icon: "heart", ink: "#71c9ce", disc: "#ecfefe" },
  people: { title: "People", chips: ["People Manager", "Team Manager"], icon: "people", ink: "#66e0bd", disc: "#ecfdf5" },
  theming: { title: "Theming", chips: ["Themes", "Profile Banner Settings"], icon: "palette", ink: "#34bded", disc: "#f3f8ff" },
  localization: { title: "Localization", chips: ["Video Subtitle Translations", "Timezone"], icon: "pin", ink: "#6394e7", disc: "#f0f6ff" },
  spaces: { title: "Spaces", chips: ["Space Approvals", "Space Content Promotion"], icon: "spaces", ink: "#9f8dff", disc: "#f5f3ff" },
  integrations: { title: "Integrations", chips: ["App Integrations", "Zoom Configurations"], icon: "integrations", ink: "#ff6f8e", disc: "#fff1f2" },
  provisioning: { title: "Provisioning", chips: ["Workplace from Meta Migrat…", "Authentication Settings"], icon: "provisioning", ink: "#ff8e3b", disc: "#fff7ed" },
  platform: { title: "Platform", chips: ["Webhook Settings", "API Keys & JWT Settings"], icon: "platform", ink: "#f8bf22", disc: "#fefae9" },
};

/**
 * The strip, left to right. Spaces is on it twice because it is in the reference twice:
 * it is the outer-left card at 4611 AND the card that follows Localization at 4670. The
 * reference's own loop wrapped it; this is what was on screen.
 */
export const ADMIN_STRIP: AdminCategory[] = [
  CATEGORY.spaces,
  CATEGORY.features,
  CATEGORY.people,
  CATEGORY.theming,
  CATEGORY.localization,
  CATEGORY.spaces,
  CATEGORY.integrations,
  CATEGORY.provisioning,
  CATEGORY.platform,
];
/** Index into ADMIN_STRIP of the card that holds the middle when the carousel opens. */
export const ADMIN_STRIP_START = 2;

/** Kept for callers that list the categories; one of each. */
export const ADMIN_CATEGORIES: AdminCategory[] = Object.values(CATEGORY);

const CatIcon: React.FC<{ kind: string; ink: string; size: number }> = ({ kind, ink, size }) => {
  const s = { fill: "none", stroke: ink, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {kind === "heart" && (
        <path d="M12 20.4S3.6 15.4 3.6 9.6A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 8.4 1.9c0 5.8-8.4 10.8-8.4 10.8z" {...s} />
      )}
      {kind === "people" && (
        <>
          <circle cx="9.4" cy="7.2" r="3.4" {...s} />
          <path d="M3.2 20.2c0-3.6 2.8-6 6.2-6 1.4 0 2.7.4 3.7 1.1" {...s} />
          <path d="M17.6 13.8v6.2M14.5 16.9h6.2" {...s} />
        </>
      )}
      {kind === "palette" && (
        <>
          <path d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.2 0 1.9-.8 1.9-1.7 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.8 1.9-1.8h1.6a4.2 4.2 0 0 0 4.2-4.2c0-3.9-3.9-7-8.6-7z" {...s} />
          <circle cx="8.2" cy="9.2" r="1.25" fill={ink} />
          <circle cx="12.2" cy="7.2" r="1.25" fill={ink} />
          <circle cx="16" cy="9.4" r="1.25" fill={ink} />
        </>
      )}
      {kind === "pin" && (
        <>
          <path d="M12 21.4s6.4-6.2 6.4-10.9a6.4 6.4 0 1 0-12.8 0c0 4.7 6.4 10.9 6.4 10.9z" {...s} />
          <circle cx="12" cy="10.4" r="2.5" {...s} />
        </>
      )}
      {kind === "spaces" && (
        <>
          <path d="M12 3.6l8.6 4.6L12 12.8 3.4 8.2z" {...s} />
          <path d="M3.4 12.4l8.6 4.6 8.6-4.6" {...s} />
          <path d="M3.4 16.4l8.6 4.6 8.6-4.6" {...s} />
        </>
      )}
      {kind === "integrations" && (
        <path d="M2.6 12.6h4.2l2.4-6.4 3.2 12.4 2.6-8.2 1.6 2.2h4.8" {...s} strokeWidth="1.9" />
      )}
      {kind === "provisioning" && (
        <>
          <path d="M5.6 19.2c0-4.2 2.2-6.6 5.4-7.2 3.2-.6 5.6-2.6 6.2-6.6" {...s} strokeWidth="1.9" />
          <path d="M14.4 5.4h3.4v3.4" {...s} strokeWidth="1.9" />
          <circle cx="5.6" cy="19.2" r="1.6" fill={ink} />
        </>
      )}
      {kind === "platform" && (
        <>
          <path
            d="M10.4 3.2h3.2l.5 2.4 1.6.9 2.3-.8 1.6 2.8-1.8 1.6v1.8l1.8 1.6-1.6 2.8-2.3-.8-1.6.9-.5 2.4h-3.2l-.5-2.4-1.6-.9-2.3.8-1.6-2.8 1.8-1.6v-1.8L4.4 8.5 6 5.7l2.3.8 1.6-.9z"
            {...s}
          />
          <circle cx="12" cy="12" r="2.6" {...s} />
        </>
      )}
    </svg>
  );
};

/**
 * One card, drawn at the focused size and scaled by the caller. Everything inside is
 * positioned in the card's own 512x400 units so one transform moves the lot.
 */
export const WorkvivoAdminCard: React.FC<{
  category: AdminCategory;
  style?: React.CSSProperties;
}> = ({ category, style }) => {
  const t = useT();
  return (
    <div className="wac" style={{ width: CARD_W, height: CARD_H, ...style }}>
      <div className="wac-disc" style={{ background: category.disc }}>
        <CatIcon kind={category.icon} ink={category.ink} size={53} />
      </div>
      <div className="wac-title">{t(category.title)}</div>
      {category.chips.map((c, i) => (
        <div key={c} className="wac-chip" style={{ top: 154 + i * 74 }}>
          {t(c)}
        </div>
      ))}
      <div className="wac-more" style={{ top: 154 + category.chips.length * 74 + 8 }}>
        {t("View more")}
      </div>
    </div>
  );
};
