'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser, requirePermission, AuthorizationError } from '@/lib/auth/guards';
import {
  setAnswerKey,
  setExplanation,
  transitionQuestion,
  ReviewError,
} from '@/lib/services/review';

export type ReviewResult = { ok: boolean; message: string };

const keySchema = z.object({
  questionId: z.string().uuid(),
  correctOptionId: z.string().uuid(),
  confidence: z.enum(['official_key', 'expert_verified']),
});

export async function setAnswerKeyAction(
  input: z.infer<typeof keySchema>,
): Promise<ReviewResult> {
  try {
    const user = await requirePermission('question:edit');
    const parsed = keySchema.parse(input);

    await setAnswerKey({ ...parsed, actorId: user.id });
    revalidatePath('/admin/review');

    return { ok: true, message: 'Answer key saved.' };
  } catch (error) {
    return { ok: false, message: describe(error) };
  }
}

const explanationSchema = z.object({
  questionId: z.string().uuid(),
  explanation: z.string().trim().min(1).max(5000),
});

export async function setExplanationAction(
  input: z.infer<typeof explanationSchema>,
): Promise<ReviewResult> {
  try {
    const user = await requirePermission('question:edit');
    const parsed = explanationSchema.parse(input);

    await setExplanation({
      questionId: parsed.questionId,
      explanationMd: parsed.explanation,
      actorId: user.id,
    });
    revalidatePath('/admin/review');

    return { ok: true, message: 'Explanation saved.' };
  } catch (error) {
    return { ok: false, message: describe(error) };
  }
}

const transitionSchema = z.object({
  questionId: z.string().uuid(),
  action: z.enum(['submit', 'approve', 'reject', 'request_changes', 'publish', 'unpublish']),
  note: z.string().max(1000).optional(),
});

export async function transitionQuestionAction(
  input: z.infer<typeof transitionSchema>,
): Promise<ReviewResult> {
  try {
    const parsed = transitionSchema.parse(input);

    // Each transition needs its own permission — approving and publishing
    // are not the same authority as editing.
    const permission =
      parsed.action === 'publish' || parsed.action === 'unpublish'
        ? 'question:publish'
        : parsed.action === 'approve' || parsed.action === 'reject'
          ? 'question:approve'
          : 'question:submit_review';

    const user = await requirePermission(permission);

    const result = await transitionQuestion({
      questionId: parsed.questionId,
      action: parsed.action,
      actorId: user.id,
      actorRole: user.role,
      note: parsed.note,
    });

    revalidatePath('/admin/review');
    revalidatePath('/admin');

    return { ok: true, message: result.message };
  } catch (error) {
    return { ok: false, message: describe(error) };
  }
}

function describe(error: unknown): string {
  if (error instanceof ReviewError) return error.message;
  if (error instanceof AuthorizationError) return error.message;
  if (error instanceof z.ZodError) return 'That request was not valid.';
  console.error('[review action]', error);
  return 'Something went wrong. Please try again.';
}
