import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const FREE_DAILY_LIMIT = 3;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const nature = searchParams.get('nature') || '';
  const department = searchParams.get('department') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sort = searchParams.get('sort') || 'publicationDate';
  const order = searchParams.get('order') || 'desc';
  const status = searchParams.get('status') || '';
  const source = searchParams.get('source') || '';

  // Date filters
  const datePublishedFrom = searchParams.get('datePublishedFrom') || '';
  const datePublishedTo = searchParams.get('datePublishedTo') || '';
  const deadlineFrom = searchParams.get('deadlineFrom') || '';
  const deadlineTo = searchParams.get('deadlineTo') || '';

  // Check user plan
  let isPaid = false;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, plan: true, stripeCurrentPeriodEnd: true },
      });
      if (user) {
        isPaid = user.role === 'ADMIN' ||
          (user.plan === 'VEILLE' && user.stripeCurrentPeriodEnd && new Date(user.stripeCurrentPeriodEnd) > new Date()) ||
          user.role === 'ADMIN';
      }
    }
  } catch (e) {
    // Continue as free user if session check fails
  }

  const where: any = {};
  // Default to OUVERT to exclude attributed/closed contracts
  where.status = status || 'OUVERT';
  if (source) {
    where.source = source;
  }
  if (q) {
    const keywords = q.split(',').map(k => k.trim()).filter(Boolean);
    if (keywords.length === 1) {
      where.OR = [{ title: { contains: keywords[0], mode: 'insensitive' } }, { buyer: { contains: keywords[0], mode: 'insensitive' } }, { cpvCode: { contains: keywords[0] } }, { cpvLabel: { contains: keywords[0], mode: 'insensitive' } }];
    } else if (keywords.length > 1) {
      where.AND = keywords.map(kw => ({
        OR: [{ title: { contains: kw, mode: 'insensitive' } }, { buyer: { contains: kw, mode: 'insensitive' } }, { cpvCode: { contains: kw } }, { cpvLabel: { contains: kw, mode: 'insensitive' } }],
      }));
    }
  }
  if (nature) where.nature = nature;
  if (department) where.department = department;

  // Date filters for publication date
  if (datePublishedFrom || datePublishedTo) {
    where.publicationDate = {};
    if (datePublishedFrom) {
      where.publicationDate.gte = new Date(datePublishedFrom);
    }
    if (datePublishedTo) {
      // Add end of day
      const endDate = new Date(datePublishedTo);
      endDate.setHours(23, 59, 59, 999);
      where.publicationDate.lte = endDate;
    }
  }

  // Date filters for deadline
  if (deadlineFrom || deadlineTo) {
    where.deadline = {};
    if (deadlineFrom) {
      where.deadline.gte = new Date(deadlineFrom);
    }
    if (deadlineTo) {
      const endDate = new Date(deadlineTo);
      endDate.setHours(23, 59, 59, 999);
      where.deadline.lte = endDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.marche.findMany({ where, orderBy: { [sort]: order }, skip: (page - 1) * limit, take: limit }),
    prisma.marche.count({ where }),
  ]);

  // For free users, mark results beyond the daily limit as locked
  const results = data.map((m: any, index: number) => {
    const globalIndex = (page - 1) * limit + index;
    if (!isPaid && globalIndex >= FREE_DAILY_LIMIT) {
      return {
        ...m,
        locked: true,
        // Mask sensitive fields
        buyer: '\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF',
        value: null,
        sourceRef: null,
        cpvCode: null,
        cpvLabel: null,
      };
    }
    return { ...m, locked: false };
  });

  return NextResponse.json({
    data: results,
    meta: { total, page, pages: Math.ceil(total / limit), isPaid, freeLimit: FREE_DAILY_LIMIT },
  });
}
