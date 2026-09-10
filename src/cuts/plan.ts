/**
 * How a cut is assembled out of the film, given the pillars an operator picked.
 *
 * `ZoetestCut`, `ZoeTestSearchCut` and `ZoeTestPeopleCut` each hard-code ONE arrangement:
 * the film's intro, one chapter, the film's outro. This module is the same arithmetic with
 * the chapter list as an argument, so the wizard can ask for two of them, or all three, and
 * get one video with a single intro at the front and a single ending at the back.
 *
 * It is deliberately free of React and of Remotion. Two callers need the same answer and
 * must not be able to disagree about it: `CombinedCut` lays the windows down from this
 * plan, and the wizard reads `durationInFrames` off it to size the `<Player>` and the
 * render. A preview one length and an encode another is the bug this shape prevents.
 *
 * The four numbers that matter, and where they come from:
 *
 *   intro   0 - 390      brand mark, the faces, the workvivo HQ title card, and the wheel
 *                        with all three pillars lit
 *   comms   390 - 2236   the wheel with Communication & Engagement picked out, then the
 *                        home feed, the desktop, the livestream, Spaces, the Space page,
 *                        Journeys, the signage, the newsletters and the catch-up card
 *   search  2236 - 2760  the wheel with Search & Knowledge picked out, then the Ask bar,
 *                        HQ Search, HQ Chat, Ask / Answer / Job Done and the mobile answer
 *   people  3326 - 4983  the wheel with People Intelligence picked out, then Analytics,
 *                        the Seer run, the Space feed, the AI survey builder, the
 *                        integrations pair, the Admin Hub and the governance run
 *   outro   4983 - 5300  the customer logo wall, the workvivo HQ endcard and the strapline
 *
 * `to` is exclusive throughout, as the sequence names in WorkvivoCut are.
 *
 * THE THING TO NOTICE about those boundaries is which of them touch. `intro.to` is
 * `comms.from`, and `comms.to` is `search.from`, and `people.to` is `outro.from` — three
 * joins where the two windows are consecutive frames of one film and there is nothing to
 * transition. Only two joins in the whole set are real cuts: anything landing on `people`
 * (2760 or 2236 -> 3326) and anything leaving `comms` or `search` for the outro. That is
 * why this file works out `abut` per join rather than treating every join the same: a
 * dissolve laid across two consecutive frames of one shot is a transition between a shot
 * and itself, which costs 15 frames and looks like a fault.
 *
 * Checked against the two cuts that were signed off: a plan for `search` alone comes out at
 * 1216 frames and one for `people` alone at 2349, which are `SEARCH_CUT_DURATION` and
 * `PEOPLE_CUT_DURATION` exactly. `comms` alone comes out at 2553 against
 * `ZOETEST_CUT_DURATION`'s 2545, because that cut mounts its logo wall four frames early
 * and stops its tail four frames short — see the note there. The wizard does not use this
 * plan for a single pillar anyway; it plays the approved cut. See web/templates.ts.
 */

/** The three pillars, in the order the film puts them up. */
export const PILLAR_IDS = ["zoe-test-comms", "zoe-test-search", "zoe-test-people"] as const;

export type PillarId = (typeof PILLAR_IDS)[number];

/** Every window's key, including the two that are not a pillar. */
export type SlotKey = "intro" | PillarId | "outro";

export type Window = { readonly from: number; readonly to: number };

export const WINDOWS: Readonly<Record<SlotKey, Window>> = {
  intro: { from: 0, to: 390 },
  "zoe-test-comms": { from: 390, to: 2236 },
  "zoe-test-search": { from: 2236, to: 2760 },
  "zoe-test-people": { from: 3326, to: 4983 },
  outro: { from: 4983, to: 5300 },
};

export const lengthOf = (w: Window): number => w.to - w.from;

/**
 * Frames of dissolve where a chapter arrives on a cut rather than on a continuation.
 *
 * Fifteen, as both the Search and People cuts use, and for their reason: every chapter in
 * this film opens on the pillar wheel dimmed and re-entering with its own pillar picked
 * out, so a dissolve into it reads as one graphic changing state rather than as a cut
 * between two shots.
 *
 * It costs frames — the incoming window is pulled back over the tail of the outgoing one —
 * which is why `planFor` subtracts it from the running offset rather than adding it.
 */
export const CROSSFADE = 15;

/**
 * Frames each side of a dip through the brand colour, used at ONE join: a cut that ends on
 * the Search chapter and goes to the outro.
 *
 * A dissolve is wrong there and the Search cut says why at length. The shots have nothing
 * in common — the chapter ends on a phone held on a near-black field, the outro opens on
 * the bright customer logo wall — and the outgoing shot is a SCENE rather than the
 * reference, so fading the reference window would fade something that is not on screen. A
 * dip is an overlay: it knows nothing about either side, and being an overlay it costs no
 * frames.
 */
export const OUTRO_DIP = 10;

/**
 * Frames the customer logo wall dissolves up over the reference before 4983, used at the
 * one join where the chapter and the outro ABUT — i.e. when People Intelligence is the
 * last pillar picked.
 *
 * Only possible there. The dissolve needs the reference underneath it to be running
 * continuously into 4983, which is true when the People chapter has just played and false
 * otherwise. The mount moves EARLIER by this length rather than the dissolve running across
 * 4983, so the wall is opaque on 4983 exactly as the original is — see ZoeTestPeopleCut for
 * why anything still translucent at 4987 turns olive.
 */
export const OUTRO_GRID_DISSOLVE = 12;

export type AudioFades = {
  /** Global frames [start, full] the soundtrack rises over on entry. */
  readonly fadeIn?: readonly [number, number];
  /** Global frames [start, silent] the soundtrack falls over on exit. */
  readonly fadeOut?: readonly [number, number];
};

/**
 * Where a window's soundtrack fades, IF that side of it turns out to be a cut.
 *
 * Global frames, the same numbers the measurements below are in, converted to
 * sequence-local frames by the envelope at render time. Written as globals on purpose:
 * every one of these has to sit inside a pause in the voiceover, those pauses are known in
 * global frames, and re-deriving them by hand as offsets from a window edge is exactly how
 * a fade ends up on top of a word.
 *
 * MEASURED, off the reference's own track (mono 16k, pre-emphasised, RMS per video frame —
 * see ZoeTestPeopleCut's AUDIO block for the method):
 *
 *   384 - 424    a 40-frame pause after the intro's last phrase. `intro.fadeOut` sits in
 *                the front of it, so the sound holds at FULL through the first two thirds
 *                of the picture dissolve and only lets go once the last word is out.
 *   3305 - 3387  an 82-frame pause across the whole People Intelligence pillar card. Its
 *                own voiceover does not start until 3387.
 *   4977 - 4990  a 14-frame pause before the outro's first phrase.
 *
 * NOT measured, and so placed by length rather than by content: the fades leaving the
 * Comms and Search chapters, and the one entering Search. They are the treatment those two
 * cuts already ship — a ramp over the length of the picture transition beside them — and
 * they are only ever used at a join those cuts do not have. If someone re-runs the RMS pass,
 * these three are the ones worth moving.
 *
 * A side that turns out to ABUT its neighbour gets no fade at all, whatever is written
 * here: the two windows are consecutive frames of one track and fading between them would
 * duck the sound for no reason. `planFor` is what applies that rule.
 */
const AUDIO: Readonly<Record<SlotKey, AudioFades>> = {
  intro: { fadeOut: [384, 389] },
  "zoe-test-comms": { fadeIn: [390, 404], fadeOut: [2221, 2235] },
  "zoe-test-search": { fadeIn: [2236, 2250], fadeOut: [2750, 2759] },
  "zoe-test-people": { fadeIn: [3335, 3347], fadeOut: [4968, 4982] },
  outro: { fadeIn: [4983, 4990] },
};

export type Slot = {
  key: SlotKey;
  window: Window;
  /** Where this window's first frame lands in the assembled cut. */
  localOffset: number;
  /** Frames the PICTURE dissolves up over on entry. 0 for a hard cut or a continuation. */
  fadeIn: number;
  /** Which ends of the soundtrack are faded, and where. Empty for a continuation. */
  audio: AudioFades;
};

export type CutPlan = {
  /** Intro, the chosen chapters in the film's own order, then the outro. */
  slots: readonly Slot[];
  durationInFrames: number;
  /**
   * Frames each side of the dip through brand at the chapter -> outro join, or 0 when
   * that join does not want one. Costs no frames either way.
   */
  outroDip: number;
  /** Frames the logo wall dissolves up over before 4983, or 0 for the original hard cut. */
  gridDissolve: number;
};

/** The picked pillars in the film's own order, deduplicated. Never empty — see below. */
export const orderPillars = (picked: readonly PillarId[]): PillarId[] =>
  PILLAR_IDS.filter((id) => picked.includes(id));

/**
 * Work out the whole arrangement for a selection.
 *
 * An empty selection falls back to all three rather than throwing. The wizard will not send
 * one — its Continue button is gated on at least one pillar — but this is also called from
 * the render path, and a plan with no chapters is a 707-frame film of an intro cutting
 * straight to an endcard. Falling back to the whole thing is the failure that is easiest to
 * notice and hardest to ship by accident.
 */
export const planFor = (picked: readonly PillarId[]): CutPlan => {
  const chosen = orderPillars(picked);
  const keys: SlotKey[] = [
    "intro",
    ...(chosen.length ? chosen : [...PILLAR_IDS]),
    "outro",
  ];

  const slots: Slot[] = [];
  let outroDip = 0;
  let gridDissolve = 0;
  let offset = 0;

  keys.forEach((key, i) => {
    const window = WINDOWS[key];
    const prev = i > 0 ? WINDOWS[keys[i - 1]] : null;
    const next = i < keys.length - 1 ? WINDOWS[keys[i + 1]] : null;

    // Consecutive frames of one film on this side of the join: nothing to transition, and
    // nothing to crossfade. This is the case for intro -> comms, comms -> search and
    // people -> outro, which is most joins in most selections.
    const abutsPrev = prev !== null && prev.to === window.from;
    const abutsNext = next !== null && window.to === next.from;

    const isOutro = key === "outro";

    // The outro never dissolves in. It either continues (people last), dips through the
    // brand colour (search last) or hard-cuts (comms last) — the three treatments the
    // three approved cuts already use, each reproduced at the join it belongs to.
    const fadeIn = i === 0 || abutsPrev || isOutro ? 0 : CROSSFADE;

    if (isOutro) {
      if (abutsPrev) gridDissolve = OUTRO_GRID_DISSOLVE;
      else if (keys[i - 1] === "zoe-test-search") outroDip = OUTRO_DIP;
    }

    // Pulled back over the tail of the window before it, which is what makes the dissolve
    // an overlap rather than a gap. The dip and the grid dissolve cost nothing, so only
    // `fadeIn` moves anything.
    offset -= fadeIn;

    const audio = AUDIO[key];
    slots.push({
      key,
      window,
      localOffset: offset,
      fadeIn,
      audio: {
        ...(abutsPrev || i === 0 ? {} : { fadeIn: audio.fadeIn }),
        ...(abutsNext || i === keys.length - 1 ? {} : { fadeOut: audio.fadeOut }),
      },
    });

    offset += lengthOf(window);
  });

  return { slots, durationInFrames: offset, outroDip, gridDissolve };
};

/** Just the length, for the wizard's template table. */
export const combinedDuration = (picked: readonly PillarId[]): number =>
  planFor(picked).durationInFrames;
