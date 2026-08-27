/**
 * What the wizard holds, and how it becomes `inputProps`.
 *
 * The wizard's state is shaped by the FORM — a company, a person, a logo, a bag of
 * photos — while the composition's is shaped by the VIDEO. `toInputProps` is the single
 * seam between the two, so a change to either side has exactly one place to meet.
 */

import { COPY, type VideoInputProps } from "../src/customize/videoCopy";
import { assignImagery, type ImageSlotKey } from "../src/customize/imagery";
import { expandCopyOverrides } from "../src/customize/copyPaths";
import { repairSelfShoutOut } from "../src/customize/shoutOut";
import { followValueRenames } from "../src/customize/valueEcho";
import type { HeaderOverrides } from "../src/customize/headers";
import {
  DEFAULT_BRAND_HEX,
  clampBrandAccentHex,
  type Hex,
} from "../src/customize/color";
import type { Upload } from "./uploads";
import type { SlotFraming } from "./framing";
import type { ResearchState } from "./research";

export type WizardState = {
  company: string;
  /**
   * Free text about the audience and the deal.
   *
   * Goes to the research step as the operator's own framing, alongside whatever the web
   * search turns up. It is the one input the model cannot get for itself.
   */
  context: string;
  person: { name: string; title: string; photo: Upload | null };
  logo: Upload | null;
  /**
   * The white knockout DERIVED from `logo` (see logoProcess.ts).
   *
   * Empty while none has been derived — either no logo yet, or a file that failed
   * processing — in which case the provider falls back to the colour mark.
   */
  logoWhite: string;
  /**
   * A reversed logo the operator supplied themselves, which beats the derived one.
   *
   * Deriving a knockout is a guess, and on a mark with white cut-outs inside a solid
   * shape it is a bad guess — forcing every inked pixel white fills the holes in. Brand
   * kits usually ship a real reversed file; when one is given, it wins outright.
   */
  logoWhiteUpload: Upload | null;
  /** Exactly as the operator picked it — unclamped, so the picker shows their colour. */
  color: Hex;
  /**
   * True once the operator has chosen a colour themselves.
   *
   * A logo only gets to SET the brand colour while this is false; after that a new logo
   * contributes to the palette instead of overwriting a deliberate choice. It lives in
   * wizard state rather than in the Brand step because a logo can also arrive by paste,
   * which is handled in `App`, and a per-component ref would give the two routes
   * different behaviour.
   */
  colorTouched: boolean;
  palette: Hex[];
  shots: Upload[];
  /**
   * Shots the reviewer has pinned to a specific position, keyed by `ImageSlotKey`.
   *
   * Empty until they swap something on the reveal screen.
   */
  imageOverrides: Record<string, string>;
  /**
   * How the photo at a position is cropped inside it, keyed by `ImageSlotKey`.
   *
   * Separate from `imageOverrides` even though both end up on the same slot, because they
   * answer different questions and the panel edits them in different sections: the
   * override says WHICH photo, this says which part of it. Keeping them apart is also what
   * lets the Image picker still show the operator's chosen thumbnail as selected — if the
   * baked crop were written straight into `imageOverrides`, the value there would be a URL
   * matching none of the uploads and the grid would show nothing pinned.
   *
   * Sparse: a position nobody dragged has no entry and is dealt and drawn exactly as
   * before. See framing.ts for why the crop is baked into pixels rather than set in CSS.
   */
  framing: Record<string, SlotFraming>;
  /**
   * Space badges and value discs the reviewer has repointed at a different shipped icon,
   * keyed by `IconSlotKey`. Values are paths under `public/`, not uploads — the icons
   * come from the set that ships with the app.
   *
   * A position with no entry keeps the artwork the scene was built with, so removing a
   * key is what "restore the original" means.
   */
  iconOverrides: Record<string, string>;
  /**
   * Wash colour, wash opacity and centred-mark toggle per page header, keyed by
   * `HeaderSlotKey`.
   *
   * Sparse like the other two: a header nobody touched keeps `HEADER_DEFAULTS`, which is
   * what the approved cut renders. Storing a colour of "" is meaningful and different
   * from storing today's brand — it means "keep following the brand picker".
   */
  headerOverrides: HeaderOverrides;
  /**
   * Lines of copy the reviewer retyped on the finished cut, keyed by their dotted path
   * in the copy table (`"feed.spaces.0.name"`).
   *
   * Applied as the LAST merge layer, so an operator's own words beat both the research
   * pass and the baseline. An entry whose value is empty falls back through that stack
   * rather than rendering a blank line — a card with no title is a broken frame, and
   * "clear this field" is not a thing anyone wants the video to do.
   */
  copyOverrides: Record<string, string>;
  /** The copywriting pass. Runs in the background from the Character step onwards. */
  research: ResearchState;
};

export const INITIAL_STATE: WizardState = {
  company: "",
  context: "",
  person: { name: "", title: "", photo: null },
  logo: null,
  logoWhite: "",
  logoWhiteUpload: null,
  color: DEFAULT_BRAND_HEX,
  colorTouched: false,
  palette: [],
  shots: [],
  imageOverrides: {},
  framing: {},
  iconOverrides: {},
  headerOverrides: {},
  copyOverrides: {},
  research: { status: "idle" },
};

/**
 * The steps, in order.
 *
 * Declared once because three things read from it: the rail's labels, each step's own
 * "← previous" link, and the "of four" in its eyebrow. Splitting the company and the
 * main character apart broke the back-links the first time precisely because each step
 * spelled its predecessor's name out itself.
 */
export const STEPS = ["Company", "Character", "Brand", "Imagery"] as const;

/** The company is the one thing every other answer hangs off, so it stands alone. */
export const companyReady = (s: WizardState): boolean =>
  s.company.trim().length >= 2;

/** All three parts of the persona are required: the cut shows every one of them. */
export const personReady = (s: WizardState): boolean =>
  s.person.name.trim().length >= 2 &&
  s.person.title.trim().length > 0 &&
  s.person.photo !== null;

export const brandReady = (s: WizardState): boolean => s.logo !== null;

export const imageryReady = (s: WizardState): boolean => s.shots.length > 0;

/**
 * Whether "Build the video" may fire.
 *
 * Imagery alone is not enough. The copywriting pass runs in the background from the
 * Company step, and the whole point of the reveal is showing the CUSTOMISED cut —
 * building while the pass is still in the air plays the approved demo's words back at
 * the operator and reads as though the research did nothing.
 *
 * It gets three whole steps to finish in now rather than two, which is what starting it a
 * step earlier bought: five model calls over a three-and-a-half-minute film is a slower
 * pass than the one this button was first tuned against.
 *
 * Only `running` blocks, deliberately. A failed pass has nothing left to wait for and
 * the chip already says the video keeps the baseline copy; `idle` means it never
 * started, which is equally nothing to wait for. Blocking on either would strand
 * somebody in front of a dead button with no way forward.
 */
export const buildReady = (s: WizardState): boolean =>
  imageryReady(s) && s.research.status !== "running";

/**
 * What each position is actually showing: the operator's pin if there is one, else the deal.
 *
 * Exported because three places need the same answer and they must not disagree — this
 * function, the panel's "which thumbnail is selected", and the bake effect that decides
 * which photo to crop.
 */
export const resolveSlotSource = (
  s: WizardState,
  dealt: Partial<Record<ImageSlotKey, string>>,
  slot: string,
): string => s.imageOverrides[slot] ?? dealt[slot as ImageSlotKey] ?? "";

/**
 * Fold the baked crops into the overrides the video receives.
 *
 * A bake only wins if it was made from the photo currently at that position. Swapping the
 * photo in the Image section leaves a stale `framing` entry pointing at the previous one,
 * and the guard is what stops the old crop being pinned onto the new photo — the entry is
 * simply ignored until the bake effect catches up and replaces it.
 */
const withFramingBakes = (s: WizardState): Record<string, string> => {
  const entries = Object.entries(s.framing);
  if (!entries.length) return s.imageOverrides;

  const dealt = assignImagery(s.shots.map((u) => u.url));
  const out = { ...s.imageOverrides };
  for (const [slot, fr] of entries) {
    if (!fr.baked) continue;
    if (fr.src && fr.src === resolveSlotSource(s, dealt, slot)) out[slot] = fr.baked;
  }
  return out;
};

/**
 * Wizard state -> what the composition renders.
 *
 * Caps apply HERE, once, on the way in — the operator's title is trimmed to what the
 * sidebar can hold before it reaches the video, and nothing downstream trims it again.
 * Empty fields are left out entirely rather than passed as `""`, so the merge falls back
 * to approved baseline copy instead of rendering a blank line.
 */
export const toInputProps = (s: WizardState): VideoInputProps => {
  const person: Record<string, string> = {};
  if (s.person.name.trim()) person.name = s.person.name.trim();
  if (s.person.title.trim()) person.title = s.person.title.trim();

  const copyPatch: Record<string, unknown> = { person };
  if (s.company.trim()) copyPatch.companyName = s.company.trim();

  // Two layers, in this order, because they answer different questions. First the
  // researched copy over the approved baseline, so anything the model declined to write
  // keeps the demo's own wording. Then the OPERATOR's fields over that, so what they
  // typed always beats what the model produced.
  //
  // The second merge passes the first as its `base` rather than spreading the two
  // objects together: a spread would replace `person` wholesale, and an operator who
  // left the title blank would silently get the baseline's "CEO" back instead of the
  // researched one.
  const researched = COPY.merge(
    s.research.status === "done" ? s.research.copy : {},
    { capLengths: true },
  );

  const written = COPY.merge(copyPatch, { capLengths: true, base: researched });

  // The shout-out cannot thank the person writing it.
  //
  // The copywriting pass fires when the COMPANY is submitted, which is a step before the
  // operator names the main character — so the model wrote `composed.recipient` without
  // knowing who the film is addressed to, and the server's own check had nothing to check
  // against. This is the first point where both are known. Silent and deterministic; see
  // src/customize/shoutOut.ts for why it falls back to the baseline name.
  const { copy: settled } = repairSelfShoutOut(written, s.person.name);

  // A third layer, applied last and UNCAPPED: these are words the operator typed while
  // watching the frame they land in, so if they overrun the card they can see it and
  // shorten it. Truncating them silently — the right move for a model's reply, which
  // nobody is watching — would delete text out from under someone mid-sentence. The
  // panel's own maxLength is where the limit is enforced, visibly.
  const edited = COPY.merge(expandCopyOverrides(s.copyOverrides), {
    capLengths: false,
    base: settled,
  });

  /**
   * …and a fourth, for the one edit that is not local to the frame it was made on.
   *
   * The four company values are quoted again on the published post and on the billboard
   * stories, as bare phrases with nothing tying them together. Renaming one in the picker
   * therefore has to carry, or the operator fixes the value in one shot and leaves two
   * later shots quoting the wording they just replaced. Sparse and usually empty; see
   * src/customize/valueEcho.ts.
   */
  const echoed = followValueRenames(
    settled,
    edited,
    new Set(Object.keys(s.copyOverrides)),
  );

  return {
    copy: Object.keys(echoed).length
      ? COPY.merge(expandCopyOverrides(echoed), {
          // Capped, unlike the layer above it. The rule that an operator's own text is
          // never re-truncated behind their back is about the field they typed into and
          // can see; these are the same words arriving somewhere else, in a slot two
          // characters shorter, on a frame they are not looking at.
          capLengths: true,
          base: edited,
        })
      : edited,
    brand: {
      accentHex: clampBrandAccentHex(s.color),
      palette: s.palette,
      // Both versions come from ONE upload, processed at the edge (logoProcess.ts): the
      // white box is knocked out of each, and the second is then forced to white. The
      // operator is never asked for a reversed logo.
      logoUrl: s.logo?.url ?? "",
      // The operator's own reversed file if they gave one, else the derived knockout.
      logoLightUrl: s.logoWhiteUpload?.url ?? s.logoWhite,
      personPhotoUrl: s.person.photo?.url ?? "",
      imagery: s.shots.map((u) => u.url),
      // Set by the reviewer swapping shots on the finished cut, plus any position they
      // reframed — a crop arrives here as an ordinary photo, so the composition needs no
      // concept of framing at all. Sparse: every position it does not name is still dealt
      // by `assignImagery`.
      imageOverrides: withFramingBakes(s),
      // Sparser still: an unnamed icon position keeps its own artwork, so this stays
      // empty for a run where nobody touched a space badge or a value disc.
      iconOverrides: s.iconOverrides,
      // Emptiest of the three: three headers, and most runs change none of them.
      headerOverrides: s.headerOverrides,
    },
  };
};
