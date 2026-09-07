import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditFromSession } from '@/lib/audit';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'xls', 'csv', 'doc'];
const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};
const ALLOWED_MIME_TYPES = new Set(Object.values(MIME_MAP));

// Magic bytes signatures
const MAGIC_BYTES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]],                     // %PDF
  docx: [[0x50, 0x4B, 0x03, 0x04]],                    // PK (ZIP)
  xlsx: [[0x50, 0x4B, 0x03, 0x04]],                    // PK (ZIP)
  doc: [[0xD0, 0xCF, 0x11, 0xE0]],                     // OLE2
  xls: [[0xD0, 0xCF, 0x11, 0xE0], [0x50, 0x4B, 0x03, 0x04]], // OLE2 or ZIP (newer xls)
};

function validateMagicBytes(bytes: Uint8Array, ext: string): boolean {
  // CSV is plain text — no magic bytes to check
  if (ext === 'csv') return true;

  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return true; // unknown ext, skip

  return signatures.some(sig =>
    sig.every((byte, i) => i < bytes.length && bytes[i] === byte)
  );
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) {
    return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const type = (formData.get('type') as string) || 'AUTRE';

  if (!file) {
    return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
  }

  // 1. Extension check
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: `Format .${ext} non accepté. Formats: ${ALLOWED_EXTENSIONS.join(', ')}` }, { status: 400 });
  }

  // 2. Size check
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
  }

  // 3. MIME type check (browser-reported)
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type) && ext !== 'csv') {
    return NextResponse.json({ error: `Type MIME ${file.type} non autorisé` }, { status: 400 });
  }

  // 4. Magic bytes check (actual file content)
  const buffer = Buffer.from(await file.arrayBuffer());
  const header = new Uint8Array(buffer.slice(0, 8));
  if (!validateMagicBytes(header, ext)) {
    return NextResponse.json({ error: 'Le contenu du fichier ne correspond pas à son extension' }, { status: 400 });
  }

  const validTypes = ['FICHE_RECAP', 'BASE_PROSPECTION', 'DCE', 'AUTRE'];
  const docType = validTypes.includes(type) ? type : 'AUTRE';

  const base64 = buffer.toString('base64');

  const doc = await prisma.missionDocument.create({
    data: {
      missionId: params.id,
      name: file.name,
      type: docType,
      url: '/api/pilotage/documents/placeholder',
      mimeType: MIME_MAP[ext] || 'application/octet-stream',
      size: file.size,
      fileData: base64,
    },
  });

  const updatedDoc = await prisma.missionDocument.update({
    where: { id: doc.id },
    data: { url: `/api/pilotage/documents/${doc.id}` },
  });

  auditFromSession(user, req, 'DOCUMENT_UPLOAD', 'MissionDocument', updatedDoc.id, { name: file.name, type: docType, size: file.size });

  return NextResponse.json({
    id: updatedDoc.id,
    name: updatedDoc.name,
    type: updatedDoc.type,
    url: updatedDoc.url,
    mimeType: updatedDoc.mimeType,
    size: updatedDoc.size,
    createdAt: updatedDoc.createdAt,
  }, { status: 201 });
}
