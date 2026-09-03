import 'dotenv/config';

/**
 * Integration tests run against the local development database seeded by
 * `npm run db:seed`. They are read-mostly; the few that write use a
 * dedicated throwaway user created and removed inside the test.
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env, then run: npm run db:migrate && npm run db:seed',
  );
}
