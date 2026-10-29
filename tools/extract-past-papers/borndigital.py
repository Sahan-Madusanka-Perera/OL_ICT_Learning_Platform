"""Transcribe the born-digital papers from their text layer, not from OCR.

WHY THIS IS NOT ocr_all.py + parse.py
-------------------------------------
Those two exist for the nine scanned years and do a careful job of repairing
damage. For 2020-2025 there is no damage to repair: the text is *in* the file.
Reading it directly is not a better guess, it is the actual characters the
Department typeset, and that changes what the result is allowed to claim.

Three things this recovers that OCR cannot:

1.  **Sub- and superscripts.** `1110 1110₂` is stored as a 12pt run followed by
    an 8pt run sitting 1pt lower. OCR flattens that to `11101110 2` or eats it
    entirely, which silently changes the value — the single worst failure mode
    in an O/L ICT paper, where half of Unit 3 is written in subscripts. Here the
    font size and baseline say exactly which digits are subscript.

2.  **Reading order.** PDF text runs in the order the typesetter emitted it, not
    the order a reader sees. On page 1 of the 2025 paper, question 4's options
    and question 5's options are interleaved in the raw stream; on page 2, the
    A/B/C list belonging to question 10 appears after question 14's heading.
    Sorting every line by (y, x) puts both right.

3.  **Image-only options.** Questions 11, 12 and 13 of the 2025 paper are icon
    questions: the option markers are there and the text after them is empty.
    That is detectable here and is recorded, rather than arriving as four blank
    strings that look like a parse failure.

Usage:  python3 tools/extract-past-papers/borndigital.py [year]
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

from topics import topic_of

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PAPERS = os.path.join(REPO, 'pastpapers')
DEST = os.path.join(REPO, 'src', 'lib', 'db', 'seed', 'data')

BORN_DIGITAL = {
    2020: 'ol-2020-english_2024-08-13_02-56-27.pdf',
    2021: 'ol-2021-english_2024-08-13_02-55-10.pdf',
    2022: 'ol-2022-english_2024-08-13_02-53-50.pdf',
    2023: 'ol-2023-english_2024-11-29_19-49-37.pdf',
    2024: 'ol-2024-english_2026-01-30_11-49-16.pdf',
    2025: 'ol-2025-english_2026-08-14_04-37-43.pdf',
}

SUB = str.maketrans('0123456789+-=()', '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎')
SUP = str.maketrans('0123456789+-=()n', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ')

# Sinhala and Tamil blocks — the paper is trilingual and we transcribe English.
OTHER_SCRIPT = re.compile(r'[඀-෿஀-௿]')
FURNITURE = re.compile(
    r'^(#ictfromabc|OL/\d{4}|Department of Exam|All Rights|\[see page|-\s*\d+\s*-'
    r'|\d{1,3}\s*$|⁕|Use additional reading time|Additional Reading Time'
    r'|General Certificate|Information & Communication|\d+\s+E\s+I,II)',
    re.I,
)


def spans_to_text(line, body_size):
    """Join a line's spans, restoring sub- and superscripts as Unicode."""
    out = []
    # The baseline is the body text's, which is the *largest* span on the line —
    # not the lowest. A subscript sits below the baseline, so taking the maximum
    # origin_y makes the subscript its own reference and it never registers.
    body = max(line['spans'], key=lambda s: (s['size'], len(s['text'])), default=None)
    baseline = body['origin'][1] if body else 0
    for s in line['spans']:
        t = s['text']
        if not t.strip():
            out.append(t)
            continue
        # A smaller run that also sits off the baseline is a sub/superscript.
        if s['size'] < body_size - 1.5:
            dy = s['origin'][1] - baseline
            if dy > 0.4:
                out.append(t.translate(SUB))
                continue
            if dy < -0.4:
                out.append(t.translate(SUP))
                continue
        out.append(t)
    return ''.join(out)


def lines_of(page, body_size):
    """Every English line on the page, in true reading order."""
    rows = []
    for b in page.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            t = spans_to_text(l, body_size).strip()
            if not t or OTHER_SCRIPT.search(t) or FURNITURE.match(t):
                continue
            rows.append((round(l['bbox'][1], 1), round(l['bbox'][0], 1), t))

    # Group into visual rows before ordering left-to-right.
    #
    # Sorting on raw y is not enough. In the 2025 paper, question 38's options
    # (3) and (4) sit at y=550.1 while (1) and (2) sit at y=551.1 — one point
    # apart, the same printed line to any reader, but enough to sort the second
    # half of the row ahead of the first. A band of a few points puts them back
    # in reading order.
    rows.sort(key=lambda r: (r[0], r[1]))
    banded = []
    for row in rows:
        if banded and abs(row[0] - banded[-1][0][0]) <= ROW_BAND:
            banded[-1].append(row)
        else:
            banded.append([row])
    out = []
    for band in banded:
        out.extend(sorted(band, key=lambda r: r[1]))
    return out


def body_size_of(doc):
    """The most common span size — the body text size for this paper."""
    counts = {}
    for page in doc:
        for b in page.get_text('dict')['blocks']:
            if b['type'] != 0:
                continue
            for l in b['lines']:
                for s in l['spans']:
                    if s['text'].strip():
                        counts[round(s['size'], 1)] = counts.get(round(s['size'], 1), 0) + len(s['text'])
    return max(counts, key=counts.get) if counts else 12.0


QNUM = re.compile(r'^(\d{1,2})\.\s+(.*)$')
# Two phrasings introduce a shared stimulus, and the 2025 paper uses both:
#   "Questions 19 to 21 are based on the following partly shown database tables"
#   "To answer questions 37 and 38, consider a raster image of resolution ..."
SHARED = re.compile(
    r'(?:questions?\s+(\d{1,2}(?:\s*(?:,|and|&|to|-|–)\s*\d{1,2})+)\s*(?:are|is)\s+based'
    r'|to\s+answer\s+questions?\s+(\d{1,2}(?:\s*(?:,|and|&|to|-|–)\s*\d{1,2})+)\s*,?\s*consider)',
    re.I,
)
# Option markers. Several may share one line: "(3) B and C only    (4) All A, B and C"
OPT = re.compile(r'\((\d)\)\s*')

QNUM_MAX_X = 120
# Two lines within this many points of each other are the same printed row.
ROW_BAND = 3.0


def collect(doc, body_size):
    """Question number -> list of its lines, in reading order, Paper I only."""
    blocks = {}
    order = []
    current = None
    stimulus_for = {}
    pending_shared = None

    for page in doc:
        rows = lines_of(page, body_size)
        for y, x, t in rows:
            m = SHARED.search(t)
            if m:
                nums = shared_questions(m.group(1) or m.group(2))
                pending_shared = nums
                for n in nums:
                    stimulus_for[n] = [t]
                continue

            m = QNUM.match(t)
            if m and x <= QNUM_MAX_X:
                n = int(m.group(1))
                # Only ever move forward, and never past 40.
                if 1 <= n <= 40 and (current is None or n == current + 1):
                    current = n
                    pending_shared = None
                    blocks[n] = [m.group(2)]
                    order.append(n)
                    continue

            # A shared header runs to several lines, and its continuation must
            # not land on the question above it. Without this, "Ubuntu" in
            # question 18's option 4 is followed by "data about school subjects,
            # teachers and" — the second line of question 19's stimulus. The
            # next question number closes the stimulus, which is why this is
            # checked after QNUM and not before it.
            if pending_shared is not None:
                for n in pending_shared:
                    stimulus_for[n].append(t)
                continue

            if current is not None:
                blocks[current].append(t)

        if current == 40:
            break

    return blocks, stimulus_for


RANGE = re.compile(r'(\d{1,2})\s*(?:to|-|–)\s*(\d{1,2})')


def shared_questions(spec):
    m = RANGE.search(spec)
    if m:
        lo, hi = int(m.group(1)), int(m.group(2))
        if 1 <= lo < hi <= 40:
            return list(range(lo, hi + 1))
    return [int(n) for n in re.findall(r'\d{1,2}', spec) if 1 <= int(n) <= 40]


def split_options(lines):
    """Return (stem, options, image_options, defect).

    `image_options` is True when the four markers are present but at least one
    carries no text — a picture question, where the options are icons or
    diagrams rather than words. See the note at the test itself.

    `defect` is a note when the *paper* is wrong, not the extraction. Two of the
    born-digital papers misnumber an option: the 2020 paper's question 4 prints
    its third option as `(2)`, and the 2021 paper's question 8 prints its third
    as `(5)`. Both are visible in the PDF at 200 dpi and both are the
    Department's own typo. A strict 1,2,3,4 scan reads those as "no options
    found" and throws away a question that is otherwise perfectly transcribed,
    so a second pass accepts a run whose first and last markers are right and
    which breaks in exactly one place. The note travels with the question, so a
    reviewer is told what the paper did rather than shown a silent repair.
    """
    body = '\n'.join(lines)
    marks = [(m.start(), int(m.group(1)), m.end()) for m in OPT.finditer(body)]

    # Find the first ascending run 1,2,3,4.
    seq, want = [], 1
    for start, n, end in marks:
        if n == want:
            seq.append((start, end))
            want += 1
            if want > 4:
                break
    defect = None
    if len(seq) != 4:
        seq, defect = misnumbered_run(marks)
    if len(seq) != 4:
        return tidy(body), None, False, None

    stem = body[:seq[0][0]]
    opts = []
    for i in range(4):
        s = seq[i][1]
        e = seq[i + 1][0] if i < 3 else len(body)
        opts.append(tidy(body[s:e]))

    # A printed MCQ never offers a blank choice, so a blank one means the
    # options are not text at all.
    #
    # The obvious version of this test — all four blank — only catches the easy
    # case, where the options are bare icons. It misses the harder one: four
    # logic circuits or four database tables, drawn as vector art with their
    # labels set as page text over the top. 2020 Q35 came through as
    # ['', 'Output Output B B A A', 'Output', 'Output B B'] and 2021 Q23 as
    # three table cells and a gap, which read as extraction damage when the
    # questions are perfectly intact and simply not made of words. Both are
    # picture questions, and option-icons.py renders their four regions.
    if any(o == '' for o in opts):
        return tidy(stem), None, True, defect
    return tidy(stem), opts, False, defect


def misnumbered_run(marks):
    """A four-marker run anchored by (1) and (4), breaking in exactly one place.

    Deliberately narrow. It will not rescue a question whose options were never
    found, only one the paper itself misnumbered: the run must start at (1), end
    at (4), hold four markers in document order, and differ from 1,2,3,4 in a
    single position. Anything looser starts inventing options out of a stray
    "(2)" in a stem.
    """
    for i in range(len(marks) - 3):
        window = marks[i:i + 4]
        nums = [n for _, n, _ in window]
        if nums[0] != 1 or nums[3] != 4:
            continue
        wrong = [k for k in range(4) if nums[k] != k + 1]
        if len(wrong) != 1:
            continue
        k = wrong[0]
        note = (
            f'The paper prints option {k + 1} as "({nums[k]})". '
            'Transcribed in printed order; the misnumbering is the paper\'s.'
        )
        return [(start, end) for start, _, end in window], note
    return [], None


def join_stimulus(lines):
    return tidy(' '.join(lines)) if lines else None


def tidy(t):
    t = re.sub(r'\s+', ' ', t.replace('\n', ' ')).strip()
    t = t.replace('“', '"').replace('”', '"').replace('’', "'").replace('‘', "'")
    return t.strip(' .,;:')


def run(only_year=None):
    out = []
    for year, filename in sorted(BORN_DIGITAL.items()):
        if only_year and year != only_year:
            continue
        path = os.path.join(PAPERS, filename)
        doc = pymupdf.open(path)
        size = body_size_of(doc)
        blocks, stimulus_for = collect(doc, size)

        complete = 0
        defects = 0
        for n in range(1, 41):
            if n not in blocks:
                out.append({'year': year, 'q': n, 'stem': None, 'options': None,
                            'imageOptions': False, 'sourceDefect': None,
                            'stimulus': join_stimulus(stimulus_for.get(n)),
                            'transcription': 'missing'})
                continue
            stem, opts, image_opts, defect = split_options(blocks[n])
            if opts or image_opts:
                complete += 1
            if defect:
                defects += 1
            out.append({
                'year': year,
                'q': n,
                'topic': topic_of(f"{stem} {' '.join(opts or [])}"),
                'topicSource': 'keyword',
                'stem': stem,
                'options': opts,
                'imageOptions': image_opts,
                'sourceDefect': defect,
                'stimulus': join_stimulus(stimulus_for.get(n)),
                'transcription': 'text_layer',
            })
        note = f', {defects} misnumbered in the paper' if defects else ''
        print(f'{year}: {len(blocks)}/40 questions, {complete} with options{note}')
        doc.close()

    dest = os.path.join(DEST, 'past-paper-borndigital.json')
    prior = {}
    if os.path.exists(dest):
        with open(dest) as f:
            for r in json.load(f):
                prior[(r['year'], r['q'])] = r

    # Topics are hand-assigned, in the file, and are NOT reproducible from the
    # PDF — the keyword classifier that seeded them was wrong 22 times out of 40
    # on 2025, which is why someone sat down and did it by hand. Re-running the
    # extractor must never cost that work, so a topic already recorded is
    # carried across. Everything else is regenerated from the paper.
    for row in out:
        was = prior.get((row['year'], row['q']))
        if was and was.get('topic') and was.get('topicSource', 'hand') == 'hand':
            row['topic'] = was['topic']
            row['topicSource'] = 'hand'

    if only_year:
        # Merge rather than clobber the other years.
        out += [r for r in prior.values() if r['year'] != only_year]
    out.sort(key=lambda r: (r['year'], r['q']))
    with open(dest, 'w') as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print(f'-> {dest} ({len(out)} rows)')


if __name__ == '__main__':
    year = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run(year)
