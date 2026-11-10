import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

// ─── Palette ───
const C = {
  bg: '#0F0F23',
  card: '#1E293B',
  line: '#334155',
  text: '#E2E8F0',
  muted: '#94A3B8',
  dim: '#64748B',
  blue: '#3B82F6',
  cyan: '#00C2FF',
  green: '#10B981',
  amber: '#F59E0B',
};

const fmt = (n: number) => n.toLocaleString('fr-FR');

/** Chiffres réels lus en base (arrondis), avec repli si la base ne répond pas. */
async function getStats() {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [open, week] = await Promise.all([
      prisma.marche.count({ where: { status: 'OUVERT' } }),
      prisma.marche.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);
    return { open, week };
  } catch {
    return null;
  }
}

const roundDown = (n: number) => (n >= 1000 ? Math.floor(n / 100) * 100 : n >= 100 ? Math.floor(n / 10) * 10 : n);

const SECTORS = [
  'Transport sanitaire', 'Transport scolaire', 'Transport de personnes / TPMR', 'Messagerie & livraison',
  'Collecte de déchets', 'Déménagement', 'Logistique & stockage', 'Transport funéraire',
  'Location de véhicules avec chauffeur', 'Transport de denrées',
];

const STEPS = [
  { n: '1', title: 'On repère', desc: 'Chaque nuit, le portail scanne les plateformes officielles. Chaque matin, vous recevez par email les appels d\'offres de votre secteur et de vos départements.', color: C.blue },
  { n: '2', title: 'Vous choisissez', desc: 'Date limite, acheteur, montant, documents : tout est sur une fiche claire. Vous gardez les marchés qui vous intéressent et vous voyez qui les a gagnés avant.', color: C.cyan },
  { n: '3', title: 'On monte le dossier', desc: 'Si vous le souhaitez, l\'équipe AB DRIDI prépare la réponse à 100 % : mémoire technique, BPU, pièces administratives, jusqu\'au dépôt.', color: C.green },
];

const FAQ = [
  { q: 'L\'essai est-il vraiment gratuit ?', a: 'Oui. 5 semaines d\'accès complet, sans carte bancaire. À la fin, votre compte repasse automatiquement en offre Découverte gratuite : aucun prélèvement surprise.' },
  { q: 'Que se passe-t-il après les 5 semaines ?', a: 'Vous choisissez : continuer avec l\'offre Veille à 150 € / mois (sans engagement, annulable en un clic), ou rester sur l\'offre Découverte gratuite (3 appels d\'offres par jour, sans alertes).' },
  { q: 'Je n\'ai jamais répondu à un marché public. C\'est pour moi ?', a: 'Oui, c\'est même notre spécialité. Nous accompagnons des entreprises de transport de toutes tailles : nous vérifions que le marché est à votre portée, puis nous montons le dossier avec vous.' },
  { q: 'D\'où viennent les appels d\'offres ?', a: 'Uniquement de sources officielles : BOAMP, JOUE / TED, PLACE, Maximilien, Mégalis, les plateformes régionales, achatpublic, marches-securises, et simap pour la Suisse, entre autres.' },
  { q: 'Combien coûte le montage d\'un dossier ?', a: 'C\'est sur devis, selon la taille du marché. Prenez rendez-vous depuis le portail : le premier échange est gratuit.' },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/marches');

  const stats = await getStats();

  const cta = (label: string, big = false) => (
    <Link
      href="/auth/register"
      style={{
        display: 'inline-block', padding: big ? '16px 34px' : '14px 30px', fontSize: big ? 16 : 15, fontWeight: 700,
        color: '#fff', background: C.blue, textDecoration: 'none', borderRadius: 10, boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
      }}
    >
      {label}
    </Link>
  );

  const h2 = (t: string) => (
    <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, textAlign: 'center', marginBottom: 12, fontFamily: "'Instrument Serif', Georgia, serif" }}>{t}</h2>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', maxWidth: 1100, margin: '0 auto', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/logo.png" alt="AB DRIDI" width={36} height={36} priority />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>AB DRIDI</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth/login" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: C.muted, textDecoration: 'none', border: `1px solid ${C.line}`, borderRadius: 8, whiteSpace: 'nowrap' }}>
            Se connecter
          </Link>
          <Link href="/auth/register" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: C.blue, textDecoration: 'none', borderRadius: 8, whiteSpace: 'nowrap' }}>
            Essai gratuit
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '64px 16px 48px', maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6EE7B7', fontSize: 13, fontWeight: 600, marginBottom: 22 }}>
          5 semaines offertes · sans carte bancaire
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 48px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 18, fontFamily: "'Instrument Serif', Georgia, serif" }}>
          Les marchés publics du <em style={{ color: C.blue, fontStyle: 'italic' }}>transport</em>, trouvés pour vous chaque matin
        </h1>
        <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.7, maxWidth: 600, margin: '0 auto 30px' }}>
          AB DRIDI repère les appels d&apos;offres de votre secteur sur toutes les plateformes officielles, vous les envoie par email, et monte votre dossier de réponse à votre place si vous le souhaitez.
        </p>
        {cta('Démarrer mes 5 semaines gratuites', true)}
        <p style={{ fontSize: 13, color: C.dim, marginTop: 14 }}>Inscription en 1 minute · Sans engagement · Aucun prélèvement automatique</p>
      </section>

      {/* Live stats */}
      <section style={{ padding: '0 16px 56px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            stats && stats.open > 0 ? { n: `${fmt(roundDown(stats.open))}+`, t: 'appels d\'offres ouverts en ce moment' } : { n: '8h', t: 'vos nouveaux marchés par email, chaque matin' },
            stats && stats.week > 0 ? { n: `${fmt(roundDown(stats.week))}+`, t: 'nouveaux marchés ces 7 derniers jours' } : { n: '7j/7', t: 'mise à jour quotidienne' },
            { n: '35+', t: 'sources officielles, France, Europe et Suisse' },
          ].map(s => (
            <div key={s.t} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '20px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{s.n}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '24px 16px 64px', maxWidth: 1040, margin: '0 auto' }}>
        {h2('Comment ça marche')}
        <p style={{ textAlign: 'center', color: C.muted, fontSize: 15, marginBottom: 32 }}>Vous gérez vos véhicules et vos équipes, on s&apos;occupe des marchés publics.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {STEPS.map(f => (
            <div key={f.title} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.line}`, padding: 26, borderTop: `3px solid ${f.color}` }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: f.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{f.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section style={{ padding: '8px 16px 64px', maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        {h2('Pour toutes les entreprises de transport')}
        <p style={{ color: C.muted, fontSize: 15, marginBottom: 22 }}>Vos alertes sont réglées sur votre activité dès l&apos;inscription.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {SECTORS.map(s => (
            <span key={s} style={{ padding: '7px 14px', fontSize: 13, color: C.text, border: `1px solid ${C.line}`, background: 'rgba(30,41,59,0.6)', borderRadius: 20 }}>{s}</span>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '8px 16px 64px', maxWidth: 1040, margin: '0 auto' }}>
        {h2('Des tarifs simples')}
        <p style={{ textAlign: 'center', color: C.muted, fontSize: 15, marginBottom: 30 }}>Commencez gratuitement, décidez ensuite.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {[
            { name: 'Essai gratuit', price: '0 €', per: '5 semaines', color: C.green, items: ['Appels d\'offres illimités', 'Alertes email chaque matin', 'Veille concurrentielle (qui a gagné quoi)', 'Sans carte bancaire'], highlight: true, btn: 'Commencer' },
            { name: 'Veille', price: '150 €', per: '/ mois', color: C.blue, items: ['Tout l\'essai, en continu', 'Filtres avancés et export', 'Prise de rendez-vous avec l\'équipe', 'Sans engagement'], highlight: false, btn: 'Essayer d\'abord' },
            { name: 'Accompagnement', price: 'Sur devis', per: '', color: C.amber, items: ['Dossier monté à 100 % par AB DRIDI', 'Mémoire technique et BPU', 'Pièces administratives', 'Dépôt sur la plateforme'], highlight: false, btn: 'En parler' },
          ].map(p => (
            <div key={p.name} style={{ background: C.card, borderRadius: 14, border: p.highlight ? `2px solid ${p.color}` : `1px solid ${C.line}`, padding: 26, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{p.name}</div>
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: '#fff' }}>{p.price}</span>
                {p.per && <span style={{ fontSize: 14, color: C.muted, marginLeft: 6 }}>{p.per}</span>}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {p.items.map(i => (
                  <li key={i} style={{ fontSize: 14, color: C.text, display: 'flex', gap: 8 }}>
                    <span style={{ color: p.color, fontWeight: 700 }}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', color: p.highlight ? '#fff' : C.text, background: p.highlight ? p.color : 'transparent', border: p.highlight ? 'none' : `1px solid ${C.line}` }}>
                {p.btn}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '8px 16px 64px', maxWidth: 760, margin: '0 auto' }}>
        {h2('Questions fréquentes')}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ.map(f => (
            <details key={f.q} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 18px' }}>
              <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>{f.q}</summary>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginTop: 10 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '24px 16px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(0,194,255,0.10))', border: `1px solid ${C.line}` }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, marginBottom: 10, fontFamily: "'Instrument Serif', Georgia, serif" }}>Votre prochain contrat est peut-être déjà publié</h2>
          <p style={{ color: C.muted, fontSize: 15, marginBottom: 24 }}>Testez AB DRIDI pendant 5 semaines. Si ça ne vous sert pas, vous n&apos;aurez rien payé.</p>
          {cta('Démarrer mes 5 semaines gratuites')}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 16px', textAlign: 'center', borderTop: `1px solid ${C.card}` }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: C.dim, marginBottom: 14 }}>
          <a href="https://abdridi.com" style={{ color: C.dim, textDecoration: 'none' }}>abdridi.com</a>
          <Link href="/mentions-legales" style={{ color: C.dim, textDecoration: 'none' }}>Mentions légales</Link>
          <Link href="/confidentialite" style={{ color: C.dim, textDecoration: 'none' }}>Confidentialité</Link>
          <Link href="/accessibilite" style={{ color: C.dim, textDecoration: 'none' }}>Accessibilité</Link>
        </div>
        <p style={{ fontSize: 12, color: '#475569' }}>AB DRIDI — Monsieur Bilel DRIDI, EI — SIREN 949654487</p>
      </footer>
    </div>
  );
}
