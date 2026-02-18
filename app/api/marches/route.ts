import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const nature = searchParams.get('nature');
  const department = searchParams.get('department');
  const source = searchParams.get('source');
  const status = searchParams.get('status') || 'OUVERT';
  const sort = searchParams.get('sort') || 'publicationDate';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: Prisma.MarcheWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { buyer: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { cpvLabel: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (nature) where.nature = nature as any;
  if (department) where.department = department;
  if (source) where.source = source;
  if (status) where.status = status as any;

  const [total, marches] = await Promise.all([
    prisma.marche.count({ where }),
    prisma.marche.findMany({ where, orderBy: { [sort]: order }, skip: (page - 1) * limit, take: limit }),
  ]);

  return NextResponse.json({ data: marches, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
}
