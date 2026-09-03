import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  smallint,
  boolean,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { nodeLevel } from './enums';

export const syllabi = pgTable(
  'syllabi',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(), // 'OL-ICT-2026'
    title: text('title').notNull(),
    version: text('version').notNull(), // 'Revised 2026'
    authority: text('authority').notNull().default('National Institute of Education, Sri Lanka'),
    gradeMin: smallint('grade_min').notNull(),
    gradeMax: smallint('grade_max').notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('syllabi_code_uq').on(t.code)],
);

/**
 * The syllabus tree, transcribed from the NIE Teacher's Guide and textbooks.
 *
 * `path` is a zero-padded materialised path ("03.02.01"), which gives two
 * things for free:
 *   - subtree queries are a prefix match on a btree index, no recursion
 *   - `ORDER BY path` yields correct document order
 *
 * We use a text path rather than the `ltree` extension deliberately: the
 * access patterns are identical for our queries, and it removes an extension
 * dependency from local dev, CI and any future host.
 */
export const syllabusNodes = pgTable(
  'syllabus_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    syllabusId: uuid('syllabus_id')
      .notNull()
      .references(() => syllabi.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => syllabusNodes.id, {
      onDelete: 'cascade',
    }),

    level: nodeLevel('level').notNull(),
    code: text('code').notNull(), // '3.2' — as printed in the syllabus
    title: text('title').notNull(),
    description: text('description'),

    grade: smallint('grade'), // 10 | 11
    /** Teaching periods allocated by the syllabus — used to weight coverage. */
    periods: smallint('periods'),

    path: text('path').notNull(), // '03.02.01'
    depth: smallint('depth').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('syllabus_nodes_code_uq').on(t.syllabusId, t.code),
    index('syllabus_nodes_parent_idx').on(t.parentId),
    index('syllabus_nodes_path_idx').on(t.path),
    index('syllabus_nodes_syllabus_level_idx').on(t.syllabusId, t.level),
  ],
);

export type Syllabus = typeof syllabi.$inferSelect;
export type SyllabusNode = typeof syllabusNodes.$inferSelect;
export type NewSyllabusNode = typeof syllabusNodes.$inferInsert;
