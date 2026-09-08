"""
Mora counting for Japanese timing, calibrated against the actual read.

Characters are the wrong unit. Katakana runs about one mora per character, but a kanji
compresses two or three into one, so a kanji-heavy line takes longer than its character
count implies and a katakana-heavy line takes about as long as it looks. Averaging that
out over a whole script — which is what a chars/sec figure does — leaves every line wrong
in proportion to how far its own script mix sits from the mean.

Readings come from fugashi/unidic-lite. Latin tokens the analyser has no reading for are
mapped by hand below, as the reader actually says them.
"""
import re

try:
    import fugashi
    _TAGGER = fugashi.Tagger()
except Exception:  # pragma: no cover - the caller reports it
    _TAGGER = None

# How the reader says the Latin in this script. Measured off the transcript, not guessed:
# Whisper hears "ワークウィボ" and "エイチキュー".
LATIN = {
    "workvivo": "ワークウィボ",
    "hq": "エイチキュー",
    "ai": "エーアイ",
    "zoom": "ズーム",
}

# Small kana attach to the mora before them and are not counted. Everything else that is
# kana counts one, including ー (long vowel), っ (geminate) and ん (moraic nasal).
SMALL = set("ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ")
KANA = re.compile(r"[ぁ-んァ-ヴーｱ-ﾝﾞﾟ]")


def mora_of_reading(kana: str) -> int:
    return sum(1 for c in kana if KANA.match(c) and c not in SMALL)


# Longest first, so WorkvivoHQ is not eaten as Workvivo + HQ with the wrong join.
_LATIN_RE = re.compile("|".join(sorted(LATIN, key=len, reverse=True)), re.I)


def mora(text: str) -> int:
    """Mora in a mixed-script string."""
    if _TAGGER is None:
        raise RuntimeError("fugashi is not installed; pip install fugashi unidic-lite")
    # Substitute the product names with their spoken katakana BEFORE tagging. Left to the
    # analyser, "WorkvivoHQ" is one unknown token and falls to the len x 2 guess — 20 mora
    # against a real 12, which made the closing line look a second longer than it reads.
    text = _LATIN_RE.sub(lambda m: LATIN[m.group(0).lower()], text)
    total = 0
    for word in _TAGGER(text):
        s = word.surface
        if re.fullmatch(r"[A-Za-z]+", s):
            total += mora_of_reading(LATIN.get(s.lower(), "")) or len(s) * 2
            continue
        if re.fullmatch(r"[0-9]+", s):
            total += len(s) * 2  # digits read as two-mora numerals on average
            continue
        kana = getattr(word.feature, "kana", None) or getattr(word.feature, "pron", None)
        total += mora_of_reading(kana) if kana else mora_of_reading(s)
    return total
