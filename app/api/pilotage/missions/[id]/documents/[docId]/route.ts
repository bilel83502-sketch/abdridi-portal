import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditFromSession } from '@/lib/audit';

export async function DELETE(req: Request, { params }: { params: { id: string; docId: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const doc = await prisma.missionDocument.findFirst({
    where: { id: params.docId, missionId: params.id },
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  await prisma.missionDocument.delete({ where: { id: params.docId } });
  auditFromSession(user, req, 'DOCUMENT_DELETE', 'MissionDocument', params.docId, { name: doc.name });

  return NextResponse.json({ ok: true });
}
