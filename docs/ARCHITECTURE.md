# Praghna — O/L ICT Learning & Practice Platform
## Architecture & Product Decisions (v1)

> **Working name:** *Praghna* (ප්‍රඥා / "wisdom"). Placeholder — easy to change, it lives in one config file.

---

## 0. Reality check: what the source material actually gives us

Before any technology choice, the content constrains the product.

| Asset | State | Implication |
|---|---|---|
| 16 past papers, 2010–2025 (EN) | **10 have a text layer; 6 are image-only scans** | Two ingestion paths: text extraction, and OCR-assisted |
| Marking schemes | **NONE PROVIDED** | We cannot ship verified past-paper answers without expert input |
| Grade 10 Teacher's Guide + Syllabus (Revised 2026) | Full competency table, 9 competencies, 90 periods | Authoritative taxonomy for Grade 10 |
| Grade 10 & 11 textbooks | 300pp + 200pp | Grade 11 chapters 1–6; explanation source material |

### 0.1 The answer-key problem (most important product decision)

Requirement §5 says the platform must *never knowingly publish incorrect answers*. We hold
15 question papers but official marking schemes for only **10** of them. Therefore:

- Every question carries `answer_confidence`:
  - `official_key` — matched against a Department of Examinations marking scheme
  - `expert_verified` — two independent qualified reviewers agreed
  - `unverified` — **cannot be published**, `status` is pinned to `draft`
- Imported past-paper questions from an unkeyed year land as `draft` + `unverified`. They are
  invisible to students until a human sets the key and a second human approves it.
- Imported questions from a keyed year land as `draft` + `official_key`. This is a narrower
  claim than it appears: the marking scheme establishes what the *paper's* answer was, while
  our question text is OCR output. A reviewer must still check the transcription against the
  source PDF before publishing, because an official answer attached to a mistranscribed
  question is more dangerous than no answer at all.
- Where the Department accepted multiple options or voided a question — seven cases across
  the corpus — **no option is marked correct**. There is no single answer to record, and
  such a question must never be served as a scored single-answer MCQ.
- Not every supplied "marking scheme" is one. Commercial answer booklets and one teacher's
  self-described *tentative* working are held in `UNOFFICIAL_ANSWER_SOURCES`, attributed to
  their publisher, and are structurally incapable of producing `official_key` — a separate
  type, never read by the code path that sets `is_correct`.
- The UI never claims "official answer" for an `expert_verified` question. It says
  *"Answer verified by our review panel"* with the reviewer count. Trust comes from
  transparency (§31), not from overclaiming.

This is why the review workflow is built in the MVP rather than deferred.

---

## 1. Technology stack

| Layer | Choice | Why |
|---|---|---|
| **App framework** | Next.js 15 (App Router) + React 19 + TypeScript (strict) | One codebase, one deploy. Server Components keep client JS small — decisive for mid-range Android on 3G, which is the median Sri Lankan student device. Server Actions give a typed RPC boundary where validation is server-side *by default*. |
| **Database** | PostgreSQL 16 | The domain is deeply relational: a recursive syllabus tree, attempts, mastery. Needs recursive CTEs, window functions, partial indexes, `ltree`, JSONB, real constraints. No document store fits this. |
| **DB host** | Any Postgres. Supabase or Neon (Singapore) in production | `ap-southeast-1` ≈ 50 ms RTT from Colombo. Nothing in the code is Supabase-specific — it runs on a plain `postgres:16` container, which is how it is developed and tested. |
| **Auth** | **First-party.** scrypt (`node:crypto`) + Postgres-backed sessions | *Changed during the build — see §1.3.* |
| **DB access** | Drizzle ORM, **server-only** | TypeScript-first, migrations are plain SQL, and it gets out of the way when a mastery query needs hand-written SQL. |
| **Validation** | Zod | One schema shared by client form and server action. Server always re-validates. |
| **Styling** | Tailwind CSS v4 | Utility CSS with a token layer; no runtime cost. |
| **Components** | Radix UI primitives, owned locally (shadcn pattern) | Focus management, roving tabindex and ARIA come correct out of the box — this is how §25 gets met without heroics. We own the code, so nothing is un-fixable. |
| **Caching** | Next.js Data Cache + tag invalidation; Upstash Redis for rate limits & counters | Taxonomy and published questions are read-mostly and cache beautifully. Redis is serverless-friendly; an in-process cache would not survive Lambda. |
| **Background jobs** | Postgres-backed queue + Vercel Cron, behind a `JobQueue` interface | Nightly mastery rollups, streak close-out, question-stat aggregation. No new infrastructure for v1; swap in Inngest later without touching callers. |
| **Payments** | `PaymentProvider` interface; PayHere adapter first | PayHere dominates LKR (local cards, eZ Cash, FriMi). Business logic never imports it. |
| **Email** | Resend, behind a `Notifier` interface | Good deliverability, trivial API. |
| **Errors** | Sentry | |
| **Product analytics** | **First-party `events` table. No third-party behavioural SDK.** | Deliberate: the users are children (§22). We do not ship minors' behaviour to an ad-adjacent vendor. We lose some dashboards; we keep the trust that lets a parent say yes. |
| **Testing** | Vitest (services/domain) + Playwright (critical flows) | |
| **Hosting** | Vercel, functions pinned to `sin1` (Singapore) | Nearest region to Sri Lanka. |

### 1.1 Alternatives considered, and why not

- **Separate API (Django / NestJS) + SPA.** Rejected: doubles the deploy surface and the auth
  surface for a solo/small team, and an SPA ships more JS to exactly the devices that can least
  afford it. Revisit if a native mobile app arrives.
- **Prisma over Drizzle.** Prisma's runtime is heavier and its escape hatch to raw SQL is
  clumsier. The mastery and analytics queries here are genuinely non-trivial.
- **Supabase RLS as the primary authorization mechanism.** Rejected as *primary*. The
  platform's core asset is answer keys; a policy bug that leaks `is_correct` would be
  catastrophic and silent. Authorization lives in a reviewable server-side service layer,
  and is covered by a test that asserts the student payload contains no correctness field.

### 1.3 Two decisions changed during the build

Recorded here rather than quietly rewritten, because the reasoning matters more than the
appearance of having got it right first time.

**Auth moved from a hosted provider to first-party.** The original plan was Supabase Auth,
chosen largely for its phone-OTP support. Building it out, the trade looked worse than it
had on paper:

- The platform now depends on nothing but Postgres. It develops, tests and self-hosts with
  a single container — which matters for a product that may end up hosted in Sri Lanka.
- The most security-critical path stays reviewable in this repository, and is covered by
  tests here rather than trusted to a vendor's dashboard.
- Sessions are rows, so "sign out everywhere" after a password change is one `UPDATE`.

Implementation is scrypt from `node:crypto` (memory-hard, no dependency), session tokens
stored only as SHA-256 hashes, per-account lockout, and a constant-time login path that
does not reveal whether an account exists. Phone OTP and OAuth can be added behind the same
`lib/auth` boundary; no caller would change.

**The syllabus path is `text`, not `ltree`.** Subtree queries are prefix matches either way,
and a zero-padded text path (`03.02.01`) additionally sorts into document order for free.
Dropping the extension removes a dependency from local dev, CI and any future host, for no
measurable loss.
- **Firebase / Firestore.** The taxonomy and mastery model need joins and aggregation.
  Wrong shape entirely.
- **Stripe.** Not practically usable for LKR consumer payments in Sri Lanka.
- **MDX-authored questions in the repo.** Violates §18 — content must be data, editable by a
  teacher who does not use git.

### 1.2 How this scales

The read path (questions, taxonomy) is cacheable and CDN-friendly; it scales horizontally with
zero DB load once warm. The write path is small rows (`answers`, `events`) with no contention.
The expensive part — mastery and question statistics — is **not** computed on the request path:
it is incrementally updated on submit and reconciled by a nightly job. First real bottleneck
will be `answers` and `events` table size; both are time-ordered and become monthly partitions,
which is a migration, not a rewrite.

---

## 2. Layering

```
app/            Next.js routes. Thin. Rendering + calling services. No business logic.
  (marketing)/  Public: landing, about, methodology, syllabus, privacy, terms
  (auth)/       Sign in / up / verify / reset
  (student)/    Dashboard, practice, exam, review, progress, mistakes, bookmarks
  (admin)/      Question CMS, review queue, taxonomy, analytics, users
  api/          Webhooks only (payments). Everything else is a Server Action.

lib/
  domain/       PURE. No I/O. mastery, scheduling, recommendation, scoring, entitlements.
  services/     Orchestration: transactions, authz checks, cache invalidation.
  db/           Drizzle schema, migrations, queries.
  auth/         Session, RBAC matrix, guards.
  payments/     PaymentProvider interface + adapters.
  validation/   Zod schemas shared client/server.
```

**The rule that keeps this maintainable:** `lib/domain` is pure functions over plain data —
mastery, spaced repetition, recommendations and scoring are all unit-testable without a
database. That is where the educational logic lives, and it is the part most likely to be
tuned repeatedly.

---

## 3. Database schema

### 3.1 Identity (deliberately minimal — §22)

```
profiles           id(=auth.users) · display_name · role · grade · school? · locale
                   · onboarding_at · current_streak · longest_streak · deleted_at
```
No date of birth, no address, no real-name requirement, no phone unless used for login.
`display_name` may be a nickname. Deletion is a real cascade, not a flag (§22).

Roles: `student` · `teacher` · `admin` · `superadmin`. RBAC is a capability matrix in code
(`lib/auth/rbac.ts`), not scattered `if (role === 'admin')` checks.

### 3.2 Taxonomy

```
syllabi            id · code · title · version · grade_min · grade_max · effective_from · is_active
syllabus_nodes     id · syllabus_id · parent_id · level(unit|topic|subtopic|concept)
                   · code · title · description · grade · periods
                   · path(text) · depth · sort_order · is_active
```
Adjacency list **plus** a zero-padded materialised path (`03.02.01`), so "all questions under
Unit 3" is a prefix match on a btree index rather than a recursive walk — and `ORDER BY path`
yields correct document order with no extra column.

**As seeded from the real documents:** 15 units, 60 topics, 236 subtopics. The Grade 10
teaching periods sum to exactly 90, matching the Teacher's Guide's own stated total — which
is the check that the transcription is faithful.

Mapped from the real syllabus: `unit` = Competency (1–15), `topic` = Competency Level (3.2),
`subtopic` = content bullet, `concept` = fine-grained idea. Grade 10 = competencies 1–9 from
the Teacher's Guide; Grade 11 = chapters 1–6 of the Grade 11 text.

### 3.3 Questions

```
exam_papers        id · year · sitting · paper_no · medium · duration_minutes
                   · total_questions · source_file · is_published

stimuli            id · kind(text|table|image|code) · content_md · asset_id · caption
                   -- shared context for question groups ("consider the following spreadsheet…")

questions          id · public_id · type · stem_md · stimulus_id?
                   · syllabus_node_id · difficulty · cognitive_level
                   · source_type(past_paper|model|textbook_adapted)
                   · paper_id? · question_number? · part_label?
                   · explanation_md · exam_tip_md · marks · estimated_seconds
                   · status(draft|in_review|approved|published|rejected|archived)
                   · answer_confidence(official_key|expert_verified|unverified)
                   · version · created_by · reviewed_by · published_at · deleted_at

question_options   id · question_id · label · content_md · asset_id? · is_correct
                   · misconception_md · sort_order
question_assets    id · storage_path · alt_text · width · height · kind
question_versions  id · question_id · version · snapshot(jsonb) · changed_by · note
question_reviews   id · question_id · reviewer_id · action · note
tags / question_tags
```

`type` is an enum from day one containing `mcq_single`, `mcq_multi`, `true_false`,
`short_answer`, `fill_blank`, `matching`, `structured`. Only the first three are *implemented*
in v1 — but the column, the options table and the answer payload shape already accommodate the
rest, so §19 costs nothing later.

`question_options.misconception_md` is what makes explanations teach rather than announce (§9):
each distractor carries *why a student would pick it*.

**Answer safety:** `is_correct` and `misconception_md` are stripped by the service layer.
`getQuestionForStudent()` physically cannot return them — it selects an explicit column list.
Grading happens only in `gradeAnswer()`, server-side.

### 3.4 Practice & attempts

```
practice_sessions  id · user_id · mode · config(jsonb) · syllabus_node_id? · paper_id?
                   · status · question_count · time_limit_seconds · expires_at
                   · started_at · submitted_at · score · max_score
session_questions  id · session_id · question_id · position · served_at
answers            id · session_id · question_id · user_id · selected_option_ids[]
                   · text_answer? · is_correct · awarded_marks · time_spent_ms
                   · marked_for_review · changed_count · answered_at
                   UNIQUE(session_id, question_id)
```

`session_questions` freezes the served order at creation, so a session survives a question
being edited or unpublished mid-attempt. `expires_at` is server-authoritative: a timed exam
cannot be extended by tampering with the client clock.

### 3.5 Learning state

```
question_states    (user_id, question_id) PK · box · attempts · correct_attempts
                   · consecutive_correct · last_result · last_attempted_at
                   · next_review_at · graduated_at · is_bookmarked
node_mastery       (user_id, syllabus_node_id) PK · alpha · beta · effective_n
                   · mastery · mastery_lower · trend · attempts · correct · last_practiced_at
mastery_snapshots  user_id · node_id · week_start · mastery · effective_n
daily_activity     (user_id, activity_date) PK · answered · correct · seconds · sessions
```
`daily_activity` makes streaks and the activity heatmap a single indexed range scan rather
than an aggregate over every answer.

### 3.6 Commerce, admin, safety

```
plans · subscriptions · payments · payment_events(event_id UNIQUE) · usage_counters
achievements · user_achievements
question_stats     question_id · attempts · correct · avg_time_ms · option_counts(jsonb)
                   · p_value · discrimination
content_reports    student-reported "this question looks wrong"
audit_logs         actor · action · entity · before/after · ip · ua
events             first-party analytics
```

`payment_events.event_id UNIQUE` is the idempotency key — a replayed webhook is a no-op (§20).
`content_reports` closes the quality loop: students are the largest QA team we will ever have.

---

## 4. Auth & authorization

- Supabase Auth: email+password (verified), Google OAuth, phone OTP. Sessions in
  httpOnly/Secure/SameSite cookies. No token in `localStorage`.
- Every Server Action begins with `requireUser()` / `requireRole()` / `requireAdmin()`.
  There is no "the UI hid the button" authorization.
- RBAC is one matrix: `can(role, 'question:publish')`. Adding a permission is one line.
- Ownership is checked, not assumed: `getSession(id, userId)` filters by `user_id` in the
  `WHERE`, so student A requesting student B's session gets a 404, not a leak.
- RLS on every table as the second lock.
- Rate limits: auth endpoints, answer submission, admin mutations, content reports.

---

## 5. Mastery model

Progress must not be "questions answered" (§10). Per (student, syllabus node):

A **Beta posterior with weighted, decaying evidence**:

```
weight(attempt) = recency(t) × difficulty(d)
recency(t)      = 0.5 ^ (days_since / 30)          -- 30-day half life
difficulty(d)   = { easy: 0.8, medium: 1.0, hard: 1.3 }

α = 2 + Σ weight·correct          β = 2 + Σ weight·(1 − correct)
mastery       = α / (α + β)
effective_n   = (α + β) − 4
mastery_lower = beta_inv(0.10, α, β)               -- conservative floor
```

The `α₀ = β₀ = 2` prior means **two correct answers do not read as 100 %**. It reads as 67 %
with almost no confidence — which is the truth. Confidence tiers:

| effective_n | Shown as |
|---|---|
| < 4 | "Not enough practice yet" — no percentage at all |
| 4–11 | percentage + "early estimate" |
| ≥ 12 | percentage, full confidence |

`trend` = mastery over last 10 attempts − previous 10, giving "improving / steady / slipping".

Weak-topic ranking uses the posterior **mean** with a minimum sample, *not* the lower bound —
ranking by lower bound would just surface whatever the student has barely touched. Untouched
topics get their own separate, honestly-labelled "Not started" list.

Mastery propagates up the `ltree` path: answering a subtopic question updates subtopic, topic
and unit rows in one transaction.

---

## 6. Spaced repetition

Leitner boxes — deliberately simple, and honest about it (§13).

```
box:      0    1    2    3    4     5
interval: 1    2    4    9    21    45   days
correct   → box + 1
incorrect → max(0, box − 2)
graduated when box ≥ 4 AND consecutive_correct ≥ 2  → leaves the Mistake Book
```

Behind `lib/domain/scheduling.ts` with a `Scheduler` interface, so FSRS or a half-life
regression can replace it without touching a caller. We are not shipping ML we cannot explain
to a 15-year-old or debug at 2 a.m.

---

## 7. Recommendation engine

Deterministic slot composer — explainable, never random (§11):

| Slot | Source | Default |
|---|---|---|
| A | Weakest topic with `effective_n ≥ 4`, difficulty targeted just above current mastery | 5 |
| B | `next_review_at <= now`, most overdue first | 5 |
| C | Recent incorrect, not yet due | 3 |
| D | Coverage: unstarted subtopic in an otherwise strong unit | 2 |

Each slot returns its own human-readable reason, so the UI can say
*"5 questions from Logic Gates — your weakest topic this week"* rather than
*"Recommended for you"*. Slots that cannot fill donate their quota to the next slot.

Extension point for §30: swap the composer for a model-driven planner behind
`Recommender.next(userId, size)` — the interface is already the seam.

---

## 8. Sitemap

```
PUBLIC
  /                       landing
  /syllabus               coverage map — proof of legitimacy
  /methodology            how questions are sourced & reviewed  ← trust
  /about  /contact  /privacy  /terms

AUTH
  /sign-in  /sign-up  /verify  /reset-password

STUDENT
  /dashboard
  /practice               mode picker
  /practice/quick · /topic · /weak · /mistakes · /bookmarks · /challenge
  /papers                 past-paper browser
  /papers/[year]/[paper]
  /session/[id]           the practice/exam runner
  /session/[id]/review    per-question review with explanations
  /progress               mastery map, trends, activity
  /progress/[nodeId]      topic drill-down
  /mistakes               the Mistake Book
  /bookmarks
  /achievements
  /settings               profile · privacy · data export · delete account
  /billing                V3

ADMIN
  /admin
  /admin/questions        list · filter · bulk
  /admin/questions/new · /[id]/edit
  /admin/review           the approval queue
  /admin/papers  /admin/taxonomy  /admin/import
  /admin/analytics/questions   ← flags bad questions
  /admin/analytics/users
  /admin/reports          student-flagged content
  /admin/users  /admin/audit  /admin/settings
```

## 9. Core user flows

**First run.** Sign up → verify → pick grade → *3-question calibration* → dashboard already
has a real recommendation. A new student never meets an empty dashboard.

**Practice.** Dashboard → "Start practice" → question → answer → **immediate feedback with
explanation** → next. Session summary: score, per-topic breakdown, what changed in mastery,
what to do next.

**Exam.** Choose paper → rules screen (duration, count, no pausing) → runner with palette,
timer, mark-for-review → submit confirmation showing unanswered count → auto-mark → analysis.
Answers are checkpointed to the server on every change; a dropped connection or dead battery
loses nothing.

**Mistake Book.** Mistakes → grouped by topic → work through → graduate.

## 10. Admin workflows

**Import.** Upload CSV/JSON → schema validate → preview with row-level errors → dry-run diff →
commit as `draft`. Nothing is ever published by an import.

**Review.** Draft → submit → queue → reviewer sets/confirms the key, checks the explanation,
approves or requests changes → second approver for `past_paper` → publish. Every transition
writes `question_reviews` + `audit_logs`, and a snapshot into `question_versions`.

**Quality loop.** `/admin/analytics/questions` sorts by discrimination and p-value. A question
where high performers pick a distractor more than low performers is *broken*, and the table
surfaces it. Student `content_reports` land in the same queue.

---

## 11. Roadmap

**MVP** — auth · profiles · taxonomy loaded from the real syllabus · question bank ·
options/assets/stimuli · MCQ practice engine · immediate feedback + explanations ·
answer history · mistake tracking · per-topic performance · student dashboard ·
admin question CRUD + review workflow + import · seeded model questions.

**V2** — mock exams & past-paper runner · full Beta mastery + confidence UI ·
recommendation slots · spaced repetition · progress analytics · achievements ·
bookmarks · question statistics for admins.

**V3** — subscriptions + PayHere · short-answer & structured types · parent reports ·
teacher/class features · AI-assisted drafting *behind the same review gate* ·
Sinhala & Tamil medium.

---

## 12. Security strategy

- Server-side validation on every mutation (Zod), no exceptions.
- Answers never enter a client payload before grading — enforced by explicit column selection,
  and covered by a test that asserts `is_correct` is absent from the student DTO.
- Premium gating server-side; a paywalled question is not fetched-then-hidden.
- Rate limiting on auth, submission, reports, admin mutations.
- Secrets only in env, validated at boot; no `NEXT_PUBLIC_` secret can exist by lint rule.
- Uploads: server-side MIME sniffing, size cap, extension allowlist, randomised keys,
  served from a separate origin.
- Audit log on every privileged action.
- CSP, HSTS, `X-Content-Type-Options`, Referrer-Policy.
- Dependency scanning in CI.

## 13. Privacy & child safety

Minimum viable PII. No public profiles. Leaderboards, if ever, are opt-in and show
display names only — never school, never grade, never real name. Self-serve data export and
account deletion. Plain-language privacy policy a 15-year-old can actually read.
No third-party behavioural analytics on minors.

## 14. Deployment

```
Vercel (sin1) ── Next.js app
      │
      ├── Supabase Postgres (ap-southeast-1)  ← PITR backups
      ├── Supabase Storage                    ← question images
      ├── Upstash Redis                       ← rate limits, counters
      ├── Resend                              ← transactional email
      └── Sentry
Vercel Cron ─→ /api/jobs/*  (nightly rollups, streak close, stat aggregation)
```
Environments: `local` (Docker Postgres) → `preview` (per-PR, seeded) → `production`.
Migrations are forward-only, reviewed, and run before deploy.

## 15. Design language

Trust-first and calm, because the audience includes children and the people who decide
whether children may use it.

- **Type:** one humanist sans for UI, tabular numerals for data. Question text at
  17–18 px minimum on mobile — this is a reading product.
- **Colour:** near-neutral canvas, single deep-teal accent, semantic green/amber/red used
  *only* for correctness. Correctness is never signalled by colour alone (§25) — always an
  icon and a word too.
- **Motion:** feedback only. Answer reveal, progress change. Everything respects
  `prefers-reduced-motion`. No decorative animation.
- **Density:** generous. One question fills the viewport on a phone; options are ≥ 56 px
  tall and thumb-reachable.
- Explicitly avoided: gradient meshes, glassmorphism, neon, giant marketing heroes inside the
  product, chart walls. The interface should look like it respects the student's time.

**PAST PAPER** and **MODEL QUESTION** badges are structurally different — different shape,
different weight, always present, never colour-only (§29).
