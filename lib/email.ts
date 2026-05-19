import { Resend } from 'resend';
import { ADMIN_EMAIL } from './constants';

const FROM_EMAIL = 'AB DRIDI <noreply@abdridi.com>';

// ─── Types ───

type AppointmentEmailData = {
  clientName: string;
  clientEmail: string;
  clientCompany: string | null;
  subject: string;
  marketReference: string | null;
  requestedDate: Date;
  timeSlot: string;
  message: string | null;
};

type ConfirmationEmailData = {
  clientEmail: string;
  clientName: string;
  subject: string;
  requestedDate: Date;
  timeSlot: string;
};

// ─── Helpers ───

function formatDateFR(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function abDridiFooter(): string {
  return `<tr>
  <td style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center;">
    <p style="margin:0 0 4px;font-size:13px;color:#374151;font-weight:600;">AB DRIDI</p>
    <p style="margin:0;font-size:11px;color:#9CA3AF;">Portail de veille des marches publics</p>
    <p style="margin:8px 0 0;font-size:11px;color:#9CA3AF;">
      <a href="https://portal.abdridi.com" style="color:#2563EB;text-decoration:none;">portal.abdridi.com</a>
    </p>
  </td>
</tr>`;
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        ${content}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Template: Admin notification (new RDV) ───

function buildAdminNotificationHTML(data: AppointmentEmailData): string {
  return emailWrapper(`
    <tr>
      <td style="background:#1E40AF;padding:24px 32px;">
        <h1 style="margin:0;font-size:18px;color:#fff;font-weight:700;">Nouvelle demande de rendez-vous</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 32px;">
        <h2 style="margin:0 0 20px;font-size:15px;color:#111827;font-weight:600;">Informations client</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6B7280;width:160px;vertical-align:top;">Nom</td>
            <td style="padding:8px 0;font-size:13px;color:#111827;font-weight:600;">${escapeHtml(data.clientName)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6B7280;vertical-align:top;">Email</td>
            <td style="padding:8px 0;font-size:13px;color:#111827;">${escapeHtml(data.clientEmail)}</td>
          </tr>
          ${data.clientCompany ? `<tr>
            <td style="padding:8px 0;font-size:13px;color:#6B7280;vertical-align:top;">Entreprise</td>
            <td style="padding:8px 0;font-size:13px;color:#111827;">${escapeHtml(data.clientCompany)}</td>
          </tr>` : ''}
        </table>

        <h2 style="margin:0 0 20px;font-size:15px;color:#111827;font-weight:600;">Details du rendez-vous</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6B7280;width:160px;vertical-align:top;">Objet du marche</td>
            <td style="padding:8px 0;font-size:13px;color:#111827;font-weight:500;">${escapeHtml(data.subject)}</td>
          </tr>
          ${data.marketReference ? `<tr>
            <td style="padding:8px 0;font-size:13px;color:#6B7280;vertical-align:top;">Reference</td>
            <td style="padding:8px 0;font-size:13px;color:#111827;font-family:monospace;">${escapeHtml(data.marketReference)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6B7280;vertical-align:top;">Date souhaitee</td>
            <td style="padding:8px 0;font-size:13px;color:#111827;font-weight:600;">${formatDateFR(data.requestedDate)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6B7280;vertical-align:top;">Creneau horaire</td>
            <td style="padding:8px 0;font-size:13px;color:#111827;font-weight:600;">${escapeHtml(data.timeSlot)}</td>
          </tr>
          ${data.message ? `<tr>
            <td style="padding:8px 0;font-size:13px;color:#6B7280;vertical-align:top;">Message</td>
            <td style="padding:8px 0;font-size:13px;color:#374151;line-height:1.5;">${escapeHtml(data.message)}</td>
          </tr>` : ''}
        </table>

        <a href="https://portal.abdridi.com/admin" style="display:inline-block;padding:10px 24px;background:#2563EB;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
          Voir dans le panneau admin
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
        <p style="margin:0;font-size:11px;color:#9CA3AF;">AB DRIDI - Portail de veille des marches publics</p>
      </td>
    </tr>
  `);
}

// ─── Template: Client receipt (new RDV) ───

function buildClientReceiptHTML(data: AppointmentEmailData): string {
  return emailWrapper(`
    <tr>
      <td style="background:linear-gradient(135deg,#1E40AF,#2563EB);padding:28px 32px;text-align:center;">
        <h1 style="margin:0;font-size:20px;color:#fff;font-weight:700;">AB DRIDI</h1>
        <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">Veille et accompagnement marches publics</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h2 style="margin:0 0 8px;font-size:17px;color:#111827;font-weight:700;">Votre demande a bien ete enregistree.</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
          Merci pour votre confiance. Voici le recapitulatif de votre demande de rendez-vous :
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
              <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">Objet du marche</div>
              <div style="font-size:14px;color:#111827;font-weight:600;">${escapeHtml(data.subject)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
              <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">Date souhaitee</div>
              <div style="font-size:14px;color:#111827;font-weight:600;">${formatDateFR(data.requestedDate)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">Creneau horaire</div>
              <div style="font-size:14px;color:#111827;font-weight:600;">${escapeHtml(data.timeSlot)}</div>
            </td>
          </tr>
        </table>

        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;font-size:14px;color:#1E40AF;line-height:1.5;font-weight:500;">
            Notre equipe vous contactera sous 24h pour confirmer votre rendez-vous.
          </p>
        </div>

        <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">
          Si vous avez des questions en attendant, n'hesitez pas a nous contacter a
          <a href="mailto:contact@abdridi.com" style="color:#2563EB;text-decoration:none;font-weight:500;">contact@abdridi.com</a>.
        </p>
      </td>
    </tr>
    ${abDridiFooter()}
  `);
}

// ─── Template: Client confirmation (admin confirmed RDV) ───

function buildClientConfirmedHTML(data: ConfirmationEmailData): string {
  return emailWrapper(`
    <tr>
      <td style="background:linear-gradient(135deg,#1E40AF,#2563EB);padding:28px 32px;text-align:center;">
        <h1 style="margin:0;font-size:20px;color:#fff;font-weight:700;">AB DRIDI</h1>
        <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.7);">Veille et accompagnement marches publics</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h2 style="margin:0 0 8px;font-size:17px;color:#111827;font-weight:700;">Votre rendez-vous est confirme.</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#6B7280;line-height:1.6;">
          ${escapeHtml(data.clientName)}, votre rendez-vous a ete confirme par notre equipe. Voici le recapitulatif :
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
              <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">Objet du marche</div>
              <div style="font-size:14px;color:#111827;font-weight:600;">${escapeHtml(data.subject)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #E5E7EB;">
              <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">Date du rendez-vous</div>
              <div style="font-size:14px;color:#111827;font-weight:600;">${formatDateFR(data.requestedDate)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;">
              <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">Creneau horaire</div>
              <div style="font-size:14px;color:#111827;font-weight:600;">${escapeHtml(data.timeSlot)}</div>
            </td>
          </tr>
        </table>

        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
          <p style="margin:0;font-size:14px;color:#065F46;line-height:1.5;font-weight:500;">
            Rendez-vous confirme. Notre equipe vous attend a la date et au creneau indiques ci-dessus.
          </p>
        </div>

        <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">
          En cas de question ou d'empechement, contactez-nous :
          <a href="mailto:contact@abdridi.com" style="color:#2563EB;text-decoration:none;font-weight:500;">contact@abdridi.com</a>
        </p>
      </td>
    </tr>
    ${abDridiFooter()}
  `);
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Send 2 emails after a new appointment is created:
 *  1. Admin notification → bilel83502@gmail.com
 *  2. Client receipt → client email
 */
export async function sendAppointmentEmails(data: AppointmentEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email notifications');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY || '');

  // Email 1: Admin notification
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Nouvelle demande de rendez-vous — ${data.clientName}`,
      html: buildAdminNotificationHTML(data),
    });
    console.log('[Email] Admin notification sent to', ADMIN_EMAIL);
  } catch (err: any) {
    console.error('[Email] Failed to send admin notification:', err.message);
  }

  // Email 2: Client receipt
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.clientEmail,
      subject: 'Votre demande de rendez-vous a bien ete recue — AB DRIDI',
      html: buildClientReceiptHTML(data),
    });
    console.log('[Email] Client receipt sent to', data.clientEmail);
  } catch (err: any) {
    console.error('[Email] Failed to send client receipt:', err.message);
  }
}

/**
 * Send confirmation email to client when admin sets status to CONFIRMED.
 */
export async function sendConfirmationEmail(data: ConfirmationEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping confirmation email');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY || '');

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.clientEmail,
      subject: 'Votre rendez-vous est confirme — AB DRIDI',
      html: buildClientConfirmedHTML(data),
    });
    console.log('[Email] Confirmation email sent to', data.clientEmail);
  } catch (err: any) {
    console.error('[Email] Failed to send confirmation email:', err.message);
  }
}
