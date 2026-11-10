/**
 * announce-trial — Email d'annonce « 5 semaines offertes » aux inscrits.
 *
 * Usage (dans le Terminal, depuis le dossier du portail) :
 *   npx tsx scripts/announce-trial.ts            → aperçu : combien de personnes, qui (rien n'est envoyé)
 *   npx tsx scripts/announce-trial.ts --test     → envoie l'email UNIQUEMENT à l'admin, pour vérifier le rendu
 *   npx tsx scripts/announce-trial.ts --send     → envoie à tous les destinataires
 *
 * Destinataires : les comptes clients (rôle USER) qui ont accepté les
 * communications (marketingConsent = true). Ajouter --all pour inclure
 * aussi les clients qui n'ont pas coché la case (prospection B2B : un lien
 * de désinscription est toujours présent dans l'email).
 *
 * Relançable sans risque : chaque adresse servie est notée dans
 * scripts/.announce-trial-sent.txt et ne recevra jamais l'email deux fois.
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const ADMIN = (process.env.ADMIN_EMAIL || 'bilel83502@gmail.com').toLowerCase();
const SENT_FILE = path.join(__dirname, '.announce-trial-sent.txt');
const SUBJECT = 'Nouveau : 5 semaines offertes sur AB DRIDI';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function html(name: string, email: string): string {
  const prenom = esc((name || '').split(' ')[0] || 'Bonjour');
  const unsub = `https://portal.abdridi.com/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 0;"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;background:#fff;border-radius:8px;overflow:hidden;">
<tr><td style="background:#0A1628;padding:20px 32px;"><span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:0.1em;">AB DRIDI</span></td></tr>
<tr><td style="padding:30px 32px;">
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#10B981;text-transform:uppercase;letter-spacing:0.05em;">Nouveau</p>
  <h1 style="margin:0 0 18px;font-size:23px;line-height:1.3;color:#111827;">5 semaines d'accès complet offertes sur AB DRIDI</h1>
  <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">${prenom},</p>
  <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">
    Le portail AB DRIDI évolue. Toute entreprise qui s'inscrit bénéficie désormais de <strong>5 semaines d'accès complet, sans carte bancaire</strong> :
  </p>
  <ul style="margin:0 0 18px;padding-left:20px;font-size:14px;line-height:1.8;color:#374151;">
    <li>les appels d'offres du transport, sans limite, sur 35+ sources officielles (France, Europe, Suisse) ;</li>
    <li>une alerte email chaque matin avec les nouveaux marchés de votre secteur ;</li>
    <li>la veille concurrentielle : qui a gagné quels marchés, et à quel prix.</li>
  </ul>
  <p style="margin:0 0 22px;font-size:14px;line-height:1.7;color:#374151;">
    <strong>Vous connaissez une entreprise de transport</strong> qui pourrait en profiter ? Transférez-lui simplement cet email.
    Et si vous souhaitez qu'on monte votre prochain dossier de réponse (mémoire technique, BPU, dépôt), répondez à ce message.
  </p>
  <table cellpadding="0" cellspacing="0"><tr><td style="background:#2563EB;border-radius:6px;">
    <a href="https://portal.abdridi.com/" style="display:inline-block;padding:13px 30px;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">Découvrir le portail</a>
  </td></tr></table>
  <p style="margin:26px 0 0;font-size:14px;color:#374151;">À très vite,<br><strong>Bilel Dridi</strong> — AB DRIDI</p>
</td></tr>
<tr><td style="padding:18px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center;font-size:11px;color:#9CA3AF;line-height:1.6;">
  AB DRIDI — portail de veille des marchés publics · <a href="https://portal.abdridi.com" style="color:#2563EB;text-decoration:none;">portal.abdridi.com</a><br>
  Vous recevez cet email car vous avez un compte sur portal.abdridi.com. <a href="${unsub}" style="color:#2563EB;">Se désinscrire</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--send') ? 'send' : args.includes('--test') ? 'test' : 'preview';
  const includeAll = args.includes('--all');

  if (mode !== 'preview' && !process.env.RESEND_API_KEY) {
    console.error('\nErreur : RESEND_API_KEY absente de .env.local. Copiez-la depuis Vercel (Settings → Environment Variables).\n');
    process.exit(1);
  }
  const resend = new Resend(process.env.RESEND_API_KEY || 're_missing_key');

  if (mode === 'test') {
    await resend.emails.send({ from: 'AB DRIDI <noreply@abdridi.com>', to: ADMIN, replyTo: ADMIN, subject: `[TEST] ${SUBJECT}`, html: html('Bilel Dridi', ADMIN) });
    console.log(`\nEmail de test envoyé à ${ADMIN}. Vérifiez votre boîte (et les spams).\n`);
    return;
  }

  const already = new Set(
    fs.existsSync(SENT_FILE) ? fs.readFileSync(SENT_FILE, 'utf8').split('\n').map(l => l.trim().toLowerCase()).filter(Boolean) : [],
  );

  const users = await prisma.user.findMany({
    where: { role: 'USER', ...(includeAll ? {} : { marketingConsent: true }) },
    select: { email: true, name: true, company: true, plan: true },
    orderBy: { createdAt: 'asc' },
  });
  const targets = users.filter(u => u.email.toLowerCase() !== ADMIN && !already.has(u.email.toLowerCase()));

  console.log(`\nDestinataires : ${targets.length}${includeAll ? ' (tous les clients)' : ' (clients ayant accepté les communications)'}`);
  if (already.size) console.log(`Déjà servis lors d'un envoi précédent : ${already.size}`);
  for (const u of targets.slice(0, 50)) console.log(`  - ${u.email}${u.company ? ` (${u.company})` : ''}`);
  if (targets.length > 50) console.log(`  … et ${targets.length - 50} autres`);

  if (mode === 'preview') {
    console.log('\nRien n\'a été envoyé. Pour un test sur votre boîte : --test. Pour envoyer à tous : --send\n');
    return;
  }

  let ok = 0, ko = 0;
  for (const u of targets) {
    try {
      const { error } = await resend.emails.send({
        from: 'AB DRIDI <noreply@abdridi.com>',
        to: u.email,
        replyTo: ADMIN,
        subject: SUBJECT,
        html: html(u.name, u.email),
        headers: { 'List-Unsubscribe': `<https://portal.abdridi.com/unsubscribe?email=${encodeURIComponent(u.email)}>` },
      });
      if (error) throw new Error(error.message);
      fs.appendFileSync(SENT_FILE, u.email.toLowerCase() + '\n');
      ok++;
      console.log(`  ✓ ${u.email}`);
    } catch (e: any) {
      ko++;
      console.log(`  ✗ ${u.email} — ${e?.message || e}`);
    }
    await sleep(600); // limite Resend : ~2 emails / seconde
  }
  console.log(`\nTerminé : ${ok} envoyé(s), ${ko} échec(s).${ko ? ' Relancez la même commande pour réessayer les échecs.' : ''}\n`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
