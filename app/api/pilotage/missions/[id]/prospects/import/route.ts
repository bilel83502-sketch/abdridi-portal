import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[;,\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(/[;,\t]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
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
  if (!file) {
    return NextResponse.json({ error: 'Fichier CSV requis' }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  const prospects = await prisma.prospect.createMany({
    data: rows.map(r => ({
      missionId: params.id,
      company: (r.Entreprise || r.entreprise || r.company || r.Company || r['Nom'] || '').trim(),
      contact: (r.Contact || r.contact || r['Nom contact'] || '').trim() || null,
      phone: (r.Telephone || r['Téléphone'] || r.telephone || r.phone || r.Phone || r.Tel || r.tel || '').trim() || null,
      email: (r.Email || r.email || r.Mail || r.mail || '').trim() || null,
    })).filter(p => p.company),
  });

  return NextResponse.json({ imported: prospects.count }, { status: 201 });
}
