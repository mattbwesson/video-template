/**
 * Where the operator's uploads land in the cut.
 *
 * The wizard collects a bag of photos with no labels on them — it cannot ask which one
 * is "the third billboard". So placement is a **closed, ordered list of named
 * positions** and a pure function from the pool to that list, which is the same
 * enum-in / lookup-out shape the guide prescribes for anything visual (§4, §5.8): the
 * set of positions is fixed and exhaustive, nothing invents a slot at render time, and
 * an unfilled position falls back to the approved baseline asset rather than to a hole.
 *
 * The function must be pure and stable: Remotion re-renders every frame, and an
 * assignment that shuffled between frames would make photos flicker mid-shot.
 */

/**
 * Every operator-fillable image position in frames 0-5299.
 *
 * Two orderings are at work, and both matter, because the allocator hands upload `i % n`
 * to position `i` — so the FIRST positions in this list are the ones that get distinct
 * photos when the pool is short.
 *
 *  1. Groups run in timeline order: the opening cloud, the desktop homepage, the phone,
 *     the Catch Me Up story, the in-app screens, and then everything from the Spaces
 *     directory at 1468 through to the Employee Insights article at 4253.
 *  2. Within a group, the biggest, most-looked-at position comes first, and the small
 *     decorative member avatars come last.
 *
 * Adding to the END is safe; inserting into the middle is not. The allocator deals by
 * index, so a new position spliced in at 40 shifts every photo after it into a different
 * slot — and any `imageOverrides` the reviewer had already pinned would then be sitting
 * on the wrong shot.
 *
 * Product chrome is deliberately absent — file-type glyphs, the HQ mark, vendor tiles.
 * Those are not photographs and swapping them would break the product, not brand it.
 */
export const IMAGE_SLOTS = [
  // --- global 33-90: ten portraits orbiting the headline -------------------------
  "hq.face.0",
  "hq.face.1",
  "hq.face.2",
  "hq.face.3",
  "hq.face.4",
  "hq.face.5",
  "hq.face.6",
  "hq.face.7",
  "hq.face.8",
  "hq.face.9",

  // --- global 417-534: the desktop homepage (WorkvivoHomeContainer) --------------
  "home.billboard.0",
  "home.billboard.1",
  "home.billboard.2",
  "home.hero.0",
  "home.news.0",
  "home.news.1",
  "home.news.2",
  "home.space.0",
  "home.space.1",
  "home.space.2",
  "home.post.0",
  "home.post.1",
  "home.post.2",
  "home.page.0",
  "home.page.1",
  "home.page.2",
  "home.event.0",
  "home.survey.0",
  // Right-hand column of the same screen.
  "side.post.0",
  "side.space.0",
  "side.event.0",
  "side.page.0",
  "side.face.0",
  // 20px avatars in the Trending Spaces header. Last in the group on purpose.
  "home.member.0",
  "home.member.1",
  "home.member.2",
  "home.member.3",
  "home.member.4",

  // --- global 534-600: the phone homepage (WorkvivoMobileHome) -------------------
  // The header photo is first in this group by the same rule as everywhere else: it is
  // the biggest thing on the phone and the frame the cut rests on at global 540.
  "mobile.hero.0",
  "mobile.lead.0",
  "mobile.news.0",
  "mobile.news.1",

  // --- global 632-738: Catch Me Up, feed then story -----------------------------
  "cmu.feed.0",
  "cmu.feed.1",
  "story.0",
  "story.1",
  "story.2",
  "story.3",

  // --- global 738-896 and 1032+: the in-app screens (WorkvivoDesktop) ------------
  // The banner across the top of the screen, first in the group for the usual reason:
  // it is the largest picture on it and the frame the cut holds at global 755.
  "app.hero.0",
  "app.post.0",
  "app.billboard.0",
  "app.news.0",
  "app.space.0",
  "app.page.0",
  "app.page.1",
  "app.survey.0",
  "app.survey.1",
  "app.survey.2",
  "composer.face.0",
  "app.face.0",
  "app.face.1",
  "app.face.2",
  "app.face.3",
  "app.face.4",
  "app.face.5",
  "app.face.6",
  "app.face.7",
  "app.face.8",
  "app.face.9",
  "app.face.10",
  "app.face.11",
  "app.face.12",
  "app.face.13",

  // --- global 1275-1477: the livestream replay ----------------------------------
  // Only the FIRST chapter's thumbnail. It is the one the sheet opens on and the only one
  // read at this size, and it carries the company's logo over it like a title card — so
  // it is the shot worth letting an operator choose. The other three keep the broadcast's
  // own stills: four uploads for four 85x58 tiles is a lot of asking for very little.
  "livestream.chapter.0",

  // --- global 1468-1549: the Spaces directory -----------------------------------
  "spaces.banner.0",
  "spaces.card.0",
  "spaces.card.1",
  "spaces.card.2",
  "spaces.card.3",
  "spaces.card.4",
  "spaces.card.5",
  "spaces.card.6",
  "spaces.card.7",
  "spaces.card.8",
  "spaces.card.9",

  // --- global 1549-1639: the Space page it opens --------------------------------
  "spacepage.banner.0",
  "spacepage.survey.0",
  "spacepage.story.0",
  "spacepage.countdown.0",
  "spacepage.face.0",
  "spacepage.face.1",
  "spacepage.face.2",
  "spacepage.face.3",
  "spacepage.face.4",
  "spacepage.face.5",

  // --- global 1630-1677: the phone's Spotlight tab ------------------------------
  // No header position: the Spotlight tab draws the SAME .wm-hero as the home screen at
  // 534-600, so its header photo is `mobile.hero.0` and swapping one swaps both. That is
  // the right behaviour — it is one phone — and a second position for it would be a
  // photo the operator could set and never see.
  "spotlight.journey.0",
  "spotlight.lead.0",
  "spotlight.news.0",
  "spotlight.news.1",
  "spotlight.news.2",
  "spotlight.news.3",
  "spotlight.space.0",
  "spotlight.space.1",
  "spotlight.space.2",
  "spotlight.event.0",

  // --- global 1677-1825: the Journeys phone, then the wall of nine --------------
  // The wall's SECOND card is the hero the match cut lands on, so it comes first in
  // the group.
  "journey.hero.0",
  // The phone's own banner at 1677-1750. Its own position rather than the wall card it
  // used to borrow: it is a header like any other, so an operator sets a photo for it and
  // the brand wash tints it, and changing it no longer silently changes a card on the
  // wall as well. The baseline default is unchanged, so the demo looks the same.
  "journey.phone.0",
  "journey.card.0",
  "journey.card.1",
  "journey.card.2",
  "journey.card.3",
  "journey.card.4",
  "journey.card.5",
  "journey.card.6",
  "journey.card.7",

  // --- global 1813-1978: Workvivo Billboards on the wall screen -----------------
  "signage.story.0",
  "signage.story.1",
  "signage.story.2",
  "signage.article.0",
  "signage.event.0",
  "signage.face.0",
  "signage.face.1",
  "signage.face.2",
  "signage.face.3",

  // --- global 1978-2058: the Newsletters index ----------------------------------
  "newsletter.cover.0",
  "newsletter.cover.1",
  "newsletter.cover.2",
  "newsletter.cover.3",
  "newsletter.collage.0",
  "newsletter.collage.1",
  "newsletter.collage.2",
  "newsletter.collage.3",
  "newsletter.collage.4",

  // --- global 2100-2236: the chat thread on the left phone ----------------------
  "chat.photo.0",
  "chat.photo.1",
  "chat.photo.2",
  "chat.photo.3",
  "chat.face.0",
  "chat.face.1",
  "chat.face.2",

  // --- global 2317-2392: the second search result's byline ----------------------
  "search.face.0",

  // --- global 3264-3326: the article page ---------------------------------------
  "article.banner.0",
  "article.figure.0",
  "article.figure.1",

  // --- global 3388-3572: the Analytics & Reporting header strip -----------------
  "analytics.banner.0",
  "analytics.banner.1",
  "analytics.banner.2",
  "analytics.banner.3",

  // --- global 4066-4110: the Employee Insights space ----------------------------
  "voice.banner.0",
  "voice.doc.0",
  "voice.featured.0",
  "voice.event.0",
  "voice.face.0",
  "voice.face.1",
  "voice.face.2",
  "voice.face.3",
  "voice.face.4",
  "voice.face.5",

  // --- global 4110-4253: the article it links to --------------------------------
  "voice.author.0",

  // --- global 4553-4591: the Admin Hub ------------------------------------------
  "admin.collage.0",
  "admin.collage.1",
  "admin.collage.2",
  "admin.collage.3",
  "admin.new.0",
] as const;

export type ImageSlotKey = (typeof IMAGE_SLOTS)[number];

/**
 * The attribute each slot's element carries in the rendered DOM.
 *
 * Every `image(key, …)` call site also writes `data-vc-slot="<key>"` on the element the
 * picture lands on. In a render that attribute is inert. In the wizard's `<Player>` it is
 * how the swap overlay finds a shot to put a hit target over — the composition's real
 * geometry (device frames scaled inside scaled stages, a rotating match cut) is not
 * something an overlay could reconstruct from the outside, so the composition points at
 * its own pictures and the overlay measures them.
 *
 * Exported for the reader. The writers use the literal, because JSX cannot take a
 * computed attribute name without an awkward spread.
 */
export const SLOT_ATTR = "data-vc-slot";

export type ImageAssignment = Partial<Record<ImageSlotKey, string>>;

/**
 * `"home.news.1"` -> `"home.news"`. `${bigint}` is what matches an integer-looking
 * segment in a template-literal pattern; `${number}` would also match `"1.5"` and `"1e3"`.
 *
 * Recursive rather than the obvious `K extends \`${infer R}.${bigint}\` ? R : never`,
 * which silently collapses to `"story"`. Template-literal inference does not backtrack:
 * it splits on the FIRST separator, so that pattern binds R to `"hq"` and then asks
 * whether `"face.0"` is a bigint. Only the one-dot keys survive it. Peeling the head off
 * until the tail is a bare number is what actually finds the last segment.
 */
type RoleOf<K extends string> = K extends `${infer Head}.${infer Tail}`
  ? Tail extends `${bigint}`
    ? Head
    : `${Head}.${RoleOf<Tail>}`
  : never;

export type ImageRole = RoleOf<ImageSlotKey>;

/**
 * Human names for the positions, so the wizard can tell an operator where a photo landed
 * instead of showing them an anonymous grid.
 *
 * Keyed by role rather than by slot: an exhaustive `Record<ImageRole, string>` still makes
 * an unnamed group a type error, without sixty near-identical lines that differ only in a
 * trailing digit.
 */
const ROLE_LABELS: Record<ImageRole, string> = {
  "hq.face": "Opening face",
  "home.billboard": "Billboard",
  "home.hero": "Homepage banner",
  "home.news": "Featured news",
  "home.space": "Trending space",
  "home.post": "Post",
  "home.page": "Featured page",
  "home.event": "Event countdown",
  "home.survey": "Survey",
  "home.member": "Member avatar",
  "side.post": "Sidebar post",
  "side.space": "Sidebar space",
  "side.event": "Event banner",
  "side.page": "Sidebar page",
  "side.face": "Post author",
  "mobile.hero": "Phone header",
  "mobile.lead": "Phone lead story",
  "mobile.news": "Phone news",
  "cmu.feed": "Catch Me Up card",
  story: "Story",
  "app.hero": "In-app header",
  "app.post": "In-app post",
  "app.billboard": "In-app billboard",
  "app.news": "In-app news",
  "app.space": "In-app space",
  "app.page": "In-app page",
  "app.survey": "In-app survey",
  "app.face": "In-app avatar",
  "composer.face": "Shout-out recipient",
  "livestream.chapter": "Replay chapter thumbnail",
  "spaces.banner": "Spaces banner",
  "spaces.card": "Space card",
  "spacepage.banner": "Space page banner",
  "spacepage.survey": "Space survey",
  "spacepage.story": "Space featured story",
  "spacepage.countdown": "Space countdown",
  "spacepage.face": "Space member",
  "spotlight.journey": "Spotlight journey",
  "spotlight.lead": "Spotlight lead story",
  "spotlight.news": "Spotlight news",
  "spotlight.space": "Spotlight space",
  "spotlight.event": "Spotlight event",
  "journey.hero": "Journey cover",
  "journey.phone": "Journey phone header",
  "journey.card": "Journey card",
  "signage.story": "Billboard story",
  "signage.article": "Billboard article",
  "signage.event": "Billboard event",
  "signage.face": "Billboard avatar",
  "newsletter.cover": "Newsletter cover",
  "newsletter.collage": "Newsletter collage",
  "chat.photo": "Chat photo",
  "chat.face": "Chat avatar",
  "search.face": "Search result author",
  "article.banner": "Article banner",
  "article.figure": "Article picture",
  "voice.banner": "Insights space banner",
  "voice.doc": "Insights document",
  "voice.featured": "Insights featured news",
  "voice.event": "Insights event",
  "voice.face": "Insights member",
  "voice.author": "Insights article author",
  "analytics.banner": "Analytics header",
  "admin.collage": "Admin Hub header",
  "admin.new": "Admin Hub What's New",
};

/** How many positions a given role has, for numbering the label ("Opening face 3"). */
const roleCounts = IMAGE_SLOTS.reduce<Record<string, number>>((acc, key) => {
  const role = key.slice(0, key.lastIndexOf("."));
  acc[role] = (acc[role] ?? 0) + 1;
  return acc;
}, {});

/** `"hq.face.2"` -> `"Opening face · 3"`; a role with one position drops the number. */
export const imageSlotLabel = (key: ImageSlotKey): string => {
  const cut = key.lastIndexOf(".");
  const role = key.slice(0, cut) as ImageRole;
  const label = ROLE_LABELS[role];
  return roleCounts[role] > 1 ? `${label} · ${Number(key.slice(cut + 1)) + 1}` : label;
};

/**
 * How many photos the wizard asks for.
 *
 * Deliberately far below `IMAGE_SLOTS.length`. There are around 190 positions across the
 * whole film and nobody is going to upload 190 photos; past a dozen or so the returns are
 * small, because the repeats land in different scenes minutes apart where nobody reads
 * them as repeats.
 *
 * It did not go up when the film grew from 54 seconds to three and a half minutes, and
 * that is on purpose: the number is what an operator will actually do, not a fraction of
 * the positions. More positions makes each upload go FURTHER, not the ask larger.
 */
export const SUGGESTED_UPLOADS = 12;

/**
 * Deal the pool across the positions in order, wrapping when it runs short.
 *
 * Wrapping rather than stopping is what makes a small upload still dress the whole cut.
 * Twelve photos fills the headquarters cloud with ten distinct faces before anything
 * repeats, which is the one place a duplicate would be obvious — they are all on screen
 * at once. Everywhere else the repeats are scenes apart.
 */
export const assignImagery = (pool: string[]): ImageAssignment => {
  const clean = pool.filter(Boolean);
  if (!clean.length) return {};
  const out: ImageAssignment = {};
  IMAGE_SLOTS.forEach((key, i) => {
    out[key] = clean[i % clean.length];
  });
  return out;
};

/**
 * The inverse of `assignImagery`: which positions the upload at `index` ends up filling.
 *
 * Used only to caption the wizard's grid.
 */
export const slotsForUpload = (
  index: number,
  poolSize: number,
): ImageSlotKey[] =>
  poolSize <= 0
    ? []
    : IMAGE_SLOTS.filter((_, i) => i % poolSize === index);
