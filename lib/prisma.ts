import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Slow query monitoring in production
// 1000ms+ → warning, 3000ms+ → error
if (process.env.NODE_ENV === 'production') {
  prisma.$on('query' as never, (e: { query: string; params: string; duration: number }) => {
    if (e.duration > 1000) {
      const level = e.duration > 3000 ? 'error' : 'warning';
      const msg = `[SLOW QUERY] ${e.duration}ms — ${e.query} — params: ${e.params}`;
      console.warn(msg);
      try {
        const Sentry = require('@sentry/nextjs');
        Sentry.captureMessage(msg, { level, extra: { duration: e.duration, query: e.query } });
      } catch {
        // Sentry not available, log only
      }
    }
  });
}
