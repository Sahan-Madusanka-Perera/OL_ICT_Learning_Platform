"""Extract answer options that are pictures, from the born-digital papers.

Some questions have no text in their options at all. The 2025 paper has three
in a row — questions 11, 12 and 13 ask which word-processor *icon* does a job,
and each option is a 23-point icon and nothing else. `borndigital.py` detects
them and records `imageOptions: true`, but a question whose four options are
blank is not answerable; the pictures have to come too.

The schema has had a place for this since the beginning: `question_options`
carries an `asset_id`, and the comment above it says a large share of real O/L
ICT MCQs are picture questions. This is the first thing to actually fill it.

HOW AN ICON ROW IS FOUND
------------------------
By looking, not by coordinates. The first version of this file carried a
hand-measured y-band per question and a fixed list of four column centres,
which held for exactly one paper: the 2022 paper sets question 39's options at
x = 88, 176, 316 and 459, nowhere near the 2025 columns, and the 2023 paper
puts two icon questions close enough together that a 35-point band catches the
wrong row.

So the question number is located in the text layer, the small images below it
are clustered into printed rows, and the first row holding exactly four is the
option row. Four icons, left to right, are options 1 to 4 — the order a reader
reads them in. If no row has exactly four, the question is skipped and reported
rather than half-assigned.

TWO SHAPES OF PICTURE OPTION
----------------------------
**Icons.** A row of four small raster images — toolbar buttons. Found by
clustering the images below the question number, above.

**Diagrams.** Four logic circuits or four database tables, laid out as a 2x2
grid, drawn as vector art with their labels (A, B, Output, a company name) set
as page text over the top. `get_images` finds nothing for these, because there
is no image object to find.

The second shape is why 2020 Q35 and 2021 Q23 used to arrive with options
`["", "Output Output B B A A", "Output", "Output B B"]` — the text layer holds
the labels and nothing else, so the options read as damage when the question is
in fact intact. Here the four option markers are located in the text layer, the
grid they form is read off their coordinates, and each cell is re-rendered from
the page. That is the same move `figures.py` makes, applied one level down.

    python3 tools/extract-past-papers/option-icons.py
"""
import json
import os
import re

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DEST_IMG = os.path.join(REPO, 'public', 'past-papers')
DEST_JSON = os.path.join(REPO, 'src', 'lib', 'db', 'seed', 'data')

# Icons are small on the page, so they are rendered well above their printed
# size — a student needs to tell a strike-through from an underline on a phone.
DPI = 400
PAD = 2
# A circuit or a table needs less magnification than a 15-point icon, and the
# region is an order of magnitude larger.
DIAGRAM_DPI = 200

# How far below the question number its options can sit, in points. Generous
# enough for a two-line stem, short enough not to reach the next question.
OPTION_BAND = 140
# Two images within this many points of each other are on the same printed row.
ROW_BAND = 6.0
# Anything larger than this is a figure or a rule, not an option icon.
MAX_ICON = 70

PAPERS = {
    2020: 'ol-2020-english_2024-08-13_02-56-27.pdf',
    2021: 'ol-2021-english_2024-08-13_02-55-10.pdf',
    2022: 'ol-2022-english_2024-08-13_02-53-50.pdf',
    2023: 'ol-2023-english_2024-11-29_19-49-37.pdf',
    2024: 'ol-2024-english_2026-01-30_11-49-16.pdf',
    2025: 'ol-2025-english_2026-08-14_04-37-43.pdf',
}

# year -> question -> {prompt, alts}
#
# Alt text is written by *looking at* the extracted icons, which is the one step
# here that cannot be automated: an option nobody has described is unanswerable
# on a screen reader, and these four options are only pictures.
#
# Worth recording that the first draft of the 2025 descriptions was written from
# the question wording before the icons had been rendered, and most of the
# twelve were wrong — question 12's options are a capital A, not the capital X
# the stem mentions, and question 13 leads with a format-painter brush that the
# wording gives no hint of. Alt text guessed from context is not alt text.
#
# Each description says what is drawn and stops there. "A paperclip" is what a
# sighted candidate sees; "the attach button" is the answer, and writing that
# would hand the question away to exactly the readers the description exists to
# serve.
ICON_QUESTIONS = {
    2022: {
        13: {
            'prompt': 'list icons',
            'alts': [
                'A boxed pair of toolbar icons: a lower-case x with a small 2 set below '
                'the baseline, and a lower-case x with a small 2 set above it.',
                'A boxed pair of toolbar icons: three lines each preceded by a square '
                'bullet, and three lines each preceded by the numerals 1, 2 and 3. Both '
                'carry a small drop-down arrow.',
                'A boxed pair of toolbar icons: a capital A with a small upward caret '
                'beside it, and a capital A with a small downward caret beside it.',
                'A boxed pair of toolbar icons: four stacked lines with an arrow pointing '
                'left into them, and four stacked lines with an arrow pointing right '
                'into them.',
            ],
        },
        39: {
            'prompt': 'email composer controls',
            'alts': [
                'The word "To" in grey, as it is printed beside a field in an email '
                'composing window.',
                'The word "Subject" in grey, as it is printed beside a field in an email '
                'composing window.',
                'A paperclip, drawn upright with its loop at the top, as it appears on a '
                'button in an email composing window.',
                'A circular smiling face with two dot eyes and a wide curved mouth, as it '
                'appears on a button in an email composing window.',
            ],
        },
    },
    2023: {
        13: {
            'prompt': 'alignment',
            'alts': [
                'A toolbar icon showing four horizontal lines of differing length, all '
                'starting flush at the left edge and ragged on the right.',
                'A toolbar icon showing four horizontal lines of differing length, all '
                'ending flush at the right edge and ragged on the left.',
                'A toolbar icon showing four horizontal lines of differing length, each '
                'centred about a common vertical middle so both edges are ragged.',
                'A toolbar icon showing four horizontal lines all of the same length, '
                'flush at both the left and the right edge.',
            ],
        },
        15: {
            'prompt': 'subscript',
            'alts': [
                'A toolbar icon showing a capital A with a thick horizontal line drawn '
                'beneath it.',
                'A toolbar icon showing a capital A with a small numeral 2 set high, '
                'above the line and to the right of it.',
                'A toolbar icon showing a capital A with a small numeral 2 set low, '
                'below the baseline and to the right of it.',
                'A toolbar icon showing a capital U with a thick horizontal line drawn '
                'beneath it.',
            ],
        },
    },
    2024: {
        11: {
            'prompt': 'undo',
            'alts': [
                'A toolbar icon showing a curved arrow that loops round and points to the '
                'left.',
                'A toolbar icon showing a curved arrow that loops round and points to the '
                'right.',
                'A toolbar icon showing a clipboard with a written sheet of paper laid '
                'over its lower right corner.',
                'A toolbar icon showing a capital S with a horizontal line drawn straight '
                'through its middle.',
            ],
        },
    },
    2025: {
        11: {
            'prompt': 'centre align',
            'alts': [
                'A toolbar icon showing four horizontal lines of differing length, '
                'all ending flush at the right edge and ragged on the left.',
                'A toolbar icon showing four horizontal lines all of the same length, '
                'flush at both the left and the right edge.',
                'A toolbar icon showing four horizontal lines of differing length, '
                'each centred about a common vertical middle so both edges are ragged.',
                'A toolbar icon showing four horizontal lines of differing length, '
                'all starting flush at the left edge and ragged on the right.',
            ],
        },
        12: {
            'prompt': 'superscript',
            'alts': [
                'A toolbar icon showing a capital A with a small capital B set low, '
                'below the baseline and to the right of it.',
                'A toolbar icon showing a capital A with a small capital B set high, '
                'above the line and to the right of it.',
                'A toolbar icon showing a capital A with a tick mark across its foot.',
                'A toolbar icon showing two overlapping pages, one behind the other.',
            ],
        },
        13: {
            'prompt': 'strike-through',
            'alts': [
                'A toolbar icon showing a paint brush held at an angle.',
                'A toolbar icon showing a capital A with a thick line drawn beneath it.',
                'A toolbar icon showing a capital S with a horizontal line drawn straight '
                'through its middle.',
                'A toolbar icon showing a capital U with a line drawn beneath it.',
            ],
        },
    },
}


# year -> question -> {prompt, alts}
#
# The 2x2 kind. Both of these are questions the text layer cannot express at
# all: the options are drawings, and what OCR or a text read returns is the
# handful of labels printed over them.
DIAGRAM_QUESTIONS = {
    2020: {
        35: {
            'prompt': 'equivalent logic circuit',
            # Shapes only. Writing "a NAND gate" here would hand the question
            # to a screen-reader user as a free mark while a sighted candidate
            # still has to read the drawing — so the description says curved
            # back or flat back, and lets the reader name the gate.
            'alts': [
                'A logic circuit. Input A runs straight into the upper input of a gate '
                'drawn with a curved back and a pointed nose; input B passes through a '
                'small triangle with a circle at its tip and then into the lower input. '
                'A circle sits on the gate\'s output, which is labelled Output.',
                'A logic circuit. Input A passes through a small triangle with a circle '
                'at its tip and then into the upper input of a gate drawn with a curved '
                'back and a pointed nose; input B runs straight into the lower input. '
                'A circle sits on the gate\'s output, which is labelled Output.',
                'A logic circuit. Input A runs straight into the upper input of a gate '
                'drawn with a flat back and a rounded, D-shaped nose; input B passes '
                'through a small triangle with a circle at its tip and then into the '
                'lower input. A circle sits on the gate\'s output, which is labelled '
                'Output.',
                'A logic circuit. Input A passes through a small triangle with a circle '
                'at its tip and then into the upper input of a gate drawn with a flat '
                'back and a rounded, D-shaped nose; input B runs straight into the lower '
                'input. A circle sits on the gate\'s output, which is labelled Output.',
            ],
        },
    },
    2021: {
        23: {
            'prompt': 'rendered HTML table',
            'alts': [
                'A two-column table headed Company Name and Contact Number. ABC Ltd '
                'occupies one tall cell spanning two rows, beside 011-2222222 and '
                '011-9999999 stacked in separate rows; XYZ & Sons sits in a single row '
                'below, beside 011-7777777.',
                'A two-column table headed Company Name and Contact Number. ABC Ltd sits '
                'in a single row beside 011-2222222; XYZ & Sons occupies one tall cell '
                'spanning two rows, beside 011-9999999 and 011-7777777 stacked in '
                'separate rows.',
                'A three-column table whose header row reads Company Name, ABC Ltd, '
                'XYZ & Sons. The row below is labelled Contact Number and holds '
                '011-2222222 under ABC Ltd, with 011-7777777 and 011-9999999 stacked in '
                'two cells under XYZ & Sons.',
                'A three-column table whose header row reads Company Name, XYZ & Sons, '
                'ABC Ltd. The row below is labelled Contact Number and holds 011-2222222 '
                'and 011-9999999 stacked in two cells under XYZ & Sons, with 011-7777777 '
                'in a single tall cell under ABC Ltd.',
            ],
        },
    },
}

MARKER = re.compile(r'^\((\d)\)$')
# What ends the question when no further question number follows it on the page.
PAGE_TAIL = re.compile(r'^(\[see page|OL/\d{4}|#ictfromabc|-\s*\d+\s*-|\d+\s+E\s+I,II)', re.I)
# A cell is inset from its marker so the marker itself is not in the picture,
# and stops short of the next column so a neighbour cannot bleed in.
CELL_INSET_X = 24.0
CELL_GUTTER = 13.0
CELL_HEAD = 9.0


def locate_question(doc, number):
    """(page index, y) where this question number is printed at the left margin."""
    marker = re.compile(rf'^{number}\.\s')
    for index, page in enumerate(doc):
        for block in page.get_text('dict')['blocks']:
            if block['type'] != 0:
                continue
            for line in block['lines']:
                text = ''.join(s['text'] for s in line['spans']).strip()
                if line['bbox'][0] < 120 and marker.match(text):
                    return index, line['bbox'][1]
    return None


def option_row(page, top):
    """The four option icons under `top`, left to right — or None."""
    found = []
    for image in page.get_images(full=True):
        for rect in page.get_image_rects(image[0]):
            if not (top < rect.y0 < top + OPTION_BAND):
                continue
            if rect.width > MAX_ICON or rect.height > MAX_ICON:
                continue
            found.append(rect)

    found.sort(key=lambda r: (r.y0, r.x0))
    rows = []
    for rect in found:
        if rows and abs(rect.y0 - rows[-1][0].y0) <= ROW_BAND:
            rows[-1].append(rect)
        else:
            rows.append([rect])

    for row in rows:
        if len(row) == 4:
            return sorted(row, key=lambda r: r.x0)
    return None


def option_cells(page, top, number):
    """The four option markers below `top`, read as a grid, as four rects.

    The markers are page text, so their coordinates are exact. Columns are their
    distinct x values and rows their distinct y values; a cell runs from its own
    marker to the next column across and the next row down. The last row stops
    at whatever bounds the question — the next question number if there is one
    on the page, otherwise the lowest ink below the markers.
    """
    marks = []
    next_q_y = None
    tail_y = None
    for block in page.get_text('dict')['blocks']:
        if block['type'] != 0:
            continue
        for line in block['lines']:
            text = ''.join(s['text'] for s in line['spans']).strip()
            if line['bbox'][1] <= top - 2:
                continue
            m = MARKER.match(text)
            if m:
                marks.append((int(m.group(1)), line['bbox'][0], line['bbox'][1]))
            elif re.match(rf'^{number + 1}\.\s', text) and line['bbox'][0] < 120:
                next_q_y = min(next_q_y, line['bbox'][1]) if next_q_y else line['bbox'][1]
            elif PAGE_TAIL.match(text):
                tail_y = min(tail_y, line['bbox'][1]) if tail_y else line['bbox'][1]

    marks = sorted({n: (x, y) for n, x, y in sorted(marks, reverse=True)}.items())
    if [n for n, _ in marks] != [1, 2, 3, 4]:
        return None

    xs = sorted({round(x, 0) for _, (x, _) in marks})
    ys = sorted({round(y, 0) for _, (_, y) in marks})
    if len(xs) * len(ys) != 4:
        return None

    # How much of the picture sits ABOVE its own marker. A circuit's top input
    # line and a table's header row both do, and the marker is set against the
    # middle of the cell rather than its top. There is no cheap way to measure
    # it: these papers draw a whole page as one path object, so the per-figure
    # ink bounds `figures.py` relies on are not available here. The row pitch is,
    # and it scales with the thing being drawn — 54 points for the 2021 tables,
    # 41 for the 2020 circuits.
    pitch = (ys[1] - ys[0]) if len(ys) > 1 else 40.0
    head = min(pitch * 0.35, 22.0)

    # The last row runs to whatever ends the question: the next question number,
    # or — when it is the last on the page — the footer. Guessing a depth
    # instead caught the ruled page border and the words "[see page six".
    bottom = next_q_y or tail_y or (page.rect.height - 48)
    bottom = min(bottom - 6, ys[-1] + pitch + 12)

    right = page.rect.width - 50
    cells = []
    for n, (x, y) in marks:
        ci = xs.index(round(x, 0))
        ri = ys.index(round(y, 0))
        x1 = xs[ci + 1] - CELL_GUTTER if ci + 1 < len(xs) else right
        y1 = (ys[ri + 1] - head - 2) if ri + 1 < len(ys) else bottom
        cells.append(pymupdf.Rect(x + CELL_INSET_X, y - head, x1, y1))

    if any(c.width < 40 or c.height < 20 for c in cells):
        return None
    return cells


def all_years():
    """Every year named by either table, so each PDF is opened once."""
    return sorted(set(ICON_QUESTIONS) | set(DIAGRAM_QUESTIONS))


def run():
    rows = []
    skipped = 0

    for year in all_years():
        doc = pymupdf.open(os.path.join(REPO, 'pastpapers', PAPERS[year]))
        out_dir = os.path.join(DEST_IMG, str(year), 'options')
        os.makedirs(out_dir, exist_ok=True)

        work = [('icons', q, spec) for q, spec in ICON_QUESTIONS.get(year, {}).items()]
        work += [('diagram', q, spec) for q, spec in DIAGRAM_QUESTIONS.get(year, {}).items()]

        for kind, q, spec in sorted(work, key=lambda w: w[1]):
            where = locate_question(doc, q)
            if where is None:
                print(f'  ! {year} Q{q}: question number not found in the text layer')
                skipped += 1
                continue

            page = doc[where[0]]
            if kind == 'icons':
                regions = option_row(page, where[1])
                miss = 'no row of exactly four icons below it'
                pad, dpi = PAD, DPI
            else:
                regions = option_cells(page, where[1], q)
                miss = 'the four option markers do not form a 2x2 grid'
                pad, dpi = 0, DIAGRAM_DPI

            if regions is None:
                print(f'  ! {year} Q{q}: {miss} — skipped')
                skipped += 1
                continue

            for i, r in enumerate(regions):
                clip = pymupdf.Rect(r.x0 - pad, r.y0 - pad, r.x1 + pad, r.y1 + pad)
                pix = page.get_pixmap(clip=clip, dpi=dpi)
                name = f'q{q:02d}-opt{i + 1}.png'
                dest = os.path.join(out_dir, name)
                pix.save(dest)
                rows.append({
                    'year': year,
                    'q': q,
                    'option': i + 1,
                    'path': f'/past-papers/{year}/options/{name}',
                    'alt': spec['alts'][i],
                    'kind': kind,
                    'width': pix.width,
                    'height': pix.height,
                    'byteSize': os.path.getsize(dest),
                })
            label = '4 option icons' if kind == 'icons' else '4 option diagrams'
            print(f'  {year} Q{q} ({spec["prompt"]}): {label}')
        doc.close()

    rows.sort(key=lambda r: (r['year'], r['q'], r['option']))
    dest = os.path.join(DEST_JSON, 'past-paper-option-icons.json')
    with open(dest, 'w') as f:
        json.dump(rows, f, indent=1, ensure_ascii=False)
        f.write('\n')
    questions = len({(r['year'], r['q']) for r in rows})
    print(f'{len(rows)} option icons across {questions} questions -> {dest}')
    if skipped:
        print(f'{skipped} questions skipped — they need looking at, not guessing at')


if __name__ == '__main__':
    run()
