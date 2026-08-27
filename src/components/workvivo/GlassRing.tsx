import React from "react";

/**
 * The glass edge's ring, as a real element.
 *
 * It used to be `.wv-glass-edge::before`. The in-browser export never paints a pseudo-
 * element — it walks the DOM with `NodeFilter.SHOW_ELEMENT` — so the whole desktop glass
 * edge was missing from every render, while the phones (whose band is the root's own
 * background) looked correct and hid the problem.
 *
 * Drop it in as the FIRST child of anything carrying `wv-glass-edge` or `wv-glass-phone`.
 * It is absolutely positioned, so it costs no layout, and being first means the band
 * paints under the frame's content rather than over it.
 */
export const GlassRing: React.FC = () => <div className="wv-glass-ring" />;
