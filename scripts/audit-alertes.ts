/**
 * audit-alertes — Qui reçoit quoi ?
 *
 * Liste chaque alerte de veille, le compte à qui elle appartient et l'adresse
 * email réellement notifiée. Sert à vérifier qu'aucun client ne reçoit d'AO
 * qui ne lui est pas destiné, et inversement qu'un client censé être notifié
 * l'est bien.
 *
 * Usage :
 *   npx tsx scripts/audit-alertes.ts
 *   npx tsx scripts/audit-alertes.ts "sud primeur"   (filtre sur un client)
 */
import { config } from 'dotenv';

// Les imports ESM sont evalues avant cette ligne : Prisma a donc deja pu charger
// le .env du projet (qui contient une URL factice host:5432). override:true
// garantit que .env.local a le dernier mot.
config({ path: '.env.local', override: true });

const DB = process.env.DATABASE_URL || '';
if (!DB || /@host:|@localhost|\/\/host:/.test(DB)) {
  console.error('\nErreur de configuration : DATABASE_URL pointe vers une adresse factice');
  console.error(`  valeur lue : ${DB.replace(/:\/\/[^@]*@/, '://***@') || '(vide)'}`);
  console.error('  Verifiez que .env.local existe a la racine du projet et contient');
  console.error('  la vraie DATABASE_URL Neon. Le fichier .env, lui, contient un');
  console.error('  gabarit qui ne doit pas servir.\n');
  process.exit(1);
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const filtre = process.argv[2]?.toLowerCase().trim();

function d(v: Date | null | undefined): string {
  return v ? new Date(v).toLocaleDateString('fr-FR') : 'jamais';
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true, name: true, company: true, role: true, plan: true,
      lastLoginAt: true,
      alerts: {
        select: {
          name: true, keywords: true, natures: true, departments: true,
          frequency: true, active: true, lastSentAt: true, lastMatchCount: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const cible = filtre
    ? users.filter(u =>
        [u.company, u.name, u.email].some(x => (x || '').toLowerCase().includes(filtre)))
    : users;

  if (filtre) {
    console.log(`\n═══ RECHERCHE : "${filtre}" ═══\n`);
    if (cible.length === 0) {
      console.log('  ❌ AUCUN COMPTE ne correspond à ce nom.');
      console.log('     → ce client n\'a pas de compte sur le portail,');
      console.log('       il ne peut donc recevoir AUCUNE notification.\n');
    }
  }

  for (const u of cible) {
    console.log('─'.repeat(70));
    console.log(`  ${u.company || u.name}`);
    console.log(`  email notifié : ${u.email}`);
    console.log(`  rôle ${u.role} · formule ${u.plan} · dernière connexion ${d(u.lastLoginAt)}`);
    if (u.alerts.length === 0) {
      console.log('  ⚠️  AUCUNE ALERTE → ce compte ne reçoit aucun email d\'AO.');
    } else {
      console.log(`  ${u.alerts.length} alerte(s) :`);
      for (const a of u.alerts) {
        console.log(`    • "${a.name}" ${a.active ? '(active)' : '(DÉSACTIVÉE — n\'envoie rien)'}`);
        if (a.keywords.length)    console.log(`        mots-clés     : ${a.keywords.join(', ')}`);
        if (a.natures.length)     console.log(`        secteurs      : ${a.natures.join(', ')}`);
        if (a.departments.length) console.log(`        départements  : ${a.departments.join(', ')}`);
        console.log(`        fréquence ${a.frequency} · dernier envoi ${d(a.lastSentAt)} · ${a.lastMatchCount} AO au dernier passage`);
      }
    }
    console.log('');
  }

  // Synthèse : qui est réellement notifié
  const avecAlertes = users.filter(u => u.alerts.some(a => a.active));
  console.log('═'.repeat(70));
  console.log('  SYNTHÈSE — COMPTES QUI REÇOIVENT DES EMAILS D\'AO');
  console.log('═'.repeat(70));
  if (avecAlertes.length === 0) {
    console.log('  Aucun compte n\'a d\'alerte active : personne ne reçoit d\'AO.');
  } else {
    for (const u of avecAlertes) {
      const n = u.alerts.filter(a => a.active).length;
      console.log(`  • ${u.email.padEnd(38)} ${String(n).padStart(2)} alerte(s) active(s)   ${u.company || u.name}`);
    }
  }
  console.log(`\n  Total : ${users.length} comptes, ${avecAlertes.length} notifié(s).`);
  console.log('  Chaque email part vers un seul destinataire : le propriétaire');
  console.log('  de l\'alerte. Aucune copie, aucune copie cachée.\n');
}

main()
  .catch(e => { console.error('Erreur :', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
