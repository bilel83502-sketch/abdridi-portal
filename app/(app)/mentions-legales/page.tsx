import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales — AB DRIDI',
  description: 'Mentions légales du site AB DRIDI, conformément à la loi LCEN 2004-575.',
};

export default function MentionsLegalesPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 0 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#E2E8F0', marginBottom: 8, fontFamily: "'Instrument Serif', Georgia, serif" }}>
        Mentions légales
      </h1>
      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 40, lineHeight: 1.6 }}>
        Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN).
      </p>

      {/* Éditeur du site */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', marginBottom: 16 }}>Éditeur du site</h2>
        <div style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: '24px 28px' }}>
          <dl style={{ display: 'grid', gap: 14, margin: 0 }}>
            {[
              ['Dénomination', 'Monsieur Bilel DRIDI, entrepreneur individuel exerçant sous le nom commercial « AB DRIDI »'],
              ['Forme juridique', 'Entrepreneur individuel (EI)'],
              ['SIREN', '949 654 487'],
              ['SIRET (siège)', '949 654 487 00014'],
              ['N° TVA intracommunautaire', 'FR44949654487'],
              ['Code APE/NAF', '7022Z — Conseil pour les affaires et autres conseils de gestion'],
              ['Date d\'immatriculation', '06 mars 2023'],
              ['Siège social', '108 Rue Louis Martin Bidoure, 83500 La Seyne-sur-Mer, France'],
              ['Directeur de la publication', 'Bilel DRIDI'],
              ['Email', 'contact@abdridi.com'],
              ['Téléphone', '06 21 35 96 40'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <dt style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </dt>
                <dd style={{ fontSize: 14, color: '#E2E8F0', margin: 0 }}>
                  {label === 'Email' ? (
                    <a href={`mailto:${value}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>{value}</a>
                  ) : value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Hébergement */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', marginBottom: 16 }}>Hébergement</h2>
        <div style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: '24px 28px' }}>
          <dl style={{ display: 'grid', gap: 14, margin: 0 }}>
            {[
              ['Société', 'Vercel Inc.'],
              ['Adresse', '340 S Lemon Ave #4133, Walnut CA 91789, États-Unis'],
              ['Site web', 'https://vercel.com'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <dt style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </dt>
                <dd style={{ fontSize: 14, color: '#E2E8F0', margin: 0 }}>
                  {label === 'Site web' ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>{value}</a>
                  ) : value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Propriété intellectuelle */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', marginBottom: 16 }}>Propriété intellectuelle</h2>
        <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.8 }}>
          Tous les contenus présents sur le site abdridi.com (textes, images, logo, graphismes, marques) sont la propriété
          exclusive d&apos;AB DRIDI ou font l&apos;objet d&apos;une autorisation d&apos;utilisation. Toute reproduction totale ou partielle
          de ces contenus est strictement interdite sans autorisation écrite préalable d&apos;AB DRIDI.
        </p>
      </section>

      {/* Responsabilité */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', marginBottom: 16 }}>Responsabilité</h2>
        <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.8 }}>
          AB DRIDI s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations publiées sur ce site,
          mais ne peut garantir leur exhaustivité ni l&apos;absence d&apos;erreurs. L&apos;utilisation des informations et contenus
          disponibles sur le site se fait sous la responsabilité pleine et entière de l&apos;utilisateur.
        </p>
      </section>

      {/* Liens hypertextes */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', marginBottom: 16 }}>Liens hypertextes</h2>
        <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.8 }}>
          Le site abdridi.com peut contenir des liens vers des sites tiers. AB DRIDI n&apos;exerce aucun contrôle sur
          ces sites et décline toute responsabilité quant à leur contenu, leurs pratiques ou leur disponibilité.
        </p>
      </section>

      {/* Droit applicable */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', marginBottom: 16 }}>Droit applicable</h2>
        <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.8 }}>
          Le présent site et les mentions légales qui y figurent sont régis par le droit français.
          Tout litige en relation avec l&apos;utilisation du site abdridi.com relève de la compétence exclusive
          des tribunaux compétents du ressort du siège social d&apos;AB DRIDI.
        </p>
      </section>
    </div>
  );
}
