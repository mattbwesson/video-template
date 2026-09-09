#!/usr/bin/env python3
"""
Export every Japanese string in the film to one markdown file for a native speaker to read.

    python3 scripts/export-japanese-text.py

Writes docs/japanese-onscreen-text.md.

WHY THIS IS GENERATED

The translation lives in two TypeScript files as ~700 key/value pairs in source order, which
is the right shape for the code and the wrong shape for a person checking the Japanese: it
gives no indication of what screen a string appears on, how big it is on that screen, or what
sits next to it. "Delete" and "Required" are unremarkable words until you know they are the
two halves of one action bar.

So this groups the strings by the screen that renders them, in the order the screens appear
in the film, with the frame range and timecode of each. A reviewer reads it top to bottom in
the order a viewer sees it.

Regenerate it after changing the translation — it is a snapshot, not a source. The English
column is the key, so a corrected Japanese value goes back into src/japanese/japaneseUi.ts
against that key.

WHAT IT DOES NOT COVER

`patterns` — the entries with a number in them, like "3 days ago" — are listed at the end as
rules rather than strings, because they have no fixed form to proofread.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 25
OUT = os.path.join(ROOT, "docs", "japanese-onscreen-text.md")

# What each screen IS. Derived from the file name where a description would only repeat it;
# written out where a reviewer needs to know what they are looking at. A file with strings
# and no entry here is reported at the end rather than shipped unlabelled.
SCREENS: dict[str, str] = {
    "WorkvivoSidebar": "The left nav rail, on screen behind most of the desktop shots.",
    "WorkvivoLeftColumn": "Left column of the home feed — profile card, quick links.",
    "WorkvivoRightColumn": "Right column of the home feed — events, birthdays, links.",
    "WorkvivoDesktop": "The main home feed: posts, reactions, comments, the composer.",
    "WorkvivoPostComposer": "The 'what's going on' composer and its attachment row.",
    "WorkvivoMobileHome": "The phone home screen.",
    "WorkvivoCatchMeUp": "The AI catch-up summary card, after time off.",
    "WorkvivoLivestream": "The livestream player and its reaction bar.",
    "WorkvivoSpaces": "The Spaces directory.",
    "WorkvivoSpacePage": "A single Space — its header, tabs and right rail.",
    "WorkvivoSpaceFeed": "The feed inside a Space.",
    "WorkvivoMobileSpotlight": "The mobile Spotlight / recognition screen.",
    "WorkvivoJourneyBuilder": "The journey builder — onboarding and change journeys.",
    "WorkvivoBillboardScreen": "Workvivo on an office display / digital signage.",
    "WorkvivoNewsletters": "The newsletters list.",
    "WorkvivoNewsletterBuilder": "The newsletter builder canvas.",
    "WorkvivoPhonesScene": "The three-phone arrangement.",
    "WorkvivoHqSearch": "HQ search results across connected systems.",
    "WorkvivoHqChat": "The HQ chat answer, with its sources.",
    "WorkvivoWidgetStore": "The widget store.",
    "WorkvivoWidgetList": "The widget library list.",
    "WorkvivoArticle": "A published article page.",
    "WorkvivoAnalytics": "The analytics dashboard — the film's densest screen.",
    "WorkvivoSeerSurveyMobile": "The engagement survey as an employee answers it on a phone.",
    "WorkvivoSeerInsights": "Employee Insights — the comments and themes tabs.",
    "WorkvivoSeerManagerInsights": "The manager's view of their team's insights.",
    "WorkvivoSeerManagerMobile": "The manager's insights on a phone.",
    "WorkvivoSeerRater": "The rating / eNPS screen.",
    "WorkvivoSeerChrome": "Shared chrome around the Insights screens.",
    "WorkvivoIntegrationsMarketplace": "The integrations marketplace.",
    "WorkvivoIntegrationsList": "The installed-integrations list.",
    "WorkvivoAdminHub": "The admin hub landing screen.",
    "WorkvivoAiComposeSettings": "The AI compose settings panel.",
    "WorkvivoCustomerGrid": "The customer logo wall near the end.",
    # The five sequences added after the first translation pass.
    "NoMatterScene": "Kinetic type: 'No matter where they are', one word a slot.",
    "WorkvivoPageEditor": "The Zoom Docs-style page editor, its block types and AI prompt bar.",
    "PageBuilderScene": "The page-builder beat: Add Page, the editor, then the card field.",
    "WorkvivoSurveyBuilder": "The survey builder: question list, action bar, and the AI modal.",
    "SurveyBuilderScene": "The survey-builder beat.",
    "WorkvivoAdminCategories": "The admin settings nav — every category and sub-item.",
    "AdminCategoriesScene": "The admin beat: category tiles flying past the HQ fan.",
    "SignOffScene": "The closing card.",
    "HqOpeningScene": "The opening HQ lockup and its tagline.",
    "HqFanBeatScene": "The HQ fan diagram, held under two beats.",
    "WorkvivoHqFan": "The HQ fan diagram itself — its four segment labels.",
    "CreateYourOwnScene": "Kinetic type: 'Create your own'.",
    "HeadquartersScene": "Kinetic type: the opening headline.",
    "BackFromScene": "Kinetic type: 'Back from time off?'.",
    "AskBarScene": "The HQ ask bar as a question is typed.",
    "VirginWorkvivoDesktopFullscreenScene": "The desktop feed full-frame, into the match cut.",
    "LivestreamScene": "The livestream beat.",
    "AmplifyReachScene": "Reach / amplify, into the office signage.",
    "CatchUpRevealScene": "The catch-up card revealing on the phone.",
    "HqChatScene": "The HQ chat beat.",
    "BrandWordScene": "A single brand word held full-frame.",
    "GoBeyondScene": "Kinetic type: 'Go beyond the numbers'.",
    "WorkvivoFeedbackArticle": "The feedback article the film scrolls through.",
    "WorkvivoHqSidebar": "The HQ side rail.",
    "WorkvivoJourneyCard": "A single journey card.",
    "WorkvivoJourneyPhone": "A journey on a phone.",
    "WorkvivoLiveReplay": "The livestream replay card.",
    "WorkvivoSeerRateCard": "One rating card in the survey.",
    "WorkvivoTopbar": "The top bar — search, notifications, avatar.",
    "WorkvivoBillboards": "The office-display arrangement.",
}

# Files that CONTAIN a string without rendering it: the copy defaults, the customisation
# schema, icon and asset tables, the composition roots. Attributing a screen's words to
# videoCopy.ts would tell a reviewer nothing about where they appear.
NOT_A_SCREEN = {
    "videoCopy", "editables", "slots", "icons", "imagery", "weather", "valueEcho",
    "uiStrings", "Root", "Japanese", "WorkvivoCut", "contentListAssets",
}


def read(path: str) -> str:
    return open(os.path.join(ROOT, path), encoding="utf8").read()


def japanese_pairs() -> list[tuple[str, str]]:
    """Every exact key/value in japaneseUi.ts, in source order."""
    src = read("src/japanese/japaneseUi.ts")
    body = src[src.index("const exact") : src.index("const patterns")]
    body = re.sub(r"//.*$", "", body, flags=re.M)
    # Values may be a concatenation across lines; take the first segment for display and
    # note the rest, rather than silently showing a fragment as if it were the whole string.
    return re.findall(r'"((?:[^"\\]|\\.)*)"\s*:\s*\n?\s*"((?:[^"\\]|\\.)*)"', body)


def unescape(s: str) -> str:
    return json.loads(f'"{s}"')


def sources() -> dict[str, str]:
    out = {}
    for root, _, files in os.walk(os.path.join(ROOT, "src")):
        if "japanese" in root:
            continue
        for f in files:
            if f.endswith((".tsx", ".ts")):
                p = os.path.join(root, f)
                out[os.path.splitext(os.path.basename(p))[0]] = open(p, encoding="utf8").read()
    return out


def frame_ranges() -> dict[str, list[tuple[int, int]]]:
    """
    Where each scene component is on the timeline, from WorkvivoCut's own Sequence names.

    The names carry the range because they are what the Studio's timeline shows, so they are
    kept correct by anyone working on the cut — which makes them a better source for this
    than anything this script could re-derive.
    """
    cut = read("src/WorkvivoCut.tsx")
    out: dict[str, list[tuple[int, int]]] = {}
    for block in re.split(r"<Sequence", cut)[1:]:
        head = block[:400]
        m = re.search(r"\((\d+) - (\d+)\)", head)
        if not m:
            continue
        span = (int(m.group(1)), int(m.group(2)))
        for comp in set(re.findall(r"<([A-Z][A-Za-z0-9]+)", block[: block.find("</Sequence>") if "</Sequence>" in block else 4000])):
            out.setdefault(comp, []).append(span)
    # The scenes added later export their own bounds instead of writing them in the name.
    for name, src in sources().items():
        fm = re.search(r"export const [A-Z_]*FROM = (\d+);", src)
        to = re.search(r"export const [A-Z_]*TO = (\d+);", src)
        if fm and to:
            out.setdefault(name, []).append((int(fm.group(1)), int(to.group(1))))
    return out


def tc(frame: int) -> str:
    s = frame / FPS
    return f"{int(s // 60)}:{s % 60:04.1f}"


def copy_section() -> list[str]:
    """
    The customer copy — the posts, the article, the names — from japaneseCopy.ts itself.

    Dumped by building the module rather than by parsing it, because it is a nested object
    with arrays and concatenated strings and a regex over it would quietly miss things. This
    is the half of the translation a reader is most likely to have an opinion about: it is
    prose, not chrome.
    """
    js = "/tmp/japanese-copy-dump.mjs"
    subprocess.run(
        ["npx", "esbuild", "src/japanese/japaneseCopy.ts", "--bundle", "--format=esm",
         f"--outfile={js}", "--log-level=error"],
        cwd=ROOT, check=True,
    )
    dumped = subprocess.run(
        ["node", "-e", f"import('{js}').then(m=>console.log(JSON.stringify(m.JAPANESE_INPUT)))"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout
    data = json.loads(dumped)

    flat: list[tuple[str, str]] = []

    def walk(node, path: str) -> None:
        if isinstance(node, str):
            flat.append((path, node))
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{path}[{i}]")
        elif isinstance(node, dict):
            for k, v in node.items():
                walk(v, f"{path}.{k}" if path else k)

    walk(data.get("copy", data), "")
    out = ["\n## Customer copy\n\n"]
    out.append(
        "The words a customer's own film would replace — posts, the article, names, the "
        "survey. Everything above is Workvivo's product chrome; this is the content inside "
        "it. Corrections go into `src/japanese/japaneseCopy.ts` at the path shown.\n\n"
    )
    out.append(f"{len(flat)} entries.\n\n")
    out.append("| Path | Japanese |\n|---|---|\n")
    for path, val in flat:
        v = val.replace("|", "\\|").replace("\n", "<br>")
        out.append(f"| `{path}` | {v} |\n")
    return out


def main() -> None:
    pairs = japanese_pairs()
    srcs = sources()
    ranges = frame_ranges()

    # Which file renders each string. A string in several files is listed under each, because
    # a reviewer checking a screen wants everything on that screen.
    where: dict[str, list[tuple[str, str]]] = {}
    homeless: list[tuple[str, str]] = []
    for en, ja in pairs:
        core = en.split("/", 1)[1] if "/" in en and " " not in en.split("/", 1)[0] else en
        lit = '"' + core + '"'
        hits = [n for n, c in srcs.items() if lit in c and n not in NOT_A_SCREEN]
        if not hits:
            homeless.append((en, ja))
        for n in hits:
            where.setdefault(n, []).append((en, ja))

    def inherited(name: str) -> list[tuple[int, int]]:
        """
        Where a component appears, when it has no Sequence of its own.

        Most screens are components mounted inside a scene, and only the scene carries a
        range. Without this every one of them sorts to the end of the document under no
        timecode, which is the opposite of reading in the order a viewer sees them.
        """
        if ranges.get(name):
            return ranges[name]
        out = []
        for other, text in srcs.items():
            if other != name and re.search(rf"\b{name}\b", text) and ranges.get(other):
                out += ranges[other]
        return sorted(set(out))

    # Repeat to a fixed point: WorkvivoSidebar is mounted by WorkvivoSpacePage, which is
    # itself mounted by a scene, and only the scene has a Sequence. One pass would leave
    # everything two levels down undated.
    for _ in range(6):
        changed = False
        for n in list(where):
            got = inherited(n)
            if got and not ranges.get(n):
                ranges[n] = got
                changed = True
        if not changed:
            break

    def first_frame(name: str) -> int:
        return min((a for a, _ in ranges.get(name, [])), default=10**9)

    order = sorted(where, key=lambda n: (first_frame(n), n))

    lines: list[str] = []
    lines.append("# Japanese on-screen text, for proofreading\n\n")
    lines.append(
        "Every Japanese string the film puts on screen, grouped by the screen that renders "
        "it and ordered as a viewer meets them. **Generated** — do not edit:\n"
    )
    lines.append("\n```bash\npython3 scripts/export-japanese-text.py\n```\n\n")
    lines.append(
        "To correct a line, change the Japanese against its English key in "
        "`src/japanese/japaneseUi.ts` (or `japaneseCopy.ts` for the customer copy at the "
        "end) and re-run the command above.\n"
    )
    lines.append("\n## What to look for\n\n")
    lines.append(
        "- **Terminology.** 社員 rather than 従業員; サーベイ rather than 調査; 本社 only in "
        "the opening line. Flag any drift.\n"
        "- **Length.** Several strings are fitted to a box measured from the English, noted "
        "in the source where it matters. A longer correction may not fit — say so and we "
        "will re-measure rather than let it clip.\n"
        "- **Register.** It is a product film: confident, not stiff, and not casual. "
        "です・ます throughout except on the kinetic type, which is deliberately clipped.\n"
        "- **Word order.** Some kinetic scenes split a sentence across slots that animate "
        "separately; those are marked, and the fragments only read correctly in order.\n"
    )
    lines.append(f"\n{len(pairs)} strings across {len(order)} screens.\n")

    missing_desc = []
    for name in order:
        rows = where[name]
        rs = sorted(set(ranges.get(name, [])))
        # No range means the screen is not mounted inside a named Sequence — it is reused
        # across scenes or built dynamically. Say so rather than leaving the heading bare.
        span = " · appears in more than one scene"
        if rs:
            span = " · " + ", ".join(f"frames {a}–{b} ({tc(a)}–{tc(b)})" for a, b in rs[:3])
        desc = SCREENS.get(name)
        if desc is None:
            missing_desc.append(name)
            desc = "_(no description yet)_"
        lines.append(f"\n### {name}{span}\n")
        lines.append(f"{desc}\n\n")
        lines.append("| English | Japanese |\n|---|---|\n")
        seen = set()
        for en, ja in rows:
            if en in seen:
                continue
            seen.add(en)
            e = unescape(en).replace("|", "\\|").replace("\n", " ")
            j = unescape(ja).replace("|", "\\|").replace("\n", " ")
            lines.append(f"| {e} | {j} |\n")

    if homeless:
        lines.append("\n### Not traceable to one screen\n")
        lines.append(
            "Scoped keys, strings assembled from fragments, and entries whose English no "
            "longer appears in the source. Worth a read; harder to place.\n\n"
        )
        lines.append("| English | Japanese |\n|---|---|\n")
        for en, ja in homeless:
            lines.append(f"| {unescape(en)} | {unescape(ja).replace(chr(10), ' ')} |\n")

    lines += copy_section()

    src = read("src/japanese/japaneseUi.ts")
    pats = re.findall(r"\[(/\^.*?\$/),\s*\"((?:[^\"\\]|\\.)*)\"\]", src)
    if pats:
        lines.append("\n### Number and date rules\n")
        lines.append(
            "These are patterns, not fixed strings — anything with a count or a date in it. "
            "`$1` is the number the film supplies.\n\n"
        )
        lines.append("| Matches | Becomes |\n|---|---|\n")
        for rx, out_ in pats:
            lines.append(f"| `{rx}` | {out_} |\n")

    open(OUT, "w", encoding="utf8").write("".join(lines))
    rel = os.path.relpath(OUT, ROOT)
    print(f"wrote {rel}: {len(pairs)} strings, {len(order)} screens")
    if missing_desc:
        print(f"  {len(missing_desc)} screens have no description in SCREENS:")
        for n in missing_desc:
            print(f"    {n}")


if __name__ == "__main__":
    main()
