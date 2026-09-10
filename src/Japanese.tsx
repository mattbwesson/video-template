import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
/**
 * `Audio` from @remotion/media, not from remotion, for the same reason WorkvivoCut's
 * soundtrack uses it: the plain one is an HTML media element, and @remotion/web-renderer
 * refuses those outright — using it here would break the wizard's in-browser export.
 */
import { Audio } from "@remotion/media";
import { CustomizationProvider } from "./customize/CustomizationProvider";
import { WorkvivoCut } from "./WorkvivoCut";
import { JAPANESE_INPUT } from "./japanese/japaneseCopy";
import { JAPANESE_UI } from "./japanese/japaneseUi";
import { UiStringsProvider } from "./customize/uiStrings";
import "./japanese/JapaneseFont.css";
import "./japanese/JapaneseType.css";

/**
 * The Japanese cut.
 *
 * The same 5300 frames as `L2VirginAirline`, translated. It shares the scene tree with the
 * English cut on purpose — the two differ in words and typography, not in what happens on
 * screen, and forking 152 files and 42,000 lines to say that would guarantee the two drift
 * apart on every fix made to either.
 *
 * ISOLATION — what "changes here cannot reach the English cut" actually rests on
 *
 * Two things, and both are structural rather than a convention to remember:
 *
 * 1. **Words** arrive as `input` to the provider, so they exist only inside this element.
 *    `COPY.merge` takes a partial, so an untranslated slot falls back to the English
 *    baseline instead of blanking.
 *
 * 2. **Type** is a stylesheet in which every rule is scoped under `.jp`, and this is the
 *    only place that class is applied. Remotion bundles every composition into one
 *    document, so an unscoped rule in `JapaneseType.css` WOULD reach the English cut —
 *    that file has the constraint written at the top for whoever edits it next.
 *
 * Nothing under `src/components/` or the other 37 stylesheets is modified or duplicated.
 *
 * WHERE THE ISOLATION ENDS, WHICH IS WORTH KNOWING BEFORE YOU NEED IT
 *
 * A change to a shared *component* or a shared *stylesheet* affects both cuts. That is the
 * deliberate trade and it covers translation work completely — copy is data and type is
 * scoped. The day this cut needs a screen laid out differently rather than merely styled
 * differently, that screen is the thing to fork, and only that screen.
 */

/**
 * SOUND — the third thing that differs, after words and type.
 *
 * The English cut plays public/audio/l2-soundtrack.m4a — the reference edit's own audio
 * track, narration and music together. That is no use here, because the narration in it
 * is English — so this cut drops that track (`ownSoundtrack`) and plays a mix built for
 * it instead.
 *
 * The mix is a build artefact rather than something assembled at render time. The supplied
 * Japanese read is 231.4s against a 212s film, and every line has to sit under the picture
 * the English line it translates was cut to, so each sentence is placed against its English
 * counterpart and sped up only as much as its slot needs — mean 1.09x, and nine of the 35
 * untouched. scripts/build-japanese-vo.mjs does that; scripts/verify-japanese-vo.mjs
 * transcribes the result to confirm the lines land where they were meant to, which they do
 * to a median of 0.18s.
 *
 * Expressing it here instead would mean 35 <Audio> elements with per-element playbackRate:
 * Remotion can say that, but it would be re-decided on every render and could not be
 * checked against the audio it actually produced. The film's soundtrack is fixed, and a
 * file is the honest representation of a fixed thing.
 */

/**
 * The font is embedded, not fetched — see src/japanese/JapaneseFont.css and the script that
 * generates it. The first version called `@remotion/google-fonts`' `loadFont`, which cost
 * ~480 requests per render and died with a bare `NetworkError` behind a TLS-intercepting
 * proxy. Worse, it ran at module scope and Root.tsx imports this file, so a Japanese-only
 * dependency failed the ENGLISH render too — the one thing this composition exists not to do.
 */

export const Japanese: React.FC = () => (
  <CustomizationProvider input={JAPANESE_INPUT}>
    {/* The product's own chrome — nav, buttons, "View All" — is not copy and is not in
        the copy table. It reaches the components through this provider; without it,
        every component renders its English literal. See src/customize/uiStrings.tsx. */}
    <UiStringsProvider strings={JAPANESE_UI}>
      {/* AbsoluteFill rather than a plain div: WorkvivoCut's own root is one, and a
          statically-sized wrapper would give it a zero-height parent to lay out inside. */}
      <AbsoluteFill className="jp">
        <Audio src={staticFile("audio/japanese-soundtrack.mp3")} />
        <WorkvivoCut ownSoundtrack />
      </AbsoluteFill>
    </UiStringsProvider>
  </CustomizationProvider>
);
