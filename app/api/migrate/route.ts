import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Temporary migration endpoint to create MarcheAttribue table.
 * Call once then this route can be removed.
 */
export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MarcheAttribue" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "objet" TEXT NOT NULL,
        "acheteurNom" TEXT NOT NULL,
        "acheteurSiret" TEXT,
        "titulaireNom" TEXT NOT NULL,
        "titulaireSiret" TEXT,
        "titulaireCommune" TEXT,
        "montant" DOUBLE PRECISION,
        "dateNotification" TIMESTAMP(3),
        "datePublicationDonnees" TIMESTAMP(3),
        "nature" TEXT NOT NULL,
        "procedure" TEXT,
        "lieuExecution" TEXT,
        "departement" TEXT,
        "departementNom" TEXT,
        "region" TEXT,
        "codeCPV" TEXT,
        "labelCPV" TEXT,
        "source" TEXT NOT NULL,
        "sourceRef" TEXT NOT NULL,
        "dureeMois" INTEGER,
        "formePrix" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MarcheAttribue_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create unique index on sourceRef
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "MarcheAttribue_sourceRef_key" ON "MarcheAttribue"("sourceRef");
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MarcheAttribue_titulaireNom_idx" ON "MarcheAttribue"("titulaireNom");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MarcheAttribue_acheteurNom_idx" ON "MarcheAttribue"("acheteurNom");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MarcheAttribue_nature_idx" ON "MarcheAttribue"("nature");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MarcheAttribue_departement_idx" ON "MarcheAttribue"("departement");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MarcheAttribue_dateNotification_idx" ON "MarcheAttribue"("dateNotification");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MarcheAttribue_montant_idx" ON "MarcheAttribue"("montant");
    `);

    return NextResponse.json({ success: true, message: 'MarcheAttribue table created with indexes' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
