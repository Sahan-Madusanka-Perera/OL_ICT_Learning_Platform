"""Step 2b - fill gaps in the primary OCR pass from the alternate one.

WHY THERE IS A SECOND PASS AT ALL
---------------------------------
`ocr_all.py` reads every page twice, at two tesseract page-segmentation modes,
because they fail in different places and the places matter:

    psm 6  one uniform block. Good at prose. Flattens a four-column option row
           into one line, after which the question numbers inside it stop
           looking like question numbers.
    psm 4  a single column of variable-sized text. Keeps that structure, and in
           exchange sometimes loses a whole page to a mis-detected column.

The numbers say it plainly. On the 2011 paper the primary pass finds 31 of 40
questions and 18 with four options; the alternate finds 36 and 24. On the 2019
paper the alternate collapses to 7 blocks while the primary gets all 40. Either
one alone leaves questions on the floor.

WHAT THIS IS ALLOWED TO DO
--------------------------
Fill gaps. Nothing else.

    - A question the primary pass never found, which the alternate did:  take it.
    - A question the primary found but could not recover options for, which the
      alternate recovered four options for:                              take it.
    - A question the primary already read completely:                    keep it,
      always, even if the alternate disagrees.

That last rule is the important one. Two OCR passes disagreeing is not evidence
about which is right, and a merge that "picks the better one" is really a merge
that picks at random twice a page. Gap-filling can only ever add a question that
was absent, so the worst case is a question that still needs a reviewer — which
is true of every row in this corpus anyway.

Every repaired question is marked `repaired_from: psm4` in the output, so the
provenance survives into the seed and a reviewer can see which pass produced
the text in front of them.

    python3 tools/extract-past-papers/repair.py
"""
import json
import os
import re
import sys

OUT = os.environ.get(
    'WORKDIR',
    os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')), '.extract'),
)

#: A candidate has to look like a question before it is allowed in. These are
#: deliberately crude — the point is to reject OCR mush, not to grade quality.
MIN_STEM = 18
MIN_OPTION = 1
#: No Paper I option is this long. One that is has run past the end of the
#: question and swallowed whatever came next, which on the last question of a
#: paper means the whole of Paper II.
MAX_OPTION = 320
#: Nor is a stem. The same runaway shows up here when options are never found.
MAX_STEM = 1200


def plausible(q):
    """Does this block look like a question a person wrote?"""
    stem = (q.get('stem') or '').strip()
    if not MIN_STEM <= len(stem) <= MAX_STEM:
        return False

    opts = q.get('options')
    if not opts or len(opts) != 4:
        return False
    if any(len((o or '').strip()) < MIN_OPTION for o in opts):
        return False
    if any(len((o or '').strip()) > MAX_OPTION for o in opts):
        return False

    # Four identical options are a marker-detection artefact, not a question.
    if len({(o or '').strip().lower() for o in opts}) < 3:
        return False

    # A stem that is mostly punctuation and stray glyphs is speckle.
    letters = sum(c.isalpha() for c in stem)
    if letters < len(stem) * 0.5:
        return False

    return True


def complete(q):
    """Has the primary pass already read this question in full?"""
    return bool(q) and bool(q.get('options')) and len(q['options']) == 4


def run():
    primary_path = f'{OUT}/parsed.json'
    alt_path = f'{OUT}/parsed.psm4.json'

    if not os.path.exists(alt_path):
        print(f'no alternate pass at {alt_path} — run ocr_all.py, then parse.py --psm4')
        sys.exit(1)

    primary = json.load(open(primary_path))
    alt = json.load(open(alt_path))

    added = 0
    completed = 0
    rejected = 0
    per_year = {}

    for year, questions in primary.items():
        alt_year = alt.get(year, {})
        gained = []

        for n in range(1, 41):
            key = str(n)
            have = questions.get(key)
            if complete(have):
                continue

            candidate = alt_year.get(key)
            if not candidate:
                continue
            if not plausible(candidate):
                rejected += 1
                continue

            repaired = dict(candidate)
            repaired['repaired_from'] = 'psm4'
            questions[key] = repaired
            gained.append(n)

            if have is None:
                added += 1
            else:
                completed += 1

        if gained:
            per_year[year] = gained

    for year in sorted(per_year):
        got = per_year[year]
        print(f'{year}: +{len(got)} from the alternate pass — {", ".join(f"Q{n}" for n in got)}')

    total = sum(
        1 for qs in primary.values() for q in qs.values() if complete(q)
    )
    print()
    print(f'{added} questions recovered that the primary pass never found')
    print(f'{completed} questions whose options the primary pass could not read')
    print(f'{rejected} alternate blocks rejected as implausible')
    print(f'{total} of 600 now have a stem and four options')

    json.dump(primary, open(primary_path, 'w'), indent=1)
    print(f'-> {primary_path}')


if __name__ == '__main__':
    run()
