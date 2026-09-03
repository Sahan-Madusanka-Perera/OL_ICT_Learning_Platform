/**
 * What a given account is allowed to do.
 *
 * Everything premium resolves through this module, so adding a paid tier
 * later is a data change plus a gate call — never a rewrite (§20). No
 * payment provider is referenced here, or anywhere in business logic.
 */

export type PlanCode = 'free' | 'premium';

export type Feature =
  | 'unlimited_practice'
  | 'full_question_bank'
  | 'all_past_papers'
  | 'mock_exams'
  | 'weak_area_practice'
  | 'mistake_review'
  | 'spaced_repetition'
  | 'advanced_analytics'
  | 'short_answer'
  | 'progress_reports';

export type Entitlements = {
  plan: PlanCode;
  features: ReadonlySet<Feature>;
  /** Null means unlimited. */
  dailyQuestionLimit: number | null;
};

/**
 * The free tier is deliberately generous on the things that teach and
 * limited on the things that scale cost. A student who cannot pay should
 * still be able to learn something real every day — that is the point of the
 * product, and a 20-question wall on day one would make the free tier a
 * demo rather than a service.
 */
const FREE_FEATURES: Feature[] = ['mistake_review'];

const PREMIUM_FEATURES: Feature[] = [
  'unlimited_practice',
  'full_question_bank',
  'all_past_papers',
  'mock_exams',
  'weak_area_practice',
  'mistake_review',
  'spaced_repetition',
  'advanced_analytics',
  'short_answer',
  'progress_reports',
];

export const FREE_DAILY_QUESTION_LIMIT = 30;

export const FREE_ENTITLEMENTS: Entitlements = {
  plan: 'free',
  features: new Set(FREE_FEATURES),
  dailyQuestionLimit: FREE_DAILY_QUESTION_LIMIT,
};

export const PREMIUM_ENTITLEMENTS: Entitlements = {
  plan: 'premium',
  features: new Set(PREMIUM_FEATURES),
  dailyQuestionLimit: null,
};

export function entitlementsFor(
  subscription: { status: string; currentPeriodEnd: Date } | null,
  now: Date = new Date(),
): Entitlements {
  if (!subscription) return FREE_ENTITLEMENTS;

  const active =
    (subscription.status === 'active' || subscription.status === 'trialing') &&
    subscription.currentPeriodEnd.getTime() > now.getTime();

  return active ? PREMIUM_ENTITLEMENTS : FREE_ENTITLEMENTS;
}

export function can(entitlements: Entitlements, feature: Feature): boolean {
  return entitlements.features.has(feature);
}

export type QuotaCheck =
  | { allowed: true; remaining: number | null }
  | { allowed: false; remaining: 0; reason: string };

export function checkDailyQuota(
  entitlements: Entitlements,
  answeredToday: number,
  requested = 1,
): QuotaCheck {
  const limit = entitlements.dailyQuestionLimit;
  if (limit === null) return { allowed: true, remaining: null };

  const remaining = Math.max(0, limit - answeredToday);
  if (remaining >= requested) return { allowed: true, remaining };

  return {
    allowed: false,
    remaining: 0,
    reason: `You've reached today's free limit of ${limit} questions. It resets at midnight.`,
  };
}
