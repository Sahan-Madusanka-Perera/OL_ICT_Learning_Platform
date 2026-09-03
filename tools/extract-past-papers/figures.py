"""Extract question figures from the born-digital papers (2020-2025).

WHY THIS IS A SEPARATE STEP FROM THE OCR PIPELINE
-------------------------------------------------
`ocr_all.py` renders a page, hands the pixels to Tesseract and throws them
away. That is the only thing it can do for the scanned years, but it is the
wrong thing for 2020-2025: those six PDFs carry a real text layer and real
image objects, so their figures can be lifted out exactly rather than
reconstructed. A logic circuit that OCR renders as `= A -=)>= CS b t=` is
sitting in the file as vector art the whole time.

This step therefore reads the PDFs directly and never touches `.extract/`.

WHY REGIONS ARE RENDERED, NOT EXTRACTED
---------------------------------------
The obvious approach -- pull each embedded image with `extract_image` -- is
wrong here. The 2020 and 2021 papers hold 131 and 157 image objects across
~16 pages, because a single logic circuit is stored as a dozen separate
strips, and the labels beside it (A, B, Output) are page text drawn over the
top, not part of any of them. Extracting objects gives you fragments with the
labels missing.

So: cluster the image rectangles that sit together into one figure region,
then re-render that region of the page at 300 dpi. Whatever a reader sees
there is what lands in the PNG -- strips, vector strokes and overlaid text
alike.

OWNERSHIP
---------
A figure belongs to the last thing that started above it. Two kinds of thing
can start above it:

  a question       "25. What will be the output if the input N is 4?"
  a shared header  "Questions 25, 26, 27 and 28 are based on the following
                    flow-chart:"

The second matters. On page 4 of the 2025 paper the flow-chart spans y=322 to
y=577, and question 25 starts at y=345 -- *inside* the figure's own vertical
span. Anchoring on the top edge of the figure resolves it to the header, which
is correct: the chart belongs to all four questions, and the schema already
models that as a `stimuli` row.

Usage:  python3 tools/extract-past-papers/figures.py
"""
import json
import os
import re
import sys

try:
    import pymupdf
except ImportError:  # older wheels only ship the deprecated alias
    import fitz as pymupdf

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PAPERS = os.path.join(REPO, 'pastpapers')
IMG_DEST = os.path.join(REPO, 'public', 'past-papers')
JSON_DEST = os.path.join(REPO, 'src', 'lib', 'db', 'seed', 'data')

# The six papers with a text layer and real image objects. The scanned years
# need region *detection* rather than region lookup and are not handled here;
# see the README.
BORN_DIGITAL = {
    2020: 'ol-2020-english_2024-08-13_02-56-27.pdf',
    2021: 'ol-2021-english_2024-08-13_02-55-10.pdf',
    2022: 'ol-2022-english_2024-08-13_02-53-50.pdf',
    2023: 'ol-2023-english_2024-11-29_19-49-37.pdf',
    2024: 'ol-2024-english_2026-01-30_11-49-16.pdf',
    2025: 'ol-2025-english_2026-08-14_04-37-43.pdf',
}

# Line art, and the target device is a mid-range Android on mobile data. 200 dpi
# stays legible when a circuit is zoomed and keeps a typical figure under 300 KB.
RENDER_DPI = 200
PAD = 4          # pt of breathing room around a region, so strokes are not clipped

# ---- what is not a figure --------------------------------------------------
# Page furniture: the exam code strip, the "#ictfromabc" watermark, and the
# ruled box every page of these papers is drawn inside.
HEADER_BAND = 50   # pt from the top of the page
FOOTER_BAND = 50   # pt from the bottom
MIN_REGION_W, MIN_REGION_H = 60, 40   # a cluster smaller than this is decoration


def is_furniture(rect, page_rect):
    """Reject a *primitive* — a single stroke or image object.

    Deliberately permissive about size. A logic circuit is dozens of tiny
    strokes and a truth table is a stack of hairlines; filtering primitives by
    size throws away exactly the figures worth having. Size is judged after
    clustering instead, on the assembled region.
    """
    if rect.width <= 0 or rect.height <= 0:
        return True
    if rect.y1 < HEADER_BAND or rect.y0 > page_rect.height - FOOTER_BAND:
        return True
    # The page border. Not a full-bleed test: the border boxes the type area,
    # so it is ~85% of the page in each dimension rather than ~100%.
    if rect.width > page_rect.width * 0.8 and rect.height > page_rect.height * 0.8:
        return True
    return False


def primitives(page):
    """Every mark on the page that could be part of a figure.

    Vector art is the majority of it. The 2025 paper's three database tables
    are 164 drawing operations and not one image object; reading only
    `get_images()` would miss them, and they are the whole of what questions
    19 to 21 are asking about.
    """
    out = []
    for d in page.get_drawings():
        out.append(pymupdf.Rect(d['rect']))
    for img in page.get_images(full=True):
        for r in page.get_image_rects(img[0]):
            out.append(pymupdf.Rect(r))
    return [r for r in out if not is_furniture(r, page.rect)]


def cluster(rects, gap=10):
    """Union rectangles that sit within `gap` pt of each other.

    A logic circuit stored as twelve strips has twelve touching rects; this
    turns them back into one region. Repeats until nothing merges, because
    merging two rects can bring a third within range.
    """
    boxes = [pymupdf.Rect(r) for r in rects]
    merged = True
    while merged:
        merged = False
        out = []
        for b in boxes:
            for i, o in enumerate(out):
                grown = pymupdf.Rect(o.x0 - gap, o.y0 - gap, o.x1 + gap, o.y1 + gap)
                if grown.intersects(b):
                    out[i] = o | b
                    merged = True
                    break
            else:
                out.append(b)
        boxes = out
    return boxes


# ---- anchors ---------------------------------------------------------------
QNUM = re.compile(r'^\s*(\d{1,2})\s*[.)]\s+\S')
# Three phrasings are in use across these six papers, and all three appear:
#   "Questions 25, 26, 27 and 28 are based on the following flow-chart:"
#   "Questions 14 and 15 are based on the following part of a spreadsheet"
#   "Questions 19 to 21 are based on the following partly shown database tables"
SHARED = re.compile(
    r'questions?\s+(\d{1,2}(?:\s*(?:,|and|&|to|-|–)\s*\d{1,2})+)'
    r'\s*(?:are|is)\s+based\s+(?:on|upon)',
    re.I,
)
RANGE = re.compile(r'(\d{1,2})\s*(?:to|-|–)\s*(\d{1,2})', re.I)


def shared_questions(spec):
    """'19 to 21' -> [19, 20, 21];  '25, 26, 27 and 28' -> [25, 26, 27, 28]."""
    m = RANGE.search(spec)
    if m:
        lo, hi = int(m.group(1)), int(m.group(2))
        if 1 <= lo < hi <= 40:
            return list(range(lo, hi + 1))
    nums = [int(n) for n in re.findall(r'\d{1,2}', spec)]
    return [n for n in nums if 1 <= n <= 40]
# Left margin: question numbers are flush left, option markers are indented.
QNUM_MAX_X = 120


def anchors_on(page):
    """Question and shared-stimulus starts on one page, in reading order."""
    found = []
    text = page.get_text('dict')
    for block in text['blocks']:
        if block['type'] != 0:
            continue
        for line in block['lines']:
            body = ''.join(s['text'] for s in line['spans']).strip()
            if not body:
                continue
            x0, y0 = line['bbox'][0], line['bbox'][1]

            m = SHARED.search(body)
            if m:
                nums = shared_questions(m.group(1))
                if nums:
                    found.append({'y': y0, 'kind': 'shared', 'questions': nums,
                                  'text': body})
                continue

            m = QNUM.match(body)
            if m and x0 <= QNUM_MAX_X:
                n = int(m.group(1))
                if 1 <= n <= 40:
                    found.append({'y': y0, 'kind': 'question', 'questions': [n],
                                  'text': body})
    found.sort(key=lambda a: a['y'])
    return found


def owner_of(region, anchors, carried):
    """The last anchor starting at or above the top edge of `region`."""
    above = [a for a in anchors if a['y'] <= region.y0 + 2]
    return above[-1] if above else carried


def slug(anchor):
    qs = anchor['questions']
    if anchor['kind'] == 'shared' or len(qs) > 1:
        return 'shared-' + '-'.join(f'{q:02d}' for q in qs)
    return f'q{qs[0]:02d}'


def run():
    manifest = []
    for year, filename in sorted(BORN_DIGITAL.items()):
        path = os.path.join(PAPERS, filename)
        if not os.path.exists(path):
            print(f'{year}: MISSING {filename}', file=sys.stderr)
            continue

        doc = pymupdf.open(path)
        out_dir = os.path.join(IMG_DEST, str(year))
        os.makedirs(out_dir, exist_ok=True)

        carried = None           # anchor continuing from the previous page
        seen = {}                # slug -> count, for the a/b suffix
        found = 0

        for pno, page in enumerate(doc):
            anchors = anchors_on(page)

            # One figure per owner per page. The 2025 database stimulus is three
            # separate bordered tables with their captions drawn as page text
            # between them; as three regions it is three meaningless crops, and
            # as one it is the thing questions 19 to 21 actually refer to.
            groups = {}
            for region in sorted(cluster(primitives(page)), key=lambda r: r.y0):
                if region.width < MIN_REGION_W or region.height < MIN_REGION_H:
                    continue
                owner = owner_of(region, anchors, carried)
                if owner is None:
                    continue
                key = (owner['kind'], tuple(owner['questions']))
                if key in groups:
                    groups[key] = (owner, groups[key][1] | region)
                else:
                    groups[key] = (owner, region)

            for owner, region in sorted(groups.values(), key=lambda g: g[1].y0):
                base = slug(owner)
                seen[base] = seen.get(base, 0) + 1
                name = base if seen[base] == 1 else f'{base}-{seen[base]}'

                clip = pymupdf.Rect(region.x0 - PAD, region.y0 - PAD,
                                    region.x1 + PAD, region.y1 + PAD) & page.rect
                pix = page.get_pixmap(clip=clip, dpi=RENDER_DPI)
                rel = f'{year}/{name}.png'
                dest = os.path.join(out_dir, f'{name}.png')
                pix.save(dest)

                manifest.append({
                    'year': year,
                    'questions': owner['questions'],
                    'shared': owner['kind'] == 'shared' or len(owner['questions']) > 1,
                    'path': f'/past-papers/{rel}',
                    'page': pno + 1,
                    'width': pix.width,
                    'height': pix.height,
                    'byteSize': os.path.getsize(dest),
                    # What the reviewer has to replace. It is deliberately not a
                    # description: nothing here has looked at the picture.
                    'altText': None,
                    'anchorText': owner['text'][:120],
                })
                found += 1

            # These files are "E-I,II" -- Paper I and Paper II bound together,
            # and Paper II is full of figures of its own. Question 40 is the
            # last thing in Paper I, so once its page is done, stop. Without
            # this, every structured-question diagram in the second half of the
            # PDF lands on question 40 by way of the carried anchor.
            if any(40 in a['questions'] for a in anchors):
                break

            if anchors:
                carried = anchors[-1]

        doc.close()
        print(f'{year}: {found} figures')

    manifest.sort(key=lambda r: (r['year'], r['questions'][0], r['path']))
    os.makedirs(JSON_DEST, exist_ok=True)
    with open(os.path.join(JSON_DEST, 'past-paper-figures.json'), 'w') as f:
        json.dump(manifest, f, indent=1, ensure_ascii=False)
        f.write('\n')

    shared = sum(1 for r in manifest if r['shared'])
    covered = {(r['year'], q) for r in manifest for q in r['questions']}
    print(f'\n{len(manifest)} figures, {shared} shared across a question group')
    print(f'{len(covered)} questions carry at least one figure')


if __name__ == '__main__':
    run()
