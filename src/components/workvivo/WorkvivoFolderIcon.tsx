import React from "react";

/**
 * Workvivo's folder glyph, and the tinted tile the home feed wraps it in.
 *
 * Lifted verbatim out of WorkvivoLeftColumn, where it was a private component, so the
 * Newsletters screen can use the same mark rather than a lookalike. Nothing about the
 * markup changed — `DocumentFolderIcon` still renders exactly the 36px tile the featured-
 * documents card has always drawn.
 *
 * `strokeWidth: 1.71` is not arbitrary: the Newsletters Figma export specifies the card's
 * folder outline at 1.81px, which is 1.71 once its 1.0583 frame scale comes out. The same
 * glyph, at the same weight, in both places.
 */

export const FolderGlyph: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 18, color = "#6103ED" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    width={size}
    height={size}
    style={{ color, display: "block", flexShrink: 0 }}
  >
    <path
      d="M19.164 10.4078V8.01959C19.164 7.14028 18.4512 6.42745 17.5718 6.42745H9.6111L9.11654 4.44915C8.93933 3.74039 8.30251 3.24316 7.57192 3.24316H3.24253C2.36322 3.24316 1.65039 3.956 1.65039 4.83531V19.1646C1.65039 20.0439 2.36322 20.7567 3.24253 20.7567H11.2032"
      stroke="currentColor"
      strokeWidth="1.71"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.2028 20.7581H18.7164C19.447 20.7581 20.0839 20.2609 20.2611 19.5521L22.3266 11.2899C22.3406 11.2337 22.3478 11.1759 22.3478 11.118C22.3478 10.7265 22.0305 10.4092 21.6389 10.4092H8.46342C7.73381 10.4092 7.09757 10.9051 6.91946 11.6126L5.61914 16.7778"
      stroke="currentColor"
      strokeWidth="1.71"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DocumentFolderIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 6,
      backgroundColor: "rgba(97, 3, 237, 0.12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <FolderGlyph size={size / 2} />
  </div>
);
