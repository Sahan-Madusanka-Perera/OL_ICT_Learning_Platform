'use server';

import { z } from 'zod';
import { requireUser } from '@/lib/auth/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { db } from '@/lib/db/client';
import { contentReports } from '@/lib/db/schema';

const schema = z.object({
  questionId: z.string().uuid(),
  reason: z.enum([
    'wrong_answer',
    'unclear_question',
    'typo',
    'broken_image',
    'wrong_topic',
    'bad_explanation',
    'other',
  ]),
  detail: z.string().trim().max(1000).optional(),
});

export async function reportQuestionAction(
  _prev: { ok?: boolean; message?: string },
  formData: FormData,
): Promise<{ ok?: boolean; message?: string }> {
  const user = await requireUser();

  const limit = await checkRateLimit(`report:${user.id}`, 20, 3600);
  if (!limit.allowed) {
    return { ok: false, message: 'You have sent a lot of reports today. Try again tomorrow.' };
  }

  const parsed = schema.safeParse({
    questionId: formData.get('questionId'),
    reason: formData.get('reason'),
    detail: formData.get('detail') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: 'Please choose what is wrong with the question.' };
  }

  await db.insert(contentReports).values({
    questionId: parsed.data.questionId,
    userId: user.id,
    reason: parsed.data.reason,
    detail: parsed.data.detail ?? null,
    status: 'open',
  });

  return { ok: true, message: 'Thank you — a reviewer will look at this question.' };
}
