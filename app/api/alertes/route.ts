import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const alerts = await prisma.alert.findMany({ where: { userId: (session.user as any).id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(alerts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const body = await req.json();
  const alert = await prisma.alert.create({
    data: {
      userId: (session.user as any).id, name: body.name || 'Nouvelle alerte',
      keywords: body.keywords || [], departments: body.departments || [], natures: body.natures || [],
      cpvCodes: body.cpvCodes || [], sources: body.sources || [],
      minValue: body.minValue || null, maxValue: body.maxValue || null, frequency: body.frequency || 'QUOTIDIEN',
    },
  });
  return NextResponse.json(alert, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const body = await req.json();
  const { id, ...data } = body;
  const alert = await prisma.alert.updateMany({ where: { id, userId: (session.user as any).id }, data });
  return NextResponse.json(alert);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  await prisma.alert.deleteMany({ where: { id, userId: (session.user as any).id } });
  return NextResponse.json({ deleted: true });
}
