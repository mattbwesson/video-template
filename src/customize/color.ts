/**
 * Pure colour maths, shared by the Remotion side and the wizard in `web/`.
 *
 * Nothing here touches the DOM or Remotion, on purpose: the wizard imports it to drive
 * its own chrome and the composition imports it to build the video's palette, and both
 * have to agree exactly or the preview lies about the render.
 *
 * Hex values are stored WITHOUT the leading `#` and uppercased ("44D760"), because that
 * is the form an `<input type="color">` round-trips most cleanly and the form the copy
 * catalogue serialises. `css()` is the only thing that adds the hash.
 */

export type Hex = string;

/** Strip anything that is not a hex digit, uppercase, clamp to six. Never throws. */
export const cleanHex = (h: string | null | undefined): string =>
  (h ?? "").replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase();

export const isHex = (h: string): boolean => /^[0-9A-F]{6}$/.test(h);

/** `"44D760"` -> `"#44D760"`. Accepts values that already carry the hash. */
export const css = (h: Hex): string => (h.startsWith("#") ? h : `#${h}`);

export const rgb = (h: Hex): [number, number, number] => {
  const v = cleanHex(h).padEnd(6, "0");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
};

export const rgba = (h: Hex, alpha: number): string => {
  const [r, g, b] = rgb(h);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const toHex = (n: number): string =>
  Math.round(Math.min(255, Math.max(0, n)))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();

export const fromRgb = (r: number, g: number, b: number): Hex =>
  `${toHex(r)}${toHex(g)}${toHex(b)}`;

export type Hsl = { h: number; s: number; l: number };

export const toHsl = (hex: Hex): Hsl => {
  const [r0, g0, b0] = rgb(hex).map((v) => v / 255) as [number, number, number];
  const mx = Math.max(r0, g0, b0);
  const mn = Math.min(r0, g0, b0);
  const d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    h =
      mx === r0
        ? ((g0 - b0) / d) % 6
        : mx === g0
          ? (b0 - r0) / d + 2
          : (r0 - g0) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
};

export const fromHsl = ({ h, s, l }: Hsl): Hex => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h % 360) / 60) % 2 - 1));
  const m = l - c / 2;
  const hh = ((h % 360) + 360) % 360;
  const t =
    hh < 60
      ? [c, x, 0]
      : hh < 120
        ? [x, c, 0]
        : hh < 180
          ? [0, c, x]
          : hh < 240
            ? [0, x, c]
            : hh < 300
              ? [x, 0, c]
              : [c, 0, x];
  return fromRgb((t[0] + m) * 255, (t[1] + m) * 255, (t[2] + m) * 255);
};

/** WCAG relative luminance, 0 (black) to 1 (white). */
export const luminance = (hex: Hex): number => {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * The operator's colour becomes a full-frame field with white type on it — the intro,
 * the headquarters headline, "Back from time off?", the livestream pills. White is a
 * design constant on those fields, not a computed choice, so the clamp's job is to make
 * sure white keeps working.
 *
 * The ceiling is the approved demo's own green (#44D760, luminance 0.507) rounded up a
 * hair, rather than a number picked out of the air: whatever the operator supplies ends
 * up no harder to read than the cut that was signed off, and the baseline green itself
 * passes through untouched, which is what keeps the demo rendering exactly as approved.
 * A near-white brand darkens until it clears the bar; hue and saturation are left alone,
 * so a customer's yellow stays yellow, it just stops glowing.
 */
export const MAX_FIELD_LUMINANCE = 0.51;

export const clampBrandAccentHex = (
  input: string,
  maxLuminance = MAX_FIELD_LUMINANCE,
): Hex => {
  let h = cleanHex(input);
  if (!isHex(h)) return DEFAULT_BRAND_HEX;
  let guard = 0;
  while (luminance(h) > maxLuminance && guard++ < 24) {
    const [r, g, b] = rgb(h);
    h = fromRgb(r * 0.88, g * 0.88, b * 0.88);
  }
  return h;
};

/**
 * Black or white type, whichever survives on `hex`. Perceptual weighting, not luminance.
 *
 * For CHIPS and PILLS sitting on the brand colour, where the design has no opinion. The
 * full-frame brand fields are white by design — see `MAX_FIELD_LUMINANCE` — and must not
 * use this, or the baseline green (which weights just over the threshold) would flip its
 * headline to near-black.
 */
export const inkOn = (hex: Hex): string => {
  const [r, g, b] = rgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#0B0C10" : "#FFFFFF";
};

/** Same hue and saturation, forced to a given lightness. */
export const withLightness = (hex: Hex, l: number): Hex => {
  const c = toHsl(hex);
  return fromHsl({ ...c, l: Math.min(1, Math.max(0, l)) });
};

/** `amount` > 0 lightens toward white, < 0 darkens toward black. */
export const shade = (hex: Hex, amount: number): Hex => {
  const { l } = toHsl(hex);
  return withLightness(hex, amount >= 0 ? l + (1 - l) * amount : l * (1 + amount));
};

/** Mix two hexes, `t` = 0 gives `a`, 1 gives `b`. */
export const mix = (a: Hex, b: Hex, t: number): Hex => {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return fromRgb(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
};

/**
 * The wizard's own chrome sits on a near-black page, where a customer's navy or maroon
 * would be invisible. This lifts the brand into something readable there WITHOUT
 * touching what the video uses — the two are deliberately different values.
 */
export const uiAccentOf = (hex: Hex): Hex => {
  const { h, s, l } = toHsl(hex);
  if (s < 0.1) return fromHsl({ h, s: 0, l: Math.max(l, 0.8) });
  return fromHsl({
    h,
    s: Math.max(s, 0.52),
    l: Math.min(Math.max(l, 0.62), 0.72),
  });
};

/** The shipped baseline: the green the approved demo was cut on. */
export const DEFAULT_BRAND_HEX: Hex = "44D760";
