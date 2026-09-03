import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * The one database handle for the application.
 *
 * `server-only` at the top of this file is load-bearing: importing it from a
 * client component is a build error, not a runtime surprise. Combined with
 * the service layer never returning `is_correct` to a client, this is how
 * answer keys stay on the server (§21).
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env and fill it in.',
  );
}

declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

// Reuse the pool across HMR reloads in development.
const client =
  globalThis.__pgClient ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === 'production' ? 10 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // required when running behind a transaction pooler
  });

if (process.env.NODE_ENV !== 'production') globalThis.__pgClient = client;

export const db = drizzle(client, { schema, casing: 'snake_case' });
export { schema };
export type Db = typeof db;
