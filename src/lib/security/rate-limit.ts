import 'server-only';

/**
 * Rate limiting.
 *
 * In production this is Upstash Redis. With no Redis configured — local
 * development, CI — it falls back to an in-process counter, which is
 * correct for a single process and honest about not being distributed.
 *
 * It deliberately FAILS OPEN if Redis errors: a rate limiter that takes the
 * whole site down when its dependency blips is a worse outage than the one
 * it prevents. Failures are logged so the blindness is visible.
 */

type Result = { allowed: boolean; remaining: number; resetAt: number };

const memory = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowSeconds: number): Result {
  const now = Date.now();
  const entry = memory.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowSeconds * 1000;
    memory.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

// Keep the in-process map from growing without bound.
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memory) if (entry.resetAt < now) memory.delete(key);
  }, 60_000);
  timer.unref?.();
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<Result> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return memoryLimit(key, limit, windowSeconds);

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', `rl:${key}`],
        ['EXPIRE', `rl:${key}`, String(windowSeconds), 'NX'],
      ]),
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Redis responded ${res.status}`);

    const [incr] = (await res.json()) as Array<{ result: number }>;
    const count = incr?.result ?? 0;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + windowSeconds * 1000,
    };
  } catch (error) {
    console.error('[rate-limit] Redis unavailable, failing open:', error);
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }
}
