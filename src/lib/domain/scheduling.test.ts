import { describe, it, expect } from 'vitest';
import {
  reviewAfterAnswer,
  isInMistakeBook,
  isDue,
  overdueDays,
  addDays,
  NEW_REVIEW_STATE,
  BOX_INTERVALS_DAYS,
  GRADUATION_BOX,
  type ReviewState,
} from './scheduling';

const T0 = new Date('2026-03-01T09:00:00Z');

const answer = (state: ReviewState, correct: boolean, at = T0) =>
  reviewAfterAnswer(state, correct, at);

describe('Leitner scheduling', () => {
  it('promotes one box on a correct answer and schedules the next review', () => {
    const s = answer(NEW_REVIEW_STATE, true);
    expect(s.box).toBe(1);
    expect(s.nextReviewAt).toEqual(addDays(T0, BOX_INTERVALS_DAYS[1]!));
  });

  it('demotes two boxes on a wrong answer, but never below zero', () => {
    let s = NEW_REVIEW_STATE;
    for (let i = 0; i < 4; i++) s = answer(s, true);
    expect(s.box).toBe(4);

    s = answer(s, false);
    expect(s.box).toBe(2);

    s = answer(s, false);
    s = answer(s, false);
    expect(s.box).toBe(0);
  });

  it('caps at the maximum box', () => {
    let s = NEW_REVIEW_STATE;
    for (let i = 0; i < 20; i++) s = answer(s, true);
    expect(s.box).toBe(5);
  });

  it('lengthens the interval as the box rises', () => {
    const intervals = [...BOX_INTERVALS_DAYS];
    const sorted = [...intervals].sort((a, b) => a - b);
    expect(intervals).toEqual(sorted);
  });
});

describe('the Mistake Book', () => {
  it('takes in a question answered wrong', () => {
    const s = answer(NEW_REVIEW_STATE, false);
    expect(isInMistakeBook(s)).toBe(true);
  });

  it('never contains a question that has only ever been right', () => {
    const s = answer(NEW_REVIEW_STATE, true);
    expect(isInMistakeBook(s)).toBe(false);
  });

  it('graduates a question only after sustained success', () => {
    let s = answer(NEW_REVIEW_STATE, false); // enters the book
    expect(isInMistakeBook(s)).toBe(true);

    // One good answer is not enough to leave.
    s = answer(s, true);
    expect(s.graduatedAt).toBeNull();
    expect(isInMistakeBook(s)).toBe(true);

    // Keep going until both conditions are met.
    while (s.graduatedAt === null) s = answer(s, true);

    expect(s.box).toBeGreaterThanOrEqual(GRADUATION_BOX);
    expect(s.consecutiveCorrect).toBeGreaterThanOrEqual(2);
    expect(isInMistakeBook(s)).toBe(false);
  });

  it('takes a graduated question back when it is failed again', () => {
    let s = NEW_REVIEW_STATE;
    while (s.graduatedAt === null) s = answer(s, true);
    expect(s.graduatedAt).not.toBeNull();

    s = answer(s, false);
    expect(s.graduatedAt).toBeNull();
    expect(isInMistakeBook(s)).toBe(true);
  });

  it('resets the streak on a wrong answer', () => {
    let s = answer(NEW_REVIEW_STATE, true);
    s = answer(s, true);
    expect(s.consecutiveCorrect).toBe(2);
    s = answer(s, false);
    expect(s.consecutiveCorrect).toBe(0);
  });
});

describe('due dates', () => {
  it('is not due before its review date', () => {
    const s = answer(NEW_REVIEW_STATE, true);
    expect(isDue(s, T0)).toBe(false);
  });

  it('is due once the date passes', () => {
    const s = answer(NEW_REVIEW_STATE, true);
    expect(isDue(s, addDays(T0, 3))).toBe(true);
  });

  it('never surfaces a graduated question for review', () => {
    let s = NEW_REVIEW_STATE;
    while (s.graduatedAt === null) s = answer(s, true);
    expect(isDue(s, addDays(T0, 500))).toBe(false);
  });

  it('measures how overdue a question is, for queue ordering', () => {
    const s = answer(NEW_REVIEW_STATE, true); // due in 2 days
    expect(overdueDays(s, addDays(T0, 9))).toBeCloseTo(7, 5);
    expect(overdueDays(s, T0)).toBe(0);
  });
});
