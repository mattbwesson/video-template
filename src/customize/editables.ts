/**
 * What one click on the finished cut lets you edit.
 *
 * The first version of the review screen had one panel per THING: click a photo, get a
 * photo picker; click a space badge, get an icon picker. That is the wrong unit. Nobody
 * looks at a Trending Spaces card and thinks "I would like to edit its photograph" — they
 * think "this card is wrong", and the card is a photo, a badge and two lines of copy.
 * Editing it meant finding and clicking three different targets.
 *
 * So the unit is the COMPONENT. This table says, for each clickable thing in the cut,
 * which image position, which icon position and which lines of copy belong to it, and the
 * panel draws only the sections that exist — a member avatar gets an image picker and
 * nothing else, a value disc gets an icon picker and nothing else.
 *
 * Built rather than typed out: every image position is an editable on its own, and this
 * file only has to say which of them ALSO carry an icon or some copy. Sixty-odd literal
 * entries whose only content was `{ image: "app.face.7" }` would be sixty-odd chances to
 * mistype one.
 */

import { IMAGE_SLOTS, imageSlotLabel, type ImageSlotKey } from "./imagery";
import { ICON_SLOTS, iconSlotLabel, type IconSlotKey } from "./icons";
import { HEADER_LABELS, type HeaderSlotKey } from "./headers";
import { textSlotAt } from "./copyPaths";

/** One line of copy attached to a component, named by its path in the copy table. */
export type TextFieldSpec = {
  /** Dotted path, list indices included: `"feed.spaces.0.description"`. */
  path: string;
  /** What to call it in the panel. Short — it sits above a 300px input. */
  label: string;
};

export type Editable = {
  /** Stable id; also what the panel keys its state off. */
  key: string;
  /** Human name for the panel's eyebrow, e.g. "Trending space · 2". */
  label: string;
  image?: ImageSlotKey;
  icon?: IconSlotKey;
  /**
   * Set on the three page banners, which are more than a photograph: they carry a
   * coloured wash and can show the company mark centred on top. The panel draws a
   * Header section for these and nothing else does.
   */
  header?: HeaderSlotKey;
  text: TextFieldSpec[];
};

/**
 * The icon and copy that hang off an image position.
 *
 * Everything absent from this table is an image and nothing more — the faces, the survey
 * thumbnails, the hero banner. Absent is the common case, which is why this is a patch
 * over the generated entries rather than the table itself.
 *
 * Where two positions show the SAME copy they name the same path on purpose: the desktop
 * homepage and the in-app screen both draw `feed.spaces.0`, and an operator who renames
 * that space on one screen means to have renamed the space.
 */
type Extra = {
  icon?: IconSlotKey;
  header?: HeaderSlotKey;
  text?: TextFieldSpec[];
};

/**
 * The ten Spaces-directory cards, each carrying its own three lines.
 *
 * Generated rather than written out because the ten entries differ only in an index, and
 * ten near-identical literals are ten chances to mistype one — the same reason the table
 * as a whole is built from `IMAGE_SLOTS` rather than typed.
 */
const spaceCards = (): Record<string, Extra> =>
  Object.fromEntries(
    Array.from({ length: 10 }, (_, i) => [
      `spaces.card.${i}`,
      {
        text: [
          { path: `spaces.directory.${i}.name`, label: "Space name" },
          // No "Members" row: the counts are derived from `companySize`, not written.
          { path: `spaces.directory.${i}.description`, label: "Description" },
        ],
      } satisfies Extra,
    ]),
  );

/**
 * The eight non-hero journey cards.
 *
 * `journey.card.N` is the (N+1)th slot of the wall's nine EXCEPT that the second card is
 * the hero and took `journey.hero.0` instead — so the wall index runs one ahead of the
 * card index from the second onwards. That offset is what this map exists to get right in
 * one place rather than at eight call sites.
 */
const journeyCards = (): Record<string, Extra> =>
  Object.fromEntries(
    Array.from({ length: 8 }, (_, i) => [
      `journey.card.${i}`,
      {
        text: [
          { path: `journeys.wall.${i === 0 ? 0 : i + 1}`, label: "Journey name" },
        ],
      } satisfies Extra,
    ]),
  );

const EXTRAS: Partial<Record<ImageSlotKey, Extra>> = {
  // --- the three page banners ------------------------------------------------------
  // Their photo position and their treatment are the same click: nobody swaps a header
  // photo without then wanting to see it under a lighter wash.
  "home.hero.0": { header: "home.hero" },
  "mobile.hero.0": { header: "mobile.hero" },
  "app.hero.0": { header: "app.hero" },

  // --- desktop homepage ------------------------------------------------------------
  "home.billboard.0": {
    text: [
      { path: "feed.billboards.0.title", label: "Headline" },
      { path: "feed.billboards.0.blurb", label: "Teaser" },
    ],
  },
  "home.billboard.1": {
    text: [
      { path: "feed.billboards.1.title", label: "Headline" },
      { path: "feed.billboards.1.blurb", label: "Teaser" },
    ],
  },
  "home.billboard.2": {
    text: [
      { path: "feed.billboards.2.title", label: "Headline" },
      { path: "feed.billboards.2.blurb", label: "Teaser" },
    ],
  },
  "home.news.0": { text: [{ path: "feed.news.0.title", label: "Headline" }] },
  "home.news.1": { text: [{ path: "feed.news.1.title", label: "Headline" }] },
  "home.news.2": { text: [{ path: "feed.news.2.title", label: "Headline" }] },
  "home.space.0": {
    icon: "space.badge.0",
    text: [
      { path: "feed.spaces.0.name", label: "Space name" },
      { path: "feed.spaces.0.description", label: "Description" },
    ],
  },
  "home.space.1": {
    icon: "space.badge.1",
    text: [
      { path: "feed.spaces.1.name", label: "Space name" },
      { path: "feed.spaces.1.description", label: "Description" },
    ],
  },
  "home.space.2": {
    icon: "space.badge.2",
    text: [
      { path: "feed.spaces.2.name", label: "Space name" },
      { path: "feed.spaces.2.description", label: "Description" },
    ],
  },
  "home.post.0": { text: [{ path: "feed.posts.0.title", label: "Post title" }] },
  "home.post.1": { text: [{ path: "feed.posts.1.title", label: "Post title" }] },
  "home.post.2": { text: [{ path: "feed.posts.2.title", label: "Post title" }] },
  "home.page.0": { text: [{ path: "feed.pages.0.title", label: "Page name" }] },
  "home.page.1": { text: [{ path: "feed.pages.1.title", label: "Page name" }] },
  "home.page.2": { text: [{ path: "feed.pages.2.title", label: "Page name" }] },
  "home.event.0": {
    text: [{ path: "feed.event.countdownName", label: "Event name" }],
  },
  // The weather card carries no photograph, so its copy hangs off the survey tile beside
  // it — the nearest thing in that column a click can land on. `feed.weather.condition`
  // and `feed.weather.unit` are absent because both are enums — one picks artwork, the
  // other the temperature scale — and the panel edits text. Editing the scale here would
  // relabel the numbers without converting them, which is worse than not offering it.
  "home.survey.0": {
    text: [
      { path: "feed.weather.city", label: "Weather city" },
      { path: "feed.weather.temperature", label: "Temperature" },
      { path: "feed.weather.high", label: "High" },
      { path: "feed.weather.low", label: "Low" },
    ],
  },

  // --- right-hand column of the same screen ----------------------------------------
  "side.post.0": {
    text: [
      { path: "feed.sidePost.headline", label: "Headline" },
      { path: "feed.sidePost.body", label: "Body" },
    ],
  },
  // "Run Club" and its member count are fixed product chrome, not copy slots, so this
  // card is a photo and a badge only.
  "side.space.0": { icon: "space.badge.3" },
  "side.event.0": {
    text: [{ path: "feed.event.bannerTitle", label: "Event name" }],
  },
  "side.page.0": { text: [{ path: "feed.pages.0.title", label: "Page name" }] },

  // --- the phone -------------------------------------------------------------------
  "mobile.lead.0": {
    text: [{ path: "feed.mobileNews.0.title", label: "Headline" }],
  },
  "mobile.news.0": {
    text: [{ path: "feed.mobileNews.1.title", label: "Headline" }],
  },
  "mobile.news.1": {
    text: [{ path: "feed.mobileNews.2.title", label: "Headline" }],
  },

  // --- Catch Me Up ------------------------------------------------------------------
  "cmu.feed.0": { text: [{ path: "catchup.0.title", label: "Headline" }] },
  "cmu.feed.1": { text: [{ path: "catchup.1.title", label: "Headline" }] },
  "story.0": {
    text: [
      { path: "stories.0.title", label: "Story title" },
      { path: "stories.0.body", label: "Story body" },
    ],
  },
  "story.1": {
    text: [
      { path: "stories.1.title", label: "Story title" },
      { path: "stories.1.body", label: "Story body" },
    ],
  },
  "story.2": {
    text: [
      { path: "stories.2.title", label: "Story title" },
      { path: "stories.2.body", label: "Story body" },
    ],
  },
  "story.3": {
    text: [
      { path: "stories.3.title", label: "Story title" },
      { path: "stories.3.body", label: "Story body" },
    ],
  },

  // --- the in-app screens -----------------------------------------------------------
  // The shout-out's image. Its text is the post being written, which is also what the
  // composer's tray thumbnail is a thumbnail OF — the two share this key deliberately.
  "app.post.0": {
    text: [
      { path: "composed.recipient", label: "Recipient" },
      { path: "composed.body", label: "Shout-out" },
    ],
  },
  "app.billboard.0": {
    text: [
      { path: "feed.billboards.1.title", label: "Headline" },
      { path: "feed.billboards.1.blurb", label: "Teaser" },
    ],
  },
  "app.news.0": { text: [{ path: "feed.news.1.title", label: "Headline" }] },
  "app.space.0": {
    icon: "space.badge.4",
    text: [
      { path: "feed.spaces.0.name", label: "Space name" },
      { path: "feed.spaces.0.description", label: "Description" },
    ],
  },
  "app.page.0": { text: [{ path: "feed.pages.0.title", label: "Page name" }] },
  "app.page.1": { text: [{ path: "feed.pages.1.title", label: "Page name" }] },
  // The centre column's document post. Its cover is a brand gradient rather than a photo,
  // so the block's only swappable picture is the poster's avatar — that is what these
  // fields hang off.
  "app.face.10": {
    text: [
      { path: "feed.appPost.document.author", label: "Posted by" },
      { path: "feed.appPost.document.space", label: "Space" },
      { path: "feed.appPost.document.body", label: "Post" },
      { path: "feed.appPost.document.title", label: "Document title" },
    ],
  },
  // The work-anniversary post below it, on the same footing.
  "app.face.12": {
    text: [
      { path: "feed.appPost.anniversary.author", label: "Name" },
      { path: "feed.appPost.anniversary.body", label: "Anniversary post" },
    ],
  },
  "app.survey.0": {
    text: [
      { path: "feed.surveys.0.title", label: "Survey 1" },
      { path: "feed.surveys.1.title", label: "Survey 2" },
      { path: "feed.surveys.2.title", label: "Survey 3" },
    ],
  },

  // --- global 1468-1549: the Spaces directory ---------------------------------------
  "spaces.banner.0": {
    text: [
      { path: "spaces.welcome.title", label: "Space name" },
      { path: "spaces.welcome.body", label: "Welcome text" },
    ],
  },
  ...spaceCards(),

  // --- global 1549-1639: the Space page ---------------------------------------------
  // Its title is the fifth directory card's name, which is editable on that card. What
  // is here is everything the page adds.
  "spacepage.banner.0": {
    text: [
      { path: "spaces.directory.4.name", label: "Space name" },
      { path: "spaces.page.about", label: "About" },
    ],
  },
  "spacepage.survey.0": {
    text: [
      { path: "spaces.page.survey.title", label: "Survey name" },
      { path: "spaces.page.survey.meta", label: "Questions" },
    ],
  },
  "spacepage.face.0": {
    text: [
      { path: "spaces.page.post.author", label: "Posted by" },
      { path: "spaces.page.post.body", label: "Shout-out" },
      { path: "spaces.page.post.credit", label: "Hooray to" },
    ],
  },
  "spacepage.story.0": {
    text: [{ path: "spaces.page.featured.story", label: "Headline" }],
  },
  "spacepage.countdown.0": {
    text: [
      { path: "feed.event.countdownName", label: "Event name" },
      { path: "spaces.page.featured.page", label: "Featured page" },
      { path: "spaces.page.featured.podcast", label: "Featured podcast" },
    ],
  },

  // --- global 1630-1677: the phone's Spotlight tab -----------------------------------
  "spotlight.journey.0": {
    text: [{ path: "spotlight.journey", label: "Journey name" }],
  },
  "spotlight.lead.0": {
    text: [{ path: "feed.mobileNews.0.title", label: "Headline" }],
  },
  "spotlight.news.0": {
    text: [{ path: "feed.mobileNews.1.title", label: "Headline" }],
  },
  "spotlight.news.1": {
    text: [{ path: "feed.mobileNews.2.title", label: "Headline" }],
  },
  "spotlight.news.2": {
    text: [{ path: "spotlight.news.0.title", label: "Headline" }],
  },
  "spotlight.news.3": {
    text: [{ path: "spotlight.news.1.title", label: "Headline" }],
  },
  "spotlight.space.0": {
    text: [
      { path: "feed.spaces.0.name", label: "Space name" },
      { path: "feed.spaces.0.description", label: "Description" },
    ],
  },
  "spotlight.space.1": {
    text: [
      { path: "feed.spaces.1.name", label: "Space name" },
      { path: "feed.spaces.1.description", label: "Description" },
    ],
  },
  "spotlight.space.2": {
    text: [
      { path: "feed.spaces.2.name", label: "Space name" },
      { path: "feed.spaces.2.description", label: "Description" },
    ],
  },
  "spotlight.event.0": {
    text: [
      { path: "spotlight.event.title", label: "Event name" },
      { path: "spotlight.event.when", label: "Date and time" },
    ],
  },

  // --- global 1677-1825: the Journeys phone and the wall ------------------------------
  // The hero card and the phone preview share `journeys.phone.title`, which is why the
  // hero also carries the blurb and the six steps: it is the journey the film is about.
  "journey.hero.0": {
    text: [
      { path: "journeys.wall.1", label: "Journey name" },
      { path: "journeys.phone.title", label: "Name on the phone" },
      { path: "journeys.phone.blurb", label: "Description" },
    ],
  },
  ...journeyCards(),

  // --- global 1813-1978: Workvivo Billboards ------------------------------------------
  "signage.story.0": {
    text: [
      { path: "signage.stories.0.headline", label: "Headline" },
      { path: "signage.stories.0.body", label: "Body" },
      { path: "signage.stories.0.action", label: "Action line" },
      { path: "signage.stories.0.scope", label: "Audience" },
      { path: "signage.translatedFrom", label: "Translated from" },
      { path: "signage.stories.0.value", label: "Value" },
      { path: "signage.location", label: "Screen location" },
    ],
  },
  "signage.story.1": {
    text: [
      { path: "signage.stories.1.headline", label: "Headline" },
      { path: "signage.stories.1.body", label: "Body" },
      { path: "signage.stories.1.author", label: "Posted by" },
      { path: "signage.stories.1.action", label: "Action line" },
      { path: "signage.stories.1.scope", label: "Audience" },
      { path: "signage.stories.1.value", label: "Value" },
    ],
  },
  "signage.story.2": {
    text: [
      { path: "signage.stories.2.headline", label: "Headline" },
      { path: "signage.stories.2.body", label: "Body" },
      { path: "signage.stories.2.author", label: "Posted by" },
      { path: "signage.stories.2.action", label: "Action line" },
      { path: "signage.stories.2.scope", label: "Audience" },
      { path: "signage.stories.2.value", label: "Value" },
    ],
  },
  "signage.article.0": {
    text: [
      { path: "signage.article.title", label: "Headline" },
      { path: "signage.article.author", label: "Author" },
    ],
  },
  "signage.event.0": {
    text: [
      { path: "signage.event.title", label: "Event name" },
      { path: "signage.link", label: "Link" },
    ],
  },
  "signage.face.3": {
    text: [
      { path: "signage.anniversary.name", label: "Name" },
      { path: "signage.anniversary.note", label: "Message" },
    ],
  },

  // --- global 1978-2058: the Newsletters index ----------------------------------------
  "newsletter.cover.0": {
    text: [
      { path: "newsletters.items.0.title", label: "Newsletter" },
      { path: "newsletters.items.0.folder", label: "Folder" },
    ],
  },
  "newsletter.cover.1": {
    text: [
      { path: "newsletters.items.1.title", label: "Newsletter" },
      { path: "newsletters.items.1.folder", label: "Folder" },
    ],
  },
  "newsletter.cover.2": {
    text: [
      { path: "newsletters.items.2.title", label: "Newsletter" },
      { path: "newsletters.items.2.folder", label: "Folder" },
    ],
  },
  "newsletter.cover.3": {
    text: [
      { path: "newsletters.items.3.title", label: "Newsletter" },
      { path: "newsletters.items.3.folder", label: "Folder" },
    ],
  },
  // The folder chips are text on a plain surface, so they hang off the collage strip
  // above them — the only thing on that screen a click can land on.
  "newsletter.collage.0": {
    text: [
      { path: "newsletters.folders.0", label: "Folder 1" },
      { path: "newsletters.folders.1", label: "Folder 2" },
      { path: "newsletters.folders.2", label: "Folder 3" },
      { path: "newsletters.folders.3", label: "Folder 4" },
      { path: "newsletters.folders.4", label: "Folder 5" },
    ],
  },

  // --- global 2100-2236: the chat thread and its summary -------------------------------
  "chat.face.0": {
    text: [
      { path: "chat.channel", label: "Channel" },
      { path: "chat.channelMeta", label: "Channel meta" },
      { path: "chat.messages.0", label: "Message 1" },
      { path: "chat.caller", label: "On the call" },
    ],
  },
  "chat.face.1": {
    text: [
      { path: "chat.senders.0", label: "Sender" },
      { path: "chat.messages.1", label: "Message 2" },
      { path: "chat.messages.2", label: "Message 3" },
      { path: "chat.messages.3", label: "Message 4" },
    ],
  },
  "chat.face.2": {
    text: [
      { path: "chat.senders.1", label: "Sender" },
      { path: "chat.messages.4", label: "Message 5" },
    ],
  },

  // --- global 2268-2499: the HQ Agent run -----------------------------------------------
  // The typed question and the whole chat that follows are fixed beats of the film
  // (FIXED_COPY.hqQuery / hqChat), so they are not offered for editing here either.
  "search.face.0": {
    text: [
      { path: "hq.answer.title", label: "Answer title" },
      { path: "hq.answer.body", label: "Answer" },
      { path: "hq.results.0.title", label: "Result 1" },
      { path: "hq.results.0.space", label: "Result 1 space" },
      { path: "hq.results.0.description", label: "Result 1 summary" },
      { path: "hq.attachment", label: "Attachment" },
      { path: "hq.results.1.title", label: "Result 2" },
      { path: "hq.results.1.space", label: "Result 2 space" },
      { path: "hq.results.1.description", label: "Result 2 summary" },
      { path: "hq.resultAuthor", label: "Result 2 author" },
    ],
  },

  // --- global 3264-3326: the article page ------------------------------------------------
  "article.banner.0": {
    text: [
      { path: "article.title", label: "Title" },
      { path: "article.language", label: "Language" },
      { path: "article.lead", label: "Opening" },
      { path: "article.heading", label: "Subheading" },
    ],
  },
  "article.figure.0": {
    text: [
      { path: "article.points.0.label", label: "Point 1" },
      { path: "article.points.0.body", label: "Point 1 text" },
      { path: "article.points.1.label", label: "Point 2" },
      { path: "article.points.1.body", label: "Point 2 text" },
      { path: "article.points.2.label", label: "Point 3" },
      { path: "article.points.2.body", label: "Point 3 text" },
    ],
  },
  "article.figure.1": {
    text: [
      { path: "article.quote", label: "Pull quote" },
      { path: "article.quoteAuthor", label: "Attributed to" },
      { path: "article.closing", label: "Closing line" },
    ],
  },

  // --- global 4066-4253: the Employee Insights space and its article ----------------------
  // The "Your Voice Matters" space carries no entries here. Its words are a fixed beat
  // (FIXED_COPY.voice) so there is nothing to edit, but every photograph on the screen is
  // still a position in its own right — `voice.banner.0`, `voice.doc.0`, `voice.featured.0`,
  // `voice.event.0` and the six `voice.face.N` avatars are all built from IMAGE_SLOTS
  // below, and each opens a picker with no Text section. Same shape as the feedback
  // article beneath it.
  // The feedback article at 4110-4253 has no entry: the whole letter is a fixed beat of
  // the film (FIXED_COPY.feedbackArticle), so there is nothing here to edit.
};

/**
 * Components that have neither a photograph nor a swappable icon — only words.
 *
 * The Employee Insights screens are the whole of this list, and they are the reason it
 * exists: there is not one photograph anywhere on the survey, the heatmap or the comments
 * tab, so anchoring their copy to an image position (which is how everything else in this
 * table is reached) is not possible. Each names a piece of UI that the component marks
 * with `data-vc-slot` itself, and the panel draws the text section alone.
 *
 * Keys deliberately look nothing like `ImageSlotKey`s — there is no numeric tail — so a
 * misfiled one shows up as a missing editable rather than as a photo swap.
 */
const TEXT_ONLY: Editable[] = [
  {
    key: "seer.survey",
    label: "Survey questions",
    text: [
      { path: "seer.questions.0", label: "Question 1" },
      { path: "seer.questions.1", label: "Question 2" },
      { path: "seer.questions.2", label: "Question 3" },
      { path: "seer.questions.3", label: "Question 4" },
      { path: "seer.questions.4", label: "Question 5" },
    ],
  },
  {
    key: "seer.rater",
    label: "Insights segments",
    text: Array.from({ length: 9 }, (_, i) => [
      { path: `seer.segments.${i}.name`, label: `Segment ${i + 1}` },
      { path: `seer.segments.${i}.kind`, label: `Segment ${i + 1} kind` },
    ]).flat(),
  },
  {
    key: "seer.comments",
    label: "Insights comments",
    text: [
      ...Array.from({ length: 10 }, (_, i) => ({
        path: `seer.topics.${i}`,
        label: `Topic ${i + 1}`,
      })),
      ...Array.from({ length: 3 }, (_, i) => [
        { path: `seer.comments.${i}.driver`, label: `Comment ${i + 1} driver` },
        { path: `seer.comments.${i}.question`, label: `Comment ${i + 1} question` },
        { path: `seer.comments.${i}.body`, label: `Comment ${i + 1}` },
      ]).flat(),
    ],
  },
  {
    // The Quick Links, Documents and vendor tiles carry no photograph between them, and
    // the phone's header is `mobile.hero.0` — shared with the home screen, whose own
    // editable is about that header rather than about this page. So this is anchored on
    // the Quick Links block itself.
    key: "spotlight.links",
    label: "Phone quick links",
    // The three Quick Links tile labels are NOT here. They are set from the icon beside
    // them and nowhere else — see `iconOnlyText` above — so a text field for them is a
    // way to put one vendor's name under another's mark.
    text: [
      ...Array.from({ length: 4 }, (_, i) => ({
        path: `spotlight.quickLinks.${i}`,
        label: `Quick link ${i + 1}`,
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        path: `spotlight.documents.${i}`,
        label: `Document ${i + 1}`,
      })),
    ],
  },
  {
    // Neither livestream screen carries a swappable photograph — the player shows video
    // and the chapter thumbnails are frames of it — so the event's copy is anchored on the
    // meta block and the chapter list respectively.
    key: "livestream.event",
    label: "Livestream event",
    text: [
      { path: "livestream.title", label: "Event name" },
      { path: "livestream.description", label: "Description" },
      ...Array.from({ length: 7 }, (_, i) => [
        { path: `livestream.comments.${i}.name`, label: `Comment ${i + 1} by` },
        { path: `livestream.comments.${i}.text`, label: `Comment ${i + 1}` },
      ]).flat(),
    ],
  },
  {
    key: "livestream.chapters",
    label: "Smart Chapters",
    text: [
      { path: "livestream.title", label: "Event name" },
      ...Array.from({ length: 4 }, (_, i) => ({
        path: `livestream.chapters.${i}`,
        label: `Chapter ${i + 1}`,
      })),
    ],
  },
  {
    // The card's artwork is the product's podcast glyph now, not a photo, so this has no
    // image position to hang off — see WorkvivoRightColumn.
    key: "feed.podcast",
    label: "Featured podcast",
    text: [
      { path: "feed.podcast.show", label: "Show" },
      { path: "feed.podcast.episode", label: "Episode" },
    ],
  },
  {
    key: "feed.documents",
    label: "Featured documents",
    text: [
      { path: "feed.documents.0.name", label: "Folder 1" },
      { path: "feed.documents.1.name", label: "PDF file" },
      { path: "feed.documents.2.name", label: "Folder 2" },
      { path: "feed.documents.3.name", label: "SVG file" },
    ],
  },
  {
    key: "chat.summary",
    label: "AI summary",
    text: [{ path: "chat.summary", label: "Summary" }],
  },
  {
    key: "journeys.steps",
    label: "Journey steps",
    text: Array.from({ length: 6 }, (_, i) => ({
      path: `journeys.phone.steps.${i}`,
      label: `Step ${i + 1}`,
    })),
  },
];

/**
 * Icon positions that are a component in their own right.
 *
 * The space badges are not here: each of them belongs to the card it sits on, and
 * clicking either the badge or the card photo should open that one card. The four value
 * discs have no photograph anywhere near them, so each is its own editable — an
 * icon-only one, which is what the panel's "draw only the sections that exist" rule was
 * written for. The three Quick Links tiles are the same shape: a mark and the name under
 * it, no photograph — so they open a panel with an icon picker and that one line.
 */
const ICON_ONLY: IconSlotKey[] = ICON_SLOTS.filter(
  (k) => k.startsWith("value.disc.") || k.startsWith("app.quicklink."),
);

/**
 * The copy that belongs to each value disc: the row's own name.
 *
 * The discs stopped being icon-only when the values became researched copy — a value is
 * a phrase with a picture next to it, and clicking the picture should let you fix the
 * phrase. Derived from the slot's index so the two lists cannot fall out of step.
 */
const iconOnlyText = (icon: IconSlotKey): TextFieldSpec[] => {
  const n = icon.slice(icon.lastIndexOf(".") + 1);
  // A Quick Links tile is a mark and the name under it, and the name is NOT typed: it
  // comes from the icon's own filename when one is picked or uploaded. Offering a text
  // field here is offering the chance to put one vendor's name under another's logo,
  // which is the exact fault this arrangement exists to make impossible.
  if (icon.startsWith("app.quicklink.")) {
    return [];
  }
  return [{ path: `composed.values.${n}`, label: "Value name" }];
};

const build = (): Map<string, Editable> => {
  const out = new Map<string, Editable>();

  for (const image of IMAGE_SLOTS) {
    const extra = EXTRAS[image];
    out.set(image, {
      key: image,
      // A banner is named for its treatment ("Homepage header"), not for its photo
      // position ("Homepage banner"), because the panel it opens is mostly the treatment.
      label: extra?.header ? HEADER_LABELS[extra.header] : imageSlotLabel(image),
      image,
      icon: extra?.icon,
      header: extra?.header,
      text: extra?.text ?? [],
    });
  }

  for (const icon of ICON_ONLY) {
    out.set(icon, {
      key: icon,
      label: iconSlotLabel(icon),
      icon,
      text: iconOnlyText(icon),
    });
  }

  for (const editable of TEXT_ONLY) out.set(editable.key, editable);

  return out;
};

const EDITABLES = build();

/**
 * Which component a marked-up DOM element belongs to.
 *
 * An element carries either an image key or an icon key, and both spaces are flat and
 * disjoint. An icon that belongs to a card resolves to the CARD, so clicking a space
 * badge and clicking the photo above it open the same panel.
 */
const OWNER_OF_ICON = new Map<string, string>();
for (const e of EDITABLES.values()) {
  if (e.icon && e.image) OWNER_OF_ICON.set(e.icon, e.key);
}

export const editableForDomKey = (key: string): Editable | null =>
  EDITABLES.get(OWNER_OF_ICON.get(key) ?? key) ?? null;

export const editableByKey = (key: string): Editable | null =>
  EDITABLES.get(key) ?? null;

/**
 * Every `path` in this table that does not name a real text slot.
 *
 * The paths above are strings, and a mistyped one fails silently in both directions:
 * `expandCopyOverrides` drops it as a stale key, and the panel simply does not draw the
 * field — so the operator finds a card they cannot fully edit and nothing anywhere says
 * why. There are nearly three hundred of them, most of which differ only in an index.
 *
 * Returns `"<editable key> -> <path>"` for each. Called by the research route at request
 * time, which is the one place in the system that already loads the whole copy table and
 * is allowed to log.
 */
export const brokenEditablePaths = (): string[] => {
  const bad: string[] = [];
  for (const editable of EDITABLES.values()) {
    for (const field of editable.text) {
      if (!textSlotAt(field.path)) bad.push(`${editable.key} -> ${field.path}`);
    }
  }
  return bad;
};
