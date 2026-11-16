import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { SiteHeader, SiteFooter, PC as C } from '@/components/public/SiteChrome';
import { CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/contact';

export const dynamic = 'force-dynamic';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const roundDown = (n: number) => (n >= 1000 ? Math.floor(n / 1000) * 1000 : n >= 100 ? Math.floor(n / 10) * 10 : n);

/** Nombre réel d'appels d'offres ouverts (même source que l'API publique utilisée par abdridi.com). */
async function getOpenTenders(): Promise<number | null> {
  try {
    return await prisma.marche.count({ where: { status: 'OUVERT' } });
  } catch {
    return null;
  }
}

const SECTORS_TRANSPORT = ['Transport sanitaire', 'Transport scolaire', 'Transport de personnes / TPMR', 'Marchandises & logistique', 'Déménagement', 'Messagerie & livraison', 'Transport funéraire'];
const SECTORS_OTHER = ['Collecte de déchets', 'Nettoyage & propreté', 'BTP & travaux', 'Fourniture alimentaire', 'Services aux collectivités', 'Fournitures'];

const STEPS = [
  { n: '1', title: 'On repère', desc: 'Chaque nuit, le portail scanne 35+ plateformes officielles. Chaque matin, vous recevez par email les appels d\'offres de votre secteur et de vos départements.', color: C.blue },
  { n: '2', title: 'Vous choisissez', desc: 'Date limite, acheteur, montant, documents : tout est sur une fiche claire. Vous voyez aussi qui a remporté les marchés précédents, et à quel prix.', color: C.cyan },
  { n: '3', title: 'On monte le dossier', desc: 'Si vous le souhaitez, l\'équipe AB DRIDI prépare la réponse à 100 % : mémoire technique, BPU, pièces administratives, jusqu\'au dépôt.', color: C.green },
];

const FAQ = [
  { q: 'Les 3 mois offerts, comment ça marche ?', a: 'À l\'inscription, vous avez 3 mois d\'accès à la formule Veille, sans carte bancaire. À la fin, votre compte repasse automatiquement en formule Découverte gratuite : aucun prélèvement surprise.' },
  { q: 'Que se passe-t-il après les 3 mois ?', a: 'Vous choisissez : continuer avec la formule Veille à 150 € par mois, sans engagement et annulable en un clic, ou rester sur la formule Découverte gratuite (3 appels d\'offres par jour, sans alertes).' },
  { q: 'Quels secteurs suivez-vous ?', a: 'Tous les secteurs. Vous réglez vos alertes sur votre activité et vos départements. Nous accompagnons particulièrement les entreprises de transport : sanitaire, scolaire, TPMR, marchandises, déménagement.' },
  { q: 'Je n\'ai jamais répondu à un marché public. C\'est pour moi ?', a: 'Oui. Nous vérifions avec vous que le marché est à votre portée, puis nous montons le dossier. Le premier rendez-vous est gratuit.' },
  { q: 'D\'où viennent les appels d\'offres ?', a: 'Uniquement de sources officielles : BOAMP, JOUE / TED, PLACE, Maximilien, Mégalis, les plateformes régionales, achatpublic, marches-securises et simap pour la Suisse, entre autres. 35+ sources au total.' },
  { q: 'Combien coûte le montage d\'un dossier ?', a: 'Il est sur devis, après un premier rendez-vous gratuit qui nous permet d\'évaluer le marché et le travail à fournir.' },
  { q: 'Citez-vous vos clients ?', a: 'Jamais. Nous ne publions ni noms, ni logos, ni témoignages de nos clients : leurs réponses aux marchés publics restent confidentielles.' },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/marches');

  const open = await getOpenTenders();

  const btn = (href: string, label: string, kind: 'primary' | 'secondary' = 'primary') => (
    <Link
      href={href}
      style={{
        display: 'inline-block', padding: '15px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none', borderRadius: 10,
        ...(kind === 'primary'
          ? { color: '#fff', background: C.blue, boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }
          : { color: C.text, border: `1px solid ${C.line}`, background: 'rgba(30,41,59,0.6)' }),
      }}
    >
      {label}
    </Link>
  );

  const h2 = (t: string, id?: string) => (
    <h2 id={id} style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, textAlign: 'center', marginBottom: 12, fontFamily: "'Instrument Serif', Georgia, serif", scrollMarginTop: 20 }}>{t}</h2>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SiteHeader />

      {/* Hero : deux parcours */}
      <section style={{ textAlign: 'center', padding: '60px 16px 44px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6EE7B7', fontSize: 13, fontWeight: 600, marginBottom: 22 }}>
          Offre de lancement : 3 mois offerts · sans carte bancaire
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 48px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 18, fontFamily: "'Instrument Serif', Georgia, serif" }}>
          Les <em style={{ color: C.blue, fontStyle: 'italic' }}>marchés publics</em> de votre secteur, trouvés et montés pour vous
        </h1>
        <p style={{ fontSize: 17, color: C.muted, lineHeight: 1.7, maxWidth: 620, margin: '0 auto 30px' }}>
          AB DRIDI repère chaque matin les appels d&apos;offres de votre activité sur 35+ sources officielles, et monte votre dossier de réponse à votre place si vous le souhaitez.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {btn('/auth/register', 'Je veux la veille : 3 mois offerts')}
          {btn('/contact', 'Je veux qu\'on monte mon dossier', 'secondary')}
        </div>
        <p style={{ fontSize: 13, color: C.dim, marginTop: 14 }}>
          Une question ? <a href={CONTACT_PHONE_HREF} style={{ color: C.text, fontWeight: 600, textDecoration: 'none' }}>{CONTACT_PHONE}</a>
        </p>
      </section>

      {/* Chiffres réels */}
      <section aria-label="Chiffres clés" style={{ padding: '0 16px 56px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            open && open > 0 ? { n: `${fmt(roundDown(open))}+`, t: 'appels d\'offres ouverts en ce moment' } : { n: '8h', t: 'vos nouveaux marchés par email, chaque matin' },
            { n: '35+', t: 'sources officielles, France, Europe et Suisse' },
            { n: 'Tous', t: 'secteurs d\'activité suivis' },
          ].map(s => (
            <div key={s.t} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '20px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{s.n}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Méthode */}
      <section style={{ padding: '24px 16px 64px', maxWidth: 1040, margin: '0 auto' }}>
        {h2('Notre méthode', 'methode')}
        <p style={{ textAlign: 'center', color: C.muted, fontSize: 15, marginBottom: 32 }}>Vous vous concentrez sur votre métier, on s&apos;occupe des marchés publics.</p>
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

      {/* Secteurs */}
      <section style={{ padding: '8px 16px 64px', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        {h2('Tous secteurs, avec une expertise transport')}
        <p style={{ color: C.muted, fontSize: 15, marginBottom: 22 }}>Vos alertes sont réglées sur votre activité dès l&apos;inscription.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          {SECTORS_TRANSPORT.map(s => (
            <span key={s} style={{ padding: '7px 14px', fontSize: 13, color: '#BFDBFE', border: '1px solid rgba(59,130,246,0.45)', background: 'rgba(59,130,246,0.10)', borderRadius: 20 }}>{s}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {SECTORS_OTHER.map(s => (
            <span key={s} style={{ padding: '7px 14px', fontSize: 13, color: C.text, border: `1px solid ${C.line}`, background: 'rgba(30,41,59,0.6)', borderRadius: 20 }}>{s}</span>
          ))}
          <span style={{ padding: '7px 14px', fontSize: 13, color: C.muted, border: `1px dashed ${C.line}`, borderRadius: 20 }}>et tous les autres</span>
        </div>
      </section>

      {/* Tarifs */}
      <section style={{ padding: '8px 16px 64px', maxWidth: 1040, margin: '0 auto' }}>
        {h2('Des tarifs simples', 'tarifs')}
        <p style={{ textAlign: 'center', color: C.muted, fontSize: 15, marginBottom: 30 }}>Commencez avec 3 mois offerts, décidez ensuite.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {[
            { name: 'Découverte', price: '0 €', per: 'pour toujours', color: C.dim, items: ['3 appels d\'offres visibles par jour', 'Recherche sur 35+ sources', 'Prise de rendez-vous avec l\'équipe'], highlight: false, href: '/auth/register', btn: 'Créer un compte' },
            { name: 'Veille', price: '150 €', per: '/ mois', badge: '3 mois offerts', color: C.blue, items: ['Appels d\'offres illimités', 'Alertes email chaque matin', 'Veille concurrentielle : qui gagne, à quel prix', 'Filtres avancés et export', 'Sans engagement'], highlight: true, href: '/auth/register', btn: 'Profiter des 3 mois offerts' },
            { name: 'Montage de dossier', price: 'Sur devis', per: '', color: C.amber, items: ['Dossier monté à 100 % par AB DRIDI', 'Mémoire technique et BPU', 'Pièces administratives', 'Dépôt sur la plateforme', 'Premier rendez-vous gratuit'], highlight: false, href: '/contact', btn: 'Être rappelé' },
          ].map(p => (
            <div key={p.name} style={{ position: 'relative', background: C.card, borderRadius: 14, border: p.highlight ? `2px solid ${p.color}` : `1px solid ${C.line}`, padding: 26, display: 'flex', flexDirection: 'column' }}>
              {p.badge && (
                <span style={{ position: 'absolute', top: -12, left: 22, padding: '4px 10px', borderRadius: 999, background: C.green, color: '#fff', fontSize: 12, fontWeight: 700 }}>{p.badge}</span>
              )}
              <h3 style={{ fontSize: 14, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{p.name}</h3>
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: '#fff' }}>{p.price}</span>
                {p.per && <span style={{ fontSize: 14, color: C.muted, marginLeft: 6 }}>{p.per}</span>}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {p.items.map(i => (
                  <li key={i} style={{ fontSize: 14, color: C.text, display: 'flex', gap: 8 }}>
                    <span aria-hidden="true" style={{ color: p.color, fontWeight: 700 }}>✓</span>{i}
                  </li>
                ))}
              </ul>
              <Link href={p.href} style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', color: p.highlight ? '#fff' : C.text, background: p.highlight ? p.color : 'transparent', border: p.highlight ? 'none' : `1px solid ${C.line}` }}>
                {p.btn}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '8px 16px 64px', maxWidth: 760, margin: '0 auto' }}>
        {h2('Questions fréquentes', 'faq')}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ.map(f => (
            <details key={f.q} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 18px' }}>
              <summary style={{ cursor: 'pointer' }}>
                <h3 style={{ display: 'inline', fontSize: 15, fontWeight: 600 }}>{f.q}</h3>
              </summary>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginTop: 10 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '24px 16px 72px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(0,194,255,0.10))', border: `1px solid ${C.line}` }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, marginBottom: 10, fontFamily: "'Instrument Serif', Georgia, serif" }}>Votre prochain contrat est peut-être déjà publié</h2>
          <p style={{ color: C.muted, fontSize: 15, marginBottom: 24 }}>Profitez de 3 mois offerts sur la veille, ou parlez-nous directement de votre dossier.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {btn('/auth/register', 'Je veux la veille : 3 mois offerts')}
            {btn('/contact', 'Je veux qu\'on monte mon dossier', 'secondary')}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
