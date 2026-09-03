"""Extract image-only answer options from a born-digital paper.

Some questions have no text in their options at all. The 2025 paper has three
in a row — questions 11, 12 and 13 ask which word-processor *icon* does a job,
and each option is a 23-point icon and nothing else. `borndigital.py` detects
them and records `imageOptions: true`, but a question whose four options are
blank is not answerable; the pictures have to come too.

The schema has had a place for this since the beginning: `question_options`
carries an `asset_id`, and the comment above it says a large share of real O/L
ICT MCQs are picture questions. This is the first thing to actually fill it.

Icons are matched to option numbers by x-position, using the same column
centres the option markers sit on, so an icon is never guessed at — if a row
does not have exactly four icons in the expected columns, it is skipped and
reported rather than half-assigned.

    python3 tools/extract-past-papers/option-icons.py
"""
import json
import os

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

# year -> question -> (0-based page, expected icon row y, alt text per option)
# Alt text is written by *looking at* the extracted icons, which is the one step
# here that cannot be automated: an option nobody has described is unanswerable
# on a screen reader, and these four options are only pictures.
#
# Worth recording that the first draft of these descriptions was written from
# the question wording before the icons had been rendered, and most of the
# twelve were wrong — question 12's options are a capital A, not the capital X
# the stem mentions, and question 13 leads with a format-painter brush that the
# wording gives no hint of. Alt text guessed from context is not alt text.
ICON_QUESTIONS = {
    2025: {
        11: {
            'page': 1,
            'y': (305, 340),
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
            'page': 1,
            'y': (360, 395),
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
            'page': 1,
            'y': (426, 460),
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

PAPERS = {2025: 'ol-2025-english_2026-08-14_04-37-43.pdf'}

# The four option columns, as x-centres. Icons are matched to the nearest.
COLUMNS = [92, 216, 322, 431]
COLUMN_TOLERANCE = 24


def run():
    rows = []
    for year, questions in sorted(ICON_QUESTIONS.items()):
        doc = pymupdf.open(os.path.join(REPO, 'pastpapers', PAPERS[year]))
        out_dir = os.path.join(DEST_IMG, str(year), 'options')
        os.makedirs(out_dir, exist_ok=True)

        for q, spec in sorted(questions.items()):
            page = doc[spec['page']]
            lo, hi = spec['y']

            found = {}
            for im in page.get_images(full=True):
                for r in page.get_image_rects(im[0]):
                    if not (lo <= r.y0 <= hi):
                        continue
                    # The full-width rules that sit on the same band are not icons.
                    if r.width > 60 or r.height > 60:
                        continue
                    for i, cx in enumerate(COLUMNS):
                        if abs(r.x0 - cx) <= COLUMN_TOLERANCE:
                            found[i] = r
                            break

            if len(found) != 4:
                print(f'  ! {year} Q{q}: found {len(found)} icons, expected 4 — skipped')
                continue

            for i in range(4):
                r = found[i]
                clip = pymupdf.Rect(r.x0 - PAD, r.y0 - PAD, r.x1 + PAD, r.y1 + PAD)
                pix = page.get_pixmap(clip=clip, dpi=DPI)
                name = f'q{q:02d}-opt{i + 1}.png'
                dest = os.path.join(out_dir, name)
                pix.save(dest)
                rows.append({
                    'year': year,
                    'q': q,
                    'option': i + 1,
                    'path': f'/past-papers/{year}/options/{name}',
                    'alt': spec['alts'][i],
                    'width': pix.width,
                    'height': pix.height,
                    'byteSize': os.path.getsize(dest),
                })
            print(f'  {year} Q{q} ({spec["prompt"]}): 4 option icons')
        doc.close()

    dest = os.path.join(DEST_JSON, 'past-paper-option-icons.json')
    with open(dest, 'w') as f:
        json.dump(rows, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print(f'{len(rows)} option icons -> {dest}')


if __name__ == '__main__':
    run()
