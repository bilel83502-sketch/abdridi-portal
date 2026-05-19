/**
 * ensure-admin — Garantit que le compte super-admin existe avec tous les droits.
 *
 * Idempotent : peut être lancé autant de fois que voulu.
 * Utilise l'email défini dans lib/constants.ts (ADMIN_EMAIL).
 *
 * Usage :
 *   npm run ensure:admin
 *   # ou
 *   npx tsx scripts/ensure-admin.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { ADMIN_EMAIL } from '../lib/constants';

const prisma = new PrismaClient();

async function main() {
  console.log(`▶ Ensure admin pour : ${ADMIN_EMAIL}\n`);

  const ONE_HUNDRED_YEARS_FROM_NOW = new Date();
  ONE_HUNDRED_YEARS_FROM_NOW.setFullYear(ONE_HUNDRED_YEARS_FROM_NOW.getFullYear() + 100);

  // Upsert : crée si absent, met à jour si présent.
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: 'Bilel DRIDI',
      role: 'ADMIN',
      plan: 'VEILLE',
      emailVerified: new Date(),
      stripeCurrentPeriodEnd: ONE_HUNDRED_YEARS_FROM_NOW,
      lastLoginAt: new Date(),
    },
    update: {
      role: 'ADMIN',
      plan: 'VEILLE',
      emailVerified: new Date(),
      stripeCurrentPeriodEnd: ONE_HUNDRED_YEARS_FROM_NOW,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      stripeCurrentPeriodEnd: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  console.log('✅ Compte super-admin garanti :');
  console.log(`   ID                : ${user.id}`);
  console.log(`   Email             : ${user.email}`);
  console.log(`   Nom               : ${user.name}`);
  console.log(`   Rôle              : ${user.role}`);
  console.log(`   Plan              : ${user.plan}`);
  console.log(`   Email vérifié     : ${user.emailVerified?.toISOString() ?? 'non'}`);
  console.log(`   Stripe valide jusqu' : ${user.stripeCurrentPeriodEnd?.toISOString() ?? 'jamais'}`);
  console.log(`   Créé le           : ${user.createdAt.toISOString()}`);
  console.log('\n→ Sur portal.abdridi.com, attends 5 minutes (rafraîchissement JWT auto)');
  console.log('  ou déconnecte-toi + reconnecte-toi pour effet immédiat.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur ensure-admin :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
