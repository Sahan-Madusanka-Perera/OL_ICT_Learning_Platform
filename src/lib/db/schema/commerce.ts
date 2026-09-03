import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { profiles } from './identity';
import { subscriptionStatus, paymentStatus } from './enums';

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(), // 'free' | 'premium_monthly'
    name: text('name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull().default(0),
    currency: text('currency').notNull().default('LKR'),
    interval: text('interval').notNull().default('month'), // month | year | none
    /** Entitlement flags resolved by lib/domain/entitlements.ts */
    features: jsonb('features').$type<Record<string, unknown>>().notNull().default({}),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [uniqueIndex('plans_code_uq').on(t.code)],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'restrict' }),
    status: subscriptionStatus('status').notNull().default('active'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    /** Which adapter owns this — never branched on in business logic. */
    provider: text('provider'),
    providerRef: text('provider_ref'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
  },
  (t) => [
    index('subscriptions_user_idx').on(t.userId, t.status),
    index('subscriptions_expiry_idx').on(t.status, t.currentPeriodEnd),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),
    provider: text('provider').notNull(),
    providerPaymentId: text('provider_payment_id'),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('LKR'),
    status: paymentStatus('status').notNull().default('pending'),
    raw: jsonb('raw'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('payments_user_idx').on(t.userId, t.createdAt),
    uniqueIndex('payments_provider_uq').on(t.provider, t.providerPaymentId),
  ],
);

/**
 * Raw webhook log. `eventId` is UNIQUE, which is the idempotency guarantee:
 * a replayed or duplicated webhook becomes a no-op instead of a double
 * entitlement grant (§20).
 */
export const paymentEvents = pgTable(
  'payment_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(),
    eventId: text('event_id').notNull(),
    eventType: text('event_type'),
    signatureVerified: boolean('signature_verified').notNull().default(false),
    payload: jsonb('payload').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    error: text('error'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('payment_events_uq').on(t.provider, t.eventId)],
);

export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
