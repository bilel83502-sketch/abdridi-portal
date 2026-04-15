import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      { status: 'ok', db: 'connected', timestamp: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch (error: any) {
    Sentry.captureException(error);

    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers }
    );
  }
}
