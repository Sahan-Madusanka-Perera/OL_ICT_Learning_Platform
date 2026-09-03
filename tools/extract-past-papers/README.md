# Past-paper extraction

Turns the PDFs in `pastpapers/` into `src/lib/db/seed/data/past-paper-mcqs.json`
(the question text) and `past-paper-figures.json` + `public/past-papers/` (the
pictures those questions refer to).

This exists so that the question bank is **reproducible and auditable**. Nobody
should have to trust that 580 questions were transcribed correctly; they should
be able to re-run this and diff the result.

## Requirements

```bash
brew install tesseract          # OCR
pip install pymupdf             # PDF rendering
```

## Running it

```bash
python3 tools/extract-past-papers/ocr_all.py    # 1. render + OCR  (slow, ~20 min)
python3 tools/extract-past-papers/parse.py      # 2. text -> question blocks
python3 tools/extract-past-papers/export.py     # 3. -> seed/data/past-paper-mcqs.json
python3 tools/extract-past-papers/figures.py   # 4. -> seed/data/past-paper-figures.json
```

Step 4 is independent of steps 1-3 and takes seconds: it reads the PDFs
directly and never touches `.extract/`.

Intermediate files go to `.extract/` at the repo root (override with `WORKDIR`).
**Step 1 writes ~700 MB of page images to `.extract/png`** — delete that
directory when the run finishes.

## What each step does

**`ocr_all.py`** renders every page at 300 dpi and runs tesseract over it. It
OCRs even the papers that already carry a text layer, because several of those
layers are themselves poor OCR passes (the 2012 file decodes as `oLl20l2t80-E-r`).
It skips the file named `2013`, which is byte-identical to the 2012 file.

**`parse.py`** finds question boundaries and splits options. The hard part is
that OCR damages the question numbers themselves, so it works in two passes:
a strict forward scan that can only move ahead and therefore cannot be derailed
by a stray `(3)`, then a repair pass that fills gaps by looking *only* between
the two neighbours the first pass already anchored. That is why `18.` read as
`8.`, or `23.` read as `93.`, is recovered without inventing questions.

**`export.py`** assigns a syllabus topic by keyword and grades the extraction.

**`figures.py`** recovers the pictures, for the six papers that can give them
up. See below — it works on completely different evidence from the other three
steps.

## Figures

For a large share of O/L ICT questions the picture *is* the question. "Consider
the following logic circuit" cannot be answered from its text, and OCR does not
merely damage a circuit — it emits `= A —=)>= CS b t=` and moves on. No amount
of repairing the stem recovers it.

Six papers can be made to give their figures up exactly. 2020-2025 are
born-digital: real text layer, real image objects, real vector art. `figures.py`
reads those PDFs directly and:

1. collects every mark on the page — vector drawing rects *and* image rects;
2. drops page furniture (the ruled border, header and footer bands);
3. clusters what is left, so a circuit stored as twelve separate strips becomes
   one region;
4. re-renders that region from the page at 200 dpi.

Rendering rather than extracting matters. The 2020 and 2021 papers hold 131 and
157 image objects each, because one circuit is a dozen strips and its labels
(A, B, Output) are page text drawn over the top. `extract_image` returns
fragments with the labels missing; re-rendering returns what a reader sees. The
2025 paper's three database tables go further — they are 164 drawing operations
and *no* image object at all.

**Ownership.** A figure belongs to the last thing that started above it: either
a question, or a shared header (`Questions 19 to 21 are based on the following
partly shown database tables`). The second is why anchoring uses the figure's
top edge — on page 4 of the 2025 paper the flow-chart spans y=322-577 while
question 25 starts at y=345, *inside* it. The header wins, and the figure is
seeded as one `stimuli` row serving all four questions.

**The Paper I cutoff.** These files are `E-I,II` — both papers bound together,
and Paper II is full of figures of its own. Extraction stops after the page
carrying question 40. Without that, every structured-question diagram in the
second half of the PDF lands on question 40: the first run produced nine
figures for 2020 Q40 alone.

**Alt text is never generated.** Nothing in this tool has looked at a picture,
so `altText` is emitted as null and the seeder writes an explicit "not yet
described" placeholder. A plausible generated description would reach a screen
reader as fact.

The extractor errs towards capturing too much — a few regions are option lists
drawn with vector arrows rather than real diagrams. That is the safe direction:
a spurious image in the review queue costs a reviewer a glance, a missing one
costs a student the question.

### Why only six papers

A text layer is not enough. 2012, 2016 and 2017 have one, but it is OCR baked
over a photograph: each page is a single full-bleed image with zero vector
drawings, so there are no figure regions to find — only ink. Their question
*text* can be located by coordinate, which makes them the natural next target,
but the figures need region detection from the raster rather than region
lookup. That work is not done.

## The extraction grades

Grading is deliberately pessimistic — a question wrongly called `clean` costs a
reviewer's trust, while one wrongly called `needs_repair` costs a minute.

| grade | meaning |
|---|---|
| `clean` | four options recovered, no damage signal |
| `needs_asset` | refers to a figure/table/circuit not yet captured, or its options only differ when that figure is present |
| `needs_repair` | a lost subscript or exponent, non-ASCII speckle, or an implausibly short field |
| `incomplete` | four options could not be recovered |

`clean` is a claim about *extraction*, never about correctness or fitness to
serve. Nothing this tool produces is publishable without human review.

## Answer keys are NOT produced here

`answer-keys.json` in this directory is **input, not output**. Every marking
scheme stores its Paper I key as a scanned image of a four-column grid sitting
on dotted leader lines, and OCR on that grid is not trustworthy — tesseract
drops and transposes the digits. Each grid was therefore rendered at 400–600 dpi
and read by eye, then spot-checked against questions whose answers can be
derived independently (base conversions, pseudocode traces, logic circuits).

`src/lib/db/seed/answer-keys.ts` is the authority the application uses; this
JSON records what was read, so the two can be diffed. The emitted question JSON
deliberately does **not** carry answers — the loader joins on year and question
number, so the key and the question text cannot drift apart.

To re-read a grid:

```python
import pymupdf
d = pymupdf.open('pastpapers/Marking Scheme/<file>.pdf')
d[<page-1>].get_pixmap(dpi=500).save('grid.png')
```

Page numbers for each year are recorded in `answer-keys.ts`.

## Coverage today

| | |
|---|---|
| Papers held | 15 (2013 is missing — the supplied file duplicates 2012) |
| Questions extracted | 580 of a possible 600 |
| Figures extracted | 37, from the 6 born-digital papers (2020-2025) |
| Questions carrying a figure | 53 — 50 of which have a question row to attach to |
| Official marking schemes | 10 years — 2012, 2014, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2025 |
| Questions with an official answer | 392 |

Five years — 2010, 2011, 2015, 2016, 2024 — have a paper but no official
marking scheme. Their questions cannot be published until a key is sourced.

The nine scanned years have no figures at all, which is the larger gap: 140
questions across the corpus are graded `needs_asset`, and only the 2020-2025
share of them can currently be given the picture they ask about.

## Not every file in `Marking Scheme/` is a marking scheme

Check the provenance before trusting a new file. An official scheme is headed
**"Department of Examinations - Sri Lanka"** and **"Confidential"** and carries
the Department's watermark. Files that are *not* official, and are recorded in
`UNOFFICIAL_ANSWER_SOURCES` rather than as keys:

| year | what it actually is |
|---|---|
| 2013 | photographed commercial answer booklet; **and we hold no 2013 paper** |
| 2015 | private answer booklet watermarked with an author's name |
| 2016 | photographed commercial answer booklet |
| 2024 | one teacher's self-described *"Tentative Marking Scheme"*, with `?` for Q34 |

These can shorten a reviewer's research. They must never key a question.
