/**
 * set-password — Définit le mot de passe d'un compte existant.
 *
 * Usage :
 *   npx tsx scripts/set-password.ts <email> '<mot de passe>'
 *
 * Le mot de passe est passé en argument et n'est JAMAIS écrit dans le code
 * (le dépôt GitHub est public). Il est haché avec bcrypt avant stockage :
 * la base ne contient jamais le mot de passe en clair.
 *
 * Le compte est aussi marqué comme vérifié, pour qu'aucune étape de
 * confirmation d'email ne bloque la première connexion.
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const DB = process.env.DATABASE_URL || '';
if (!DB || /@host:|@localhost|\/\/host:/.test(DB)) {
  console.error('\nErreur : DATABASE_URL pointe vers une adresse factice. Vérifiez .env.local\n');
  process.exit(1);
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [emailArg, password] = process.argv.slice(2);

  if (!emailArg || !password) {
    console.error("\nUsage : npx tsx scripts/set-password.ts <email> '<mot de passe>'\n");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('\nMot de passe trop court (8 caractères minimum).\n');
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`\n❌ Aucun compte pour ${email}. Créez-le d'abord avec provision-employees.ts\n`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash, emailVerified: user.emailVerified ?? new Date() },
  });

  // Les liens de réinitialisation en attente sont invalidés : un seul mot de
  // passe valide à la fois.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  console.log(`\n✅ Mot de passe défini pour ${email} (rôle ${user.role}).`);
  console.log('   Elle peut se connecter dès maintenant sur portal.abdridi.com');
  console.log('   Pensez à lui faire changer ce mot de passe depuis Paramètres.\n');
}

main()
  .catch(e => { console.error('Erreur :', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
