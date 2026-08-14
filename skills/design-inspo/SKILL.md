---
name: design-inspo
description: Pixel-perfect UI replication and design-inspired creation from screenshots, mockups, or design references. Use when the user attaches or uploads a screenshot, mockup, Figma export, or design image and wants it copied, replicated, matched, or built in code — including phrases like "copy this," "replicate this," "match this design," "build this," "like this," or "use as inspiration." Also use for extracting colors, typography, or a design system from a visual. Covers exact replication, creative adaptation, and token extraction. If a UI image is provided and the goal is code or specs, apply this skill.
---

# Design Inspo

Turn screenshots, mockups, and design references into production-quality working code. This skill handles three modes — the user's intent determines which one fires.

## Determine the Mode

Read the user's request and the uploaded image to determine which mode to use:

| Mode | When to use | User says things like |
|---|---|---|
| **Replicate** | User wants an exact copy | "replicate this," "match this exactly," "pixel-perfect," "recreate this screen," "copy this" |
| **Adapt** | User wants the vibe but not a clone | "inspired by," "something like this," "use this style," "similar to," "in this aesthetic" |
| **Extract** | User wants tokens/system, not a full build | "extract the colors," "what's the design system," "pull the typography," "component inventory" |

If ambiguous, default to **Replicate** — it's what most people mean when they upload a screenshot.

---

## Mode 1: Replicate (Pixel-Perfect)

The goal is a rendered output that is visually indistinguishable from the screenshot. Treat the screenshot as the spec — nothing more, nothing less.

### Visual Audit (do this BEFORE writing any code)

Study the screenshot and extract these specifics. Write them down as a comment block at the top of your code so you can reference them as you build:

**Layout**
- Screen dimensions and aspect ratio (mobile, tablet, desktop)
- Column/row structure — is it a single column? Grid? Sidebar + main?
- Vertical spacing rhythm between sections (estimate in px)
- Horizontal padding/margins (estimate in px)
- Whether a nav bar, tab bar, status bar, or floating element is present

**Color**
- Primary background color (hex)
- Secondary/card background color (hex)
- Primary text color (hex)
- Secondary/muted text color (hex)
- Accent/CTA color (hex)
- Any gradients (direction, start color, end color)
- Divider/border colors (hex)

**Typography**
- Font classification: sans-serif, serif, monospace, or display
- Heading size, weight, and color
- Body text size, weight, line-height, and color
- Caption/label size, weight, and color
- Letter-spacing if visually apparent (tight, normal, wide)
- Any ALL-CAPS or small-caps treatments

**Components** (inventory every visible element)
- Buttons: size, border-radius, fill color, text color, shadow
- Cards: padding, border-radius, background, border, shadow
- Input fields: height, border style, border-radius, placeholder style
- List items: height, divider style, icon placement, spacing
- Images/avatars: dimensions, border-radius (circle? rounded?), placeholder treatment
- Icons: size, color, style (outline vs filled)
- Navigation: type (top bar, bottom tabs, sidebar), active/inactive states
- Modals/sheets: handle style, background, corner radius, overlay darkness

### Build Rules

1. **One file** when practical. Prefer a single self-contained React component (.tsx/.jsx) or HTML file; match the project's stack (e.g. Remotion compositions use `AbsoluteFill`, `interpolate`, existing fonts in the repo).
2. **Match the screenshot, not your assumptions.** If the screenshot shows a weird spacing choice, match it. Don't "fix" the design.
3. **No phantom elements.** Do not add anything that isn't in the screenshot — no extra buttons, no helper text, no icons that aren't there.
4. **No missing elements.** Everything visible in the screenshot must appear in the output.
5. **Use placeholder images correctly.** If the screenshot shows images, use appropriately-sized placeholder divs with background colors or simple SVG placeholders — not external image URLs that may break.
6. **Text must match.** If text is readable in the screenshot, use the exact same text. If it's too small to read, use realistic placeholder text of the same approximate length.
7. **Interactive states.** Add hover/active/pressed states to anything that looks tappable or clickable. Match the visual language (darker shade, slight scale, opacity change).
8. **Scroll behavior.** If content clearly extends beyond the viewport, implement appropriate scroll with hidden scrollbars if the design doesn't show them.
9. **Responsive to height.** The layout should adapt to different viewport heights without breaking.

### Quality Checklist (verify before presenting)

- [ ] Side-by-side with the screenshot, could you tell which is which?
- [ ] Every color matches (check backgrounds, text, accents, dividers)
- [ ] Font sizes and weights are proportionally correct
- [ ] Spacing rhythm is consistent with the screenshot
- [ ] Border radii match across all elements
- [ ] Shadows match in blur, spread, and opacity
- [ ] No elements are added or missing
- [ ] Interactive elements have appropriate states

---

## Mode 2: Adapt (Design-Inspired Creation)

The user wants a new build that borrows the *feeling* of the reference, not a clone. This is creative work — use the reference as a springboard.

### What to Borrow

Extract the **design DNA** from the reference:
- **Color strategy**: Not the exact hex values, but the relationship (dark bg + bright accent? Monochromatic + one pop color? Gradient-heavy?)
- **Typography strategy**: The personality (clean and geometric? Humanist and warm? Monospaced and technical?)
- **Spatial philosophy**: Dense and information-rich? Airy and minimal? Card-based? List-based?
- **Component style**: Rounded and soft? Sharp and angular? Borderless? Heavy shadows?
- **Overall mood**: Playful, professional, editorial, brutalist, luxury, etc.

### What to Make New

- The actual content and purpose (per the user's request)
- Specific color values (pick a cohesive palette that matches the strategy)
- Specific font choices (use Google Fonts or system fonts that match the personality)
- Layout adapted to the user's content needs
- Component details adapted to the user's functionality

### Creative Latitude

- You can and should deviate from the reference when the user's content demands it
- Add micro-interactions and polish beyond what the reference shows
- The reference is a constraint on *vibe*, not on execution

---

## Mode 3: Extract (Design System Tokens)

The user wants structured design data pulled from the visual reference. Output a clean, usable token set.

### Output Format

Present the extracted system as a structured artifact — either a JSON token file or a styled reference card (React component) depending on what's most useful.

**Color tokens:**
```
--color-bg-primary: #___
--color-bg-secondary: #___
--color-text-primary: #___
--color-text-secondary: #___
--color-accent: #___
--color-border: #___
```

**Typography tokens:**
```
--font-family-heading: ___
--font-family-body: ___
--font-size-h1: ___px
--font-size-body: ___px
--font-size-caption: ___px
--font-weight-bold: ___
--font-weight-regular: ___
--line-height-body: ___
```

**Spacing tokens:**
```
--space-xs: ___px
--space-sm: ___px
--space-md: ___px
--space-lg: ___px
--space-xl: ___px
```

**Component tokens:**
```
--radius-sm: ___px
--radius-md: ___px
--radius-lg: ___px
--shadow-card: ___
--shadow-button: ___
```

If the user asks for a component inventory, list every distinct component type with its properties.

---

## General Principles (All Modes)

**Font Selection Heuristic:**
When matching fonts from a screenshot, use this decision tree:
- Geometric sans-serif (circular letters, uniform strokes) → Try: Inter, SF Pro, Helvetica Neue, Geist
- Humanist sans-serif (varied strokes, friendlier) → Try: Source Sans Pro, Open Sans, Nunito
- Neo-grotesque (neutral, clean) → Try: Roboto, Neue Haas Grotesk
- Monospaced → Try: JetBrains Mono, SF Mono, Fira Code
- Serif → Try: Georgia, Merriweather, Playfair Display
- Display/decorative → Match the personality; search Google Fonts if needed

**Color Extraction Tips:**
- Dark backgrounds are rarely pure black (#000) — they're usually #0a0a0a to #1a1a1a or have a slight hue
- White text on dark backgrounds is rarely pure white — usually #f0f0f0 to #fafafa
- Accent colors are often more saturated than they appear at first glance
- Shadows on dark backgrounds use rgba(0,0,0,0.3-0.5); on light backgrounds rgba(0,0,0,0.05-0.15)

**Mobile vs Desktop Detection:**
- Narrow aspect ratio + large touch targets + bottom nav = mobile
- Wide aspect ratio + hover affordances + sidebar = desktop
- Build for whichever the screenshot shows; mention the other as a note if relevant

**When the Screenshot is Ambiguous:**
- If you can't read specific text, use realistic dummy text of similar length
- If a color is between two values, go with the more saturated option (screens desaturate in photos)
- If spacing is hard to judge, use a consistent 4px/8px grid and match proportionally
- If an icon is unrecognizable, use the closest Lucide icon or a simple SVG shape
