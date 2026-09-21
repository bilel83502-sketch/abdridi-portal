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
    include: { mission: { select: { status: true, assignedToId: true } } },
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }
  if (!doc.fileData) {
    // Document ajouté par lien externe : on redirige vers ce lien
    if (doc.url && /^https?:\/\//.test(doc.url)) return NextResponse.redirect(doc.url);
    return NextResponse.json({ error: 'Ce document n\'a pas de contenu stocké' }, { status: 404 });
  }

  // Un commercial n'accède qu'aux documents de ses missions actives assignées
  if (user.role === 'PROSPECTOR' && (doc.mission.status !== 'ACTIVE' || doc.mission.assignedToId !== user.id)) {
    return NextResponse.json({ error: 'Accès refusé — mission non assignée' }, { status: 403 });
  }

  const buffer = Buffer.from(doc.fileData, 'base64');
  const mimeType = doc.mimeType || 'application/octet-stream';

  // Les en-têtes HTTP n'acceptent que de l'ASCII : un nom comme
  // "Fiche récap.pdf" faisait planter la réponse (500) pour tout le monde.
  const asciiName = doc.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');
  const utf8Name = encodeURIComponent(doc.name);
  const isPdf = mimeType === 'application/pdf';
  const disposition = `${isPdf ? 'inline' : 'attachment'}; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`;

  return new Response(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': disposition,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
