import React from "react";
import { Img } from "remotion";
import { useCustomization } from "./CustomizationProvider";
import { ICON_SLOT_ATTR, type IconSlotKey } from "./icons";
import { InlineSvg } from "../components/InlineSvg";

/** Overrides arrive as a `public/`-relative path, so the extension is all we have. */
const isSvg = (url: string): boolean => /\.svg(\?|#|$)/i.test(url);

/**
 * One swappable icon position: the operator's pick if they made one, otherwise the
 * artwork the scene was built with.
 *
 * A wrapper rather than an `icon(slot, fallback)` call at each site, because an icon's
 * baseline is JSX — a sprite `<use>`, a CSS-drawn glyph — and a function returning a URL
 * cannot express that. Wrapping also puts `data-vc-icon` on exactly one element per
 * position, which is what the wizard's overlay measures; scattering the attribute by hand
 * across nine call sites is how one of them ends up on the disc instead of the glyph and
 * the hit target quietly grows to 86px.
 *
 * `size` is the drawn size in composition pixels — the same number the baseline art is
 * given — so a swapped icon lands at the size the layout was tuned for rather than at
 * whatever the SVG's own width attribute happens to say (the shipped set ranges from 24
 * to 51px).
 */
export const SlotIcon: React.FC<{
  slot: IconSlotKey;
  size: number;
  /** The baseline artwork, drawn whenever this position has not been swapped. */
  children: React.ReactNode;
}> = ({ slot, size, children }) => {
  const { icon } = useCustomization();
  const url = icon(slot);

  return (
    <span
      {...{ [ICON_SLOT_ATTR]: slot }}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
    >
      {url ? (
        isSvg(url) ? (
          // An SVG has to be INLINED, never put behind an <Img>: delivered through an
          // image element it exports corner-cropped, which for a vendor logo means
          // whatever solid block sits in its top-left. The shipped sets are almost
          // entirely SVG, so this is the normal path, not the exception.
          // No explicit size — the wrapper below is already the drawn box, and the
          // inner <svg> fills it at its own aspect (SVG's default preserveAspectRatio
          // is the same meet-and-centre `objectFit: contain` gave the <Img>).
          <InlineSvg src={url} style={{ width: "100%", height: "100%" }} />
        ) : (
          <Img
            src={url}
            // `contain`, not `cover`: the shipped icons are not square (the star is
            // 48×46) and cropping a glyph to fill a circle clips its points off.
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )
      ) : (
        children
      )}
    </span>
  );
};
