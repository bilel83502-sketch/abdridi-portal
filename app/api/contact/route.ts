import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { rateLimitCheck } from '@/lib/rate-limit';
import { corsHeaders } from '@/lib/cors';
import { ADMIN_EMAIL } from '@/lib/constants';
import { CONTACT_EMAIL } from '@/lib/contact';

export const dynamic = 'force-dynamic';

/**
 * Formulaire de contact « Je veux qu'on monte mon dossier » (parcours B).
 * Appelé depuis portal.abdridi.com/contact et depuis abdridi.com/contact.html.
 * Envoi à contact@abdridi.com, copie à l'admin.
 */
const schema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(120),
  company: z.string().trim().min(1, 'Indiquez votre entreprise.').max(160),
  activity: z.string().trim().min(1, 'Indiquez votre activité.').max(160),
  department: z.string().trim().min(1, 'Indiquez votre département.').max(60),
  phone: z.string().trim().min(6, 'Indiquez un numéro de téléphone.').max(30),
  email: z.string().trim().email('Email invalide.').max(160).optional().or(z.literal('')),
  message: z.string().trim().max(3000).optional().or(z.literal('')),
  website: z.string().optional(), // pot de miel anti-robots : doit rester vide
  source: z.string().max(80).optional(),
});

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get('origin'));
  try {
    const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const { allowed } = await rateLimitCheck(`contact:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) return NextResponse.json({ error: 'Trop de demandes. Appelez-nous directement.' }, { status: 429, headers });

    const d = schema.parse(await req.json());
    if (d.website) return NextResponse.json({ ok: true }, { headers }); // robot : on fait semblant

    if (!process.env.RESEND_API_KEY) {
      console.error('[Contact] RESEND_API_KEY manquante');
      return NextResponse.json({ error: 'Envoi indisponible. Appelez-nous directement.' }, { status: 503, headers });
    }

    const rows: [string, string][] = [
      ['Nom', d.name], ['Entreprise', d.company], ['Activité', d.activity], ['Département', d.department],
      ['Téléphone', d.phone], ['Email', d.email || '—'], ['Provenance', d.source || 'portail'],
    ];
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#0A1628">Nouvelle demande de contact — montage de dossier</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-size:14px">${rows.map(([k, v]) => `<tr><td style="color:#6B7280">${k}</td><td><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
      ${d.message ? `<p style="font-size:14px;white-space:pre-wrap;background:#F9FAFB;padding:12px;border-radius:6px">${esc(d.message)}</p>` : ''}
      <p><a href="tel:${esc(d.phone.replace(/[^\d+]/g, ''))}" style="display:inline-block;padding:10px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:6px">Rappeler ${esc(d.name)}</a></p>
    </div>`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: 'AB DRIDI <noreply@abdridi.com>',
      to: CONTACT_EMAIL,
      cc: ADMIN_EMAIL !== CONTACT_EMAIL ? ADMIN_EMAIL : undefined,
      replyTo: d.email || undefined,
      subject: `Demande de contact : ${d.company} (${d.department})`,
      html,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true }, { headers });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0]?.message || 'Formulaire incomplet.' }, { status: 400, headers });
    console.error('[Contact] error:', e?.message || e);
    return NextResponse.json({ error: 'Envoi impossible. Appelez-nous directement.' }, { status: 500, headers });
  }
}
