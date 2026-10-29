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

The nine scanned years, in order:

```bash
python3 tools/extract-past-papers/ocr_all.py     # 1.  render + OCR, two passes (~40 min)
python3 tools/extract-past-papers/parse.py       # 2a. primary pass  -> parsed.json
python3 tools/extract-past-papers/parse.py --psm4 # 2b. alternate    -> parsed.psm4.json
python3 tools/extract-past-papers/repair.py      # 2c. merge the gaps
python3 tools/extract-past-papers/rescue.py      # 2d. 500 dpi, per question (slow)
python3 tools/extract-past-papers/export.py      # 3.  -> seed/data/past-paper-mcqs.json
```

The six born-digital years do not go through any of that:

```bash
python3 tools/extract-past-papers/borndigital.py  # -> past-paper-borndigital.json
python3 tools/extract-past-papers/option-icons.py # -> past-paper-option-icons.json
python3 tools/extract-past-papers/figures.py      # -> past-paper-figures.json
```

Those three read the PDFs directly, take seconds, and never touch `.extract/`.

Intermediate files go to `.extract/` at the repo root (override with `WORKDIR`).
**Step 1 writes ~700 MB of page images to `.extract/png`** — delete that
directory when the run finishes.

## What each step does

**`ocr_all.py`** renders every page at 300 dpi and runs tesseract over it
**twice**, at two page-segmentation modes. It OCRs even the papers that already
carry a text layer, because several of those layers are themselves poor OCR
passes (the 2012 file decodes as `oLl20l2t80-E-r`). It skips the file named
`2013`, which is byte-identical to the 2012 file.

The two passes fail differently, which is the whole point:

| | psm 6 (primary) | psm 4 (alternate) |
|---|---|---|
| 2011 | 31/40 blocks | 36/40 |
| 2014 | 36/40 | 39/40 |
| 2017 | 38/40 | 40/40 |
| 2019 | 40/40 | **7/40** |

psm 6 reads a page as one uniform block and flattens a four-column option row
into a single line, after which the question numbers inside it stop looking
like question numbers. psm 4 keeps the column structure and occasionally loses
a whole page to a mis-detected column. Either alone leaves questions on the
floor.

**`parse.py`** finds question boundaries and splits options. The hard part is
that OCR damages the question numbers themselves, so it works in two passes:
a strict forward scan that can only move ahead and therefore cannot be derailed
by a stray `(3)`, then a repair pass that fills gaps by looking *only* between
the two neighbours the first pass already anchored. That is why `18.` read as
`8.`, or `23.` read as `93.`, is recovered without inventing questions.

**`repair.py`** merges the alternate pass into the primary one, and may only
ever *fill gaps*: a question the primary never found, or one whose options it
could not read. A question the primary read completely is kept, always, even if
the alternate disagrees — two OCR passes disagreeing is not evidence about which
is right, and a merge that "picks the better one" picks at random twice a page.
Each repaired question is marked `pass: psm4` so the provenance reaches the seed.

**`rescue.py`** is the last and most expensive attempt, for what both whole-page
passes missed. It interpolates which pages a question can be on from the
questions either side of it, re-renders only those at 500 dpi, and runs three
segmentation modes over each — including psm 11, which is useless on a whole
page and occasionally the only thing that reads a four-column option row. It
keeps a result only if the question's own number *and* four ordered option
markers are present in the output. That constraint is what makes it safe to run:
a rescue pass that accepts its best guess is a machine for inventing questions.

**`export.py`** assigns a syllabus topic by keyword (from `topics.py`, shared
with the born-digital extractor) and grades the extraction.

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
| Questions in the platform | **573 of a possible 600** |
| Papers complete at 40/40 | **8** — 2010, 2017, and all six born-digital years |
| Recovered by the alternate pass | 25 |
| Recovered at 500 dpi | 10 |
| Figures extracted | 37, from the 6 born-digital papers (2020-2025) |
| Picture-only option images | 40 across 10 questions, each described |
| Official marking schemes | 10 years — 2012, 2014, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2025 |
| Questions with an official answer | 398 |

### What is still missing, and why

| year | in platform | missing |
|---|---|---|
| 2011 | 32 / 40 | 8 |
| 2014 | 34 / 40 | 6 |
| 2012, 2015, 2016, 2018 | 37 / 40 | 3 each |
| 2019 | 39 / 40 | 1 |

All 27 are in the scanned years and all have survived every pass above. The
2011 paper is the worst because the file is a photograph of a photocopy — more
extraction cleverness will not fix a source that does not hold the ink. A
cleaner scan of 2011 and 2014 would be worth more than any further work here.

Five years — 2010, 2011, 2015, 2016, 2024 — have a paper but no official
marking scheme. Their questions cannot be published until a key is sourced.

The nine scanned years have no figures at all, which is the larger remaining
gap: 145 questions across the corpus are graded `needs_asset`, and only the
2020-2025 share of them can currently be given the picture they ask about.

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
