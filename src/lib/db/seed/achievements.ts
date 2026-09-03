/**
 * Achievements.
 *
 * Academic, not arcade (§16). Every one of these marks something a student
 * actually did toward learning — no badges for logging in, no confetti for
 * opening the app. `criteria` is data so a new achievement is an insert
 * rather than a deploy.
 */

export type AchievementSeed = {
  code: string;
  title: string;
  description: string;
  icon: string;
  category: 'practice' | 'mastery' | 'consistency' | 'exams';
  criteria: Record<string, unknown>;
  sortOrder: number;
};

export const ACHIEVEMENTS: AchievementSeed[] = [
  {
    code: 'first_steps',
    title: 'First Steps',
    description: 'Answered your first 10 questions.',
    icon: 'footprints',
    category: 'practice',
    criteria: { type: 'questions_answered', threshold: 10 },
    sortOrder: 10,
  },
  {
    code: 'first_hundred',
    title: 'First 100 Questions',
    description: 'Answered 100 questions.',
    icon: 'hundred',
    category: 'practice',
    criteria: { type: 'questions_answered', threshold: 100 },
    sortOrder: 20,
  },
  {
    code: 'five_hundred',
    title: '500 Questions',
    description: 'Answered 500 questions.',
    icon: 'stack',
    category: 'practice',
    criteria: { type: 'questions_answered', threshold: 500 },
    sortOrder: 30,
  },
  {
    code: 'streak_7',
    title: '7-Day Practice Streak',
    description: 'Practised on seven days in a row.',
    icon: 'flame',
    category: 'consistency',
    criteria: { type: 'streak_days', threshold: 7 },
    sortOrder: 40,
  },
  {
    code: 'streak_30',
    title: '30-Day Practice Streak',
    description: 'Practised on thirty days in a row.',
    icon: 'flame-strong',
    category: 'consistency',
    criteria: { type: 'streak_days', threshold: 30 },
    sortOrder: 50,
  },
  {
    code: 'topic_master',
    title: 'Topic Master',
    description: 'Reached strong mastery in a topic, with enough practice to be sure of it.',
    icon: 'target',
    category: 'mastery',
    criteria: { type: 'node_mastery', threshold: 0.85, minEffectiveN: 12 },
    sortOrder: 60,
  },
  {
    code: 'unit_master',
    title: 'Unit Master',
    description: 'Reached strong mastery across a whole unit of the syllabus.',
    icon: 'shield',
    category: 'mastery',
    criteria: { type: 'unit_mastery', threshold: 0.85, minEffectiveN: 30 },
    sortOrder: 70,
  },
  {
    code: 'mistake_clearer',
    title: 'Mistake Clearer',
    description: 'Graduated 25 questions out of your Mistake Book.',
    icon: 'check-circle',
    category: 'mastery',
    criteria: { type: 'mistakes_graduated', threshold: 25 },
    sortOrder: 80,
  },
  {
    code: 'comeback',
    title: 'Turned It Around',
    description: 'Took a topic from below 40% to above 70%.',
    icon: 'trending-up',
    category: 'mastery',
    criteria: { type: 'mastery_recovery', from: 0.4, to: 0.7 },
    sortOrder: 90,
  },
  {
    code: 'past_paper_explorer',
    title: 'Past Paper Explorer',
    description: 'Completed questions from five different past papers.',
    icon: 'compass',
    category: 'exams',
    criteria: { type: 'distinct_papers', threshold: 5 },
    sortOrder: 100,
  },
  {
    code: 'mock_exam_done',
    title: 'Mock Exam Completed',
    description: 'Finished a full timed mock examination.',
    icon: 'clock',
    category: 'exams',
    criteria: { type: 'mock_exams_completed', threshold: 1 },
    sortOrder: 110,
  },
  {
    code: 'full_coverage',
    title: 'Whole Syllabus Touched',
    description: 'Practised at least one question in every unit of the syllabus.',
    icon: 'map',
    category: 'practice',
    criteria: { type: 'units_touched', threshold: 15 },
    sortOrder: 120,
  },
];

export const PLANS = [
  {
    code: 'free',
    name: 'Free',
    description: 'Daily practice, explanations, and your mistake book.',
    priceCents: 0,
    currency: 'LKR',
    interval: 'none',
    features: { dailyQuestionLimit: 30, mistakeReview: true },
    sortOrder: 10,
  },
  {
    code: 'premium',
    name: 'Premium',
    description:
      'Unlimited practice, every past paper, mock exams, weak-area practice and full progress analytics.',
    priceCents: 90_000, // LKR 900.00
    currency: 'LKR',
    interval: 'month',
    features: {
      dailyQuestionLimit: null,
      mockExams: true,
      allPastPapers: true,
      weakAreaPractice: true,
      spacedRepetition: true,
      advancedAnalytics: true,
    },
    sortOrder: 20,
  },
] as const;
