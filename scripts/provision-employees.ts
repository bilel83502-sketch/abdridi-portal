/**
 * provision-employees — Crée/convertit des comptes "commercial" (role PROSPECTOR).
 *
 * Un compte PROSPECTOR ne voit QUE les missions actives qui lui sont assignées
 * (voir migrate-mission-assignee.ts pour la colonne d'assignation, et les
 * routes /api/pilotage/* pour l'application du contrôle d'accès côté serveur).
 *
 * Pour chaque entrée de EMPLOYEES ci-dessous :
 *   - le compte n'existe pas encore → il est créé avec un mot de passe
 *     temporaire aléatoire (jamais affiché en clair : seul un lien de
 *     définition de mot de passe, valable 48h, est envoyé par email) ;
 *   - le compte existe déjà (ex: Arij, si son adresse a déjà un compte
 *     client) → seul son rôle passe à PROSPECTOR, rien d'autre n'est
 *     modifié (mot de passe, nom existants conservés).
 *
 * ⚠️ À COMPLÉTER avant de lancer : l'email de Mirko Modolo ci-dessous.
 *
 * Usage : npx tsx scripts/provision-employees.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

const DB = process.env.DATABASE_URL || '';
if (!DB || /@host:|@localhost|\/\/host:/.test(DB)) {
  console.error('\nErreur de configuration : DATABASE_URL pointe vers une adresse factice.');
  console.error('Vérifiez que .env.local contient la vraie DATABASE_URL Neon.\n');
  process.exit(1);
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const EMPLOYEES: { name: string; email: string }[] = [
  { name: 'Mirko Modolo', email: 'REMPLACER_PAR_EMAIL_DE_MIRKO@exemple.com' },
  { name: 'Arij', email: 'dridiarij9@gmail.com' },
];

function randomPassword(): string {
  // Mot de passe temporaire : jamais affiché, jamais transmis — seul le
  // lien de définition (token à usage unique) part par email.
  return crypto.randomBytes(24).toString('base64url');
}

async function sendOnboardingEmail(name: string, email: string, resetUrl: string, isNew: boolean) {
  const { error } = await resend.emails.send({
    from: 'AB DRIDI <noreply@abdridi.com>',
    to: email,
    subject: isNew ? 'Votre accès commercial AB DRIDI est prêt' : 'Votre accès AB DRIDI a été mis à jour',
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
  <tr><td style="background:#0F0F23;padding:24px;text-align:center">
    <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:0.1em">AB DRIDI</span>
  </td></tr>
  <tr><td style="background:#ffffff;padding:32px 28px">
    <h2 style="font-size:20px;font-weight:700;color:#1A1A2E;margin:0 0 16px">Bonjour ${name.split(' ')[0]},</h2>
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px">
      ${isNew
        ? "Votre accès commercial au portail AB DRIDI a été créé. Vous aurez accès aux missions qui vous sont assignées."
        : "Votre compte AB DRIDI a été configuré en accès commercial : vous verrez désormais les missions qui vous sont assignées."}
      Cliquez sur le bouton ci-dessous pour définir votre mot de passe :
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px">
      <tr><td style="background:#3B82F6;padding:12px 28px;border-radius:6px;text-align:center">
        <a href="${resetUrl}" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px">Définir mon mot de passe</a>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#94A3B8;margin:0 0 20px">Ce lien expire dans 48 heures.</p>
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0">
      Une fois connecté, retrouvez vos missions dans l'onglet <strong>Prospection</strong> sur
      <a href="https://portal.abdridi.com" style="color:#3B82F6;text-decoration:none;font-weight:600">portal.abdridi.com</a>.
    </p>
  </td></tr>
  <tr><td style="padding:20px 24px;text-align:center;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="font-size:13px;color:#374151;margin:0 0 4px;font-weight:600">Bilel DRIDI — AB DRIDI</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  });
  if (error) console.error(`  ⚠️  Email non envoyé à ${email} :`, error);
  else console.log(`  ✅ Email envoyé à ${email}`);
}

async function main() {
  const missing = EMPLOYEES.filter(e => e.email.includes('REMPLACER_PAR_EMAIL'));
  if (missing.length > 0) {
    console.error(`\n❌ Complétez d'abord l'email de : ${missing.map(m => m.name).join(', ')}`);
    console.error('   Éditez scripts/provision-employees.ts puis relancez.\n');
    process.exit(1);
  }

  for (const emp of EMPLOYEES) {
    const email = emp.email.toLowerCase().trim();
    console.log(`\n── ${emp.name} (${email}) ──`);

    const existing = await prisma.user.findUnique({ where: { email } });
    let isNew = false;

    if (existing) {
      if (existing.role === 'PROSPECTOR') {
        console.log('  ℹ️  Déjà en accès commercial — aucun changement de rôle nécessaire.');
      } else {
        await prisma.user.update({ where: { email }, data: { role: 'PROSPECTOR' } });
        console.log(`  ✅ Rôle mis à jour : ${existing.role} → PROSPECTOR (nom, mot de passe conservés).`);
      }
    } else {
      isNew = true;
      const hash = await bcrypt.hash(randomPassword(), 12);
      await prisma.user.create({
        data: { name: emp.name, email, passwordHash: hash, role: 'PROSPECTOR', plan: 'DECOUVERTE' },
      });
      console.log('  ✅ Compte créé avec le rôle PROSPECTOR.');
    }

    // Lien de définition de mot de passe (même mécanisme que "mot de passe oublié")
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    const token = crypto.randomUUID();
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires: new Date(Date.now() + 48 * 60 * 60 * 1000) },
    });
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
    await sendOnboardingEmail(emp.name, email, resetUrl, isNew);
  }

  console.log('\n✅ Terminé. Assignez leurs missions depuis Pilotage > Missions (sélecteur "Non assigné" sur chaque ligne).\n');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('\n❌ Erreur :', e.message);
  process.exit(1);
});
