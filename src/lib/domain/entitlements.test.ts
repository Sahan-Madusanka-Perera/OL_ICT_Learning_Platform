import { describe, it, expect } from 'vitest';
import {
  entitlementsFor,
  can,
  checkDailyQuota,
  FREE_ENTITLEMENTS,
  PREMIUM_ENTITLEMENTS,
  FREE_DAILY_QUESTION_LIMIT,
} from './entitlements';

const NOW = new Date('2026-06-01T00:00:00Z');
const future = new Date('2026-07-01T00:00:00Z');
const past = new Date('2026-05-01T00:00:00Z');

describe('entitlements', () => {
  it('gives an account with no subscription the free tier', () => {
    expect(entitlementsFor(null, NOW).plan).toBe('free');
  });

  it('unlocks premium for an active subscription', () => {
    const e = entitlementsFor({ status: 'active', currentPeriodEnd: future }, NOW);
    expect(e.plan).toBe('premium');
    expect(can(e, 'mock_exams')).toBe(true);
    expect(e.dailyQuestionLimit).toBeNull();
  });

  it('treats a trial as premium', () => {
    expect(entitlementsFor({ status: 'trialing', currentPeriodEnd: future }, NOW).plan)
      .toBe('premium');
  });

  it('downgrades an expired period even if the status still says active', () => {
    // The status column can lag a failed renewal webhook; the date cannot.
    expect(entitlementsFor({ status: 'active', currentPeriodEnd: past }, NOW).plan)
      .toBe('free');
  });

  it('downgrades a cancelled subscription', () => {
    expect(entitlementsFor({ status: 'canceled', currentPeriodEnd: future }, NOW).plan)
      .toBe('free');
  });

  it('keeps mistake review free — it is the part that teaches', () => {
    expect(can(FREE_ENTITLEMENTS, 'mistake_review')).toBe(true);
    expect(can(FREE_ENTITLEMENTS, 'mock_exams')).toBe(false);
  });
});

describe('daily quota', () => {
  it('allows a free user under the limit', () => {
    const r = checkDailyQuota(FREE_ENTITLEMENTS, 10);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(FREE_DAILY_QUESTION_LIMIT - 10);
  });

  it('blocks a free user at the limit, with a message that explains itself', () => {
    const r = checkDailyQuota(FREE_ENTITLEMENTS, FREE_DAILY_QUESTION_LIMIT);
    expect(r.allowed).toBe(false);
    if (!r.allowed) {
      expect(r.reason).toContain(String(FREE_DAILY_QUESTION_LIMIT));
      expect(r.reason).toContain('resets');
    }
  });

  it('blocks a batch that would cross the limit', () => {
    expect(checkDailyQuota(FREE_ENTITLEMENTS, 28, 5).allowed).toBe(false);
    expect(checkDailyQuota(FREE_ENTITLEMENTS, 25, 5).allowed).toBe(true);
  });

  it('never limits a premium user', () => {
    const r = checkDailyQuota(PREMIUM_ENTITLEMENTS, 100_000, 50);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBeNull();
  });
});
