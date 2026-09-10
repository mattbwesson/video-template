import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { HeadquartersScene } from "../HeadquartersScene";
import { VirginWorkvivoHomeScene } from "../VirginWorkvivoHomeScene";
import { BackFromScene } from "../BackFromScene";
import { VirginWorkvivoDesktopScene } from "../VirginWorkvivoDesktopScene";
import { VirginWorkvivoDesktopFullscreenScene } from "../VirginWorkvivoDesktopFullscreenScene";
import { LivestreamScene } from "../LivestreamScene";
import { SpacesRevealScene } from "../SpacesRevealScene";
import { WorkvivoMobileSpotlightScene } from "../WorkvivoMobileSpotlightScene";
import { JourneyBuilderScene } from "../JourneyBuilderScene";
import { JourneyCardRevealScene } from "../JourneyCardRevealScene";
import { AmplifyReachScene } from "../AmplifyReachScene";
import { BillboardSignageScene } from "../BillboardSignageScene";
import { NewslettersRevealScene } from "../NewslettersRevealScene";
import { NewsletterBuilderRevealScene } from "../NewsletterBuilderRevealScene";
import { CatchUpRevealScene } from "../CatchUpRevealScene";
import { AskBarScene } from "../AskBarScene";
import { HqSearchScene } from "../HqSearchScene";
import { HqChatScene } from "../HqChatScene";
import { BrandWordScene } from "../BrandWordScene";
import { WorkvivoAnalyticsScene } from "../WorkvivoAnalyticsScene";
import { WorkvivoSeerManagerInsightsScene } from "../WorkvivoSeerManagerInsightsScene";
import { SeerManagerMobileScene } from "../SeerManagerMobileScene";
import { GoBeyondScene } from "../GoBeyondScene";
import { WorkvivoSpaceFeedScene } from "../WorkvivoSpaceFeedScene";
import { WorkvivoFeedbackArticleScene } from "../WorkvivoFeedbackArticleScene";
import { WorkvivoIntegrationsListScene } from "../WorkvivoIntegrationsListScene";
import { WorkvivoIntegrationsMarketplaceScene } from "../WorkvivoIntegrationsMarketplaceScene";
import { WorkvivoAdminHubScene } from "../WorkvivoAdminHubScene";
import { WorkvivoCustomerGridScene } from "../WorkvivoCustomerGridScene";
import { WorkvivoPhonesScene } from "../components/workvivo";
import { scaleDownMatchCut } from "../scaleDownMatchCut";
import { useCustomization } from "../customize/CustomizationProvider";
import type { REFERENCE_VIDEO } from "../referenceVideo";
import { FadeIn, ReferenceWindow } from "./parts";
import {
  BrandIntro,
  MobileIrisOpen,
  SeerInsightsCutShot,
  SeerRaterClick2Shot,
  SPACE_FEED_IRIS_FROM,
  SEER_MOBILE_FROM,
  SpaceFeedIrisTransition,
  SpacePageShot,
  SurveySignOffShot,
} from "./shots";
import type { Slot } from "./plan";

/**
 * The five blocks a combined cut is built from: the film's intro, one block per pillar, and
 * the film's ending.
 *
 * Each block owns ONE window of the original edit and every scene rebuilt over it, and each
 * mounts its own `<ReferenceWindow>` first and its scenes after. That order is not tidiness
 * — the export paints in DOM order and ignores z-index, so "reference, then the scenes that
 * sit on it" has to hold inside a block, and "earlier block, then later block" has to hold
 * between them. The second is what makes a dissolve into a chapter work at all: the
 * incoming window has to be able to fade up over the outgoing block's SCENES, not just over
 * its footage, and it can only do that by being mounted after the whole of it.
 *
 * Every scene is placed with `at(globalFrame)`, which is the frame it sat on in the
 * 5300-frame film. Nothing below is written as an offset from a block boundary, so the
 * numbers here can be read straight against L2VirginAirline and against the three
 * single-pillar cuts these were taken from.
 *
 * The scene components are the same modules WorkvivoCut and the three cuts mount. Editing
 * one changes every film in the repo — that is the standing trade in this codebase, and it
 * is why only the timelines are ever copied.
 */

export type BlockProps = {
  slot: Slot;
  reference: keyof typeof REFERENCE_VIDEO;
};

/** `from` for a scene that sat at `globalFrame`, given the block it belongs to. */
const placer = (slot: Slot) => (globalFrame: number) =>
  slot.localOffset + globalFrame - slot.window.from;

// ---------------------------------------------------------------------------------------

/**
 * Intro — global 0 - 390.
 *
 * The brand mark, the faces, the workvivo HQ title card, and the wheel with all three
 * pillars lit. 139 - 390 is reference only; nothing was ever rebuilt over it, which is also
 * why this stretch is not customisable beyond the logo on the opening card.
 */
export const IntroBlock: React.FC<BlockProps> = ({ slot, reference }) => {
  const at = placer(slot);
  return (
    <>
      <ReferenceWindow
        name="Reference — intro (0 - 390)"
        window={slot.window}
        localOffset={slot.localOffset}
        reference={reference}
        fadeIn={slot.fadeIn}
        audio={slot.audio}
      />
      {/* Part 1: Brand logo with Circular Mask (frames 0 to 33) */}
      <Sequence name="Brand Intro" from={at(0)} durationInFrames={33}>
        <BrandIntro />
      </Sequence>
      {/* Part 2: Headquarters Scene. Starts on 33, LAST FRAME 138 — extended from 136, so
          the closing word holds two frames longer before the cut to the reference's HQ
          title card. 33 + 106 = 139 is the exclusive end of the same range. */}
      <Sequence name="Headquarters Scene" from={at(33)} durationInFrames={106}>
        <HeadquartersScene />
      </Sequence>
    </>
  );
};

// ---------------------------------------------------------------------------------------

/**
 * Communication & Engagement — global 390 - 2236.
 *
 * Its first 27 frames are the pillar card, reference only, with Communication & Engagement
 * picked out of the three; the chapter proper starts at 417 with the home feed. Taken from
 * ZoetestCut, which lays these same scenes on the same global frames.
 *
 * The last two sequences are deliberately out of chronological order. Both are "top layer"
 * shots that have to composite ABOVE neighbours declared earlier — the Space page's iris
 * shuts onto the Spotlight at 1630-1639, and the fullscreen scene overlaps the Desktop
 * scene at 888-896 and the Livestream at 1275-1285 — and DOM order is the only thing that
 * decides that in the export. Same position they occupy in WorkvivoCut and ZoetestCut.
 */
export const CommsBlock: React.FC<BlockProps> = ({ slot, reference }) => {
  const at = placer(slot);
  const { theme } = useCustomization();
  return (
    <>
      <ReferenceWindow
        name="Reference — Communication & Engagement (390 - 2236)"
        window={slot.window}
        localOffset={slot.localOffset}
        reference={reference}
        fadeIn={slot.fadeIn}
        audio={slot.audio}
      />

      {/* Workvivo Home (417 - 600) */}
      <Sequence name="Workvivo Home (417 - 600)" from={at(417)} durationInFrames={600 - 417}>
        <VirginWorkvivoHomeScene />
      </Sequence>
      {/* Back From (starts at global 600, ends at local 138 / global 738) */}
      <Sequence name="Back From (600 - 738)" from={at(600)} durationInFrames={138}>
        <BackFromScene />
      </Sequence>
      {/* Middle layer (738 - 896): the Desktop scene, its circular mask closing 888-896. */}
      <Sequence name="Workvivo Desktop (738 - 896)" from={at(738)} durationInFrames={158}>
        <VirginWorkvivoDesktopScene />
      </Sequence>
      {/* Under layer (1275+): revealed as the fullscreen scene's circular mask closes at
          1282-1285. Mounted BELOW that scene so the mask opens onto it, and a few frames
          early so its iframe is loaded before it is ever seen. */}
      <Sequence
        name="Livestream on brand colour (1275 - 1477)"
        from={at(1275)}
        durationInFrames={202}
      >
        <LivestreamScene />
      </Sequence>
      {/* Spaces on #010224, wiping up from the bottom over the tail of the livestream.
          Mounted AFTER the livestream sequence so it composites above it during the 9
          frames they overlap. */}
      <Sequence
        name="Spaces reveal + click (1468 - 1549)"
        from={at(1468)}
        durationInFrames={81}
      >
        <SpacesRevealScene />
      </Sequence>
      {/* Under layer (1630+): the mobile Spotlight on the brand colour, revealed as the
          Space page's circular mask shuts at 1635-1638. It takes `theme.brand` rather than
          the scene's own Virgin-red default, so a customer run gets its colour here. */}
      <Sequence
        name="Mobile Spotlight on brand colour (1630 - 1677)"
        from={at(1630)}
        durationInFrames={47}
      >
        <WorkvivoMobileSpotlightScene background={theme.brand} />
      </Sequence>
      {/* Hard cut on the Spotlight's local 47 (global 1677): the Journeys board simply
          replaces the frame. The phone is there on the first frame so the cut lands on it;
          the side palette then arrives from global 1680, assembling around a phone that is
          already holding the shot. */}
      <Sequence
        name="Journeys (1677 - 1825)"
        from={at(1677)}
        durationInFrames={148}
        style={{ zIndex: 1, isolation: "isolate" }}
      >
        {/* TransitionSeries subtracts the transition from the total, so the board's 73 and
            the card's 90 make 148, not 163 — and the transition occupies the board's last
            15 frames and the card's first 15.

            The brand field is laid under the series rather than left to the scenes: as the
            board scales to 0.25 the frame around it is whatever sits below in the tree,
            which here is the raw reference video. */}
        <AbsoluteFill style={{ background: theme.brand }}>
          <TransitionSeries>
            <TransitionSeries.Sequence durationInFrames={73}>
              <JourneyBuilderScene brand={theme.brand} columnsFrom={3} />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition
              presentation={scaleDownMatchCut()}
              timing={linearTiming({ durationInFrames: 15 })}
            />
            <TransitionSeries.Sequence durationInFrames={90}>
              <JourneyCardRevealScene
                brand={theme.brand}
                revealFrom={7}
                revealDuration={10}
                heroOvershoot={1.05}
                wallFrom={35}
                wallTravel={18}
                wallStagger={2}
                wallDuration={11}
                sideFadeFrom={70}
                sideFadeTo={77}
                middleExitFrom={70}
                middleExitDuration={12.5}
              />
            </TransitionSeries.Sequence>
          </TransitionSeries>
        </AbsoluteFill>
      </Sequence>
      {/* Two words on the brand field, closing the Spaces run. At 1813 a circular mask
          scales up from 0 to full screen by 1822, revealing the Amplify scene; at 1828 a
          hard cut to "Reach". */}
      <Sequence
        name="Amplify / Reach -> signage (1813 - 1978)"
        from={at(1813)}
        durationInFrames={165}
        style={{ zIndex: 2 }}
      >
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={38}>
            <AmplifyReachScene maskFrom={0} maskTo={9} cutAt={15} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition
            presentation={scaleDownMatchCut({ scaleOutRoot: false })}
            timing={linearTiming({ durationInFrames: 12 })}
          />
          <TransitionSeries.Sequence durationInFrames={139}>
            <BillboardSignageScene />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </Sequence>
      {/* Hard cut off the signage at 1978. The screen is already three-quarters through its
          travel on the first frame, so the shot opens mid-move; only the four card rows are
          drawn until global 2034, when the rest of the UI assembles around them. */}
      <Sequence
        name="Newsletters reveal (1978 - 2058)"
        from={at(1978)}
        durationInFrames={80}
      >
        <NewslettersRevealScene background={theme.brand} />
      </Sequence>
      {/* Hard cut at 2058 onto the plain brand field: builder panels rise in. At 2091 the
          components move down off-screen while the background remains static. */}
      <Sequence
        name="Newsletter builder (2058 - 2100)"
        from={at(2058)}
        durationInFrames={42}
      >
        <NewsletterBuilderRevealScene background={theme.brand} />
      </Sequence>
      {/* Hard cut at 2100 onto the purple background. At 2155 the phones animate up
          off-screen while the background stays static, and "Catch up on what you missed"
          animates up from below, morphing into the AI summary card. The chapter ends on
          that card at 2236. */}
      <Sequence
        name="Phones -> catch-up (2100 - 2236)"
        from={at(2100)}
        durationInFrames={136}
      >
        <AbsoluteFill
          style={{
            background:
              // Linear, not radial: the export drops a radial background entirely, and
              // this one is the whole frame behind the phones.
              "linear-gradient(180deg, #3B1B8F 0%, #23106B 45%, #12053C 100%)",
            overflow: "hidden",
          }}
        >
          <WorkvivoPhonesScene
            animateUp={true}
            riseFrames={18}
            riseDistance={350}
            exitUpFrom={55}
            exitUpFrames={18}
            exitUpDistance={1200}
          />
          <CatchUpRevealScene
            background="transparent"
            revealFrom={55}
            revealDuration={18}
            revealDistance={700}
            clickFrame={85}
            morphFrom={90}
            morphDuration={18}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Hard cut on the Spaces click at 1545: the Space page simply replaces the frame
          three frames later. Mounted here, above the fullscreen scene and below everything
          else, for the paint-order reason in this block's header. */}
      <Sequence name="Space page (1549 - 1639)" from={at(1549)} durationInFrames={91}>
        <SpacePageShot />
      </Sequence>
      {/* Top layer (888 - 1285): the fullscreen Desktop scene with its rotational match cut
          to the quote card at global 1080. */}
      <Sequence
        name="Workvivo Desktop Fullscreen Scene & MatchCut (888 - 1285)"
        from={at(888)}
        durationInFrames={398}
      >
        <VirginWorkvivoDesktopFullscreenScene />
      </Sequence>
    </>
  );
};

// ---------------------------------------------------------------------------------------

/**
 * Search & Knowledge — global 2236 - 2760.
 *
 * Its first 32 frames are the pillar card, reference only, with Search & Knowledge picked
 * out of the three. Taken from ZoeTestSearchCut.
 */
export const SearchBlock: React.FC<BlockProps> = ({ slot, reference }) => {
  const at = placer(slot);
  const { theme } = useCustomization();
  return (
    <>
      <ReferenceWindow
        name="Reference — Search & Knowledge (2236 - 2760)"
        window={slot.window}
        localOffset={slot.localOffset}
        reference={reference}
        fadeIn={slot.fadeIn}
        audio={slot.audio}
      />

      {/* A circular mask scales up revealing the ask bar. */}
      <Sequence name="Ask bar (2268 - 2317)" from={at(2268)} durationInFrames={49}>
        <AskBarScene background={theme.brand} maskFrom={0} maskTo={2} />
      </Sequence>
      {/* Hard cut — the bar is replaced by the search it opens, framed the same way on the
          same field, so only the content changes across the cut. */}
      <Sequence name="HQ Search (2317 - 2392)" from={at(2317)} durationInFrames={75}>
        <HqSearchScene background={theme.brand} />
      </Sequence>
      {/* Hard cut from the search results to the agent answering. Same field and the same
          modal footprint — the reference's own difference between the two states rather
          than a reframing. */}
      <Sequence name="HQ Chat (2392 - 2499)" from={at(2392)} durationInFrames={107}>
        <HqChatScene brand={theme.brand} />
      </Sequence>
      {/* Hard cut to the word, on the same field the chat was floating on — so the modal
          leaves and the colour stays, which is what makes it read as a title card for the
          run rather than a new scene. */}
      <Sequence name="Ask (2499 - 2520)" from={at(2499)} durationInFrames={21}>
        <BrandWordScene word="Ask" background={theme.brand} />
      </Sequence>
      <Sequence name="Answer (2520 - 2547)" from={at(2520)} durationInFrames={27}>
        <BrandWordScene word="Answer" background={theme.brand} />
      </Sequence>
      {/* It runs to 2577 rather than 2573 so it is still there behind the iris opening at
          2565-2577: the word is what the circle grows out of, and ending it four frames
          early would put raw reference footage in the ring around the circle. */}
      <Sequence name="Job Done (2547 - 2577)" from={at(2547)} durationInFrames={30}>
        <BrandWordScene word="Job Done" background={theme.brand} />
      </Sequence>
      {/* The mobile home opening back out of the middle of that word. Mounted AFTER the
          card so it composites above it. The window is fully open by 2577 and the phone
          then holds the frame to 2760, where this chapter ends. */}
      <Sequence
        name="Mobile iris open + hold (2565 - 2760)"
        from={at(2565)}
        durationInFrames={2760 - 2565}
      >
        <MobileIrisOpen />
      </Sequence>
    </>
  );
};

// ---------------------------------------------------------------------------------------

/**
 * People Intelligence — global 3326 - 4983.
 *
 * Its first 62 frames are the pillar card, reference only, with People Intelligence picked
 * out of the three. Taken from ZoeTestPeopleCut, including the integrations and admin run
 * at 4397 - 4983 that the pillar card does not introduce but the brief asked for.
 *
 * Three stretches inside it are reference only and are meant to be: 3326-3388 (the wheel),
 * 4253-4397 (the AI survey builder) and 4591-4983 (the governance run and the pill field).
 *
 * Two orderings here are load-bearing rather than chronological. The Seer tabs are declared
 * before the "Go beyond" card and the survey, so the card's line can be pushed up ACROSS
 * the arriving device and so the survey's iris opens onto the card. And the Integrations
 * List is declared before the Marketplace, because the Marketplace animates DOWN out of
 * frame between 4459 and 4480 to reveal the List underneath it.
 */
export const PeopleBlock: React.FC<BlockProps> = ({ slot, reference }) => {
  const at = placer(slot);
  const { theme } = useCustomization();
  return (
    <>
      <ReferenceWindow
        name="Reference — People Intelligence (3326 - 4983)"
        window={slot.window}
        localOffset={slot.localOffset}
        reference={reference}
        fadeIn={slot.fadeIn}
        audio={slot.audio}
      />

      {/* The chapter proper starts at 3388, where Analytics & Reporting animates up on
          #010320: the camera pans to the bar charts at 3430, zooms out at 3475 and the
          whole screen animates back down from 3534. */}
      <Sequence
        name="Workvivo Analytics (3388 - 3572)"
        from={at(3388)}
        durationInFrames={3572 - 3388}
      >
        <WorkvivoAnalyticsScene background="#010320" />
      </Sequence>

      {/* Trimmed to 36 frames, not 50: the cursor clicks the Rater tab at global 3790, and
          the sequence stops four frames later on the cut below. */}
      <Sequence
        name="Workvivo Seer Manager Insights (3758 - 3794)"
        from={at(3758)}
        durationInFrames={3794 - 3758}
      >
        <WorkvivoSeerManagerInsightsScene />
      </Sequence>
      {/* Hard cut on the click at 3790. Trimmed to 49 frames: this shot's own cursor clicks
          the Comments tab at global 3839, and the sequence stops four frames later. */}
      <Sequence
        name="Workvivo Seer Rater, click 2 (3794 - 3843)"
        from={at(3794)}
        durationInFrames={3843 - 3794}
      >
        <SeerRaterClick2Shot />
      </Sequence>
      {/* Hard cut on the click at 3839: the Comments tab simply replaces the frame. */}
      <Sequence
        name="Workvivo Seer Insights (Comments), click 3 (3843 - 3903)"
        from={at(3843)}
        durationInFrames={3903 - 3843}
      >
        <SeerInsightsCutShot />
      </Sequence>
      {/* Hard cut at 3903 to Manager Insights on the phone, its two headline cards floated
          either side. Runs to 4072 — six frames past the Space Feed's iris at 4066, which
          is declared later in the tree and so shuts over this rather than under it. */}
      <Sequence
        name="Seer Manager Insights, mobile (3903 - 4072)"
        from={at(SEER_MOBILE_FROM)}
        durationInFrames={4072 - SEER_MOBILE_FROM}
      >
        <SeerManagerMobileScene />
      </Sequence>

      {/* Under layer (3702+): the sign-off the survey's iris opens onto. Runs to 3776
          rather than stopping at 3758: its line is still on screen for the 18 frames the
          device above takes to arrive, being pushed up and off by it. */}
      <Sequence name="Go beyond (3702 - 3776)" from={at(3702)} durationInFrames={74}>
        {/* The field is laid down here rather than left to the card, and only until 3758.
            The iris starts shutting on 3704, and for those three frames the ring outside it
            has to be brand colour — if the only thing under the mask were a card that has
            not started yet, the reveal would open onto the reference footage instead. */}
        <Sequence durationInFrames={3758 - 3702}>
          <AbsoluteFill style={{ background: theme.brand }} />
        </Sequence>
        <Sequence from={3707 - 3702}>
          <GoBeyondScene
            background={theme.brand}
            lead="Go beyond"
            tail={["the", "numbers"]}
            scaleFrom={2.2}
            moveFrom={3719 - 3707}
            exitFrom={3758 - 3707}
          />
        </Sequence>
      </Sequence>
      {/* At 3571 the survey animates up with its glass border. It ends on 3707 rather than
          running on behind a zero-radius clip. Mounted after "Go beyond" so the iris opens
          onto it. */}
      <Sequence
        name="Workvivo Seer Survey Mobile (3571 - 3707)"
        from={at(3571)}
        durationInFrames={3707 - 3571}
      >
        <SurveySignOffShot />
      </Sequence>

      {/* At 4066 a circular mask scales down completing at 4070, revealing the brand field
          with WorkvivoSpaceFeed animating up. The feed is mounted first so the iris above
          it opens onto it. */}
      <Sequence
        name="Workvivo Space Feed on Brand (4066 - 4110)"
        from={at(4066)}
        durationInFrames={4110 - 4066}
      >
        <WorkvivoSpaceFeedScene background={theme.brand} entranceDuration={18} />
      </Sequence>
      <Sequence
        name="Space Feed Iris Close (4066 - 4070)"
        from={at(SPACE_FEED_IRIS_FROM)}
        durationInFrames={4070 - 4066 + 1}
      >
        <SpaceFeedIrisTransition />
      </Sequence>
      {/* At 4110, hard cut from the Space feed to the feedback article on the brand field.
          4253 - 4397 is reference only: the AI survey builder. */}
      <Sequence
        name="Workvivo Feedback Article (4110 - 4253)"
        from={at(4110)}
        durationInFrames={4253 - 4110}
      >
        <WorkvivoFeedbackArticleScene background={theme.brand} entranceDuration={36} />
      </Sequence>

      {/* ---------- integrations and admin: global 4397 - 4983 ---------- */}

      <Sequence
        name="Workvivo Integrations List (4459 - 4554)"
        from={at(4459)}
        durationInFrames={4554 - 4459}
      >
        <WorkvivoIntegrationsListScene background={theme.brand} entranceDuration={95} />
      </Sequence>
      {/* At 4397 the Marketplace card enters on the brand field; at global 4459, the frame
          the List above starts arriving, it animates down and out. */}
      <Sequence
        name="Workvivo Integrations Marketplace (4397 - 4480)"
        from={at(4397)}
        durationInFrames={4480 - 4397}
      >
        <WorkvivoIntegrationsMarketplaceScene
          background={theme.brand}
          exitStartFrame={62}
          exitDuration={18}
        />
      </Sequence>
      {/* At 4553 the Admin Hub animates up on #000021 — its own near-black field, not the
          tenant colour, which is why this one takes a literal where both its neighbours
          take `theme.brand`. */}
      <Sequence
        name="Workvivo Admin Hub (4553 - 4591)"
        from={at(4553)}
        durationInFrames={4591 - 4553}
      >
        <WorkvivoAdminHubScene background="#000021" entranceDuration={24} />
      </Sequence>
    </>
  );
};

// ---------------------------------------------------------------------------------------

/**
 * Outro — global 4983 - 5300.
 *
 * The customer logo wall lit with the tenant colour to 5166, then reference only: the
 * workvivo HQ endcard and the strapline. No `brand` prop on the wall — the scene takes it
 * from the theme, and passing a literal is what kept this shot green for every customer.
 *
 * `gridDissolve` is the one thing that varies, and it is not a preference. When the block
 * before this one is People Intelligence the two windows abut, the reference runs
 * continuously into 4983, and the wall can dissolve up over the pill field in the twelve
 * frames BEFORE it — landing opaque exactly on 4983, which is where the original cuts and
 * where the reference underneath turns Virgin red. Anything still translucent past that
 * point mixes tenant green with Virgin red and turns olive.
 *
 * After any other chapter there is a window boundary here, so there is nothing continuous
 * to dissolve over and the wall hard-cuts in on 4983 — the original's own design, and what
 * ZoetestCut does at its own 2232.
 */
export const OutroBlock: React.FC<BlockProps & { gridDissolve: number }> = ({
  slot,
  reference,
  gridDissolve,
}) => {
  const at = placer(slot);
  const gridFrom = 4983 - gridDissolve;
  return (
    <>
      <ReferenceWindow
        name="Reference — outro (4983 - 5300)"
        window={slot.window}
        localOffset={slot.localOffset}
        reference={reference}
        fadeIn={slot.fadeIn}
        audio={slot.audio}
      />
      <Sequence
        name={`Workvivo Customer Grid (${gridFrom} - 5166)`}
        from={at(gridFrom)}
        durationInFrames={5166 - gridFrom}
      >
        <FadeIn frames={gridDissolve}>
          <WorkvivoCustomerGridScene />
        </FadeIn>
      </Sequence>
    </>
  );
};
