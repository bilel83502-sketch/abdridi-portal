import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const alerts = await prisma.alert.findMany({ where: { userId: (session.user as any).id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(alerts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const body = await req.json();
  const alert = await prisma.alert.create({
    data: { userId: (session.user as any).id, name: body.name, keywords: body.keywords || [], natures: body.natures || [], departments: body.departments || [], frequency: body.frequency || 'DAILY' },
  });
  return NextResponse.json(alert, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id, ...data } = await req.json();
  const alert = await prisma.alert.updateMany({ where: { id, userId: (session.user as any).id }, data });
  return NextResponse.json(alert);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id } = await req.json();
  await prisma.alert.deleteMany({ where: { id, userId: (session.user as any).id } });
  return NextResponse.json({ ok: true });
}
