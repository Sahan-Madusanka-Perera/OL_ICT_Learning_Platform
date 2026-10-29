# O/L ICT Practice Platform

A practice and examination platform for the Sri Lankan **G.C.E. Ordinary Level ICT**
syllabus. Built so that answering a question changes what the platform knows about the
student, and therefore what it asks next.

Full design rationale: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Running it

Needs Node 20+ and a Postgres 16 database. Nothing else — no cloud account.

```bash
npm install
cp .env.example .env          # set DATABASE_URL

npm run db:migrate            # schema + integrity constraints
npm run db:seed               # syllabus, papers, question bank, demo accounts

npm run dev                   # http://localhost:3000
```

Demo accounts (created by the seed, password `practice-makes-progress`):

| Email | Role | What they see |
|---|---|---|
| `student@example.lk` | student | Dashboard, practice, mistakes, progress |
| `teacher@example.lk` | teacher | Can author and submit questions for review |
| `admin@example.lk` | superadmin | Review queue, publishing, analytics |

```bash
npm test          # 292 tests — domain logic, auth, content integrity, DB
npm run typecheck
npm run build
```

The integration tests run against the database in `DATABASE_URL` and clean up after
themselves. Seed first.

---

## What is where

```
src/
  app/            Routes. Thin — rendering and calling services.
    (marketing)/  landing · syllabus coverage · methodology · privacy · terms
    (auth)/       sign in · sign up
    (student)/    dashboard · practice · session runner · review · progress · mistakes
    (admin)/      overview · review queue · question list

  lib/
    domain/       PURE, no I/O — mastery, spaced repetition, recommendations, scoring
    services/     orchestration: transactions, authorization, cache invalidation
    db/           Drizzle schema, migrations, seed data
    auth/         password hashing, sessions, RBAC matrix, guards
    actions/      Server Actions (every one starts with a guard)

  components/     UI. Radix primitives owned locally.

docs/ARCHITECTURE.md
pastpapers/       16 paper PDFs (15 usable) + Marking Scheme/ (10 official)
public/past-papers/  figures rendered out of the papers, by year
textbooks/        NIE Teacher's Guide + Grade 10/11 textbooks
```

**`lib/domain` is the part to read first.** Mastery, scheduling, recommendation and scoring
are pure functions over plain data, unit-tested without a database. That is where the
educational logic lives, and it is what will be tuned repeatedly once real students arrive.

---

## Three things that are load-bearing

### 1. An unverified answer cannot be published

Official marking schemes are held for **10 of the 15 papers**, so the other 5 have no
official answer at all. Every question therefore carries `answer_confidence`, and it gates publication —
enforced by a database CHECK constraint, not by anyone remembering:

```sql
CHECK (status <> 'published' OR answer_confidence <> 'unverified')
```

An unkeyed past-paper question lands as `draft` + `unverified` and is invisible to students
until a reviewer sets the key and a **second, independent** reviewer approves. Try it: sign
in as the admin, open `/admin/review`, and press Approve without setting a key.

A keyed one lands as `draft` + `official_key`. That is a weaker claim than it looks, and
deliberately so: the key proves what the *paper's* answer was, not that our OCR of the
question is faithful to the paper. It still needs a human read before it can be published.

Where the Department accepted more than one option — seven questions across the corpus,
such as 2018 Q37 and 2025 Q25 — no option is marked correct at all. There is no single
right answer to record, so the seeder records none.

Not every file in `pastpapers/Marking Scheme/` is a marking scheme. Some are photographs of
commercial answer booklets or one teacher's self-described "tentative" working. Those live
in `UNOFFICIAL_ANSWER_SOURCES`, are attributed to whoever published them, and can never
produce an `official_key` or mark an option correct.

### 2. Answers never reach the browser before grading

There are two ways to read a question and they are different functions with different
return types. `getQuestionsForStudent()` selects an explicit column list that does not
include `is_correct`; `getQuestionsForGrading()` is server-only. A test walks the entire
serialised student payload looking for anything answer-shaped and fails if it finds any.

### 3. Mastery refuses to flatter

Progress is a Beta posterior with a `Beta(2,2)` prior, difficulty weighting and a 30-day
recency half-life. Two correct answers read as **67% with no confidence**, not 100% — and
below a real sample size the interface shows no percentage at all. Getting this wrong is the
most likely way a practice app can mislead a student about how ready they are.

---

## Design system

Tokens live in `src/app/globals.css`; nothing hard-codes a colour. Full
rationale in [`DESIGN.md`](DESIGN.md).

- **Palette** — warm paper canvas, near-black ink, a single deep-teal accent
  rationed to the live thing on a screen. Semantic green/amber/red are used
  *only* for correctness, and correctness is never signalled by colour alone:
  every verdict carries an icon and a word as well. Warm brass is reserved for
  past-paper provenance, deliberately not the accent, so "this came from a real
  paper" cannot read as "do this next". Dark mode is a first-class theme with
  its own warm-mixed surfaces, not an inversion.
- **Type** — Fraunces for display (a variable serif with a real optical-size
  axis, so a 56px title and a 15px card title are different cuts rather than one
  drawing scaled), Plus Jakarta Sans for interface and reading, JetBrains Mono
  for data — and in this subject data is half the syllabus. All three
  self-hosted via `next/font`, so there is no third-party font request. Question
  text is 17 px minimum.
- **Form** — cards are a core inside a shell, with the core's radius equal to
  the shell's radius minus the shell's padding. Concentric curves read as a made
  object; drifting ones read as a div. Elevation is ambient and diffused, never
  a hard drop shadow.
- **Icons** — one drawn family in `src/components/ui/icon.tsx`: 20×20 viewBox,
  1.25 stroke optically compensated by size, `currentColor`. No icon package — a
  set pulled in wholesale brings its own stroke weight and sits next to the type
  looking borrowed.
- **Motion** — one curve, `cubic-bezier(0.32, 0.72, 0, 1)`, and exactly two
  authored moments: the explanation panel settling in after an answer and the
  verdict mark landing a beat later on the same curve. Everything else is a
  colour transition. Transform and opacity only, 200–500 ms because the target
  device is a mid-range Android, and all of it respects
  `prefers-reduced-motion`.
- **Meters** — three states that cannot be mistaken for each other: *not
  measured* is a dashed outline with nothing inside, *early estimate* is a
  filled span plus a hatched tail standing for the range still open, *settled*
  is a filled span. A solid bar at 67% after three questions claims a precision
  the posterior does not have.
- **Sound** — synthesised square waves, no audio files: a zero-byte signal on
  mobile data. Off until a student turns it on, because the reader is on a bus.
  A wrong answer gets exactly the same length and loudness as a right one — only
  the pitch differs — and nothing is ever *only* a sound, so muting costs no
  information.
- **BIT** — the one character in the build, in the session title bar. It reports
  your current run of right or wrong answers, which nothing else on screen
  shows, and that is the only reason it exists. It never flatters, never
  celebrates, and is not rendered at all in an exam, where correctness is
  withheld and it would have nothing honest to say.
- **Browser surfaces** — caret, selection, scrollbars, native control accent and
  underline offset are all themed from the palette rather than left at browser
  defaults.
- **States** — every route has a loading skeleton shaped like its real layout
  (the target device is a mid-range Android on mobile data), plus error and
  empty states written in plain language.

## Content status

| | |
|---|---|
| Syllabus | 15 units · 60 topics · 236 subtopics, transcribed from the NIE documents. Grade 10 periods sum to exactly 90, matching the Teacher's Guide. |
| Model questions | **146 published**, covering all 60 syllabus topics, each with an explanation, per-distractor misconceptions and most with an exam tip. Arithmetic answers are re-derived in tests. |
| Figure questions | **16** of those depend on a drawn figure — logic circuits, a flowchart, network topologies, worksheet segments, relational tables. 13 SVGs, 42 KB in total, every one with real alt text. |
| Past papers | 16 indexed, 15 held. **2013 is missing** — the file supplied under that name is byte-identical to 2012. |
| Past-paper questions | **573 of a possible 600 in the platform**, seeded as drafts. **Eight of the fifteen papers are complete at 40/40**: 2010, 2017 and all six born-digital years. |
| Born-digital transcriptions | **240 — all six papers from 2020 to 2025, 40 of 40 each**, read off the PDF text layer rather than OCR'd. |
| Past-paper figures | **37 recovered** from the born-digital papers, attached to 50 questions. The nine scanned years have none. |
| Picture-only options | **40 images across 10 questions** — toolbar icons, four logic circuits, four rendered database tables — each with alt text written by looking at the rendered image. |
| Official marking schemes | **10 of 15 years** — 2012, 2014, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2025. |
| Verified transcriptions | **2025, all 40** — checked question by question against the marking scheme, topics assigned by hand. |
| Answer keys | 398 questions carry an official Department of Examinations answer. The rest stay `unverified` and cannot be published. |
| Third-party answer lists | 2015, 2016 and 2024 have a published answer booklet but **no official scheme**. Recorded separately as a reviewer aid; they can never key a question. |

### Where the remaining 27 questions are

| year | in platform | missing |
|---|---|---|
| 2011 | 32 / 40 | 8 |
| 2014 | 34 / 40 | 6 |
| 2012, 2015, 2016, 2018 | 37 / 40 each | 3 each |
| 2019 | 39 / 40 | 1 |
| everything else | 40 / 40 | — |

All of them are in the nine scanned years, and all of them have survived three
separate attempts: a psm 6 OCR pass, a psm 4 pass, and a per-question rescue at
500 dpi across three segmentation modes. The 2011 paper is the worst because
the file is a photograph of a photocopy. Sourcing cleaner scans of 2011 and
2014 is now the highest-value content task, ahead of further extraction work.

### Two tiers of transcription, and why

The born-digital papers do not all carry the same claim, and collapsing them
into one would overstate five of them:

- **`verified`** — exact text, read against the official marking scheme, every
  topic assigned by hand. 2025 only.
- **`text_layer`** — exact text, topic assigned by the keyword classifier, not
  yet checked against a scheme. 2020–2024.

The gap is not theoretical. Checking 2025 by hand found **22 of its 40 keyword
topics wrong**, 11 of them sitting in the classifier's fallback bucket. So a
`text_layer` row's topic is triage, and `topicSource` records that. Promoting a
year is a person's job.

### What that means for publishing

Extraction grades, deliberately pessimistic — 236 `clean`, 145 `needs_asset`,
183 `needs_repair`, 30 `incomplete`. **168 are both cleanly extracted and
officially keyed**, which is the queue a reviewer should start with: approving
one of those needs no answer research, only a read against the PDF.

No past-paper figure carries alt text. Nothing in the pipeline has looked at
those pictures, so each asset holds an explicit "not yet described" placeholder
rather than a generated description that would reach a screen reader as fact.
Writing those is part of reviewing the question. The 40 **option** images are
the exception — those were described by looking, because for those ten
questions the options *are* the pictures and there is nothing to fall back on.

Nothing extracted is seeded as published. An official key proves what the
*paper's* answer was; it does not prove our transcription is the paper. Both
have to hold, and only a human can confirm the second.

Five years — 2010, 2011, 2015, 2016, 2024 — have a paper but no official
marking scheme. Sourcing those is the single highest-value answer task left.
2013 is the odd case: an answer list exists, but the paper itself does not, so
there is nothing to attach it to.

### The born-digital papers do not need OCR

2020-2025 carry a real text layer, so `borndigital.py` reads the characters the
Department typeset instead of guessing at pixels. All six papers now give up 40
of 40 questions with their options. It found four classes of error the OCR
version could not avoid:

- **Every subscript was gone.** `1110 1110₂` had become `1110 11102` and `65₁₀`
  had become `6510` — which does not look broken, it looks like a different
  number. Font size and baseline say exactly which digits are subscript.
- **Reading order was wrong.** Question 10's A/B/C list had attached itself to
  question 14; question 18's fourth option had swallowed the first line of
  question 19's stimulus; question 38's options arrived 3, 4, 1, 2 because two
  of them are typeset one point higher than the others.
- **22 of 2025's 40 topics were wrong**, 11 of them in the keyword classifier's
  fallback bucket. Those are now assigned by hand.
- **Two papers misnumber an option.** The 2020 paper prints question 4's third
  option as `(2)`; the 2021 paper prints question 8's third as `(5)`. Both are
  the Department's own typo and both are plainly visible in the PDF. A strict
  1,2,3,4 scan used to discard the whole question. They are now transcribed in
  printed order and carry a `sourceDefect` note, so a reviewer is told what the
  paper did instead of being shown a silent repair.

Ten questions have options that are pictures and nothing else. Seven are
toolbar icons; the other three are **not** — 2020 Q35's options are four logic
circuits and 2021 Q23's are four rendered database tables, drawn as vector art
with their labels set as page text over the top. Those two used to arrive as
`["", "Output Output B B A A", "Output", "Output B B"]`, which reads as
extraction damage when the question is perfectly intact and simply not made of
words. All 40 option images are now extracted and described.

### Recovering the scanned years

`ocr_all.py` reads every page twice, at two tesseract page-segmentation modes,
because they fail in different places and the places matter. psm 6 is good at
prose and flattens a four-column option row into one line; psm 4 keeps that
structure and occasionally loses a whole page. On the 2011 paper the primary
pass finds 31 of 40 questions and the alternate finds 36; on 2019 the alternate
collapses to 7 blocks while the primary gets all 40.

`repair.py` merges them, and may only ever **fill gaps** — a question the
primary never found, or one whose options it could not read. A question the
primary read completely is kept, always, even if the alternate disagrees. Two
OCR passes disagreeing is not evidence about which is right, and a merge that
"picks the better one" is really a merge that picks at random twice a page.
That recovered 25 questions.

`rescue.py` then spends real time on whatever is still missing: it works out
which pages a question can be on from the questions either side of it,
re-renders only those at 500 dpi, and runs three segmentation modes over each.
It keeps a result only if the question's own number and four ordered option
markers are present, which is what makes it safe — a rescue pass that accepts
its best guess is a machine for inventing questions. That recovered 10 more.

Re-run or audit the whole pipeline with
[`tools/extract-past-papers`](tools/extract-past-papers/README.md).

### Model questions and their figures

Roughly a quarter of every real Paper I is a picture question, so a bank of
text-only items trains a student for an exam they are not going to sit. The
model questions were written against the NIE Grade 10 and 11 textbooks and the
Teacher's Guide, weighted towards what the papers actually examine most —
number-system conversion, logic gates and algorithms lead by a wide margin.

Their figures are **authored, not recovered**, and that difference decides what
they are allowed to do. `tools/model-figures/build.py` draws them as 1-bit SVG
in the same two values as the interface, so we know exactly what each one shows:
every figure ships **real alt text**, and a figure question can therefore be
published. The extracted past-paper figures cannot, because nothing has read
them. A test asserts that no alt text describes the answer — a description
saying "the output is 0" would make the question trivial for exactly the
students the description exists to serve.

```bash
python3 tools/model-figures/build.py     # -> public/model-questions/*.svg
```

---

## Roadmap

**Shipped (MVP)** — auth · taxonomy · question bank with assets and shared stimuli · MCQ
practice engine · immediate feedback with explanations · answer history · mistake book with
spaced repetition · per-topic mastery · student dashboard · recommendation engine · admin
review workflow with two-approver publishing · student content reports.

**V2** — mock exams and the past-paper runner · achievements · bookmarks UI · question
statistics for admins · weekly mastery snapshots · nightly reconciliation jobs.

**V3** — subscriptions and PayHere · short-answer and structured question types · parent
progress reports · teacher and class features · AI-assisted drafting *behind the same review
gate* · Sinhala and Tamil medium.

Payments, jobs and notifications already sit behind interfaces (`lib/payments`, `JobQueue`,
`Notifier`), so V3 adds adapters rather than rewriting business logic.

---

## Not affiliated

This is an independent product. It is not affiliated with, endorsed by, or connected to the
Department of Examinations or the National Institute of Education. Past-paper questions
remain the property of their respective authorities.
