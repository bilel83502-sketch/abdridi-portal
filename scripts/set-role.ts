/**
 * set-role — Change le rôle d'un compte, et supprime éventuellement un doublon.
 *
 * Usage :
 *   npx tsx scripts/set-role.ts <email> <ADMIN|PROSPECTOR|USER> [--delete=<autre-email>]
 *
 * --delete : supprime un compte doublon (refusé s'il possède des missions
 *            assignées, des alertes ou des rendez-vous, sauf --force).
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ROLES = ['ADMIN', 'PROSPECTOR', 'USER'];

async function main() {
  const [email, role, ...rest] = process.argv.slice(2);
  const del = rest.find(a => a.startsWith('--delete='))?.split('=')[1];
  const force = rest.includes('--force');

  if (!email || !ROLES.includes(role)) {
    console.error('Usage : npx tsx scripts/set-role.ts <email> <ADMIN|PROSPECTOR|USER> [--delete=<email>] [--force]');
    process.exit(1);
  }

  const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!u) { console.error(`❌ Aucun compte pour ${email}`); process.exit(1); }
  if (u.role === role) console.log(`ℹ️  ${email} est déjà ${role}.`);
  else {
    await prisma.user.update({ where: { email: email.toLowerCase() }, data: { role } });
    console.log(`✅ ${email} : ${u.role} → ${role}`);
  }

  if (del) {
    const d = await prisma.user.findUnique({
      where: { email: del.toLowerCase() },
      include: { _count: { select: { alerts: true, appointments: true, assignedMissions: true } } },
    });
    if (!d) { console.log(`ℹ️  Doublon ${del} introuvable — rien à supprimer.`); }
    else if (d.role === 'ADMIN') { console.error('❌ Refus : on ne supprime pas un admin par ce script.'); }
    else {
      const c = d._count;
      if ((c.alerts || c.appointments || c.assignedMissions) && !force) {
        console.error(`❌ ${del} possède ${c.assignedMissions} mission(s), ${c.alerts} alerte(s), ${c.appointments} RDV. Ajoutez --force pour supprimer quand même.`);
      } else {
        await prisma.user.delete({ where: { id: d.id } });
        console.log(`🗑  Doublon ${del} supprimé.`);
      }
    }
  }
}
main().catch(e => { console.error('Erreur :', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
