/**
 * Helper partagé pour l'insertion de MarcheAttribue.
 *
 * Gère deux types de conflits :
 *  - sourceRef déjà existant (même source)     → upsert (update)
 *  - contrainte dedup (même contenu, source ≠) → skip silencieux (P2002)
 */

import { prisma } from '@/lib/prisma';
import type { AttribueRecord } from '@/lib/decp-attribue';

const BATCH_SIZE = 50;

/** Champs mis à jour quand le sourceRef existe déjà */
function buildUpdate(record: AttribueRecord) {
  return {
    objet: record.objet,
    acheteurNom: record.acheteurNom,
    acheteurSiret: record.acheteurSiret,
    titulaireNom: record.titulaireNom,
    titulaireSiret: record.titulaireSiret,
    titulaireCommune: record.titulaireCommune,
    montant: record.montant,
    dateNotification: record.dateNotification,
    datePublicationDonnees: record.datePublicationDonnees,
    nature: record.nature,
    procedure: record.procedure,
    lieuExecution: record.lieuExecution,
    departement: record.departement,
    departementNom: record.departementNom,
    region: record.region,
    codeCPV: record.codeCPV,
    labelCPV: record.labelCPV,
    dureeMois: record.dureeMois,
    formePrix: record.formePrix,
  };
}

/** Retourne true si l'erreur est une violation de contrainte unique (Prisma P2002) */
function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as any).code === 'P2002'
  );
}

/** Upsert un seul enregistrement, retourne 'upserted' | 'dedup' | 'skipped' */
async function upsertOne(record: AttribueRecord): Promise<'upserted' | 'dedup' | 'skipped'> {
  if (!record.sourceRef) return 'skipped';
  try {
    await prisma.marcheAttribue.upsert({
      where: { sourceRef: record.sourceRef },
      update: buildUpdate(record),
      create: record,
    });
    return 'upserted';
  } catch (err) {
    if (isUniqueConstraintError(err)) return 'dedup';
    return 'skipped';
  }
}

export async function upsertAttribueRecords(records: AttribueRecord[]): Promise<{
  upserted: number;
  dedup: number;
  skipped: number;
}> {
  let upserted = 0;
  let dedup = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE).filter((r) => r.sourceRef);

    const ops = batch.map((record) =>
      prisma.marcheAttribue.upsert({
        where: { sourceRef: record.sourceRef },
        update: buildUpdate(record),
        create: record,
      })
    );

    try {
      // Tentative batch (rapide si pas de conflit)
      const results = await prisma.$transaction(ops);
      upserted += results.length;
    } catch {
      // Un conflit dans le batch : on repasse en individuel pour isoler
      for (const record of batch) {
        const result = await upsertOne(record);
        if (result === 'upserted') upserted++;
        else if (result === 'dedup') dedup++;
        else skipped++;
      }
    }
  }

  // Records sans sourceRef filtrés en amont → comptés comme skipped
  skipped += records.filter((r) => !r.sourceRef).length;

  return { upserted, dedup, skipped };
}
