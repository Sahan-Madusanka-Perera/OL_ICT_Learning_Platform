import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { profiles } from './identity';

/**
 * Achievements are academic, not arcade (§16). Criteria are data so a new
 * one can be added by an admin without a deploy.
 */
export const achievements = pgTable(
  'achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(), // 'first_100'
    title: text('title').notNull(),
    description: text('description').notNull(),
    icon: text('icon').notNull(),
    category: text('category').notNull(), // 'practice' | 'mastery' | 'consistency'
    /** e.g. { type: 'questions_answered', threshold: 100 } */
    criteria: jsonb('criteria').$type<Record<string, unknown>>().notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('achievements_code_uq').on(t.code)],
);

export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.achievementId] }),
    index('user_achievements_user_idx').on(t.userId, t.earnedAt),
  ],
);

export type Achievement = typeof achievements.$inferSelect;
