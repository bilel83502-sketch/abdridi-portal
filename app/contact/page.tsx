import type { Metadata } from 'next';
import { SiteHeader, SiteFooter, PC } from '@/components/public/SiteChrome';
import ContactForm from './ContactForm';
import { CONTACT_PHONE, CONTACT_PHONE_HREF, CONTACT_EMAIL, BOOKING_URL } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Contact — Confiez votre dossier de marché public | AB DRIDI',
  description: 'Un appel d\'offres à remporter ? Décrivez votre besoin, nous vous rappelons. Premier rendez-vous gratuit, montage de dossier sur devis.',
  alternates: { canonical: 'https://portal.abdridi.com/contact' },
};

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: PC.bg, color: PC.text, fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <SiteHeader />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 16px 64px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 12, fontFamily: "'Instrument Serif', Georgia, serif", textAlign: 'center' }}>
          Confiez-nous votre dossier
        </h1>
        <p style={{ fontSize: 16, color: PC.muted, lineHeight: 1.7, maxWidth: 620, margin: '0 auto 36px', textAlign: 'center' }}>
          Mémoire technique, BPU, pièces administratives, dépôt : nous montons votre réponse à 100 %.
          Le premier rendez-vous est gratuit, le montage est sur devis.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
          <section aria-labelledby="form-title" style={{ background: PC.card, border: `1px solid ${PC.line}`, borderRadius: 14, padding: 24 }}>
            <h2 id="form-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Être rappelé</h2>
            <p style={{ fontSize: 13, color: PC.muted, marginBottom: 18 }}>Réponse sous 24 h ouvrées.</p>
            <ContactForm />
          </section>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: PC.card, border: `1px solid ${PC.line}`, borderRadius: 14, padding: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Nous appeler</h2>
              <a href={CONTACT_PHONE_HREF} style={{ fontSize: 24, fontWeight: 800, color: '#fff', textDecoration: 'none' }}>{CONTACT_PHONE}</a>
              <p style={{ fontSize: 13, color: PC.muted, marginTop: 6 }}>
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: PC.muted }}>{CONTACT_EMAIL}</a>
              </p>
            </div>
            {BOOKING_URL ? (
              <div style={{ background: PC.card, border: `1px solid ${PC.line}`, borderRadius: 14, padding: 22 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Réserver un créneau</h2>
                <p style={{ fontSize: 13, color: PC.muted, marginBottom: 14 }}>Choisissez directement un rendez-vous téléphonique gratuit dans notre agenda.</p>
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 8, background: PC.green, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  Prendre rendez-vous en ligne
                </a>
              </div>
            ) : null}
            <div style={{ background: 'rgba(59,130,246,0.10)', border: `1px solid ${PC.line}`, borderRadius: 14, padding: 22 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Vous cherchez plutôt la veille ?</h2>
              <p style={{ fontSize: 13, color: PC.muted, marginBottom: 12 }}>Les appels d&apos;offres de votre secteur chaque matin : 3 mois offerts, sans carte bancaire.</p>
              <a href="/auth/register" style={{ color: PC.blue, fontWeight: 600, fontSize: 14 }}>Créer mon compte →</a>
            </div>
            <p style={{ fontSize: 12, color: PC.dim, lineHeight: 1.6 }}>
              Confidentialité : nous ne citons jamais nos clients. Vos informations servent uniquement à vous recontacter.
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
