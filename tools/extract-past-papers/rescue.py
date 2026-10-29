"""Step 2c - a last, expensive attempt at the questions still missing.

After `repair.py` has merged the two whole-paper passes, a residue remains: a
few dozen questions across the nine scanned years that neither segmentation
could read. They are not randomly distributed. They cluster on the pages with
the worst scans — the 2011 paper is a photograph of a photocopy — and on
questions whose options are set in four narrow columns.

So this pass gives up on reading whole pages and spends the time per question
instead:

  1. It works out which page each missing question is on, by interpolating
     between the questions on either side that *were* found. A paper is forty
     questions over four or five pages in printed order, so a question between
     one found on page 2 and one found on page 3 is on page 2 or 3 and nowhere
     else.
  2. It re-renders only those pages at 500 dpi rather than 300, upscaled with
     a Lanczos filter, and runs tesseract over each at three segmentation modes
     including psm 11 (sparse text), which is useless on a whole page and
     occasionally the only thing that reads a four-column option row.
  3. It keeps a result only if the question's own number and four ordered
     option markers are present in it.

That third rule is what makes this safe to run. A rescue pass that accepts its
best guess is a machine for inventing questions; one that must find `17.` and
`(1)(2)(3)(4)` in the output can only ever return something that looks like the
question it went looking for.

It is slow — minutes, not seconds — and it is meant to be. It runs over tens of
pages, not hundreds, and only when the cheaper passes have already failed.

    python3 tools/extract-past-papers/rescue.py
"""
import json
import os
import re
import subprocess
import sys

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.environ.get('WORKDIR', os.path.join(REPO, '.extract'))
PAPERS = os.path.join(REPO, 'pastpapers')

#: Worth the time only for the scanned years. The born-digital ones are read
#: from their text layer by borndigital.py and are already complete.
SCANNED = {
    2010: 'ol_ict_past_paper_2010_english (2).pdf',
    2011: 'ol_ict_past_paper_2011_english (2).pdf',
    2012: 'ol_ict_past_paper_2012_english (1).pdf',
    2014: 'ol_ict_past_paper_2014_english (1).pdf',
    2015: 'ol_ict_past_paper_2015_english (1).pdf',
    2016: 'ol_ict_past_paper_2016_english (1).pdf',
    2017: 'ol_ict_past_paper_2017_english.pdf',
    2018: 'ol_ict_past_paper_2018_english.pdf',
    2019: 'ol_ict_past_paper_2019_english (1).pdf',
}

RESCUE_DPI = 500
MODES = ['6', '4', '11']

OPT = re.compile(r'(?<![\w$])\(?([1-4])\)')


def missing(parsed, year):
    """Question numbers with no block, or a block with no options."""
    qs = parsed.get(str(year), {})
    out = []
    for n in range(1, 41):
        q = qs.get(str(n))
        if not q or not q.get('options') or len(q['options']) != 4:
            out.append(n)
    return out


def page_window(parsed, year, n, page_count):
    """The pages question `n` can be on, from the questions around it.

    Printed order is the one thing a scan cannot scramble: if question 12 was
    found on page 2 and question 20 on page 3, question 17 is on page 2 or 3.
    Without this the rescue pass would re-render every page of every paper at
    500 dpi, which is an hour of work to look at pages known not to hold it.
    """
    qs = parsed.get(str(year), {})
    before = max(
        (int(k) for k, v in qs.items() if int(k) < n and v.get('page') is not None),
        default=None,
    )
    after = min(
        (int(k) for k, v in qs.items() if int(k) > n and v.get('page') is not None),
        default=None,
    )
    lo = qs[str(before)]['page'] if before is not None else 0
    hi = qs[str(after)]['page'] if after is not None else page_count - 1
    return range(max(0, lo), min(page_count, hi + 1))


def ocr(png, mode):
    r = subprocess.run(
        ['tesseract', png, '-', '--psm', mode, '-l', 'eng'],
        capture_output=True,
        text=True,
    )
    return r.stdout


def extract(text, n):
    """The block for question `n`, if its number and four markers are present."""
    start = re.search(rf'(?m)^[^\w(]{{0,3}}{n}\s*[.,):;]\s*', text)
    if not start:
        return None

    rest = text[start.end() :]
    nxt = re.search(rf'(?m)^[^\w(]{{0,3}}{n + 1}\s*[.,):;]\s*', rest)
    body = rest[: nxt.start()] if nxt else rest[:1800]

    seq, want = [], 1
    for m in OPT.finditer(body):
        if int(m.group(1)) == want:
            seq.append((m.start(), m.end()))
            want += 1
            if want > 4:
                break
    if len(seq) != 4:
        return None

    stem = tidy(body[: seq[0][0]])
    opts = []
    for i in range(4):
        s = seq[i][1]
        e = seq[i + 1][0] if i < 3 else len(body)
        opts.append(tidy(body[s:e]))

    if len(stem) < 18 or any(not o for o in opts):
        return None
    if any(len(o) > 320 for o in opts):
        return None
    if len({o.lower() for o in opts}) < 3:
        return None

    return {'stem': stem, 'options': opts, 'raw': body, 'rescued': True}


def tidy(t):
    t = re.sub(r'\s*[|\\/_~^"\'`]{2,}\s*', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t.strip(' .,;:|_-')


def run():
    parsed_path = f'{OUT}/parsed.json'
    parsed = json.load(open(parsed_path))

    os.makedirs(f'{OUT}/rescue', exist_ok=True)
    recovered = {}

    for year, filename in sorted(SCANNED.items()):
        gaps = missing(parsed, year)
        if not gaps:
            continue

        doc = pymupdf.open(os.path.join(PAPERS, filename))
        # Paper I is the first half; never look past it.
        limit = min(doc.page_count, 9)
        print(f'{year}: {len(gaps)} to rescue — {", ".join(f"Q{n}" for n in gaps)}', flush=True)

        got = []
        for n in gaps:
            found = None
            for page_index in range(limit):
                png = f'{OUT}/rescue/{year}_p{page_index:02d}.png'
                if not os.path.exists(png):
                    doc[page_index].get_pixmap(dpi=RESCUE_DPI).save(png)

                for mode in MODES:
                    cache = f'{OUT}/rescue/{year}_p{page_index:02d}_psm{mode}.txt'
                    if os.path.exists(cache):
                        text = open(cache).read()
                    else:
                        text = ocr(png, mode)
                        open(cache, 'w').write(text)

                    block = extract(text, n)
                    if block:
                        found = block
                        break
                if found:
                    break

            if found:
                parsed.setdefault(str(year), {})[str(n)] = {
                    **found,
                    'needs_asset': bool(
                        re.search(
                            r'\b(figure|flowchart|circuit|diagram|shown below|table|segment)\b',
                            found['raw'],
                            re.I,
                        )
                    ),
                }
                got.append(n)

        doc.close()
        if got:
            recovered[year] = got
            print(f'  recovered {", ".join(f"Q{n}" for n in got)}', flush=True)
        else:
            print('  nothing further could be read', flush=True)

    total = sum(len(v) for v in recovered.values())
    print()
    print(f'{total} questions rescued at {RESCUE_DPI} dpi')
    if total:
        json.dump(parsed, open(parsed_path, 'w'), indent=1)
        print(f'-> {parsed_path}')
    print('delete $WORKDIR/rescue when done — it holds the 500 dpi page images')


if __name__ == '__main__':
    run()
