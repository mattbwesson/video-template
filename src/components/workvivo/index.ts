/**
 * Workvivo component library — public entry point.
 *
 * Import from the folder rather than reaching into individual files:
 *
 *   import { WorkvivoPhonesScene } from "./components/workvivo";
 *
 * Every module here imports its own stylesheet as a side effect, so pulling anything
 * through this barrel loads the whole folder's CSS. That is safe by construction — each
 * scene namespaces its classes (wvd-, wm-, wsp-, wbb-, wp-, lv-) and only
 * WorkvivoStyles.css declares anything global, which nearly every scene already depends
 * on. Keep that invariant when adding a component: prefix your classes.
 *
 * The three scenes listed first are standalone — plain props, no provider. Components
 * that read useCustomization() (WorkvivoDesktop, WorkvivoBillboards, WorkvivoSidebar,
 * WorkvivoTopbar, WorkvivoMobileHome, WorkvivoLeftColumn, WorkvivoRightColumn) must be
 * rendered inside a CustomizationProvider.
 *
 * See README.md in this folder for what each scene is and how it is composed.
 */

/* ---------- standalone scenes ---------- */

export { WorkvivoSpacePage } from "./WorkvivoSpacePage";
export type { WorkvivoSpacePageProps } from "./WorkvivoSpacePage";
export { WorkvivoBillboardScreen } from "./WorkvivoBillboardScreen";
export type { WorkvivoBillboardScreenProps } from "./WorkvivoBillboardScreen";
export { WorkvivoPhonesScene } from "./WorkvivoPhonesScene";
export type { WorkvivoPhonesSceneProps } from "./WorkvivoPhonesScene";
export { WorkvivoNewsletterBuilder } from "./WorkvivoNewsletterBuilder";
export type { WorkvivoNewsletterBuilderProps } from "./WorkvivoNewsletterBuilder";
export { WIDGET_CARD_PITCH, WIDGET_LIST_W, WIDGETS_LEFT, WIDGETS_RIGHT, WidgetCard, WorkvivoWidgetList } from "./WorkvivoWidgetList";
export type { WidgetCategory, WidgetItem, WorkvivoWidgetListProps } from "./WorkvivoWidgetList";
export { WorkvivoWidgetStore, WIDGET_STORE_CARD_COUNT } from "./WorkvivoWidgetStore";
export type { WorkvivoWidgetStoreProps } from "./WorkvivoWidgetStore";
export { WorkvivoIntegrationsMarketplace } from "./WorkvivoIntegrationsMarketplace";
export type { WorkvivoIntegrationsMarketplaceProps } from "./WorkvivoIntegrationsMarketplace";
export { WorkvivoIntegrationsList } from "./WorkvivoIntegrationsList";
export type { WorkvivoIntegrationsListProps } from "./WorkvivoIntegrationsList";
export { WorkvivoSeerInsights } from "./WorkvivoSeerInsights";
export type { WorkvivoSeerInsightsProps } from "./WorkvivoSeerInsights";
export { WorkvivoSeerManagerInsights } from "./WorkvivoSeerManagerInsights";
export type { WorkvivoSeerManagerInsightsProps } from "./WorkvivoSeerManagerInsights";
export { SEER_DRIVERS, SEER_RATER_ROWS, SEER_TABS, WorkvivoSeerRater, seerScoreColor, seerScoreTextColor } from "./WorkvivoSeerRater";
export type { SeerRaterRow, WorkvivoSeerRaterProps } from "./WorkvivoSeerRater";
export { WorkvivoSeerSurveyMobile } from "./WorkvivoSeerSurveyMobile";
export type { WorkvivoSeerSurveyMobileProps } from "./WorkvivoSeerSurveyMobile";
export { WorkvivoCustomerGrid } from "./WorkvivoCustomerGrid";
export type { WorkvivoCustomerGridProps } from "./WorkvivoCustomerGrid";
export {
  CUSTOMER_GRID_ROWS,
  WorkvivoCenterLogo,
  IrishRailLogo,
  BusEireannLogo,
  VirginAustraliaLogo,
  ExosLogo,
  ScootLogo,
  JamulCasinoLogo,
  IamsLogo,
  WaldenLogo,
  UnipharLogo,
  WiderCircleLogo,
  ArhLogo,
  SpringHealthLogo,
  FlexjetLogo,
  ChangiLogo,
  ValorLogo,
  NhsRoyalBerkshireLogo,
  LondonAmbulanceLogo,
  FishLogo,
  AirNavLogo,
  VolvoWordmarkLogo,
  EmpirxHealthLogo,
  GreaterGoodHealthLogo,
  PmsLogo,
  PettittsLogo,
  EndeavourGroupLogo,
  InsomniaCoffeeLogo,
  AeroCloudLogo,
  HickorysLogo,
  AmFreshLogo,
  BimedaLogo,
  HarrisFarmLogo,
  WoodiesLogo,
  KokoBlackLogo,
  SanDiegoAirportLogo,
} from "./WorkvivoCustomerLogos";

/* ---------- surfaces, sections and primitives ---------- */

export { WorkvivoAdminHub } from "./WorkvivoAdminHub";
export { WorkvivoAiComposeSettings } from "./WorkvivoAiComposeSettings";
export { WorkvivoAnalytics } from "./WorkvivoAnalytics";
export { ARTICLE_W, WorkvivoArticle } from "./WorkvivoArticle";
export type { WorkvivoArticleProps } from "./WorkvivoArticle";
export { WorkvivoBillboards } from "./WorkvivoBillboards";
export { WorkvivoCatchMeUp, WorkvivoCatchMeUpSvgDefs } from "./WorkvivoCatchMeUp";
export type { StorySlideData, WorkvivoCatchMeUpProps } from "./WorkvivoCatchMeUp";
export { WorkvivoDesktop } from "./WorkvivoDesktop";
export type { WorkvivoDesktopProps } from "./WorkvivoDesktop";
export { REACTION_GLYPH, WorkvivoFloatingReactions, useReactionCounts } from "./WorkvivoFloatingReactions";
export type { ReactionCounts, ReactionKind } from "./WorkvivoFloatingReactions";
export { DocumentFolderIcon, FolderGlyph } from "./WorkvivoFolderIcon";
export { WorkvivoHero } from "./WorkvivoHero";
export { WorkvivoHomeContainer } from "./WorkvivoHomeContainer";
export type { SwapProgress } from "./WorkvivoHomeContainer";
export { HQ_CHAT_H, HQ_CHAT_W, WorkvivoHqChat } from "./WorkvivoHqChat";
export type { WorkvivoHqChatProps } from "./WorkvivoHqChat";
export { HQ_SEARCH_H, HQ_SEARCH_W, WorkvivoHqSearch } from "./WorkvivoHqSearch";
export type { WorkvivoHqSearchProps } from "./WorkvivoHqSearch";
export { HQ_SIDEBAR_W, WorkvivoHqSidebar } from "./WorkvivoHqSidebar";
export type { WorkvivoHqSidebarProps } from "./WorkvivoHqSidebar";
export { Icon, WorkvivoSvgDefs } from "./WorkvivoIcons";
export { JOURNEY_BOARD_H, JOURNEY_BOARD_W, WorkvivoJourneyBuilder } from "./WorkvivoJourneyBuilder";
export type { WorkvivoJourneyBuilderProps } from "./WorkvivoJourneyBuilder";
export { JOURNEY_CARD_H, JOURNEY_CARD_W, WorkvivoJourneyCard } from "./WorkvivoJourneyCard";
export type { JourneyCardProps } from "./WorkvivoJourneyCard";
export { JOURNEY_PHONE_H, JOURNEY_PHONE_W, WorkvivoJourneyPhone } from "./WorkvivoJourneyPhone";
export type { JourneyDay, JourneyStep, WorkvivoJourneyPhoneProps } from "./WorkvivoJourneyPhone";
export { WorkvivoLeftColumn } from "./WorkvivoLeftColumn";
export { WorkvivoLiveReplay } from "./WorkvivoLiveReplay";
export { LV_PANEL_WIDTH, WorkvivoLivestream } from "./WorkvivoLivestream";
export type { WorkvivoLivestreamProps } from "./WorkvivoLivestream";
export { MobileClick, WorkvivoMobileClick } from "./MobileClick";
export type { MobileClickProps } from "./MobileClick";
export { WorkvivoMobileHome, WorkvivoMobileSvgDefs } from "./WorkvivoMobileHome";
export type { WorkvivoMobileHomeProps } from "./WorkvivoMobileHome";
export { WorkvivoMobileSpotlight } from "./WorkvivoMobileSpotlight";
export type { WorkvivoMobileSpotlightProps } from "./WorkvivoMobileSpotlight";
export { WorkvivoNewsletters } from "./WorkvivoNewsletters";
export type { WorkvivoNewslettersProps } from "./WorkvivoNewsletters";
export { WorkvivoPostComposer } from "./WorkvivoPostComposer";
export type { PostComposerStage } from "./WorkvivoPostComposer";
export { WorkvivoRightColumn } from "./WorkvivoRightColumn";
export { WorkvivoSidebar } from "./WorkvivoSidebar";
export { WorkvivoSpaceFeed } from "./WorkvivoSpaceFeed";
export { WorkvivoSpaces } from "./WorkvivoSpaces";
export { WorkvivoSpacesSvgDefs } from "./WorkvivoSpacesIcons";
export { WorkvivoTopbar } from "./WorkvivoTopbar";
export { WorkvivoFeedbackArticle } from "./WorkvivoFeedbackArticle";
export { ZoomCallSvgDefs } from "./ZoomCallIcons";
