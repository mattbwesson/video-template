/**
 * The original L2 edit, in two encodes of the same 212 seconds.
 *
 * This used to live in WorkvivoCut and be the film's own base layer. It is here now
 * because the film stopped using it: upstream rebuilt the last stretches of reference
 * footage as scenes and dropped the `<Video>` entirely, so `WorkvivoCut` owns every frame
 * and takes its sound from a separate soundtrack asset. `REFERENCE_VIDEO` went with it.
 *
 * The three derived cuts — ZoetestCut, ZoeTestSearchCut, ZoeTestPeopleCut — still lay the
 * reference down, because stretches they depend on exist only in that footage: the
 * workvivo HQ title card, both states of the pillar wheel, the endcard and the strapline.
 * So the constant moves to a module of its own rather than being restated three times or
 * pinned back onto a film that no longer wants it.
 *
 * WORTH KNOWING, because it is the direction of travel: the film has real components for
 * some of this now — `WorkvivoHqFan` is the pillar wheel, and the endcard stretches are
 * scenes. Rebuilding the three cuts on those would make their intros and outros
 * customisable, which they are not while they are reference footage. That is a deliberate
 * follow-up, not an oversight.
 *
 * `wizard` is the encode that ships: 45 MB at CRF 24, and the only one tracked in git or
 * present in the deployed image. `full` is the 12 Mbps / 310 MB master, which is
 * gitignored and therefore only on a machine that has been handed it — anything defaulting
 * to `full` works locally and 404s everywhere else. It keeps its AUDIO TRACK, which is why
 * these cuts have sound at all.
 */
export const REFERENCE_VIDEO = {
  full: "img/L2 Video(Virgin Airline).mp4",
  wizard: "img/l2-reference-212s.mp4",
} as const;
