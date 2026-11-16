/**
 * extend-trial — Passe les comptes déjà en essai (5 semaines) à 3 mois.
 *
 * Usage :
 *   npx tsx scripts/extend-trial.ts          → aperçu (rien n'est modifié)
 *   npx tsx scripts/extend-trial.ts --apply  → applique
 *
 * Nouvelle date de fin = date d'inscription + 90 jours.
 * Ne touche qu'aux comptes encore en plan ESSAI. Relançable sans risque.
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import { PrismaClient } from '@prisma/client';
import { TRIAL_PLAN, trialEndFrom } from '../lib/trial';

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes('--apply');
  const users = await prisma.user.findMany({
    where: { role: 'USER', plan: TRIAL_PLAN },
    select: { id: true, email: true, createdAt: true, stripeCurrentPeriodEnd: true },
  });
  let changed = 0;
  for (const u of users) {
    const newEnd = trialEndFrom(u.createdAt);
    const old = u.stripeCurrentPeriodEnd;
    if (old && old.getTime() >= newEnd.getTime()) continue;
    console.log(`  ${u.email} : ${old ? old.toLocaleDateString('fr-FR') : '—'} → ${newEnd.toLocaleDateString('fr-FR')}`);
    if (apply) await prisma.user.update({ where: { id: u.id }, data: { stripeCurrentPeriodEnd: newEnd } });
    changed++;
  }
  console.log(`\n${changed} compte(s) ${apply ? 'prolongé(s) à 3 mois' : 'à prolonger. Ajoutez --apply pour appliquer'}.\n`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
