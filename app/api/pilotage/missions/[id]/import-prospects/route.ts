import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

// Flexible column name matching
const COMPANY_NAMES = ['entreprise', 'société', 'societe', 'raison sociale', 'raison_sociale', 'company', 'nom', 'nom entreprise', 'nom_entreprise'];
const CONTACT_NAMES = ['contact', 'nom contact', 'nom_contact', 'interlocuteur', 'referent', 'référent'];
const PHONE_NAMES = ['telephone', 'téléphone', 'tel', 'phone', 'tel.', 'numéro', 'numero', 'portable', 'mobile'];
const EMAIL_NAMES = ['email', 'mail', 'e-mail', 'courriel', 'adresse email', 'adresse_email'];

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h.toLowerCase().trim() === candidate);
    if (idx !== -1) return idx;
  }
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h.toLowerCase().trim().includes(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await req.json();
  const { documentId } = body;

  if (!documentId) {
    return NextResponse.json({ error: 'documentId requis' }, { status: 400 });
  }

  const doc = await prisma.missionDocument.findFirst({
    where: { id: documentId, missionId: params.id, type: 'BASE_PROSPECTION' },
  });

  if (!doc || !doc.fileData) {
    return NextResponse.json({ error: 'Document introuvable ou pas de données' }, { status: 404 });
  }

  // Parse Excel from base64 using exceljs
  const buffer = Buffer.from(doc.fileData, 'base64');
  const workbook = new ExcelJS.Workbook();

  const ext = doc.name.toLowerCase().split('.').pop();
  if (ext === 'csv') {
    const { Readable } = await import('stream');
    await workbook.csv.read(Readable.from(buffer) as any);
  } else {
    await workbook.xlsx.load(buffer as any);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) {
    return NextResponse.json({ error: 'Fichier vide ou sans données' }, { status: 400 });
  }

  // Extract headers from first row
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value || '');
  });

  const companyIdx = findColumn(headers, COMPANY_NAMES);
  const contactIdx = findColumn(headers, CONTACT_NAMES);
  const phoneIdx = findColumn(headers, PHONE_NAMES);
  const emailIdx = findColumn(headers, EMAIL_NAMES);

  if (companyIdx === -1) {
    return NextResponse.json({
      error: `Colonne "Entreprise" non trouvée. Colonnes détectées : ${headers.filter(Boolean).join(', ')}`,
    }, { status: 400 });
  }

  // Extract data rows
  const prospects: { missionId: string; company: string; contact: string | null; phone: string | null; email: string | null }[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const cellVal = (idx: number) => {
      if (idx === -1) return null;
      const cell = row.getCell(idx + 1);
      return String(cell.value || '').trim() || null;
    };
    const company = cellVal(companyIdx);
    if (!company) return;
    prospects.push({
      missionId: params.id,
      company,
      contact: cellVal(contactIdx),
      phone: cellVal(phoneIdx),
      email: cellVal(emailIdx),
    });
  });

  if (prospects.length === 0) {
    return NextResponse.json({ error: 'Aucune entreprise trouvée dans le fichier' }, { status: 400 });
  }

  const result = await prisma.prospect.createMany({ data: prospects });

  return NextResponse.json({ imported: result.count }, { status: 201 });
}
