import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { documentCreateSchema, formatZodErrors } from '@/lib/validators';
import { auditFromSession } from '@/lib/audit';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });

  const body = await req.json();
  const parsed = documentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodErrors(parsed.error) }, { status: 400 });
  }

  const { name, type, url } = parsed.data;
  const ext = name.toLowerCase().split('.').pop() || '';
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
  };

  const doc = await prisma.missionDocument.create({
    data: { missionId: params.id, name: name.trim(), type, url: url.trim(), mimeType: mimeMap[ext] || null },
  });

  auditFromSession(user, req, 'DOCUMENT_CREATE', 'MissionDocument', doc.id, { name, type });

  return NextResponse.json(doc, { status: 201 });
}
