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
npm test          # 191 tests — domain logic, auth, content integrity, DB
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

Tokens live in `src/app/globals.css`; nothing hard-codes a colour.

- **Palette** — cool off-white canvas, single deep-teal accent, warm brass reserved for
  past-paper provenance. Semantic green/amber/red are used *only* for correctness, and
  correctness is never signalled by colour alone: every verdict carries an icon and a word.
  All 15 foreground/background pairs clear WCAG AA.
- **Type** — Archivo for display, Source Sans 3 for interface, both self-hosted via
  `next/font` so there is no third-party font request. Question text is 17 px minimum.
- **Icons** — one drawn family in `src/components/ui/icon.tsx`: 20×20 viewBox, 1.6 stroke,
  `currentColor`. No Unicode glyphs standing in for icons — a `✓` pasted into a button
  inherits the text font's weight and sits differently everywhere it appears.
- **Motion** — exactly one authored moment: the answer reveal, where the panel settles and
  the verdict mark lands a beat later on the same exponential ease-out. Everything else is
  a colour transition. All of it respects `prefers-reduced-motion`.
- **Sound** — synthesised square waves, no audio files: a one-bit waveform for a one-bit
  interface, and zero bytes on mobile data. Off until a student turns it on, because the
  reader is on a bus. A wrong answer gets exactly the same length and loudness as a right
  one — only the pitch differs — and nothing is ever *only* a sound, so muting costs no
  information.
- **BIT** — the one character in the build, in the session title bar. It reports your
  current run of right or wrong answers, which nothing else on screen shows, and that is
  the only reason a design system banning decorative pixel art allows it. It never
  flatters, never celebrates, and is not rendered at all in an exam, where correctness is
  withheld and it would have nothing honest to say.
- **Browser surfaces** — caret, selection, scrollbars, native control accent and underline
  offset are all themed from the palette rather than left at browser defaults.
- **States** — every route has a loading skeleton shaped like its real layout (the target
  device is a mid-range Android on mobile data), plus error and empty states written in
  plain language.

---

## Content status

| | |
|---|---|
| Syllabus | 15 units · 60 topics · 236 subtopics, transcribed from the NIE documents. Grade 10 periods sum to exactly 90, matching the Teacher's Guide. |
| Model questions | **146 published**, covering all 60 syllabus topics, each with an explanation, per-distractor misconceptions and most with an exam tip. Arithmetic answers are re-derived in tests. |
| Figure questions | **16** of those depend on a drawn figure — logic circuits, a flowchart, network topologies, worksheet segments, relational tables. 13 SVGs, 42 KB in total, every one with real alt text. |
| Past papers | 16 indexed, 15 held. **2013 is missing** — the file supplied under that name is byte-identical to 2012. |
| Past-paper questions | **580 of a possible 600 extracted** from all 15 held papers, seeded as drafts. |
| Past-paper figures | **37 recovered** from the 6 born-digital papers (2020-2025), attached to 50 questions. The 9 scanned years have none. |
| Official marking schemes | **10 of 15 years** — 2012, 2014, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2025. |
| Verified transcriptions | **2025, all 40** — read off the PDF text layer rather than OCR'd, checked question by question against the marking scheme, topics assigned by hand. Includes 12 picture-only answer options. |
| Answer keys | 392 questions carry an official Department of Examinations answer. The other 188 stay `unverified` and cannot be published. |
| Third-party answer lists | 2015, 2016 and 2024 have a published answer booklet but **no official scheme**. Recorded separately as a reviewer aid; they can never key a question. |

### What that means for publishing

Extraction is OCR, so every question carries an honest grade — 228 `clean`,
140 `needs_asset`, 161 `needs_repair`, 51 `incomplete`. **162 are both cleanly
extracted and officially keyed**, which is the queue a reviewer should start
with: approving one of those needs no answer research, only a read against
the PDF.

`needs_asset` is the grade that had no remedy until recently. For a large share
of O/L ICT questions the picture *is* the question — "Consider the following
logic circuit" is unanswerable without the circuit, and OCR renders one as
`= A —=)>= CS b t=`. The six papers from 2020 on are born-digital, so their
figures can be recovered exactly rather than transcribed: 37 of them, now
attached to 50 questions as `stimuli` rows, 8 of those shared across a question
group the way the paper shares them. The nine scanned years still have none,
and that is the larger remaining content gap.

No figure carries alt text. Nothing in the pipeline has looked at a picture, so
each asset holds an explicit "not yet described" placeholder rather than a
generated description that would reach a screen reader as fact. Writing those is
part of reviewing the question.

Nothing extracted is seeded as published. An official key proves what the
*paper's* answer was; it does not prove our transcription is the paper. Both
have to hold, and only a human can confirm the second.

Five years — 2010, 2011, 2015, 2016, 2024 — have a paper but no official
marking scheme. Sourcing those is the single highest-value content task left.
2015, 2016 and 2024 do have a third-party answer booklet, which shortens a
reviewer's research but is not an authority and never keys a question on its
own. 2013 is the odd case: an answer list exists, but the paper itself does
not, so there is nothing to attach it to.

### The born-digital papers do not need OCR

2020-2025 carry a real text layer, so `borndigital.py` reads the characters the
Department typeset instead of guessing at pixels. For 2025 that has been done
and checked against the marking scheme, all 40 questions. It found three classes
of error the OCR version could not avoid:

- **Every subscript was gone.** `1110 1110₂` had become `1110 11102` and `65₁₀`
  had become `6510` — which does not look broken, it looks like a different
  number. Font size and baseline say exactly which digits are subscript.
- **Reading order was wrong in three places.** Question 10's A/B/C list had
  attached itself to question 14; question 18's fourth option had swallowed the
  first line of question 19's stimulus; question 38's options arrived 3, 4, 1, 2
  because two of them are typeset one point higher than the others.
- **22 of the 40 topics were wrong**, 11 of them sitting in the keyword
  classifier's fallback bucket. Those are now assigned by hand.

Questions 11, 12 and 13 are icon questions — their options are pictures and
nothing else. All twelve icons are extracted and described, which is what makes
those three answerable at all on a screen reader.

None of this publishes anything. Two-approver review is still the gate; what has
changed is that a reviewer no longer has to compare the text against the PDF
character by character.

Re-run or audit the extraction with [`tools/extract-past-papers`](tools/extract-past-papers/README.md).

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
