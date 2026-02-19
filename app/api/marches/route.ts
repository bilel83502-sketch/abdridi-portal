import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (source) {
    where.source = source;
  }
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { buyer: { contains: q, mode: 'insensitive' } }, { cpvCode: { contains: q } }, { cpvLabel: { contains: q, mode: 'insensitive' } }];
  if (nature) where.nature = nature;
  if (department) where.department = department;

  const [data, total] = await Promise.all([
    prisma.marche.findMany({ where, orderBy: { [sort]: order }, skip: (page - 1) * limit, take: limit }),
    prisma.marche.count({ where }),
  ]);

  return NextResponse.json({ data, meta: { total, page, pages: Math.ceil(total / limit) } });
}
