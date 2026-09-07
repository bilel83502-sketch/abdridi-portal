import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'PROSPECTOR')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const doc = await prisma.missionDocument.findUnique({
    where: { id: params.docId },
    include: { mission: { select: { status: true } } },
  });

  if (!doc || !doc.fileData) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  // PROSPECTOR can only access documents from ACTIVE missions
  if (user.role === 'PROSPECTOR' && doc.mission.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const buffer = Buffer.from(doc.fileData, 'base64');
  const mimeType = doc.mimeType || 'application/octet-stream';

  const isPdf = mimeType === 'application/pdf';
  const disposition = isPdf ? `inline; filename="${doc.name}"` : `attachment; filename="${doc.name}"`;

  return new Response(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': disposition,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
