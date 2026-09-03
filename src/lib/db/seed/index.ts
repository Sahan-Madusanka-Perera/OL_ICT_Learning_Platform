import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';

import * as s from '../schema';
import { OL_ICT_SYLLABUS, SYLLABUS_SHAPE } from './syllabus';
import { MODEL_QUESTIONS } from './questions';
import { MODEL_FIGURES, figureBySlug } from './model-figures';
import { shuffleAll } from './shuffle';
import { PAST_PAPERS } from './papers';
import {
  PAST_PAPER_QUESTIONS,
  PAST_PAPER_QUESTION_STATS,
} from './past-paper-questions';
import {
  PAST_PAPER_FIGURES,
  PAST_PAPER_FIGURE_STATS,
  placeholderAlt,
  caption,
  type PastPaperFigure,
} from './past-paper-figures';
import {
  VERIFIED_QUESTIONS,
  VERIFIED_STATS,
  isVerified,
} from './past-paper-verified';
import { iconsFor, OPTION_ICON_STATS } from './past-paper-option-icons';
import { isSingleAnswer, officialAnswer, correctIndex } from './answer-keys';
import { ACHIEVEMENTS, PLANS } from './achievements';
import { hashPassword } from '../../auth/password';

/**
 * Seeds a development database with the real syllabus, the past-paper
 * records, a model question bank, and three demo accounts.
 *
 * Idempotent: safe to run repeatedly. Existing rows are matched on their
 * natural keys rather than blindly re-inserted.
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema: s, casing: 'snake_case' });

const log = (msg: string) => console.log(`  ${msg}`);

/** Short, human-quotable public id: Q-7F3K2M. */
function publicId(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I
  const bytes = randomBytes(6);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `Q-${out}`;
}

const pad = (n: string) => n.padStart(2, '0');

/**
 * Write a verified question's options.
 *
 * Two shapes: ordinary text options, and picture-only options where each
 * option is an icon carrying its own alt text. `isCorrect` is set only from an
 * official single answer — never guessed, and never set at all for a question
 * the Department voided.
 */
async function insertOptions(
  questionId: string,
  q: { options: string[] | null; imageOptions: boolean },
  icons: { option: number; path: string; alt: string; width: number; height: number; byteSize: number }[] | null,
  correctIdx: 0 | 1 | 2 | 3 | null,
  single: boolean,
): Promise<void> {
  if (icons) {
    for (const icon of icons) {
      await db
        .insert(s.assets)
        .values({
          storagePath: icon.path,
          altText: icon.alt,
          mimeType: 'image/png',
          width: icon.width,
          height: icon.height,
          byteSize: icon.byteSize,
        })
        .onConflictDoNothing({ target: s.assets.storagePath });

      const [asset] = await db
        .select({ id: s.assets.id })
        .from(s.assets)
        .where(eq(s.assets.storagePath, icon.path))
        .limit(1);

      await db.insert(s.questionOptions).values({
        questionId,
        label: String(icon.option),
        contentMd: null,
        assetId: asset?.id ?? null,
        isCorrect: single && correctIdx === icon.option - 1,
        sortOrder: icon.option - 1,
      });
    }
    return;
  }

  if (!q.options) return;
  await db.insert(s.questionOptions).values(
    q.options.map((opt, i) => ({
      questionId,
      label: String(i + 1),
      contentMd: opt,
      isCorrect: single && i === correctIdx,
      sortOrder: i,
    })),
  );
}

async function main() {
  console.log('\nSeeding O/L ICT platform\n');

  /* ---------------- 1. Syllabus ---------------- */
  console.log('Syllabus');

  const [syllabus] = await db
    .insert(s.syllabi)
    .values({
      code: 'OL-ICT-2026',
      title: 'G.C.E. Ordinary Level — Information & Communication Technology',
      version: 'Revised 2026',
      gradeMin: 10,
      gradeMax: 11,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: s.syllabi.code,
      set: { title: sql`excluded.title`, version: sql`excluded.version` },
    })
    .returning();

  if (!syllabus) throw new Error('Failed to upsert syllabus.');
  log(`${syllabus.title} (${syllabus.version})`);

  /** topic code -> node id, used when attaching questions. */
  const nodeByCode = new Map<string, string>();
  let unitCount = 0;
  let topicCount = 0;
  let subtopicCount = 0;

  for (const unit of OL_ICT_SYLLABUS) {
    const unitPath = pad(unit.code);

    const [unitRow] = await db
      .insert(s.syllabusNodes)
      .values({
        syllabusId: syllabus.id,
        parentId: null,
        level: 'unit',
        code: unit.code,
        title: unit.title,
        grade: unit.grade,
        path: unitPath,
        depth: 0,
        sortOrder: Number(unit.code),
        periods: unit.topics.reduce((sum, t) => sum + (t.periods ?? 0), 0) || null,
      })
      .onConflictDoUpdate({
        target: [s.syllabusNodes.syllabusId, s.syllabusNodes.code],
        set: { title: sql`excluded.title`, path: sql`excluded.path` },
      })
      .returning();

    if (!unitRow) throw new Error(`Failed to upsert unit ${unit.code}`);
    nodeByCode.set(unit.code, unitRow.id);
    unitCount++;

    for (const [ti, topic] of unit.topics.entries()) {
      const topicPath = `${unitPath}.${pad(String(ti + 1))}`;

      const [topicRow] = await db
        .insert(s.syllabusNodes)
        .values({
          syllabusId: syllabus.id,
          parentId: unitRow.id,
          level: 'topic',
          code: topic.code,
          title: topic.title,
          grade: unit.grade,
          periods: topic.periods,
          path: topicPath,
          depth: 1,
          sortOrder: ti + 1,
        })
        .onConflictDoUpdate({
          target: [s.syllabusNodes.syllabusId, s.syllabusNodes.code],
          set: { title: sql`excluded.title`, path: sql`excluded.path` },
        })
        .returning();

      if (!topicRow) throw new Error(`Failed to upsert topic ${topic.code}`);
      nodeByCode.set(topic.code, topicRow.id);
      topicCount++;

      for (const [si, sub] of topic.subtopics.entries()) {
        const subCode = `${topic.code}.${si + 1}`;
        await db
          .insert(s.syllabusNodes)
          .values({
            syllabusId: syllabus.id,
            parentId: topicRow.id,
            level: 'subtopic',
            code: subCode,
            title: sub,
            grade: unit.grade,
            path: `${topicPath}.${pad(String(si + 1))}`,
            depth: 2,
            sortOrder: si + 1,
          })
          .onConflictDoUpdate({
            target: [s.syllabusNodes.syllabusId, s.syllabusNodes.code],
            set: { title: sql`excluded.title` },
          });
        subtopicCount++;
      }
    }
  }

  if (unitCount !== SYLLABUS_SHAPE.units) {
    throw new Error(`Expected ${SYLLABUS_SHAPE.units} units, seeded ${unitCount}.`);
  }
  log(`${unitCount} units · ${topicCount} topics · ${subtopicCount} subtopics`);

  /* ---------------- 2. Papers ---------------- */
  console.log('\nPast papers');
  const paperByYear = new Map<number, string>();

  for (const p of PAST_PAPERS) {
    if (p.ingestion === 'missing') {
      log(`${p.year} — NOT PRESENT, skipped`);
      continue;
    }
    const [row] = await db
      .insert(s.examPapers)
      .values({
        year: p.year,
        sitting: p.sitting,
        paperNo: p.paperNo,
        medium: 'en',
        title: `G.C.E. O/L ICT ${p.sitting} — Paper ${p.paperNo}`,
        totalQuestions: p.totalQuestions,
        durationMinutes: p.durationMinutes,
        sourceFile: p.sourceFile,
        notes: p.notes ?? null,
        isPublished: false, // nothing is published until its questions are keyed
      })
      .onConflictDoUpdate({
        target: [s.examPapers.year, s.examPapers.sitting, s.examPapers.paperNo, s.examPapers.medium],
        set: { notes: sql`excluded.notes`, sourceFile: sql`excluded.source_file` },
      })
      .returning();
    if (row) paperByYear.set(p.year, row.id);
  }
  log(`${paperByYear.size} paper records`);

  /* ---------------- 3. Demo accounts ---------------- */
  console.log('\nAccounts');
  const DEMO_PASSWORD = 'practice-makes-progress';
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const accounts = [
    { email: 'student@example.lk', displayName: 'Nimali', role: 'student' as const, grade: 11 },
    { email: 'teacher@example.lk', displayName: 'Mr. Fernando', role: 'teacher' as const, grade: null },
    { email: 'admin@example.lk', displayName: 'Platform Admin', role: 'superadmin' as const, grade: null },
  ];

  const userByEmail = new Map<string, string>();

  for (const a of accounts) {
    const [row] = await db
      .insert(s.profiles)
      .values({
        id: sql`gen_random_uuid()` as unknown as string,
        displayName: a.displayName,
        email: a.email,
        role: a.role,
        grade: a.grade,
        onboardingAt: new Date(),
      })
      .onConflictDoUpdate({
        target: s.profiles.email,
        set: { displayName: sql`excluded.display_name`, role: sql`excluded.role` },
      })
      .returning();

    if (!row) continue;
    userByEmail.set(a.email, row.id);

    await db
      .insert(s.userCredentials)
      .values({ userId: row.id, passwordHash, emailVerifiedAt: new Date() })
      .onConflictDoUpdate({
        target: s.userCredentials.userId,
        set: { passwordHash: sql`excluded.password_hash` },
      });

    log(`${a.email.padEnd(22)} ${a.role}`);
  }
  log(`password for all three: ${DEMO_PASSWORD}`);

  const adminId = userByEmail.get('admin@example.lk') ?? null;
  const teacherId = userByEmail.get('teacher@example.lk') ?? null;

  /* ---------------- 4. Model questions ---------------- */
  console.log('\nModel questions');
  const served = shuffleAll(MODEL_QUESTIONS);
  let inserted = 0;
  let skipped = 0;
  let withFigure = 0;

  /*
   * Figures for the model questions.
   *
   * These are authored rather than recovered, so unlike the past-paper ones
   * they carry real alt text and a question that needs one can still be
   * published. Resolved once per slug and reused: several questions can point
   * at the same circuit, and they should share one stimulus row.
   */
  const modelStimulus = new Map<string, string>();

  async function stimulusForFigure(slug: string): Promise<string | null> {
    const cached = modelStimulus.get(slug);
    if (cached) return cached;

    const fig = figureBySlug(slug);
    if (!fig) {
      console.warn(`  ! unknown figure ${slug}`);
      return null;
    }

    await db
      .insert(s.assets)
      .values({
        storagePath: fig.path,
        altText: fig.alt,
        mimeType: 'image/svg+xml',
        width: fig.width,
        height: fig.height,
        byteSize: fig.byteSize,
        uploadedBy: teacherId,
      })
      .onConflictDoNothing({ target: s.assets.storagePath });

    const [asset] = await db
      .select({ id: s.assets.id })
      .from(s.assets)
      .where(eq(s.assets.storagePath, fig.path))
      .limit(1);
    if (!asset) return null;

    const [existingStimulus] = await db
      .select({ id: s.stimuli.id })
      .from(s.stimuli)
      .where(eq(s.stimuli.assetId, asset.id))
      .limit(1);

    let id = existingStimulus?.id;
    if (!id) {
      const [created] = await db
        .insert(s.stimuli)
        .values({ kind: 'image', assetId: asset.id, caption: null })
        .returning({ id: s.stimuli.id });
      id = created?.id;
    }
    if (!id) return null;

    modelStimulus.set(slug, id);
    return id;
  }

  for (const q of served) {
    const nodeId = nodeByCode.get(q.topic);
    if (!nodeId) {
      console.warn(`  ! unknown topic ${q.topic}, skipping`);
      skipped++;
      continue;
    }

    // Natural key for idempotency: a model question is identified by its stem.
    const existing = await db
      .select({ id: s.questions.id })
      .from(s.questions)
      .where(eq(s.questions.stemMd, q.stem))
      .limit(1);

    if (existing[0]) { skipped++; continue; }

    const stimulusId = q.figure ? await stimulusForFigure(q.figure) : null;
    if (q.figure && !stimulusId) { skipped++; continue; }
    if (stimulusId) withFigure++;

    const [row] = await db
      .insert(s.questions)
      .values({
        publicId: publicId(),
        type: 'mcq_single',
        stemMd: q.stem,
        stimulusId,
        syllabusNodeId: nodeId,
        difficulty: q.difficulty,
        cognitiveLevel: q.cognitive,
        sourceType: 'model',
        explanationMd: q.explanation,
        examTipMd: q.examTip ?? null,
        marks: 1,
        estimatedSeconds: q.difficulty === 'hard' ? 90 : q.difficulty === 'medium' ? 65 : 45,
        // Authored with a checked answer and a written explanation, and
        // covered by tests in seed/questions.test.ts.
        status: 'published',
        answerConfidence: 'expert_verified',
        createdBy: teacherId,
        reviewedBy: adminId,
        publishedAt: new Date(),
      })
      .returning();

    if (!row) continue;

    await db.insert(s.questionOptions).values(
      q.options.map((opt, i) => ({
        questionId: row.id,
        label: String(i + 1),
        contentMd: opt,
        isCorrect: i === q.correct,
        misconceptionMd: i === q.correct ? null : q.misconceptions[i]!,
        sortOrder: i,
      })),
    );
    inserted++;
  }
  log(`${inserted} inserted, ${skipped} already present — all published`);
  if (withFigure) {
    log(`${withFigure} carry an authored figure (${MODEL_FIGURES.length} figures in the set)`);
  }

  /* ---------------- 5. Past-paper questions ---------------- */
  console.log('\nPast-paper questions');

  /*
   * Everything extracted from the papers, as drafts. Two independent facts
   * decide what each row gets:
   *
   *   - the ANSWER. Present only for the 8 years with a marking scheme, and
   *     only when the Department accepted a single option. That earns
   *     `official_key`; everything else stays `unverified`, which the
   *     database will not let anyone publish.
   *
   *   - the STEM. OCR output, graded by the extractor. Even a question with
   *     a perfect official key is a draft until a human has read the stem
   *     against the PDF, because an official answer to a mistranscribed
   *     question is worse than no answer at all.
   *
   * So nothing here is published, and no `isCorrect` is ever set on a
   * question we could not key.
   */
  let keyed = 0;
  let unkeyed = 0;
  let upgraded = 0;
  let skippedNoOptions = 0;

  for (const q of PAST_PAPER_QUESTIONS) {
    // A year we have read off the text layer is handled below, from the exact
    // transcription. Seeding the OCR guess first and correcting it afterwards
    // would leave the wrong topic on any question a reviewer had already moved.
    if (isVerified(q.year)) continue;

    const nodeId = nodeByCode.get(q.topic);
    const paperId = paperByYear.get(q.year);
    if (!nodeId || !paperId) continue;

    // An option list we could not recover is not a question yet.
    if (!q.options) { skippedNoOptions++; continue; }

    const existing = await db
      .select({ id: s.questions.id, answerConfidence: s.questions.answerConfidence })
      .from(s.questions)
      .where(
        and(
          eq(s.questions.paperId, paperId),
          eq(s.questions.questionNumber, q.questionNumber),
        ),
      )
      .limit(1);

    const hasSingleAnswer =
      q.officialAnswer !== null &&
      isSingleAnswer(q.officialAnswer) &&
      q.correctIndex !== null;

    const prior = existing[0];
    if (prior) {
      /*
       * The question is already here. The one thing worth doing is applying a
       * marking scheme that has arrived since it was seeded: a question sitting
       * at `unverified` only because we had no key should pick that key up.
       *
       * Nothing else is touched. A question a human has already reviewed keeps
       * whatever they decided, and we never downgrade a confidence level.
       */
      if (hasSingleAnswer && prior.answerConfidence === 'unverified') {
        await db
          .update(s.questions)
          .set({ answerConfidence: 'official_key', updatedAt: new Date() })
          .where(eq(s.questions.id, prior.id));

        const opts = await db
          .select({ id: s.questionOptions.id, sortOrder: s.questionOptions.sortOrder })
          .from(s.questionOptions)
          .where(eq(s.questionOptions.questionId, prior.id));

        for (const o of opts) {
          await db
            .update(s.questionOptions)
            .set({ isCorrect: o.sortOrder === q.correctIndex })
            .where(eq(s.questionOptions.id, o.id));
        }

        await db.insert(s.questionReviews).values({
          questionId: prior.id,
          reviewerId: adminId,
          action: 'submit',
          note:
            `Official answer key applied from the ${q.year} marking scheme ` +
            `(answer ${q.officialAnswer}). The stem still needs checking against ` +
            'the source PDF before this can be published.',
        });
        upgraded++;
      }
      continue;
    }

    const noteParts = [`Extraction: ${q.extraction}.`];
    if (q.officialAnswer && !isSingleAnswer(q.officialAnswer)) {
      noteParts.push(
        `The marking scheme accepted "${q.officialAnswer}" — this question was ` +
          'voided or had multiple accepted options, so it has no single correct ' +
          'answer and must not be served as a scored MCQ.',
      );
    }
    if (!q.officialAnswer) {
      noteParts.push('No marking scheme is held for this year.');
    }

    const [row] = await db
      .insert(s.questions)
      .values({
        publicId: publicId(),
        type: 'mcq_single',
        stemMd: q.stem,
        syllabusNodeId: nodeId,
        difficulty: 'medium',
        cognitiveLevel: 'understanding',
        sourceType: 'past_paper',
        paperId,
        questionNumber: q.questionNumber,
        marks: 1,
        status: 'draft',
        answerConfidence: hasSingleAnswer ? 'official_key' : 'unverified',
        createdBy: adminId,
      })
      .returning();

    if (!row) continue;

    await db.insert(s.questionOptions).values(
      q.options.map((opt, i) => ({
        questionId: row.id,
        label: String(i + 1),
        contentMd: opt,
        // Set only from an official single answer. Never guessed.
        isCorrect: hasSingleAnswer && i === q.correctIndex,
        sortOrder: i,
      })),
    );

    // Provenance goes on the review trail — it is what a reviewer sees when
    // they open this question in the queue.
    await db.insert(s.questionReviews).values({
      questionId: row.id,
      reviewerId: adminId,
      action: 'submit',
      note: noteParts.join(' '),
    });

    if (hasSingleAnswer) keyed++; else unkeyed++;
  }

  log(`${keyed} with an official answer key (answer_confidence: official_key)`);
  if (upgraded) log(`${upgraded} existing drafts upgraded by a newly supplied marking scheme`);
  log(`${unkeyed} without a key (unverified — cannot be published)`);
  if (skippedNoOptions) log(`${skippedNoOptions} skipped: options not recoverable`);
  log(
    `extraction — ${PAST_PAPER_QUESTION_STATS.byExtraction.clean} clean, ` +
      `${PAST_PAPER_QUESTION_STATS.byExtraction.needsAsset} need an asset, ` +
      `${PAST_PAPER_QUESTION_STATS.byExtraction.needsRepair} need repair, ` +
      `${PAST_PAPER_QUESTION_STATS.byExtraction.incomplete} incomplete`,
  );
  log(`${PAST_PAPER_QUESTION_STATS.reviewReady} ready for a reviewer to read and approve`);

  /* ---------------- 5a. Verified transcriptions ----------------
   *
   * The born-digital papers do not need OCR, and pretending they do costs
   * accuracy. These rows come from the characters the Department typeset —
   * sub- and superscripts intact, reading order corrected, topics assigned by
   * hand against the syllabus rather than by keyword.
   *
   * They are still drafts. An exact transcription is not a reviewed question:
   * the topic is a judgement call and the figures may still be missing. What it
   * removes is the reviewer's most tedious job, comparing text to PDF.
   */
  console.log('\nVerified transcriptions');

  let verifiedInserted = 0;
  let verifiedCorrected = 0;
  let iconOptions = 0;

  for (const q of VERIFIED_QUESTIONS) {
    const nodeId = nodeByCode.get(q.topic);
    const paperId = paperByYear.get(q.year);
    if (!nodeId || !paperId) continue;

    const answer = officialAnswer(q.year, q.questionNumber);
    const single = answer !== null && isSingleAnswer(answer);
    const correctIdx = single && answer ? correctIndex(answer) : null;

    const icons = q.imageOptions ? iconsFor(q.year, q.questionNumber) : null;
    if (q.imageOptions && !icons) continue; // no pictures, no question

    const [existing] = await db
      .select({ id: s.questions.id, status: s.questions.status })
      .from(s.questions)
      .where(
        and(
          eq(s.questions.paperId, paperId),
          eq(s.questions.questionNumber, q.questionNumber),
        ),
      )
      .limit(1);

    const stemMd = q.stimulus ? `${q.stimulus}\n\n${q.stem}` : q.stem;

    if (existing) {
      /*
       * Correct an OCR row in place rather than duplicating it — but only
       * while it is still an untouched draft. Once a human has moved a
       * question, their decision outranks this script.
       */
      if (existing.status !== 'draft') continue;

      await db
        .update(s.questions)
        .set({ stemMd, syllabusNodeId: nodeId, updatedAt: new Date() })
        .where(eq(s.questions.id, existing.id));

      await db.delete(s.questionOptions).where(eq(s.questionOptions.questionId, existing.id));
      await insertOptions(existing.id, q, icons, correctIdx, single);

      await db.insert(s.questionReviews).values({
        questionId: existing.id,
        reviewerId: adminId,
        action: 'submit',
        note:
          `Replaced the OCR transcription with the exact text from the ${q.year} ` +
          'PDF text layer: sub- and superscripts restored, reading order corrected, ' +
          `topic re-assigned by hand to ${q.topic}. The stem no longer needs ` +
          'checking character by character against the paper.',
      });
      verifiedCorrected++;
      if (icons) iconOptions++;
      continue;
    }

    const [row] = await db
      .insert(s.questions)
      .values({
        publicId: publicId(),
        type: 'mcq_single',
        stemMd,
        syllabusNodeId: nodeId,
        difficulty: 'medium',
        cognitiveLevel: 'understanding',
        sourceType: 'past_paper',
        paperId,
        questionNumber: q.questionNumber,
        marks: 1,
        status: 'draft',
        answerConfidence: single ? 'official_key' : 'unverified',
        createdBy: adminId,
      })
      .returning();
    if (!row) continue;

    await insertOptions(row.id, q, icons, correctIdx, single);
    verifiedInserted++;
    if (icons) iconOptions++;
  }

  log(
    `${VERIFIED_STATS.total} questions read off the text layer for ` +
      `${VERIFIED_STATS.years.join(', ')} across ${VERIFIED_STATS.topics} topics`,
  );
  if (verifiedCorrected) log(`${verifiedCorrected} OCR drafts replaced with the exact text`);
  if (verifiedInserted) log(`${verifiedInserted} inserted`);
  log(
    `${iconOptions} questions have picture-only options ` +
      `(${OPTION_ICON_STATS.total} option icons, each with alt text)`,
  );
  log('still drafts — an exact transcription is not a reviewed question');

  /* ---------------- 5b. Past-paper figures ----------------
   *
   * The picture half of a past-paper question. "Consider the following logic
   * circuit" is not a question until the circuit is present, and OCR cannot
   * supply it — so these come from a separate pass over the PDFs that renders
   * the region each figure occupies (`tools/extract-past-papers/figures.py`).
   *
   * Everything here is layout evidence, not comprehension: the pipeline knows
   * a picture sat under question 35, and nothing more. So alt text is written
   * as an explicit placeholder rather than guessed, and attaching a figure
   * changes no question's status, grade or answer confidence. It only means a
   * reviewer can now see what they are being asked to approve.
   */
  console.log('\nPast-paper figures');

  let attached = 0;
  let extras = 0;
  let alreadyHad = 0;

  // A question can have more than one figure — 2021 Q12 runs across a page
  // break with a segment on each side. `questions.stimulus_id` holds one, so
  // the rest are named in the review note instead of being dropped silently.
  const figuresFor = new Map<string, PastPaperFigure[]>();
  for (const f of PAST_PAPER_FIGURES) {
    for (const q of f.questions) {
      const key = `${f.year}-${q}`;
      figuresFor.set(key, [...(figuresFor.get(key) ?? []), f]);
    }
  }

  const stimulusByPath = new Map<string, string>();

  for (const f of PAST_PAPER_FIGURES) {
    const paperId = paperByYear.get(f.year);
    if (!paperId) continue;

    /* The asset. `storage_path` is uniquely indexed, so this is the natural key. */
    await db
      .insert(s.assets)
      .values({
        storagePath: f.path,
        altText: placeholderAlt(f),
        mimeType: 'image/png',
        width: f.width,
        height: f.height,
        byteSize: f.byteSize,
        uploadedBy: adminId,
      })
      .onConflictDoNothing({ target: s.assets.storagePath });

    const [asset] = await db
      .select({ id: s.assets.id })
      .from(s.assets)
      .where(eq(s.assets.storagePath, f.path))
      .limit(1);
    if (!asset) continue;

    /* One stimulus per asset — that is what makes a shared figure shared. */
    let stimulusId = stimulusByPath.get(f.path);
    if (!stimulusId) {
      const [existing] = await db
        .select({ id: s.stimuli.id })
        .from(s.stimuli)
        .where(eq(s.stimuli.assetId, asset.id))
        .limit(1);

      if (existing) {
        stimulusId = existing.id;
      } else {
        const [created] = await db
          .insert(s.stimuli)
          .values({ kind: 'image', assetId: asset.id, caption: caption(f) })
          .returning({ id: s.stimuli.id });
        if (!created) continue;
        stimulusId = created.id;
      }
      stimulusByPath.set(f.path, stimulusId);
    }

    for (const qNumber of f.questions) {
      const [target] = await db
        .select({ id: s.questions.id, stimulusId: s.questions.stimulusId })
        .from(s.questions)
        .where(
          and(
            eq(s.questions.paperId, paperId),
            eq(s.questions.questionNumber, qNumber),
          ),
        )
        .limit(1);

      // No row means the question's options were never recovered, so it was
      // never seeded. The figure stays in the manifest for whenever it is.
      if (!target) continue;

      if (target.stimulusId) {
        if (target.stimulusId === stimulusId) alreadyHad++;
        else extras++;
        continue;
      }

      await db
        .update(s.questions)
        .set({ stimulusId, updatedAt: new Date() })
        .where(eq(s.questions.id, target.id));

      const all = figuresFor.get(`${f.year}-${qNumber}`) ?? [];
      const others = all.filter((o) => o.path !== f.path).map((o) => o.path);

      await db.insert(s.questionReviews).values({
        questionId: target.id,
        reviewerId: adminId,
        action: 'submit',
        note:
          `Figure attached from page ${f.page} of the ${f.year} paper ` +
          `(${f.path}). It has no alt text yet — write one against the ` +
          'picture before publishing.' +
          (others.length
            ? ` ${others.length} further figure(s) were found for this ` +
              `question and are not attached: ${others.join(', ')}.`
            : ''),
      });
      attached++;
    }
  }

  log(
    `${PAST_PAPER_FIGURE_STATS.total} figures from ${PAST_PAPER_FIGURE_STATS.years.length} ` +
      `born-digital papers (${PAST_PAPER_FIGURE_STATS.years.join(', ')})`,
  );
  log(`${attached} questions given the figure they refer to`);
  if (alreadyHad) log(`${alreadyHad} already had it`);
  if (extras) log(`${extras} second figures not attached — named in the review note`);
  log(
    `${PAST_PAPER_FIGURE_STATS.shared} are shared stimuli spanning a question group`,
  );
  log('every figure needs alt text written by a human before its question can publish');

  /* ---------------- 6. Achievements & plans ---------------- */
  console.log('\nAchievements & plans');
  for (const a of ACHIEVEMENTS) {
    await db
      .insert(s.achievements)
      .values(a)
      .onConflictDoUpdate({
        target: s.achievements.code,
        set: { title: sql`excluded.title`, description: sql`excluded.description` },
      });
  }
  for (const p of PLANS) {
    await db
      .insert(s.plans)
      .values({ ...p, features: p.features as Record<string, unknown> })
      .onConflictDoUpdate({
        target: s.plans.code,
        set: { name: sql`excluded.name`, priceCents: sql`excluded.price_cents` },
      });
  }
  log(`${ACHIEVEMENTS.length} achievements · ${PLANS.length} plans`);

  console.log('\nDone.\n');
  await client.end();
}

main().catch(async (err) => {
  console.error('\nSeed failed:', err);
  await client.end();
  process.exit(1);
});
