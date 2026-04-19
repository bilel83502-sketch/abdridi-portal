import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAccess } from '@/lib/access';

export const dynamic = 'force-dynamic';

const FREE_DAILY_LIMIT = 3;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const nature = searchParams.get('nature') || '';    // comma-separated for multi
  let department = searchParams.get('department') || ''; // comma-separated for multi
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sort = searchParams.get('sort') || 'publicationDate';
  const order = searchParams.get('order') || 'desc';
  const status = searchParams.get('status') || '';
  const source = searchParams.get('source') || '';
  const buyer = searchParams.get('buyer') || '';
  let cpvCode = searchParams.get('cpvCode') || '';

  // Date filters
  const datePublishedFrom = searchParams.get('datePublishedFrom') || '';
  const datePublishedTo = searchParams.get('datePublishedTo') || '';
  const deadlineFrom = searchParams.get('deadlineFrom') || '';
  const deadlineTo = searchParams.get('deadlineTo') || '';
  const favOnly = searchParams.get('favOnly') || '';

  // Check user access (ADMIN = full access, VEILLE with active sub = full access)
  const { isPaid } = await getUserAccess();

  // Free users cannot use premium filters — strip them server-side
  if (!isPaid) {
    department = '';
    cpvCode = '';
  }

  const where: any = {};
  // Default to OUVERT to exclude attributed/closed contracts
  where.status = status || 'OUVERT';
  if (source) {
    where.source = source;
  }
  if (q) {
    const keywords = q.split(',').map(k => k.trim()).filter(Boolean);
    // OR logic: match any keyword in title, buyer, cpvCode or cpvLabel
    where.OR = keywords.flatMap(kw => [
      { title: { contains: kw, mode: 'insensitive' } },
      { buyer: { contains: kw, mode: 'insensitive' } },
      { cpvCode: { contains: kw } },
      { cpvLabel: { contains: kw, mode: 'insensitive' } },
    ]);
  }
  const natures = nature ? nature.split(',').map(s => s.trim()).filter(Boolean) : [];
  const departments = department ? department.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (natures.length === 1) where.nature = natures[0];
  else if (natures.length > 1) where.nature = { in: natures };
  if (departments.length === 1) where.department = departments[0];
  else if (departments.length > 1) where.department = { in: departments };
  if (buyer) where.buyer = { contains: buyer, mode: 'insensitive' };
  if (cpvCode) where.cpvCode = { contains: cpvCode };

  // Date filters for publication date
  if (datePublishedFrom || datePublishedTo) {
    where.publicationDate = { not: null };
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

  // When sorting by publicationDate, exclude nulls so they don't appear first
  if (sort === 'publicationDate' && !datePublishedFrom && !datePublishedTo) {
    if (!where.publicationDate) {
      where.publicationDate = { not: null };
    }
  }

  // Date filters for deadline
  if (deadlineFrom || deadlineTo) {
    where.deadline = { not: null };
    if (deadlineFrom) {
      where.deadline.gte = new Date(deadlineFrom);
    }
    if (deadlineTo) {
      const endDate = new Date(deadlineTo);
      endDate.setHours(23, 59, 59, 999);
      where.deadline.lte = endDate;
    }
  }

  // When sorting by deadline, exclude nulls so they don't appear first
  if (sort === 'deadline' && !deadlineFrom && !deadlineTo) {
    if (!where.deadline) {
      where.deadline = { not: null };
    }
  }

  // Build orderBy — use md5(id) as tiebreaker to mix sources at same date
  const sortCol = sort === 'deadline' ? 'deadline' : 'publicationDate';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';

  // Build WHERE clause fragments for raw query
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  conditions.push(`"status" = $${paramIdx++}`);
  params.push(where.status);

  if (source) {
    conditions.push(`"source" = $${paramIdx++}`);
    params.push(source);
  }
  if (natures.length === 1) {
    conditions.push(`"nature" = $${paramIdx++}`);
    params.push(natures[0]);
  } else if (natures.length > 1) {
    conditions.push(`"nature" = ANY($${paramIdx++})`);
    params.push(natures);
  }
  if (departments.length === 1) {
    conditions.push(`"department" = $${paramIdx++}`);
    params.push(departments[0]);
  } else if (departments.length > 1) {
    conditions.push(`"department" = ANY($${paramIdx++})`);
    params.push(departments);
  }
  if (buyer && typeof where.buyer === 'object') {
    conditions.push(`"buyer" ILIKE $${paramIdx++}`);
    params.push(`%${buyer}%`);
  }
  if (cpvCode) {
    conditions.push(`"cpvCode" LIKE $${paramIdx++}`);
    params.push(`%${cpvCode}%`);
  }
  if (q) {
    const keywords = q.split(',').map(k => k.trim()).filter(Boolean);
    const kwClauses: string[] = [];
    for (const kw of keywords) {
      kwClauses.push(`"title" ILIKE $${paramIdx} OR "buyer" ILIKE $${paramIdx} OR "cpvCode" LIKE $${paramIdx + 1} OR "cpvLabel" ILIKE $${paramIdx}`);
      params.push(`%${kw}%`, `%${kw}%`);
      paramIdx += 2;
    }
    if (kwClauses.length > 0) {
      conditions.push(`(${kwClauses.join(' OR ')})`);
    }
  }
  if (where.publicationDate) {
    if (where.publicationDate.not === null) {
      conditions.push(`"publicationDate" IS NOT NULL`);
    }
    if (where.publicationDate.gte) {
      conditions.push(`"publicationDate" >= $${paramIdx++}`);
      params.push(where.publicationDate.gte);
    }
    if (where.publicationDate.lte) {
      conditions.push(`"publicationDate" <= $${paramIdx++}`);
      params.push(where.publicationDate.lte);
    }
  }
  if (where.deadline) {
    if (where.deadline.not === null) {
      conditions.push(`"deadline" IS NOT NULL`);
    }
    if (where.deadline.gte) {
      conditions.push(`"deadline" >= $${paramIdx++}`);
      params.push(where.deadline.gte);
    }
    if (where.deadline.lte) {
      conditions.push(`"deadline" <= $${paramIdx++}`);
      params.push(where.deadline.lte);
    }
  }

  if (favOnly === '1') {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
        if (user) {
          const favs = await prisma.favori.findMany({ where: { userId: user.id }, select: { marcheId: true } });
          const favIds = favs.map(f => f.marcheId);
          if (favIds.length > 0) {
            conditions.push(`"id" = ANY($${paramIdx++})`);
            params.push(favIds);
          } else {
            // No favoris → return empty
            return NextResponse.json({ data: [], meta: { total: 0, page, pages: 0, isPaid, freeLimit: FREE_DAILY_LIMIT } });
          }
        }
      }
    } catch {}
  }

  const whereClause = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const dataQuery = `SELECT * FROM "Marche" WHERE ${whereClause} ORDER BY "${sortCol}" ${sortDir}, "id" DESC LIMIT ${limit} OFFSET ${offset}`;
  const countQuery = `SELECT COUNT(*)::int as count FROM "Marche" WHERE ${whereClause}`;

  const [data, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(dataQuery, ...params) as Promise<any[]>,
    prisma.$queryRawUnsafe(countQuery, ...params) as Promise<{ count: number }[]>,
  ]);
  const total = countResult[0]?.count || 0;

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

  const res = NextResponse.json({
    data: results,
    meta: { total, page, pages: Math.ceil(total / limit), isPaid, freeLimit: FREE_DAILY_LIMIT },
  });
  res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  return res;
}
