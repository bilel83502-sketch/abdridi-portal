import { prisma } from './prisma';

/**
 * Distributed rate limiter using Neon PostgreSQL.
 * Works correctly on Vercel serverless (no cold-start reset).
 *
 * Uses CronLog table with jobName as rate limit key to avoid adding a new model.
 * For a production-grade solution, migrate to Upstash Redis (@upstash/ratelimit).
 */

// In-memory cache for current request (avoids DB round-trip on every call within same invocation)
const localCache = new Map<string, { count: number; resetAt: number }>();

export async function rateLimitCheck(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();

  // Check local cache first (same serverless invocation)
  const cached = localCache.get(key);
  if (cached && cached.resetAt > now) {
    if (cached.count >= limit) return { allowed: false, remaining: 0 };
    cached.count++;
    return { allowed: true, remaining: limit - cached.count };
  }

  // Count recent entries in DB
  const windowStart = new Date(now - windowMs);
  try {
    const count = await prisma.cronLog.count({
      where: {
        jobName: `rl:${key}`,
        executedAt: { gte: windowStart },
      },
    });

    if (count >= limit) {
      localCache.set(key, { count: limit, resetAt: now + windowMs });
      return { allowed: false, remaining: 0 };
    }

    // Log this request
    await prisma.cronLog.create({
      data: {
        jobName: `rl:${key}`,
        success: true,
        message: 'rate-limit-entry',
        alertsProcessed: 0,
        emailsSent: 0,
      },
    });

    localCache.set(key, { count: count + 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - count - 1 };
  } catch {
    // If DB fails, allow the request (fail open)
    return { allowed: true, remaining: limit };
  }
}

/**
 * Simple in-memory rate limiter (fallback for non-critical paths).
 * Note: resets on cold start — use rateLimitCheck() for critical paths.
 */
const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || entry.resetAt < now) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}
