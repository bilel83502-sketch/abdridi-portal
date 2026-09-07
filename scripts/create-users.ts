/**
 * One-shot script: create 2 user accounts with plan VEILLE.
 * Usage: npx tsx scripts/create-users.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const prisma = new PrismaClient();

async function main() {
  const periodEnd = new Date('2030-12-31');

  // ── Compte 1 — SUD PRIMEURS N&A (pas d'email) ──
  const hash1 = await bcrypt.hash('Sudprimeur@', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'nordine.agueni@sud-primeur.fr' },
    update: { name: 'SUD PRIMEURS N&A', passwordHash: hash1, plan: 'VEILLE', role: 'USER', stripeCurrentPeriodEnd: periodEnd },
    create: { name: 'SUD PRIMEURS N&A', email: 'nordine.agueni@sud-primeur.fr', passwordHash: hash1, plan: 'VEILLE', role: 'USER', stripeCurrentPeriodEnd: periodEnd },
  });
  console.log(`[OK] ${user1.email} — id: ${user1.id}`);

  // ── Compte 2 — Life Line Transport (avec email de bienvenue) ──
  const hash2 = await bcrypt.hash('Lifeline@', 12);
  const user2 = await prisma.user.upsert({
    where: { email: 'contact@lifelinetransports.com' },
    update: { name: 'Life Line Transport', passwordHash: hash2, plan: 'VEILLE', role: 'USER', stripeCurrentPeriodEnd: periodEnd },
    create: { name: 'Life Line Transport', email: 'contact@lifelinetransports.com', passwordHash: hash2, plan: 'VEILLE', role: 'USER', stripeCurrentPeriodEnd: periodEnd },
  });
  console.log(`[OK] ${user2.email} — id: ${user2.id}`);

  // Send welcome email to Life Line Transport
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'AB DRIDI <noreply@abdridi.com>',
    to: 'contact@lifelinetransports.com',
    subject: 'Votre accès AB DRIDI est prêt',
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
  <tr><td style="background:#0F0F23;padding:24px;text-align:center">
    <img src="https://abdridi.com/Logo%20AB%20DRIDI.png" alt="AB DRIDI" width="48" height="48" style="display:block;margin:0 auto 8px">
    <span style="font-size:18px;font-weight:700;color:#fff;letter-spacing:0.1em">AB DRIDI</span>
  </td></tr>
  <tr><td style="background:#ffffff;padding:32px 28px">
    <h2 style="font-size:20px;font-weight:700;color:#1A1A2E;margin:0 0 16px">Bienvenue sur AB DRIDI</h2>
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 16px">
      Bonjour,<br><br>
      Votre compte AB DRIDI a ete cree. Connectez-vous sur
      <a href="https://portal.abdridi.com" style="color:#3B82F6;text-decoration:none;font-weight:600">portal.abdridi.com</a>
      avec vos identifiants :
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:16px">
      <tr><td>
        <p style="font-size:13px;color:#64748B;margin:0 0 6px"><strong style="color:#1A1A2E">Email :</strong> contact@lifelinetransports.com</p>
        <p style="font-size:13px;color:#64748B;margin:0"><strong style="color:#1A1A2E">Mot de passe :</strong> Lifeline@</p>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#94A3B8;margin:0 0 20px;font-style:italic">
      Nous vous recommandons de changer votre mot de passe a la premiere connexion.
    </p>
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px">
      Vous avez acces a toutes les fonctionnalites :
    </p>
    <ul style="font-size:14px;color:#374151;line-height:1.8;margin:0 0 24px;padding-left:20px">
      <li>Consultations illimitees</li>
      <li>Alertes personnalisees</li>
      <li>Veille concurrentielle</li>
    </ul>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto">
      <tr><td style="background:#3B82F6;padding:12px 28px;border-radius:6px;text-align:center">
        <a href="https://portal.abdridi.com" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px">Se connecter maintenant</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 24px;text-align:center;background:#F8FAFC;border-top:1px solid #E2E8F0">
    <p style="font-size:13px;color:#374151;margin:0 0 4px;font-weight:600">Bilel DRIDI — AB DRIDI</p>
    <p style="font-size:12px;color:#94A3B8;margin:0">
      <a href="https://abdridi.com" style="color:#3B82F6;text-decoration:none">abdridi.com</a> · 07 49 84 56 61
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>
    `,
  });

  if (error) {
    console.error('[EMAIL ERROR]', error);
  } else {
    console.log('[OK] Email de bienvenue envoye a contact@lifelinetransports.com');
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
