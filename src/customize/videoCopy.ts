/**
 * Every word of on-screen copy in frames 0-5299 of the Workvivo cut, declared once.
 *
 * Two rules decide whether something belongs here:
 *
 *  1. **If it is not in this table, it is not customisable.** Fixed product chrome —
 *     "Home", "Spaces", the Workvivo wordmark, the composer's tool labels — is
 *     deliberately absent, so no prompt engineering is needed to protect it (guide §1).
 *  2. **Nothing visual lives here.** Colours and images are operator-supplied and
 *     travel in `BrandInput` instead; a language model can neither generate nor pick
 *     them (guide §3, §4).
 *
 * Caps are pixel-motivated, not stylistic. Each one has the geometry that set it in a
 * comment, because the next person to raise a cap needs to know what will overflow.
 */

import { asset, defineCopy, enumSlot, list, text, type ValueOf } from "./slots";
import { DEFAULT_BRAND_HEX, type Hex } from "./color";
import type { HeaderOverrides } from "./headers";

/**
 * The baseline demo names a real company. The wizard find-and-replaces it the moment
 * the operator types their own, so the preview reads correctly before any model call —
 * the deterministic substitution layer the guide calls underrated (§5.4).
 */
export const BASELINE_COMPANY = "Spotify";

export const COPY = defineCopy({
  /**
   * How big this employer is, as one of three bands.
   *
   * The only thing the model is asked about headcount. Every member count in the film is
   * derived from it (see `memberCounts.ts`) rather than written per space: asking for a
   * dozen independent numbers meant they never agreed with each other, and a 300-person
   * agency could be handed a space with 28,000 people in it. An enum the model is good at
   * answering, arithmetic the code is good at doing.
   */
  companySize: enumSlot({
    default: "large",
    options: ["small", "medium", "large"] as const,
    guide:
      "This company's size as an employer, by total headcount: 'small' under about 1,000 people, 'medium' up to about 10,000, 'large' above that. Judge the whole company, not one office or brand.",
  }),

  /** The company the video is cut for. Everything else refers back to this. */
  companyName: text({
    default: BASELINE_COMPANY,
    // The topbar wordmark slot is 240px at 24px type; longer names wrap the sidebar.
    max: 28,
    guide:
      "The customer company's name exactly as they write it. No legal suffix (Inc, Ltd, GmbH) unless they always use one.",
  }),

  quote: {
    /** The post as first written, shown while the card opens (global ~1082). */
    original: text({
      default:
        "As we wrap up another quarter, I wanted to take a moment to thank the team for all of their hard work and dedication. We've achieved some fantastic results, supported one another through challenges, and continued to deliver great outcomes for our customers and the business. I'm incredibly proud of what we've accomplished together and excited to see what we can achieve in the months ahead.",
      // The open card is 939x470 at 27px/38px leading: about 420 characters before the
      // body overruns the card's bottom edge.
      max: 420,
      // "Written at length and slightly rambling" is what this used to say, and the model
      // did exactly as it was told: 538-715 characters against a 420 cap, in every measured
      // run, so the repair pass had to amputate the leader's post on the one card the whole
      // scene is built around. A guide that asks for length beats a number that forbids it.
      // The BEFORE state has to be conveyed as a QUALITY — unedited, hedged, repetitive —
      // rather than as a size.
      guide:
        "A leader's end-of-quarter post to the whole company. This is the BEFORE state that the AI rewrite improves on, so it should read as unedited: warm but hedged, a little repetitive, saying in three phrases what one would carry. First person plural. Make it read unpolished, NOT long — fill most of `aim_for` and never exceed `max_characters`.",
    }),
    /** The AI rewrite that replaces it in place. */
    rewritten: text({
      default:
        "What a quarter!\n\nA huge thank you to the team for your hard work, collaboration, and commitment. Together we've delivered great results, supported one another, and made a real impact. Proud of everything we've achieved and excited for what's next. \u{1F680}",
      max: 260,
      multiline: true,
      // The visible beat is that the rewrite is SHORTER — so the instruction has to be about
      // the gap between the two, not a fraction of whatever `original` happened to produce.
      // "About half the length" inherited `original`'s overrun: half of a 700-character post
      // is still over this field's own 260.
      guide:
        "The same message as `original`, visibly tighter — the shortening is the point of the shot. An opening exclamation, one short paragraph, one emoji at the end. Same facts, no new ones. Must fit `max_characters` however long `original` came out.",
    }),
    /** The same rewrite, translated — the beat that shows the translation feature. */
    translated: text({
      default:
        "\u{A1}Qué trimestre!\n\nUn enorme agradecimiento a todo el equipo por su esfuerzo, colaboración y compromiso. Juntos hemos logrado grandes resultados, nos hemos apoyado mutuamente y hemos generado un impacto real. Estamos orgullosos de todo lo que hemos conseguido y entusiasmados por lo que viene. \u{1F680}",
      // Romance-language expansion runs ~20% over the English, and the card is the same
      // size either way.
      max: 320,
      multiline: true,
      // The cap already carries the ~20% Romance expansion (see above), so this only needs
      // to say that the expansion cannot be spent twice: a translation of an over-long
      // `rewritten` would blow through even that allowance.
      guide:
        "A faithful translation of `rewritten` into a language this company actually operates in. Keep the emoji. `max_characters` already allows for the language running longer than English — stay inside it.",
    }),
  },

  livestream: {
    /**
     * The all-hands broadcast itself, global 1275-1477: the desktop stream at 1330 and the
     * phone's replay with its chapter list at 1450.
     *
     * The two screens share `title` deliberately — they are the same event, once live and
     * once on replay, and a title that changed between them would read as two broadcasts.
     * Viewer counts, timestamps and chapter timecodes are fixed: they are the shape of the
     * player's chrome, and inventing per-company numbers is the kind of specific the
     * research pass is told never to produce.
     */
    title: text({
      default: "Company All Hands \u{1F64C}",
      // 28px semibold under the player; the phone shows the same string at 17px.
      max: 30,
      guide:
        "The name of this company's all-hands broadcast, as they would title it. Ends with a single emoji.",
    }),
    description: text({
      default:
        "Join us for our August All Hands livestream — a moment to come together as one team, celebrate our wins, tackle our challenges, and look ahead to the exciting road in front of us.",
      // Two lines at 15px in the 870px column before the "See more" link truncates it.
      max: 200,
      guide:
        "What the broadcast is for, in one sentence, written as an invitation to staff. Names the month or the period it covers.",
    }),
    /**
     * The comments rail down the right of the desktop stream.
     *
     * Kept short on purpose: these are bubbles people type while watching, not internal
     * comms.
     */
    comments: list({
      length: 7,
      defaults: [
        { name: "Jillian Erics", text: "Comment any questions you have \u{1F60A}" },
        { name: "Leo Oliver", text: "Thanks for sharing this." },
        { name: "Courtney Samuels", text: "Great momentum!" },
        { name: "Korey Andrews", text: "Love it!, very exciting :)" },
        { name: "Anna Hill", text: "Comment any questions you have \u{1F60A}" },
        { name: "Kate Banks", text: "Great update!" },
        { name: "Ethan Tan", text: "Greetings from Singapore" },
      ],
      of: {
        name: text({
          default: "Jillian Erics",
          // 300px rail at 13px bold, one line.
          max: 22,
          guide: "A colleague watching the stream. Not the main character.",
        }),
        text: text({
          default: "Comment any questions you have \u{1F60A}",
          // The bubble wraps to two lines at 13px before it runs past the rail.
          max: 42,
          guide:
            "A short live-chat comment, the length people actually type while watching. At most one emoji.",
        }),
      },
      guide:
        "Seven live comments during the broadcast. Keep the baseline's rhythm — a couple of hosts prompting for questions, then one-line reactions — and make the LAST one a greeting from a place this company really operates, which is what makes the audience read as global.",
    }),
    /**
     * The Smart Chapters list on the phone's replay, global 1450.
     *
     * Four chapters; their TIMECODES are fixed, so the titles have to suit a broadcast
     * running in that order.
     */
    chapters: list({
      length: 4,
      defaults: [
        "CEO Welcome",
        "Quarter in Review",
        "Key Business Results",
        "Looking Ahead",
      ],
      of: text({
        default: "CEO Welcome",
        // 300px row at 17px, one line before it clips.
        max: 26,
        guide: "A chapter title from the broadcast. Title case, no timecode.",
      }),
      guide:
        "Four chapters an AI would have cut this company's all-hands into, in running order: a welcome, a look back at the period, the substance of what the business actually did, then what comes next. The third is where this company should be most recognisable.",
    }),
    /*
     * The three pills fanning out from behind the phone at global 1380 are NOT here —
     * see `FIXED_COPY.livestreamPills`. They name Workvivo's own features, not anything
     * about the customer.
     */
  },

  /**
   * The Workvivo feed itself — the articles, spaces, pages and posts on the screens the
   * film scrolls through.
   *
   * This is the bulk of the readable text in the cut and the part that most betrays a
   * generic demo: a home-improvement retailer's intranet does not carry the same stories
   * as a music streamer's. Product chrome around it ("Featured News", "View All", the nav
   * labels) stays fixed and is deliberately absent from this table.
   */
  feed: {
    billboards: list({
      length: 3,
      defaults: [
        {
          title: "Inspire, Shape, Connect",
          blurb: 'Join us for the "Inspire, Shape, Connect" event...',
        },
        {
          title: "Diversity and Inclusion Efforts",
          blurb: "Our company is committed to fostering an inclusive...",
        },
        {
          title: "Customer Summit",
          blurb: "Join us for the upcoming Customer Summit, where we...",
        },
      ],
      of: {
        title: text({
          default: "Inspire, Shape, Connect",
          // 436px card at 19px bold, one line before it clips.
          max: 34,
          guide: "A company-wide announcement headline. Title case, no full stop.",
        }),
        blurb: text({
          default: 'Join us for the "Inspire, Shape, Connect" event...',
          // Clamped to two lines and shown mid-sentence, so it ends in an ellipsis.
          max: 62,
          guide:
            "The opening clause of the announcement, cut off mid-sentence with a trailing '...' - it is a teaser, not a summary.",
        }),
      },
      guide:
        "Three billboard announcements this company would really run: an all-hands moment, a culture or values initiative, and a customer- or season-facing event.",
    }),

    news: list({
      length: 3,
      defaults: [
        { title: "Innovative Strategies for Productivity" },
        { title: "A New Hire's Guide to Success" },
        { title: "How Great Teams Stay Connected" },
      ],
      of: {
        title: text({
          default: "Innovative Strategies for Productivity",
          // 250px card, 15px type, wraps to two lines.
          max: 46,
          guide: "An internal news headline. Title case, no full stop.",
        }),
      },
      guide:
        "Three articles this company's internal comms team would plausibly have published: one about how the work gets done, one aimed at new starters, one about teams working together.",
    }),

    mobileNews: list({
      length: 3,
      defaults: [
        { title: "How to prepare for your next Customer Event" },
        { title: "Meditating on the Go" },
        { title: "Accelerating AI" },
      ],
      of: {
        title: text({
          default: "Meditating on the Go",
          // The phone's lead card takes two lines; the two thumbnails take one each.
          max: 44,
          guide: "A short article headline as it appears on the phone.",
        }),
      },
      guide:
        "Three more headlines for the phone's home screen. The first is the big lead story, the other two are small cards beneath it. Do not repeat the desktop headlines.",
    }),

    spaces: list({
      length: 3,
      defaults: [
        {
          name: "New Starters Network",
          description: "Helping new starters settle in and find the resources they need.",
        },
        {
          name: "AI & Digital Innovation",
          description: "Exploring AI, automation, and emerging technologies.",
        },
        {
          name: "Community Impact",
          description: "Sharing volunteer opportunities and fundraising initiatives.",
        },
      ],
      of: {
        name: text({
          default: "New Starters Network",
          max: 28,
          guide: "The name of an employee group. Title case, no full stop.",
        }),
        description: text({
          default: "Helping new starters settle in and find the resources they need.",
          // Three lines in a 250px card.
          max: 68,
          // 68 characters is a short sentence, not an average one, and the demo's example
          // uses 64 of them.
          guide:
            "One short sentence on what the group is for — ten words or so. Ends in a full stop.",
        }),
      },
      guide:
        "Three internal communities this company would actually have. Keep one for new starters; make the other two specific to their industry and the things their staff care about.",
    }),

    pages: list({
      length: 3,
      defaults: [
        { title: "AI Resource Center" },
        { title: "Manager Toolkit" },
        { title: "HR Pages" },
      ],
      of: {
        title: text({
          default: "AI Resource Center",
          max: 30,
          guide: "The name of an internal reference page. Title case.",
        }),
      },
      guide:
        "Three reference pages staff would look up - the kind of thing bookmarked rather than read once.",
    }),

    posts: list({
      length: 3,
      defaults: [
        { title: "Volunteer Registration Now Open" },
        { title: "Employee Spotlight: Mateo Garcia" },
        { title: "Book Club: This Month's Pick" },
      ],
      of: {
        title: text({
          default: "Volunteer Registration Now Open",
          max: 42,
          guide: "A short post headline, the kind a colleague would write.",
        }),
      },
      guide:
        "Three posts from around the business: something to sign up for, someone being recognised by name, and something social.",
    }),

    /**
     * The two posts in the desktop app's centre column, global 738-896.
     *
     * The screen behind them is already customised — the news card, Trending Spaces,
     * Featured Pages and the billboard all read from slots — but these two were written
     * into the markup, so the most-read column of the busiest screen in the film kept the
     * demo's words while everything around it changed.
     */
    appPost: {
      document: {
        author: text({
          default: "Maria Miller",
          max: 22,
          guide:
            "Who shared the document. A colleague, not the main character.",
        }),
        space: text({
          default: "New Hires",
          max: 18,
          guide:
            "The space the post was shared into. Should be one of the spaces named in `feed.spaces` if one fits.",
        }),
        body: text({
          default:
            "This document will bring you through the key features of HR platform, including viewing your profile, booking days off etc.",
          // Two lines in the 500px centre column at 15px.
          max: 140,
          guide:
            "One sentence introducing an internal guide this company's staff would actually be sent. Says what the document covers, in the plain voice a colleague posts in.",
        }),
        title: text({
          default: "The Complete Guide to our HR System",
          // Set twice: large on the document's cover and again as the caption under it.
          // The cover breaks it across two lines itself, so it must survive wrapping.
          max: 40,
          guide:
            "The document's title, in title case. Names an internal system or process this company would really document.",
        }),
      },
      anniversary: {
        author: text({
          default: "Phil Wilson",
          max: 22,
          guide:
            "Who is celebrating a work anniversary. A colleague, not the main character.",
        }),
        body: text({
          default:
            "Ten years today. Thank you to everyone who has made it such a good decade.",
          max: 90,
          guide:
            "What they wrote about their own milestone: how long, then a thank-you. Warm and brief, the way people actually post these.",
        }),
      },
    },

    /** The Surveys & Forms rail, right-hand column of the same screen. */
    surveys: list({
      length: 3,
      defaults: [
        { title: "Quarterly Survey" },
        { title: "AI Adoption Survey" },
        { title: "Recognition Pulse" },
      ],
      of: {
        title: text({
          default: "Quarterly Survey",
          // One line in the 306px rail at 14px.
          max: 26,
          guide: "The name of a survey. Title case, no full stop.",
        }),
      },
      guide:
        "Three surveys this company would run: a regular company-wide one, one about something it is currently rolling out, and a short recognition or wellbeing pulse.",
    }),

    sidePost: {
      headline: text({
        default: "One Workplace. One Shared Experience.",
        max: 42,
        guide: "The headline of the featured post in the right-hand column.",
      }),
      body: text({
        default:
          "Explore how employees across the organization are coming together through shared spaces, collaboration, and culture.",
        // Three lines in a 330px column.
        max: 150,
        guide:
          "Two clauses on how people across this company connect. Written by internal comms, not marketing.",
      }),
    },

    event: {
      countdownName: text({
        default: "Employee Summit",
        max: 26,
        guide: "The name of the event being counted down to.",
      }),
      bannerTitle: text({
        default: "Quarterly Company Kickoff",
        max: 30,
        guide: "The name of an upcoming all-hands or kickoff event.",
      }),
    },

    /**
     * The Featured Documents shelf, global ~510-534. Two folders and two files.
     *
     * The KIND of each row is fixed — position 0 and 2 draw a folder, 1 draws the PDF
     * glyph, 3 draws the SVG glyph — so the artwork is chrome and only the names are
     * here. That is also why the list guide is per-position rather than general: a name
     * without an extension under a PDF icon reads as a bug, and so does "Report.pdf"
     * under a folder.
     */
    documents: list({
      length: 4,
      defaults: [
        { name: "Q3 Financials" },
        { name: "Annual Report.pdf" },
        { name: "Brand Guidelines" },
        { name: "Logo Pack.svg" },
      ],
      of: {
        name: text({
          default: "Q3 Financials",
          // The row is 330px at 14.6px semibold and does not wrap — it clips.
          max: 28,
          guide:
            "The name of a folder or a file, as it would appear in a document library. Title case.",
        }),
      },
      guide:
        "Four things pinned to this company's Featured Documents shelf, in this exact shape because each row's icon is fixed: (1) a FOLDER, (2) a PDF FILE whose name ends '.pdf', (3) a FOLDER, (4) an SVG FILE whose name ends '.svg' — so that fourth one is artwork, a logo pack or an icon set, not a document. Names only, no descriptions. Make at least two specific to what this company actually does.",
    }),

    /**
     * The weather card in the right-hand column, global ~440-534.
     *
     * The temperatures are given as bare numbers and the card adds the degree signs and
     * the H/L prefixes itself — a model writing "H 14°" into a 60px slot is one stray
     * symbol away from a card that wraps.
     *
     * `condition` is an enum, not free text, because it also picks a piece of artwork:
     * the five members are exactly the five glyphs in public/img/weather, so there is no
     * value the lookup can miss (guide §4 — enum in, lookup out). Anything outside the
     * set falls back to the baseline at merge time.
     */
    weather: {
      city: text({
        default: "London",
        // 200px column at 15px; a long city name pushes the dots off the card.
        max: 22,
        guide:
          "The city this company is headquartered in, as its own site names it. If research does not find one, use London — a plausible generic beats a wrong specific.",
      }),
      condition: enumSlot({
        default: "Rainy",
        options: ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Snow"] as const,
        guide:
          "Typical weather for that city at this time of year. Must be one of the listed values exactly — each one draws its own icon.",
      }),
      /**
       * Which scale the card DISPLAYS. Not the scale the numbers below are written in.
       *
       * The three temperatures are always Celsius; `weatherInDisplayScale` converts them
       * when this says F. That split is deliberate. This used to name the scale the model
       * had also written the numbers in, with the guides asking it to keep four fields in
       * step, and it drifted — Newark, Ohio arrived at 18° with a high of 23, a Celsius
       * forecast on a Fahrenheit city, and the card shows no unit letter to give it away.
       *
       * Now the model answers one question it is reliable on, is this city in the United
       * States, and does no arithmetic. The numbers and the scale cannot disagree because
       * the same code produces both.
       */
      unit: enumSlot({
        default: "C",
        options: ["C", "F"] as const,
        guide:
          "Which scale this city's country uses. F if `city` is in the United States. C everywhere else in the world — including Canada, the UK, Ireland and Australia, which all use Celsius. Write the temperatures below in Celsius either way; the card converts.",
      }),
      temperature: text({
        default: "11",
        // Set at 64px; three glyphs is the most that fits beside the condition block.
        max: 3,
        guide:
          "The current temperature in CELSIUS, as a bare number — no degree sign, no unit, and no conversion even for a US city. Plausible for `city` in an average month, so roughly 0-35. The card converts to Fahrenheit itself when `unit` is F.",
      }),
      high: text({
        default: "14",
        max: 3,
        guide: "The day's high in CELSIUS, a bare number. Never converted here.",
      }),
      low: text({
        default: "9",
        max: 3,
        guide: "The day's low in CELSIUS, a bare number. Never converted here.",
      }),
    },

    podcast: {
      show: text({
        default: "The Leading Forward Podcast",
        max: 32,
        guide: "The name of this company's internal podcast.",
      }),
      episode: text({
        default: "#8 \u00b7 Navigating Modern Leadership",
        max: 40,
        guide:
          "An episode line: '#', a number, then a middle dot and the episode title.",
      }),
    },
  },

  /** The four Catch Me Up story cards, full-bleed on the phone at global 670-738. */
  stories: list({
    length: 4,
    defaults: [
      {
        title: "The Countdown Begins! \u23f1\ufe0f",
        body: "With just 19 days to go until our annual Employee Experience Summit, excitement is building across the organization. Teams from around the world are coming together to explore new ways of working, connect around a shared vision, and shape the future of the employee experience.",
      },
      {
        title: "Quarterly Pulse Survey - Reminder",
        body: "We'd love your feedback. Take a few minutes to share your thoughts and help shape future improvements across the organization. Your input helps us create a better employee experience for everyone.",
      },
      {
        title: "Manager Essentials Journey \u2013 1 Step Remaining \ud83d\ude80",
        body: "You're almost there. Complete the final step in your learning journey to unlock practical guidance, resources, and next steps designed to help you succeed.",
      },
      {
        title: "Accelerating AI Across the Business \u26a1",
        body: "AI is transforming how we work, helping teams find information faster, automate routine tasks, and make more informed decisions as adoption grows across all hubs.",
      },
    ],
    of: {
      title: text({
        default: "The Countdown Begins!",
        // Two lines on the phone at 2.25x; an emoji costs roughly two characters.
        max: 48,
        guide: "The story's headline. May end in a single emoji.",
      }),
      body: text({
        default:
          "With just 19 days to go until our annual Employee Experience Summit, excitement is building across the organization.",
        max: 280,
        guide:
          // "One paragraph" reads as 250-550 characters to a model; the cap is 280 and the
          // demo's own example fills 277 of it, so the worked example teaches filling the
          // box exactly and any variance overruns.
          //
          // The budget is given in WORDS. A model hits a word count far more reliably than a
          // character count — it cannot see characters — and forty words is about 240
          // characters, which leaves real headroom under 280.
          "One short paragraph, about forty words. Plain, warm, internal-comms voice - never a sales pitch.",
      }),
    },
    guide:
      "Four catch-up stories for someone back from leave: something coming up, a survey reminder, a learning nudge, and a business-wide change. Keep them in that order.",
  }),

  /** The two feed cards behind the Catch Me Up banner, global 632-670. */
  catchup: list({
    length: 2,
    defaults: [
      { title: "Volunteering Day Brought 400 Colleagues Together" },
      { title: "Inside the New Learning Centre" },
    ],
    of: {
      title: text({
        default: "Inside the New Learning Centre",
        max: 54,
        guide: "A feed headline, two lines on the phone.",
      }),
    },
    guide: "Two more recent stories, different from the four story cards.",
  }),

  /**
   * The shout-out the composer writes and publishes, global 950-1100.
   *
   * The main character is the AUTHOR of this post — the film shows them typing it — so
   * the person being thanked has to be somebody else. Both slots say so, because the
   * model is separately told the film is addressed to the main character and will
   * otherwise thank them by name in a post they are writing themselves.
   */
  composed: {
    recipient: text({
      default: "Lisa Doyle",
      max: 24,
      guide:
        "The full name of the colleague being thanked. A plausible name for this company's workforce - not a real named executive, and NEVER the main character the film is addressed to: they are the one writing this post, so thanking them by name is nonsense.",
    }),
    /**
     * The four rows of the Select Value picker, global ~1003-1031.
     *
     * A real company's values are the most recognisable internal language it has, and a
     * demo showing Workvivo's own placeholder values to a customer is the single most
     * obviously-generic frame in the cut. The research step is asked to quote them
     * verbatim from the company's own pages.
     *
     * The picker's ICONS are not here — each row keeps the artwork the scene ships with,
     * swappable from the review panel through `value.disc.N`. A value is a phrase; the
     * disc behind it is a picture, and the model has no business choosing pictures.
     */
    values: list({
      length: 4,
      defaults: [
        "Care Deeply",
        "Aim High",
        "Work Hard, Play Hard",
        "Be Yourself",
      ],
      of: text({
        default: "Care Deeply",
        // The row's text column is 402px at 19px bold — about 38 glyphs. 30 leaves room
        // for the longest real values ("Customer Obsession", "Do the Right Thing")
        // without letting a sentence-length one through.
        max: 30,
        guide:
          "One organisation value, worded exactly as the company words it. Title case, no trailing punctuation.",
      }),
      guide:
        "This company's four REAL stated values, quoted from its own careers, about or culture pages. Do not translate, expand or improve them - a value is recognisable to its own staff only in its own wording. If research found fewer than four, keep the ones you found and write plainly-worded generic ones for the rest rather than inventing company-specific-sounding ones. If it found none, use plain workplace values.",
    }),
    value: text({
      default: "Care Deeply",
      max: 30,
      guide:
        "The value this shout-out is tagged with. MUST be exactly one of the four in `composed.values`, copied character for character - it is shown on the published post and the viewer has just watched it being picked from that list.",
    }),
    body: text({
      default:
        "Thank you, Lisa Doyle, for leading our latest wellbeing initiative. Your work continues to support a positive and healthy employee experience across the organization \ud83d\udc9c",
      max: 190,
      guide:
        "The shout-out post, written BY the main character ABOUT a colleague. Opens 'Thank you, <recipient>,' - the name must match the recipient field exactly, because it is highlighted in the UI. The main character's own name must not appear anywhere in it. Ends with one emoji.",
    }),
  },

  person: {
    /**
     * Operator-supplied rather than written, but declared here so one merge covers the
     * whole script and one type describes it.
     */
    name: text({
      default: "Daniel Ek",
      // Sidebar identity block is 190px at 15px type.
      max: 26,
      guide: "The main character's full name, as it would appear in their profile.",
    }),
    title: text({
      default: "CEO",
      max: 34,
      guide: "Their job title, as their own company writes it.",
    }),
  },

  /**
   * The Spaces run, global 1468-1677: the directory, the Space page it opens, and the
   * phone's Spotlight tab.
   *
   * The three cards in the directory's Trending rail are `feed.spaces`, not new slots,
   * and the Spotlight's own Spaces carousel is the same three again. That is deliberate
   * and matches how the homepage and the in-app screen already share them: an operator
   * who renames a space means to have renamed the space, not to have renamed it on one
   * screen out of four.
   */
  spaces: {
    /** The tenant banner across the top of the directory. */
    welcome: {
      title: text({
        default: "The Development Den",
        // 27px bold in a 470px panel, one line.
        max: 30,
        guide:
          "The name of a flagship internal space this company would run — a learning, development or community hub. Title case, no full stop.",
      }),
      body: text({
        default:
          "Welcome to your Development Den. Here you'll find information on our mentor program, tools & resources, and support.",
        // Three lines in the same panel at 15px.
        max: 140,
        guide:
          // Two sentences inside 140 characters is tighter than "two sentences" suggests on
          // its own. Budgeted in words rather than characters — a model cannot count
          // characters, and twenty words is about 120, which leaves headroom under 140.
          "Two short sentences, twenty words in total, welcoming staff to that space and saying what is in it. Names the space in its first sentence.",
      }),
    },

    /**
     * The ten cards under "My Spaces" — six in the grid, then four across the wide row.
     *
     * Order matters: the fifth is the one the cursor clicks at global 1545, and the
     * Space page that opens takes its title from that entry rather than repeating it.
     * Keep the summit or flagship event there.
     */
    /*
     * No `members` field: every count in the film is derived from `companySize` — see
     * memberCounts.ts. Asking for one number per space produced a set that never agreed
     * with itself or with the company it was describing.
     */
    directory: list({
      length: 10,
      defaults: [
        {
          name: "Leadership Corner",
          description:
            "Leadership communications, AMAs, strategy updates, and All Hands content.",
        },
        {
          name: "Managers Network",
          description: "Guidance, resources, and discussions for people leaders.",
        },
        {
          name: "Learning Hub",
          description:
            "Training resources, workshops, certifications, and career development.",
        },
        {
          name: "Human Resources",
          description:
            "Your destination for benefits, policies, career development, performance resources, and employee support.",
        },
        {
          name: "Annual Employee Summit",
          description:
            "Everything you need to know, including agendas, speakers, key updates, and event resources.",
        },
        {
          name: "Customer Success Stories",
          description: "Customer wins, case studies, and business impact stories.",
        },
        {
          name: "IT Support & Resources",
          description: "Help desk guidance, service status, and how-to resources.",
        },
        {
          name: "Sales Enablement",
          description:
            "Playbooks, competitive intel, and deal support for revenue teams.",
        },
        {
          name: "Run Club",
          description:
            "Routes, race sign-ups, and training plans for runners of every pace.",
        },
        {
          name: "Wellbeing",
          description:
            "Mental health support, benefits, and everyday wellbeing resources.",
        },
      ],
      of: {
        name: text({
          default: "Leadership Corner",
          // 312px card at 19px bold, one line before it clips.
          max: 30,
          guide: "The name of an internal space. Title case, no full stop.",
        }),
        description: text({
          default:
            "Leadership communications, AMAs, strategy updates, and All Hands content.",
          // Three lines in the 312px card.
          max: 110,
          guide:
            "One line on what the space is for. A list of the things in it, or one short sentence. Ends in a full stop.",
        }),
      },
      guide:
        "Ten internal spaces this company would really run. Keep the shape of the baseline set: leadership, people leaders, learning, HR, a flagship annual event, customer stories, IT, a revenue-team space, a social club and wellbeing. Make the middle six specific to this industry; the fifth is the one the film clicks into, so it must be an event or summit.",
    }),

    /** The Space page the fifth card opens, global 1549-1639. */
    page: {
      about: text({
        default:
          "Welcome to the home of this year's Annual Employee Summit. Find everything you need before the event, including the agenda, travel information, speaker updates, FAQs, livestream details, and event resources.",
        // The ABOUT card gives it six lines in a 238px column at 14px.
        max: 260,
        multiline: true,
        guide:
          "The About text for the space the film clicks into — the fifth entry of `spaces.directory`. Two sentences: what the space is, then what people will find in it.",
      }),
      survey: {
        title: text({
          default: "Employee Summit Travel Survey",
          max: 34,
          guide:
            "The name of a survey running in this space. Names the event it belongs to.",
        }),
        meta: text({
          default: "6 Questions, Not Anonymous",
          max: 30,
          guide:
            "A question count and an anonymity note, in the form 'N Questions, Not Anonymous'.",
        }),
      },
      post: {
        author: text({
          default: "Alex Morgan",
          max: 24,
          guide:
            "The colleague who posted the shout-out on this space. Not the main character, and not the same name as `composed.recipient`.",
        }),
        body: text({
          default:
            "\u{1F44F} A huge thank you to our Employee Summit organizing committee for the incredible work that's gone into planning this year's event. Months of preparation happen behind the scenes to bring colleagues together, and we truly appreciate everyone's dedication. We can't wait to see it all come to life!",
          // Five lines in the 568px feed column at 16px.
          max: 330,
          guide:
            "A shout-out thanking the team behind the event this space is for. Opens with a clapping emoji. Written by a colleague, not by comms.",
        }),
        credit: text({
          default: "Employee Summit Team",
          max: 28,
          guide:
            "The group named in the 'Hooray to:' chip — the team the shout-out thanks.",
        }),
      },
      featured: {
        story: text({
          default: "Employee Summit Agenda Now Live",
          // Two lines in the 269px right rail at 18px.
          max: 36,
          guide:
            "The Featured Story headline on this space. Title case, no full stop.",
        }),
        page: text({
          default: "Travel Information",
          max: 28,
          guide: "The Featured Page name on this space. Title case.",
        }),
        podcast: text({
          default: "First Time at the Summit?",
          max: 30,
          guide:
            "The Featured Podcast title on this space. May be a question.",
        }),
      },
    },
  },

  /**
   * The phone's Spotlight tab, global 1630-1677.
   *
   * Its Featured News hero and first two cards are `feed.mobileNews`, and its Spaces
   * carousel is `feed.spaces` — only the two extra news cards, the quick links, the
   * documents and the event are new here.
   */
  spotlight: {
    journey: text({
      default: "New Hire Onboarding \u{1F44B}",
      // The hero's journey strip is 250px at 15px bold.
      max: 28,
      guide:
        "The name of a Journey running on the phone's home screen. Ends with a single emoji.",
    }),
    /** The three vendor tiles at the top of Quick Links. */
    /**
     * The three Quick Links tile labels — and NOT researched copy, which is the whole
     * point of them being `asset` slots: an asset is absent from the JSON schema, so the
     * model cannot write one.
     *
     * They were text slots with a guide asking for "three tools this company's employees
     * would open every day", and the model answered it well — Kronos, Microsoft Teams. But
     * the MARK beside each label is a separate icon slot the model has no say in, so a
     * researched name landed under whatever logo the tile shipped with: ServiceNow's mark
     * labelled Kronos, Zoom's labelled Microsoft Teams. A label is only ever right if it
     * came from the icon next to it.
     *
     * So these defaults name the three default marks, and the only thing that changes them
     * is picking or uploading an icon — which sets both together, from the file's own name.
     * See `assignIcon` in web/Reveal.tsx.
     */
    apps: list({
      length: 3,
      defaults: ["Workday", "ServiceNow", "Zoom"],
      of: asset({
        default: "Workday",
        guide: "Set from the icon beside it, never written.",
      }),
      guide:
        "The three Quick Links tile labels. Each is the name of the mark next to it and is set from that icon's filename, so it is not researched.",
    }),
    quickLinks: list({
      length: 4,
      defaults: ["Payroll", "Benefits Hub", "IT Support", "Learning Centre"],
      of: text({
        default: "Payroll",
        // Two per row in a 375pt phone, 15px type.
        max: 20,
        guide: "The name of an internal service staff look up. Title case.",
      }),
      guide:
        "Four internal services on the phone's Quick Links: pay, benefits, technical help and learning. Word them the way this company would.",
    }),
    documents: list({
      length: 4,
      defaults: [
        "Safety Procedures",
        "Employee Handbook",
        "Learning Resources",
        "Policies",
      ],
      of: text({
        default: "Safety Procedures",
        max: 24,
        guide: "The name of a document staff would open. Title case.",
      }),
      guide:
        "Four documents this company's staff actually need — one of them specific to the work its frontline people do.",
    }),
    /**
     * The last two Featured News cards. The hero and the two above these are
     * `feed.mobileNews`, which is why this list is two long rather than five.
     */
    news: list({
      length: 2,
      defaults: [
        { title: "Employee Spotlight" },
        { title: "Continuous Learning" },
      ],
      of: {
        title: text({
          default: "Employee Spotlight",
          max: 34,
          guide: "A short article headline on the phone. Title case.",
        }),
      },
      guide:
        "Two more phone headlines, different from `feed.mobileNews` and from `feed.news`.",
    }),
    event: {
      title: text({
        default: "Employee Summit",
        max: 26,
        guide:
          "The upcoming event on the phone. Should be the same event as the fifth entry of `spaces.directory`.",
      }),
      when: text({
        default: "Wednesday 13th August 2026,\n5:00pm - 8:30pm",
        // Two fixed lines under the title at 12px.
        max: 46,
        multiline: true,
        guide:
          "The event's date on one line and its time range on the next, separated by a newline. Keep the trailing comma on the date line.",
      }),
    },
  },

  /**
   * The Journeys run, global 1677-1825: the builder's phone preview, then the wall of
   * nine journey cards the match cut lands in.
   *
   * The step PALETTE either side of the phone ("Share a Message", "Enroll to a Space")
   * is Workvivo's own feature list, not this company's, so it is absent from here on
   * purpose — the same rule that keeps "Featured News" and the nav labels out.
   */
  journeys: {
    /** The journey on the phone preview, and the hero of the wall. */
    phone: {
      title: text({
        default: "New Hire Onboarding \u{1F44B}",
        // 393pt screen, 21px bold, one line.
        max: 28,
        guide:
          "The name of this company's onboarding journey. Ends with a single emoji. Should match the second entry of `journeys.wall`, which is the card the match cut lands on.",
      }),
      blurb: text({
        default:
          "Onboarding is a structured process designed to help new employees integrate into the company, understand their roles.",
        // Three lines under the title at 13px.
        max: 140,
        guide:
          // Measured top offender after the `quote` cascade was fixed: 170-182 against a 140
        // cap in consecutive runs. "One sentence" is not a length to a model — its sentences
        // run 90-180 characters — so the sentence gets a word budget.
        "One sentence of under twenty words on what the journey does for a new starter. Reads like product copy written by HR, and may end mid-thought as the baseline does.",
      }),
      /**
       * The six steps down the phone, in order: three on Day 1 (which tick during the
       * shot), two on Day 2, one on Day 30. The grey sub-line under each ("A message has
       * been shared with you") is Workvivo's own wording for what kind of step it is, so
       * only the titles are here.
       */
      steps: list({
        length: 6,
        defaults: [
          "Welcome to the Company \u{1F680}",
          "New Hires Space",
          "Onboarding Overview",
          "Getting Started",
          "Company Values",
          "Onboarding Survey",
        ],
        of: text({
          default: "Welcome to the Company \u{1F680}",
          // 393pt screen, 15px semibold, one line before it clips.
          max: 30,
          guide:
            "One step of an onboarding journey. Title case. Only the first may carry an emoji.",
        }),
        guide:
          "Six onboarding steps in the order a new starter meets them: a welcome message, a space to join, an overview page, a getting-started article, the company's values, and a survey at thirty days. Keep that order and that shape — the first three tick on screen and the rest are padlocked.",
      }),
    },

    /**
     * The nine cards on the wall, in reading order.
     *
     * The SECOND one is the hero: it is what the match cut lands on and the card the
     * other eight assemble around, so it must be the onboarding journey named in
     * `journeys.phone.title`.
     */
    wall: list({
      length: 9,
      defaults: [
        "IT & Security Training",
        "New Hire Onboarding",
        "Relocation Guidelines",
        "AI Adoption Program",
        "Our Culture in Action",
        "Parental Leave Policy",
        "Leadership Training",
        "Continuous Learning",
        "Sustainability at Work",
      ],
      of: text({
        default: "IT & Security Training",
        // The card's title column is 234px at 19.77px and does not wrap — `white-space:
        // nowrap`, so anything longer runs out of the card rather than onto a second line.
        max: 24,
        guide:
          "The name of a Journey — a guided sequence of steps an employee is walked through. Title case, no full stop, no emoji.",
      }),
      guide:
        "Nine journeys this company would really run. The SECOND must be the onboarding one named in `journeys.phone.title`, without its emoji. Keep the spread of the baseline set — compliance, onboarding, moving, a technology programme, culture, a leave policy, leadership, learning and sustainability — but word each one the way this company would, and make at least two specific to its industry.",
    }),
  },

  /**
   * Workvivo Billboards on a wall-mounted screen, global 1813-1978.
   *
   * The most public screen in the film — it is what a visitor to the building sees — so
   * it is also the one where a leftover reference to another company reads worst. The
   * baseline is a real Spotify board, Stockholm and all.
   */
  signage: {
    /**
     * The city on the clock-and-weather strip.
     *
     * Separate from `feed.weather.city` on purpose: this is where the SCREEN is, and a
     * screen on a warehouse wall is not the head office. It is usually the same place
     * though, which is what the guide says.
     */
    /**
     * The translation line above the FIRST story's body, and only that one.
     *
     * All three stories used to carry this row — the second and third filled it with a
     * team name, which made a translation affordance look like a byline. It belongs to
     * the one post that is actually translated, so it is a single field here rather than
     * a per-story one, and the other two rows are simply not drawn.
     */
    translatedFrom: text({
      default: "Translated from Swedish",
      // One line at 17px above the body.
      max: 30,
      guide:
        "'Translated from <language>', naming a language this company really works in other than English.",
    }),

    // No `location`. The screen prints its city beside a forecast, and the two were
    // separate slots — so the model could research one city for the weather card and a
    // different one for the sign, and the strip read "London | 64 F" with an Ohio
    // forecast behind it. It draws `feed.weather.city` now: one place, researched once.

    /**
     * One reaction emoji on the middle story, at global ~1913.
     *
     * The other eight reactions on this board are deliberately generic — party popper,
     * clap, rocket, heart, sparkles, fire — because they read as "people reacted" for any
     * company. This one is the opposite: it is the single place the board says what the
     * company actually MAKES, and the baseline's musical note is a Spotify joke that reads
     * as nothing anywhere else.
     *
     * A slot rather than a lookup, because the mapping from "what does this company do" to
     * "which emoji" is exactly the judgement a language model has and a table does not.
     */
    reactionEmoji: text({
      // The baseline is Spotify, so the baseline emoji is a musical note.
      default: "\u{1F3B5}",
      // Room for one emoji including a variation selector or a two-codepoint sequence;
      // the cap is what stops a model returning "🍩 donut" and breaking the row.
      max: 4,
      guide:
        "EXACTLY ONE emoji and nothing else — no words, no count, no spaces. It should say what this company makes or does, the way a doughnut is Dunkin' or a tractor is John Deere: pick the object a customer would picture. If nothing obvious fits the industry, use a generic positive reaction rather than something wrong.",
    }),
    /**
     * The three stories the board swipes through, at local 30 and 103.
     *
     * Reaction and comment counts are fixed: they are the same numbers for every tenant
     * and nobody reads them as being about the company.
     */
    stories: list({
      length: 3,
      defaults: [
        {
          author: "Daniel Ek",
          action: "posted a company update",
          scope: "Global",
          headline: "Another great milestone for the team! \u{1F44F}",
          body: "Huge thanks to everyone across our global teams who collaborated to deliver this milestone. Your creativity, focus, and passion for music and creators made all the difference. Proud of what we've built together and excited for what's ahead!",
          value: "Passionate & Innovative",
        },
        {
          author: "Megan Wilson",
          action: "shared a workplace update",
          scope: "Stockholm HQ",
          headline: "Stockholm Creative Studios are officially open! \u{1F3A7}",
          body: "Designed specifically for hybrid squads, creator partnerships, and live audio recording sessions. Check out the space booking tool in Workvivo to reserve listening rooms, podcast suites, and creative pods.",
          value: "Collaborative & Playful",
        },
        {
          author: "Arjun Sharma",
          action: "posted a product release",
          scope: "Creator Squad",
          headline: "Spotify for Artists: In Focus launched worldwide \u{1F680}",
          body: "Empowering millions of independent musicians and creators with next-generation analytics, real-time audience insights, and direct fan monetization tools. Huge cross-functional milestone!",
          value: "Growth & Impact",
        },
      ],
      of: {
        author: text({
          default: "Daniel Ek",
          max: 24,
          guide:
            "The full name of whoever posted the story. The FIRST one is never shown — the screen draws the main character's name there instead — so write any plausible colleague's name for it rather than a pronoun or a placeholder. The other two are shown, and must be different people from each other and from `composed.recipient`.",
        }),
        action: text({
          default: "posted a company update",
          // Runs on one line after the bolded name, 20px, in a 610px column.
          max: 30,
          guide:
            "What they did, lower case, continuing the sentence after their name: 'posted a company update'.",
        }),
        scope: text({
          default: "Global",
          max: 20,
          guide:
            "Who the post went to — 'Global', a named site, or a team. Sites must be places this company really operates.",
        }),
        headline: text({
          default: "Another great milestone for the team! \u{1F44F}",
          // Bold opening line, 22px, two lines in the 610px column.
          max: 56,
          guide:
            "The story's opening line, ending in a single emoji. A real thing that happened at this company.",
        }),
        body: text({
          default:
            "Huge thanks to everyone across our global teams who collaborated to deliver this milestone. Your creativity, focus, and passion for music and creators made all the difference. Proud of what we've built together and excited for what's ahead!",
          // Six lines at 19px before it overruns the card.
          max: 260,
          guide:
            // Two is the target, three the ceiling — phrased that way round because "two or
            // three" is read as three, and three sentences do not fit 260 characters
            // comfortably.
            "The body of the story: two short sentences, three only if they are short. Internal-comms voice. No invented figures.",
        }),
        value: text({
          default: "Passionate & Innovative",
          max: 28,
          guide:
            "The company value the post is tagged with. Prefer one of `composed.values`, worded as the company words it.",
        }),
      },
      guide:
        "Three stories running on a screen in this company's building: a leadership update about a milestone, a workplace or facilities announcement tied to a real site, and a product, service or operational launch. They must be plausible for this company specifically.",
    }),
    article: {
      title: text({
        default: "Spotify for Artists: In Focus",
        // 459px card at 20px, two lines.
        max: 40,
        guide: "The headline on the Article card. Title case.",
      }),
      author: text({
        default: "Megan Wilson",
        max: 22,
        guide: "Who wrote the article, in the byline under it.",
      }),
    },
    event: {
      title: text({
        default: "Global All-Hands & Kickoff",
        max: 34,
        guide: "The name of the event on the board. Title case.",
      }),
    },
    anniversary: {
      name: text({
        default: "Karlos Washington",
        max: 24,
        guide:
          "A colleague celebrating a work anniversary. Not the main character, and not a name used anywhere else in the film.",
      }),
      note: text({
        default: "is celebrating 2 years of service today!",
        // Two lines in the 250px side column at 15px.
        max: 46,
        guide:
          "The rest of the sentence after their name, starting lower case: 'is celebrating N years of service today!'",
      }),
    },
    /**
     * The one field in the whole table that is allowed to look like a URL — it is
     * printed under "Find out more" beside a QR block, so anything else would read as a
     * mistake. The instructions carry an explicit exception for it.
     */
    link: text({
      default: "https://spotify.link/all-hands-stream",
      // 250px column at 13px, one line.
      max: 40,
      guide:
        "A short internal link for the event, in the form 'https://<company>.link/<slug>' using this company's own name. This is the ONE field where a URL is wanted.",
    }),
  },

  /**
   * The Newsletters index, global 1978-2058.
   *
   * The BUILDER that follows it (2058-2100) has no slots at all and is not an oversight:
   * every word on it is either a palette label ("Full Width", "Divider") or the lorem
   * placeholder the real product ships in an empty template. There is nothing on that
   * screen about a company.
   */
  newsletters: {
    /**
     * The four cards in Recent Newsletters. Their dates and Sent/Scheduled badges are
     * fixed — the same on every tenant's screen, and nobody reads them as being about
     * the company.
     */
    items: list({
      length: 4,
      defaults: [
        { title: "All Hands", folder: "All Hands" },
        { title: "Latest Updates", folder: "Updates" },
        { title: "Friday Wrap", folder: "Reports" },
        { title: "New Pups on the Block", folder: "Woofvivo" },
      ],
      of: {
        title: text({
          default: "All Hands",
          // 300px card at 22px bold, one line over the cover photo.
          max: 26,
          guide: "The name of a recurring internal newsletter. Title case.",
        }),
        folder: text({
          default: "All Hands",
          max: 18,
          guide:
            "Which folder it files into. MUST be one of `newsletters.folders`, spelled the same. All FOUR newsletters must file into four DIFFERENT folders — the screen shows the folder under each card and four identical chips reads as a bug.",
        }),
      },
      guide:
        "Four newsletters this company would really send: a company-wide one, a product or operations update, a light end-of-week one, and one that is obviously for fun. The fourth is the joke card in the reference — keep it playful and keep it filed in the playful folder.",
    }),
    folders: list({
      length: 5,
      defaults: ["All Hands", "Updates", "Woofvivo", "Reports", "News"],
      of: text({
        default: "All Hands",
        // Chip at 14px; the row holds five before it wraps.
        max: 16,
        guide: "A newsletter folder name. Title case, one or two words.",
      }),
      guide:
        "Five folders the newsletters file into. Every value used in `newsletters.items[].folder` must appear here.",
    }),
  },

  /**
   * The two phones, global 2100-2236: a Team Chat thread beside a video call, then the
   * Catch Me Up card the thread's Summarize button opens.
   */
  chat: {
    channel: text({
      default: "New York Office \u{1F44B}",
      // Chat header at 13px bold, one line on a 393pt phone.
      max: 24,
      guide:
        "The name of a busy Team Chat channel — usually a site or an office this company really has. Ends with a single emoji.",
    }),
    channelMeta: text({
      default: "# 723 · Welcome to the New…",
      max: 30,
      guide:
        "The channel's member count and topic, in the form '# <count> · <topic>…' — the topic is cut off mid-phrase.",
    }),
    /**
     * The thread, in the order it is read. The first, fourth and fifth are the main
     * character's own outgoing bubbles; the second and third are colleagues, and the
     * last arrives on screen at global 2125.
     */
    messages: list({
      length: 5,
      defaults: [
        "Good morning! How are you today?",
        "Hey everyone, here's some pics of our recent company offsite \u{1F60A}",
        "Love it!",
        "thanks for organising \u{1F44F}",
        "Thanks! Can you share any of the event resources? \u{1F60E}",
      ],
      of: text({
        default: "Good morning! How are you today?",
        // Bubbles wrap to three lines at 13px on a 393pt phone.
        max: 70,
        guide:
          "One chat message. Written the way colleagues actually type — short, lower-case where natural, at most one emoji.",
      }),
      guide:
        "A five-message thread about photos from a recent company get-together: a greeting, the colleague sharing the pictures, two short replies, and a follow-up asking for the resources. Keep that order.",
    }),
    senders: list({
      length: 2,
      defaults: ["Kate Banks", "Marley Williams"],
      of: text({
        default: "Kate Banks",
        max: 22,
        guide:
          "A colleague's full name, shown above their message. Not the main character.",
      }),
      guide:
        "Two colleagues in the thread — the one sharing the photos and the one asking the follow-up.",
    }),
    caller: text({
      default: "May Smith",
      // Sits before the call timer on one line at 13px.
      max: 20,
      guide: "Who the main character is on a video call with. Not the main character.",
    }),
    /** The AI summary the Summarize button opens, global 2190-2236. */
    summary: text({
      default:
        "A team offsite was hosted to focus on collaboration, connection, and shared goals, with employees taking part in workshops designed to strengthen communication and align on key priorities. Venue logistics, meeting spaces, and activities were coordinated to create a smooth experience for all attendees, with teams supporting schedules and on-site requirements throughout the event. A preview was shared about future initiatives, with further details planned to be announced in the coming weeks.",
      // The card is 0.317 x 0.548 of the frame at 21px/30px leading: about 470 characters
      // before the body runs past its bottom edge.
      max: 470,
      guide:
        "An AI summary of the chat thread, in three sentences: what the event was and what people did, how it was organised, and what was said about what comes next. Flat, factual, third person — this is a machine summarising, not a person writing.",
    }),
  },

  /**
   * The HQ Agent run, global 2268-2499: the ask bar types a question, enterprise search
   * answers it, then the agent takes the action in chat.
   *
   * Only the middle of that run is customisable. The question typed at 2268 and the whole
   * chat at 2392-2499 are fixed beats — `FIXED_COPY.hqQuery` and `FIXED_COPY.hqChat` —
   * so what is left here is the search result between them: the answer, the two indexed
   * documents, the attachment and who published it. Those are written against the fixed
   * question, quoted literally in the guides below rather than referenced as a slot,
   * because the model can no longer see it in the schema.
   *
   * The vendor names on it — Workday, ServiceNow, SharePoint, Google Drive, Zoom — are
   * NOT slots. They are drawn from a fixed set of real vendor marks, and a name with no
   * artwork behind it would render as a blank tile (guide §4: enum in, lookup out).
   */
  hq: {
    answer: {
      title: text({
        default: "Time Off Request",
        max: 26,
        guide: "The agent's answer heading. Title case, no full stop.",
      }),
      body: text({
        default:
          "You can book a day off in two ways — ask the HQ Agent to handle it for you automatically, or do it yourself directly in Workday.",
        // Two lines in the 560px results column at 14px.
        max: 150,
        guide:
          "The agent's answer to the fixed question 'What is our time off policy?', in one sentence offering two routes. One of them must be booking it in the HR system the chat later books through — Workday in the baseline; name whichever system this company actually uses.",
      }),
    },
    /**
     * The two indexed documents under the answer. The second is clipped by the modal's
     * bottom edge in the shot, as the reference has it.
     */
    results: list({
      length: 2,
      defaults: [
        {
          title: "Time Off & Leave Policy",
          space: "HR Resources",
          description:
            "Covers all leave types available to employees — annual leave, sick leave, public holidays, and special leave — including entitlements, notice requirements, and approval workflows.",
        },
        {
          title: "How to Request Time Off in Workday",
          space: "New Hires",
          description:
            "Step-by-step walkthrough of submitting, editing and cancelling a time off request in Workday, including who approves it and how far ahead to book.",
        },
      ],
      of: {
        title: text({
          default: "Time Off & Leave Policy",
          // One line at 15px in the 560px column.
          max: 44,
          guide:
            "The title of a document or page that answers the fixed question 'What is our time off policy?'. Title case.",
        }),
        space: text({
          default: "HR Resources",
          max: 22,
          guide: "Which space the result lives in. Title case.",
        }),
        description: text({
          default:
            "Covers all leave types available to employees — annual leave, sick leave, public holidays, and special leave — including entitlements, notice requirements, and approval workflows.",
          // Three lines at 13px before the card clips.
          max: 200,
          guide:
            "What the document covers, in one sentence. Written the way an intranet summarises itself.",
        }),
      },
      guide:
        "Two search results for the fixed question 'What is our time off policy?': a formal policy document and a how-to page. The second must reference the same system named in `hq.answer.body`.",
    }),
    attachment: text({
      default: "Time_Off_and_Leave_Policy.pdf",
      max: 36,
      guide:
        "The attached file's name — the first result's title in Snake_Case, ending '.pdf'.",
    }),
    resultAuthor: text({
      default: "Maria Miller",
      max: 22,
      guide:
        "Who published the second search result. Not the main character.",
    }),
  },

  /**
   * The article page, global 3264-3326.
   *
   * The page runs off the bottom of the frame on purpose, so only the banner, the AI
   * Summary bar and the first three blocks are ever read. Everything below the quote is
   * still declared, because the scene animates the page upward and a blank paragraph
   * would be visible on its way past.
   */
  article: {
    title: text({
      default: "Team Productivity",
      // 920px banner at 44px bold, one line over the photo.
      max: 32,
      guide: "The article's title. Title case, no full stop.",
    }),
    language: text({
      default: "English",
      max: 16,
      guide:
        "The language the article is being read in, in that language's own English name.",
    }),
    lead: text({
      default:
        "Improving team productivity starts with creating an environment where people can work efficiently, communicate clearly, and stay focused on shared goals.",
      // Two lines in the 920px column at 18px.
      max: 180,
      guide:
        "The article's opening sentence — what the piece is about, stated plainly.",
    }),
    heading: text({
      default: "Key Focus Areas for Alignment",
      max: 34,
      guide: "The article's one subheading. Title case.",
    }),
    /** The three bullets under that heading. Each is a bolded label and a sentence. */
    points: list({
      length: 3,
      defaults: [
        {
          label: "Clear Direction",
          body: "Ensure everyone understands team goals, individual ownership, and measurable outcomes.",
        },
        {
          label: "Open Communication",
          body: "Foster regular check-ins and cross-functional visibility to eliminate roadblocks.",
        },
        {
          label: "Smart Prioritization",
          body: "Focus high-impact effort on strategic priorities while minimizing unnecessary friction.",
        },
      ],
      of: {
        label: text({
          default: "Clear Direction",
          // Bolded, runs inline before the body on the same line.
          max: 24,
          guide: "Two words naming the point. Title case, no colon — the UI adds it.",
        }),
        body: text({
          default:
            "Ensure everyone understands team goals, individual ownership, and measurable outcomes.",
          // One line at 17px after the label.
          max: 110,
          guide: "One sentence on what that point means in practice. Imperative mood.",
        }),
      },
      guide:
        "Three focus areas that follow from `article.heading`, written for how this company actually works.",
    }),
    quote: text({
      default:
        "Empowering teams with clear priorities and connected communication transforms everyday collaboration into meaningful impact.",
      // Pull quote, 22px italic across the 920px column, three lines.
      max: 150,
      guide:
        "A pull quote from the article. One sentence, no attribution inside it — the byline below carries that.",
    }),
    quoteAuthor: text({
      default: "Workplace Experience Team",
      max: 30,
      guide: "The team the quote is attributed to. Title case.",
    }),
    closing: text({
      default:
        "By breaking larger objectives into clear, actionable steps, teams build momentum faster with clarity and shared purpose.",
      max: 150,
      guide: "The closing sentence, restating the point without repeating `article.lead`.",
    }),
  },

  /**
   * Employee Insights, global 3571-3903: the survey on the phone, then the three tabs of
   * the Seer dashboard.
   *
   * Everything numeric on those screens — scores, response counts, NPS bands, the
   * heatmap — is fixed. Those are the shape of the product's own charts, and a model
   * writing plausible-looking numbers into a dashboard is exactly the kind of invented
   * specific the research pass is told never to produce.
   */
  seer: {
    /** The five statements the survey walks through on the phone. */
    questions: list({
      length: 5,
      defaults: [
        "I am provided with the necessary tools and resources I need to do my job",
        "My manager gives me regular, helpful feedback on my work",
        "I feel my contributions are recognized and valued by my team",
        "I have good opportunities for career growth and professional development",
        "I would recommend our organization as a great place to work",
      ],
      of: text({
        default:
          "I am provided with the necessary tools and resources I need to do my job",
        // Three lines on a 393pt phone at 17px.
        max: 90,
        guide:
          "One engagement-survey statement, written in the first person for the employee to agree or disagree with. No question mark — these are statements on a five-point scale.",
      }),
      guide:
        "Five engagement statements covering tools, management, recognition, growth and advocacy, in that order. At least one should name something specific about how this company's frontline staff work.",
    }),
    /**
     * The rows down the left of the Rater heatmap, global 3794-3843: one global row,
     * then locations, then departments.
     */
    segments: list({
      length: 9,
      defaults: [
        { name: "Global", kind: "All Segments" },
        { name: "Boston", kind: "Location" },
        { name: "London", kind: "Location" },
        { name: "CX", kind: "Department" },
        { name: "Human Resources", kind: "Department" },
        { name: "IT", kind: "Department" },
        { name: "Marketing", kind: "Department" },
        { name: "Product", kind: "Department" },
        { name: "Sales", kind: "Department" },
      ],
      of: {
        name: text({
          default: "Global",
          // 200px row head at 13px, one line.
          max: 22,
          guide: "A segment name — a place or a department.",
        }),
        kind: text({
          default: "All Segments",
          max: 16,
          guide:
            "What kind of segment it is: 'All Segments', 'Location' or 'Department'. Use only those three.",
        }),
      },
      guide:
        "Nine segments this company really breaks itself down by. The FIRST must stay 'Global' / 'All Segments'. Then two real locations it operates in, then six of its actual departments — a retailer's are not a bank's.",
    }),
    /** The Popular Topics rail on the Comments tab, global 3843-3903. */
    topics: list({
      length: 10,
      defaults: [
        "Team Collaboration",
        "Work Environment",
        "Employee Satisfaction",
        "Workplace Atmosphere",
        "Competitive Environment",
        "Employee Morale",
        "Performance Recognition",
        "Coworker Relationships",
        "Workplace Communication",
        "Team Dynamics",
      ],
      of: text({
        default: "Team Collaboration",
        // Chip at 13px; two words fit, three clip.
        max: 24,
        guide:
          "A theme the AI pulled out of open survey comments. Two words, title case.",
      }),
      guide:
        "Ten themes this company's employees would actually be writing about. Keep the order — the sentiment badges beside them are fixed, so the eighth is the one marked Very Negative and the first is Very Positive.",
    }),
    /** The three open comments beneath it. */
    comments: list({
      length: 3,
      defaults: [
        {
          driver: "Wellbeing",
          question: "I can effectively manage my work-life balance",
          body: "I try my best to manage my work-life balance, but it can be challenging at times.",
        },
        {
          driver: "Career Development",
          question: "I am given real opportunities to grow here",
          body: "I've received great training over the last quarter",
        },
        {
          driver: "Communication",
          question:
            "Team meetings and communication are frequent and of high quality",
          body: "We haven't had a team meeting in a while.",
        },
      ],
      of: {
        driver: text({
          default: "Wellbeing",
          max: 22,
          guide: "The engagement driver the comment was filed under. Title case.",
        }),
        question: text({
          default: "I can effectively manage my work-life balance",
          max: 70,
          guide:
            "The survey statement the comment answers, in the same first-person voice as `seer.questions`.",
        }),
        body: text({
          default:
            "I try my best to manage my work-life balance, but it can be challenging at times.",
          // Two lines in the 420px comment card at 14px.
          max: 100,
          guide:
            // Consistently 109 against a 100 cap. Real survey comments are short, so the word
        // budget matches the content note rather than fighting it.
        "What an employee actually typed, in fifteen words or fewer. Unpolished — a real comment, not a testimonial. The scores beside them are fixed at 7, 9 and 2, so the first should be lukewarm, the second positive and the third a complaint.",
        }),
      },
      guide:
        "Three open-text survey comments from this company's staff, on wellbeing, development and communication.",
    }),
  },

  /*
   * The "Your Voice Matters" space is NOT here — see `FIXED_COPY.voice`. Its copy is a
   * fixed beat of the film; only its photographs are per-customer.
   */
});

/**
 * The lines that are deliberately NOT slots.
 *
 * These are fixed beats of the film rather than copy about a customer: the opening claim
 * the whole cut is built to answer, its own four-word reply, and the question the Catch Me
 * Up sequence opens on. They are locked at the client's request, and locking them is done
 * by keeping them OUT of `COPY` — which means they are absent from the JSON schema the
 * model is decoded against, so it has no field to write them into. That is a structural
 * guarantee rather than a prompt instruction, and prompt instructions are the thing that
 * quietly stops holding.
 *
 * They live here, beside the table they are missing from, so there is one place that
 * answers "why isn't this customisable?" — and so nobody adds them back as slots without
 * first reading this.
 */
export const FIXED_COPY = {
  /** Global 33-90, over the headquarters cloud. */
  headquartersHeadline: "Every employee deserves a headquarters.",
  /**
   * Global 80-135, cut one word at a time onto the brand field — the answer to the
   * headline above, and locked for the same reason it is. This was a slot for a while:
   * four words, each capped at eight glyphs, with a guide spelling out that they had to
   * form one grammatical sentence replying to a fixed line. That is a hard brief, models
   * routinely returned fragments like "Now it feels like.", and a broken sentence in
   * 300px type is the most visible copy in the film. Fixed beat, not customer copy.
   */
  headquartersRevealWords: ["Now", "they", "have", "one."] as const,
  /**
   * Global 547-600, arriving beside the phone. Three lines because each is a stacked
   * line of 104px type, not a sentence that wraps.
   *
   * A slot until it was locked: it names the PRODUCT capability the shot is showing, not
   * anything about the customer, so rewriting it per tenant only ever moved it away from
   * what is on screen. Same reason the headquarters headline is fixed.
   */
  homeHeadlineLines: ["Personalized", "Homepage", "Experiences"] as const,
  /**
   * The three pills fanning out from behind the phone, global 1380-1477.
   *
   * A slot until it was locked, for the same reason as the line above: these are the
   * PRODUCT's feature names. "Smart Chapters" and "Summarize with AI" are things Workvivo
   * does — they are the same category as "Featured News" and "View All", which this table
   * has always kept out of research — and "LIVE REPLAY" is a status badge. Asking a model
   * for "three capability labels" only ever moved them away from what the shot is
   * demonstrating, and a renamed feature is wrong on screen in a way a renamed space is
   * not.
   *
   * All three move together: the scene reads them by index, and a list that is part
   * researched and part fixed is a trap for whoever edits it next.
   */
  livestreamPills: ["LIVE REPLAY", "Smart Chapters", "Summarize with AI"] as const,
  /**
   * The "Your Voice Matters" space and the post on it, global 4066-4253.
   *
   * Locked at the client's request: this run is the survey-results story, and it always
   * plays out on the same space with the same post and the same two comments. Rewriting
   * the space's name or its post per tenant only ever moved it away from the beat the
   * shot is showing, in the same way the livestream pills above did.
   *
   * Its PHOTOGRAPHS are still per-customer — `voice.banner.0`, `voice.doc.0` and the six
   * `voice.face.N` avatars are image positions and untouched by this. Fixing the words
   * and dealing the pictures is the whole point: the customer sees their own people on a
   * screen whose story stays the one that was approved.
   */
  voice: {
    space: {
      name: "Your Voice Matters",
      about: "A dedicated space to explore, discuss, and act on Employee Insights.",
    },
    post: {
      author: "Lee Johnson",
      space: "Manager Insights Action Hub",
      body:
        "We're sharing our latest insights and updates on the actions being taken based on the feedback we've received last week. This document highlights key themes, opportunities, and the steps we're taking to continue improving the employee experience.\nThank you to everyone who continues to share their perspectives! Your feedback helps guide meaningful change and shape the future of our organization \u{1F44F}",
      document: "The Complete Guide to our HR System",
    },
    comments: [
      { name: "Rachel Lopez", text: "Thanks for sharing!" },
      { name: "Lee Johnson", text: "Was waiting for this one" },
    ],
    featured: {
      headline: "A New Hire's Guide to Success",
      author: "Megan Wilson",
    },
    event: {
      title: "Management Enablement Session",
      location: "Conference Room B",
    },
  },
  /**
   * The HQ Agent's own words, global 2268-2499 — the question typed into the ask bar and
   * the whole conversation that follows it. Locked at the client's request: this run is
   * the product demo inside the film, and it has to show the same task being asked,
   * agreed, dated and confirmed every time. `hq.answer` and `hq.results` around it are
   * still slots, so the search result a company sees is theirs; the ask and the chat are
   * not, so the beat always plays out the same way.
   */
  /**
   * The feedback article, global 4110-4253 — the whole letter, top to bottom. Locked at
   * the client's request: this is Workvivo's own worked example of a company acting on
   * survey results, and it reads as the product's voice rather than the customer's. It
   * was four slots (title, standfirst, author, and two heading+body sections carrying
   * hand-set line breaks); it is now one constant.
   */
  feedbackArticle: {
    title: "We Hear You: Acting on Your Feedback",
    standfirst:
      "We share how listening to feedback helps us uncover insights,\ntake action, and create a better workplace experience.",
    author: "Jay Lee",
    sections: [
    {
      heading: "Why We Value Your Feedback",
      body: "Feedback is one of the most valuable assets an organization can have. It surfaces blind spots that\ninternal teams can't see, highlights friction points before they become crises, and signals what's\nworking well enough to double down on.\n\nWhen people feel heard, trust grows. When trust grows, engagement follows. And engaged\nemployees, customers, and partners are the foundation of any thriving organization.\n\nThe cost of ignoring feedback, on the other hand, is steep: turnover rises, loyalty erodes, and the\nsame problems resurface year after year.",
    },
    {
      heading: "Turning Feedback Into Action",
      body: "We believe feedback is only valuable when it leads to meaningful action. By listening closely to the\nexperiences, ideas, and perspectives shared with us, we gain a clearer understanding of what's\nworking well and where there are opportunities to improve.\n\nFeedback helps us identify areas for growth, remove barriers, and make informed decisions that\ncreate a better experience for everyone.\n\nTaking action on feedback shows that every voice matters. It helps strengthen trust, improve\ncommunication, and build a culture where people feel encouraged to share openly. By turning\ninsights into meaningful changes, we can continue to evolve, address challenges, and create a\nmore connected and engaged organization.",
    },
    ],
  } as const,
  hqQuery: "What is our time off policy?",
  hqChat: {
    question: "Can you book me a day off?",
    offer:
      "Sure! I will book the day off on Workday for you. What date would you like to book?",
    reply: "20th of February",
    confirmation:
      "Your day off request for February 20th has been successfully submitted to your manager for approval. You'll be notified once it's approved.",
    /** The left rail's recent prompts. Seven rows; the list scrolls past the frame. */
    history: [
      "Can you book me a day off?",
      "Brainstorm Meeting",
      "Write a short paragraph about today",
      "Product sync",
      "What meetings do I have today?",
      "Customer Presentation",
      "What meetings do I have today?",
    ] as const,
  },
  /** Global 600-648. Four words because each animates in separately. */
  timeOffWords: ["Back", "from", "time", "off?"] as const,
  /** Global 1813-1840, either side of the mask. */
  amplifyWords: ["Amplify", "Reach"] as const,
  /** Global 2499-2577. Three cards, one word or phrase each. */
  askWords: ["Ask", "Answer", "Job Done"] as const,
  /** Global 3022-3109, over the widget wall. */
  createWords: ["Create your own", "AI Widget Builder"] as const,
  /** Global 3702-3776, pushed up and off by the device arriving under it. */
  goBeyond: { lead: "Go beyond", tail: ["the", "numbers"] as const },
} as const;

export type WorkvivoCopy = ValueOf<typeof COPY.shape>;

export const DEFAULT_COPY: WorkvivoCopy = COPY.defaults;

/**
 * Images and colour: the half of the video a model never touches.
 *
 * Every URL here is a data URL by the time it reaches the composition. The wizard reads
 * uploads with `FileReader.readAsDataURL` at the edge, because a data URL renders in the
 * Player and in a server render alike and has no lifetime to manage — the one change the
 * guide is most emphatic about (§5.7).
 */
export type BrandInput = {
  /** The single colour the operator picks. Already clamped when it gets here. */
  accentHex: Hex;
  /** Secondary colours, used for accents. Pulled out of the logo, editable. */
  palette: Hex[];
  /** The logo as uploaded. Shown on light ground. Empty string = fall back to baseline. */
  logoUrl: string;
  /** A knockout/white version for dark and brand-coloured ground. Falls back to `logoUrl`. */
  logoLightUrl: string;
  /** The main character's headshot. */
  personPhotoUrl: string;
  /** The operator's image pool, in upload order. Distributed across the cut. */
  imagery: string[];
  /**
   * Per-position overrides, set by the reviewer when they swap a shot.
   *
   * Sparse on purpose: `assignImagery` still decides every position it does not name,
   * so a swap changes one shot rather than freezing the whole allocation. Keys are
   * `ImageSlotKey`s and values are URLs from `imagery`.
   */
  imageOverrides: Record<string, string>;
  /**
   * Per-position icon swaps, set when the reviewer picks a different space badge or
   * value disc. Keys are `IconSlotKey`s; values are paths under `public/` from the
   * shipped icon folder, which the composition resolves with `staticFile()`.
   *
   * Sparse, and expected to STAY mostly empty — unlike `imageOverrides`, which sits on
   * top of a full deal, an unnamed icon position keeps the Workvivo artwork the scene
   * was built with. There is nothing to deal.
   */
  iconOverrides: Record<string, string>;
  /**
   * Per-header wash colour, wash opacity and centred-mark toggle, keyed by
   * `HeaderSlotKey`. Sparse: a header with no entry renders `HEADER_DEFAULTS`, which is
   * exactly what the approved cut shows.
   */
  headerOverrides: HeaderOverrides;
};

export const DEFAULT_BRAND: BrandInput = {
  accentHex: DEFAULT_BRAND_HEX,
  palette: [],
  logoUrl: "",
  logoLightUrl: "",
  personPhotoUrl: "",
  imagery: [],
  imageOverrides: {},
  headerOverrides: {},
  iconOverrides: {},
};

/** What the composition is handed. Serialisable end to end, so it survives `inputProps`. */
export type VideoInputProps = {
  copy: WorkvivoCopy;
  brand: BrandInput;
};

export const DEFAULT_INPUT_PROPS: VideoInputProps = {
  copy: DEFAULT_COPY,
  brand: DEFAULT_BRAND,
};
