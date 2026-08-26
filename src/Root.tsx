import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { VirginAirline } from "./VirginAirline";
import { CustomizedWorkvivo } from "./CustomizedWorkvivo";
import { WorkvivoSpacesScene } from "./WorkvivoSpacesScene";
import { WorkvivoNewslettersScene } from "./WorkvivoNewslettersScene";
import { WorkvivoSpaceFeedScene } from "./WorkvivoSpaceFeedScene";
import { WorkvivoMobileSpotlightScene } from "./WorkvivoMobileSpotlightScene";
import { WorkvivoAnalyticsScene } from "./WorkvivoAnalyticsScene";
import { JourneyCardsScene } from "./JourneyCardsScene";
import { JourneyBuilderScene } from "./JourneyBuilderScene";
import { HqSearchScene } from "./HqSearchScene";
import { HqChatScene } from "./HqChatScene";
import { WorkvivoArticleScene } from "./WorkvivoArticleScene";
import { WorkvivoWidgetListScene } from "./WorkvivoWidgetListScene";
import { WorkvivoAdminHubScene } from "./WorkvivoAdminHubScene";
import { WorkvivoSeerRaterScene } from "./WorkvivoSeerRaterScene";
import { WorkvivoSeerManagerInsightsScene } from "./WorkvivoSeerManagerInsightsScene";
import {
  WorkvivoSpacePage,
  WorkvivoBillboardScreen,
  WorkvivoPhonesScene,
  WorkvivoNewsletterBuilder,
  WorkvivoWidgetStore,
  WorkvivoIntegrationsMarketplace,
  WorkvivoIntegrationsList,
  WorkvivoSeerInsights,
  WorkvivoSeerManagerInsights,
  WorkvivoSeerSurveyMobile,
  WorkvivoCustomerGrid,
} from "./components/workvivo";
import { WorkvivoCustomerGridScene } from "./WorkvivoCustomerGridScene";
import { WorkvivoSeerSurveyMobileScene } from "./WorkvivoSeerSurveyMobileScene";
import { CUSTOMIZED_CUT_DURATION } from "./WorkvivoCut";
import { DEFAULT_INPUT_PROPS } from "./customize/videoCopy";
import { CustomizationProvider } from "./customize/CustomizationProvider";

/**
 * Wrap a component that reads `useCustomization()` so it can be registered as a
 * `<Composition>` on its own.
 *
 * Several of the still compositions below draw screens that are also used inside the cut,
 * and those screens now read their copy, photos and logo from the customisation context.
 * Mounted from `WorkvivoCut` they have a provider above them; mounted directly by a
 * `<Composition>` they do not, and `useCustomization()` throws by design rather than
 * silently rendering half a screen.
 *
 * With no `input` the provider yields the approved baseline, so a still registered this
 * way looks exactly as it did before any of this existed.
 */
const withCustomization = <P extends object>(
  Inner: React.ComponentType<P>,
): React.FC<P> => {
  const Wrapped: React.FC<P> = (props) => (
    <CustomizationProvider>
      <Inner {...props} />
    </CustomizationProvider>
  );
  Wrapped.displayName = `withCustomization(${Inner.displayName ?? Inner.name})`;
  return Wrapped;
};

const FPS = 24;
const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION_IN_FRAMES = 30 * FPS;

// L2 Video(Virgin Airline).mp4 specs: 1920x1080, 25 FPS, 212s (5300 frames)
const VIRGIN_FPS = 25;
const VIRGIN_WIDTH = 1920;
const VIRGIN_HEIGHT = 1080;
const VIRGIN_DURATION_IN_FRAMES = 212 * VIRGIN_FPS; // 5300 frames

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="L2VirginAirline"
        component={VirginAirline}
        durationInFrames={VIRGIN_DURATION_IN_FRAMES}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* What the wizard renders. The same scenes and the same 5300 frames, driven by
          inputProps. defaultProps is the approved baseline, so opening it in the Studio
          with no props shows exactly what L2VirginAirline shows — the only difference
          between the two is which encode of the reference is laid underneath. */}
      <Composition
        id="CustomizedWorkvivo"
        component={CustomizedWorkvivo}
        durationInFrames={CUSTOMIZED_CUT_DURATION}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
        defaultProps={DEFAULT_INPUT_PROPS}
      />
      {/* Still frame: the Workvivo Space page for the Annual Employee Summit, at the
          1440x1415 size of the Figma export it recreates. */}
      <Composition
        id="WorkvivoSpacePage"
        component={withCustomization(WorkvivoSpacePage)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={1440}
        height={1480}
      />
      {/* Still frame: the Workvivo Billboards signage screen, 16:9 at the width the
          supplied large-story export implies. */}
      <Composition
        id="WorkvivoBillboardScreen"
        component={withCustomization(WorkvivoBillboardScreen)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={1320}
        height={742}
      />
      {/* Still frame: Workvivo Chat and a video call, side by side on the purple field. */}
      <Composition
        id="WorkvivoPhones"
        component={withCustomization(WorkvivoPhonesScene)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={1920}
        height={1080}
      />
      {/* Still frame: the Seer Insights dashboard, extracted from the Seer pitch deck. */}
      <Composition
        id="WorkvivoSeerInsights"
        component={withCustomization(WorkvivoSeerInsights)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      <Composition
        id="WorkvivoSeerManagerInsights"
        component={withCustomization(WorkvivoSeerManagerInsightsScene)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Seer Insights, Rater tab — the segment x driver heatmap. Workvivo chrome, so
          it needs the provider; the table runs off the right edge as the reference does. */}
      <Composition
        id="WorkvivoSeerRater"
        component={withCustomization(WorkvivoSeerRaterScene)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      <Composition
        id="WorkvivoSeerSurveyMobile"
        component={withCustomization(WorkvivoSeerSurveyMobile)}
        durationInFrames={VIRGIN_FPS * 7}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      <Composition
        id="WorkvivoSeerSurveyMobileScene"
        component={withCustomization(WorkvivoSeerSurveyMobileScene)}
        durationInFrames={150}
        fps={VIRGIN_FPS}
        width={1920}
        height={1080}
      />
      {/* Customer logo wall — 5x11 grid on illuminated red field with center Workvivo mark */}
      <Composition
        id="WorkvivoCustomerGrid"
        component={withCustomization(WorkvivoCustomerGridScene)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={1920}
        height={1080}
      />
      {/* The widget catalogue — two columns of installable widgets, caught mid-scroll
          so the list runs off the top and bottom of the frame as the reference does. */}
      <Composition
        id="WorkvivoWidgetList"
        component={WorkvivoWidgetListScene}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Still frame: the Widget Store category browser, modal on the brand field. */}
      <Composition
        id="WorkvivoWidgetStore"
        component={WorkvivoWidgetStore}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Still frame: the Integrations Marketplace card, on the brand field. */}
      <Composition
        id="WorkvivoIntegrationsMarketplace"
        component={WorkvivoIntegrationsMarketplace}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Still frame: the Integrations List connector grid, on the brand field. */}
      <Composition
        id="WorkvivoIntegrationsList"
        component={WorkvivoIntegrationsList}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Still frame: the newsletter builder — palette, canvas and save bar on the
          tenant brand field. The editor panel bleeds off frame, as in the reference. */}
      <Composition
        id="WorkvivoNewsletterBuilder"
        component={WorkvivoNewsletterBuilder}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* The Admin Hub. Draws its own top bar and collapsed rail, so it is a whole
          1440-wide window rather than a content pane. */}
      <Composition
        id="WorkvivoAdminHub"
        component={withCustomization(WorkvivoAdminHubScene)}
        durationInFrames={VIRGIN_FPS}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* A single article page on the dark field. Runs off the bottom of the frame, as
          the reference does — the image row is meant to be half-shown. */}
      <Composition
        id="WorkvivoArticle"
        component={withCustomization(WorkvivoArticleScene)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* The HQ Agent overlay mid-answer — the chat state of the same modal. */}
      <Composition
        id="HqChat"
        component={withCustomization(HqChatScene)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Still frame: the HQ Agent enterprise-search overlay, on the same red field. */}
      <Composition
        id="HqSearch"
        component={withCustomization(HqSearchScene)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* The Journeys builder — step palette either side of a live phone preview. */}
      <Composition
        id="JourneyBuilder"
        component={withCustomization(JourneyBuilderScene)}
        durationInFrames={VIRGIN_FPS}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Still frame: the 3x3 wall of Workvivo Journeys cards on Virgin red. */}
      <Composition
        id="JourneyCards"
        component={withCustomization(JourneyCardsScene)}
        durationInFrames={VIRGIN_FPS * 5}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Scene 24 — the Spaces directory. A static screen, so one second is plenty; it is
          here to be scrubbed and stilled rather than to carry motion. */}
      <Composition
        id="WorkvivoSpaces"
        component={withCustomization(WorkvivoSpacesScene)}
        durationInFrames={VIRGIN_FPS}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
        defaultProps={{ scrollTop: 0 }}
      />
      {/* The Newsletters index. Draws its own chrome on the standard 1760x1080 device
          rather than being a bare content pane. */}
      {/* Mobile Spotlight tab. `scrollTop` drives the page; 0 is the reference framing. */}
      <Composition
        id="WorkvivoMobileSpotlight"
        component={withCustomization(WorkvivoMobileSpotlightScene)}
        durationInFrames={VIRGIN_FPS}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
        defaultProps={{ scrollTop: 0 }}
      />
      {/* Space page, Feed tab — "Your Voice Matters". */}
      <Composition
        id="WorkvivoSpaceFeed"
        component={withCustomization(WorkvivoSpaceFeedScene)}
        durationInFrames={VIRGIN_FPS}
        fps={VIRGIN_FPS}
        width={1760}
        height={2093}
      />
      <Composition
        id="WorkvivoNewsletters"
        component={withCustomization(WorkvivoNewslettersScene)}
        durationInFrames={VIRGIN_FPS}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
      {/* Analytics & Reporting, Snapshot tab. Static, so one second is plenty. */}
      <Composition
        id="WorkvivoAnalytics"
        component={withCustomization(WorkvivoAnalyticsScene)}
        durationInFrames={VIRGIN_FPS}
        fps={VIRGIN_FPS}
        width={VIRGIN_WIDTH}
        height={VIRGIN_HEIGHT}
      />
    </>
  );
};
