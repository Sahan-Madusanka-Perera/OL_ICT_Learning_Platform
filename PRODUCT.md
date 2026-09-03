# O/L ICT Practice — product truth

## What it is
A practice and examination platform for the Sri Lankan G.C.E. Ordinary Level ICT paper,
built on the National Institute of Education syllabus (15 units, 60 topics).

## The unique mechanism
Every answer re-scores what the platform believes the student knows, and that belief picks
the next question. Practice *is* measurement — and the measurement is honest enough to
refuse to give a number it has not earned.

## Who uses it, and the real scene
- **Primary — the student.** 15–16 years old. A mid-range Android phone, often shared,
  often on mobile data. Usually studying alone at night, sometimes between tuition classes.
  Weeks to months from an exam that decides their A/L stream, and with it a large part of
  what happens next. High stakes, low patience, tired.
- **Secondary — the parent.** Decides whether this is allowed and whether it is worth
  paying for. Needs to see seriousness, not a game.
- **Secondary — the teacher.** Decides whether to recommend it to a class. Needs to see
  the syllabus honoured and the answers trustworthy.
- **Internal — reviewers.** Set and verify answer keys before anything reaches a student.

## Cultural home
Sri Lankan national examinations. Department of Examinations papers and OMR answer sheets.
Tuition-class culture. School exercise books and the teacher's red pen. And the subject's
own notation: binary place values, logic gates, flowcharts, truth tables.

## What must stay true
- **PAST PAPER** and **MODEL QUESTION** can never be confused for one another.
- Mastery below a real sample size shows **no percentage at all**.
- Correctness is never signalled by colour alone.
- No unverified answer can be published; two independent approvers for past papers.
- Question text ≥17px; touch targets ≥56px; works on a slow connection.
- No dark patterns, no third-party behavioural tracking on minors, no promised grades.

## What would make a polished result feel wrong
- Anything that reads as a game congratulating a child — mascots, confetti, flame streaks.
- Anything that looks like a generic SaaS dashboard, which is what it looks like now.
- Any claim we cannot back: predicted grades, "official" answers we verified ourselves.
- Decoration that costs bytes on a phone on mobile data.

## Constraints
Next.js 15 · Tailwind v4 · Postgres. Self-hosted fonts, no third-party CDNs. 103 kB shared
JS today and that is a ceiling, not a floor.
