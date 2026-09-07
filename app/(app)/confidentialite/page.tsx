import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — AB DRIDI',
  description: 'Politique de confidentialité et protection des données personnelles conformément au RGPD.',
};

export default function ConfidentialitePage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 0 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#E2E8F0', marginBottom: 8, fontFamily: "'Instrument Serif', Georgia, serif" }}>
        Politique de confidentialité
      </h1>
      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 40, lineHeight: 1.6 }}>
        Version 1.0 — Dernière mise à jour : 13 avril 2026. AB DRIDI s&apos;engage à protéger vos données personnelles conformément au
        Règlement Général sur la Protection des Données (RGPD). Pour toute question : <a href="mailto:contact@abdridi.com" style={{ color: '#3B82F6', textDecoration: 'none' }}>contact@abdridi.com</a>
      </p>

      {/* Responsable du traitement */}
      <Section title="Responsable du traitement">
        <p style={pStyle}>
          AB DRIDI, représentée par Bilel Dridi.
        </p>
        <p style={pStyle}>
          Contact : <a href="mailto:contact@abdridi.com" style={linkStyle}>contact@abdridi.com</a>
        </p>
      </Section>

      {/* Données collectées */}
      <Section title="Données collectées">
        <SubTitle>Via le formulaire d&apos;inscription</SubTitle>
        <p style={pStyle}>
          Nom, prénom, adresse email, entreprise, SIRET, téléphone, mot de passe (hashé via bcrypt).
        </p>
        <SubTitle>Via l&apos;usage du portail</SubTitle>
        <p style={pStyle}>
          Marchés consultés, alertes créées, prospects, missions de prospection, documents uploadés,
          activités de suivi commercial.
        </p>
        <SubTitle>Via les cookies techniques</SubTitle>
        <p style={pStyle}>
          Session NextAuth (authentification), préférences utilisateur, consentement cookies.
        </p>
        <SubTitle>Via les logs serveur</SubTitle>
        <p style={pStyle}>
          Adresse IP, user-agent, horodatage des requêtes — conservés 12 mois maximum.
        </p>
      </Section>

      {/* Finalités */}
      <Section title="Finalités du traitement">
        <ul style={ulStyle}>
          <Li>Fourniture du service de veille sur les marchés publics</Li>
          <Li>Accompagnement au montage de dossiers de réponse aux appels d&apos;offres</Li>
          <Li>Communication commerciale (avec consentement préalable)</Li>
          <Li>Obligations légales et comptables</Li>
          <Li>Sécurité du système : détection de fraude, audit log, prévention des abus</Li>
        </ul>
      </Section>

      {/* Base légale */}
      <Section title="Base légale">
        <ul style={ulStyle}>
          <Li><strong style={{ color: '#E2E8F0' }}>Exécution du contrat</strong> — fourniture du service payant de veille et d&apos;accompagnement</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Consentement</strong> — newsletters, cookies non essentiels, communications commerciales</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Intérêt légitime</strong> — sécurité de la plateforme, prévention de la fraude</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Obligations légales</strong> — comptabilité, conservation des données de facturation</Li>
        </ul>
      </Section>

      {/* Durée de conservation */}
      <Section title="Durée de conservation">
        <div style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
          {[
            ['Données de compte', 'Durée de l\'abonnement + 3 ans après résiliation'],
            ['Logs de sécurité', '12 mois'],
            ['Données de facturation', '10 ans (obligation légale)'],
            ['Cookies', '13 mois maximum'],
          ].map(([type, duree], i, arr) => (
            <div key={type} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 24px', borderBottom: i < arr.length - 1 ? '1px solid #334155' : 'none',
            }}>
              <span style={{ fontSize: 14, color: '#E2E8F0', fontWeight: 500 }}>{type}</span>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>{duree}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Destinataires */}
      <Section title="Destinataires des données">
        <p style={pStyle}>
          Les données sont traitées par AB DRIDI et ses sous-traitants techniques :
        </p>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {[
            { name: 'Vercel', role: 'Hébergement', loc: 'États-Unis — SCCs + DPF' },
            { name: 'Neon', role: 'Base de données PostgreSQL', loc: 'Union Européenne' },
            { name: 'Resend', role: 'Emails transactionnels', loc: 'Union Européenne' },
            { name: 'Stripe', role: 'Paiements sécurisés', loc: 'États-Unis — SCCs + DPF' },
            { name: 'Sentry', role: 'Monitoring erreurs (Functional Software Inc.)', loc: 'États-Unis — SCCs' },
            { name: 'Google Analytics', role: 'Mesure d\'audience (avec consentement)', loc: 'Irlande/États-Unis — DPF + SCCs' },
            { name: 'Google OAuth', role: 'Authentification (sur demande utilisateur)', loc: 'États-Unis — DPF' },
          ].map(s => (
            <div key={s.name} style={{
              background: '#1E293B', borderRadius: 8, border: '1px solid #334155', padding: '12px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{s.name}</span>
                <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8 }}>{s.role}</span>
              </div>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>{s.loc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Transferts hors UE */}
      <Section title="Transferts hors Union Européenne">
        <p style={pStyle}>
          Certains sous-traitants (Vercel, Stripe, Sentry, Google) sont situés aux États-Unis.
          Ces transferts sont encadrés par les Clauses Contractuelles Types (SCCs) adoptées par la
          Commission européenne (décision 2021/914) et, le cas échéant, le EU-US Data Privacy Framework (DPF).
        </p>
      </Section>

      {/* Contacts tiers — prospection B2B */}
      <Section title="Traitement des contacts tiers (prospection B2B)">
        <p style={pStyle}>
          Dans le cadre de notre activité d&apos;aide au montage de dossiers d&apos;appels d&apos;offres, des coordonnées
          professionnelles de contacts d&apos;entreprises tierces (nom, téléphone professionnel, email professionnel)
          peuvent être traitées sur la base de notre intérêt légitime à exercer notre activité commerciale B2B
          (article 6.1.f du RGPD).
        </p>
        <p style={{ ...pStyle, marginTop: 12 }}>
          Ces données ne sont jamais revendues, partagées avec des tiers à des fins commerciales, ni utilisées pour
          du marketing direct sans consentement. Les personnes concernées peuvent exercer leur droit d&apos;opposition
          à tout moment : <a href="mailto:contact@abdridi.com" style={linkStyle}>contact@abdridi.com</a>
        </p>
      </Section>

      {/* Droits RGPD */}
      <Section title="Vos droits RGPD">
        <p style={pStyle}>
          Conformément aux articles 15 à 22 du Règlement Général sur la Protection des Données,
          vous disposez des droits suivants :
        </p>
        <ul style={ulStyle}>
          <Li><strong style={{ color: '#E2E8F0' }}>Droit d&apos;accès</strong> — obtenir une copie de vos données personnelles</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Droit de rectification</strong> — corriger des données inexactes ou incomplètes</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Droit à l&apos;effacement</strong> — demander la suppression de vos données (&quot;droit à l&apos;oubli&quot;)</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Droit à la limitation</strong> — restreindre le traitement de vos données</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Droit d&apos;opposition</strong> — vous opposer au traitement de vos données</Li>
          <Li><strong style={{ color: '#E2E8F0' }}>Retrait du consentement</strong> — retirer votre consentement à tout moment</Li>
        </ul>
        <p style={{ ...pStyle, marginTop: 16 }}>
          Pour exercer ces droits : <a href="mailto:contact@abdridi.com" style={linkStyle}>contact@abdridi.com</a>
        </p>
      </Section>

      {/* Réclamation */}
      <Section title="Réclamation">
        <p style={pStyle}>
          En cas de litige concernant le traitement de vos données personnelles, vous pouvez introduire
          une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) :{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={linkStyle}>www.cnil.fr</a>
        </p>
      </Section>

      {/* Cookies */}
      <Section title="Cookies">
        <p style={pStyle}>
          Le site utilise uniquement des cookies techniques nécessaires au fonctionnement du service
          (session d&apos;authentification, sécurité, préférences). Aucun cookie publicitaire ou de tracking
          tiers n&apos;est déposé sans votre consentement explicite.
        </p>
      </Section>

      {/* Mise à jour */}
      <section>
        <h2 style={h2Style}>Mise à jour de cette politique</h2>
        <p style={pStyle}>
          La présente politique de confidentialité peut être modifiée à tout moment pour
          tenir compte des évolutions réglementaires ou des changements de nos pratiques.
          La date de dernière mise à jour est indiquée en haut de cette page.
        </p>
      </section>
    </div>
  );
}

/* ── Shared styles & sub-components ── */
const h2Style: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, color: '#3B82F6', marginBottom: 16,
};

const pStyle: React.CSSProperties = {
  fontSize: 14, color: '#CBD5E1', lineHeight: 1.8, margin: 0,
};

const linkStyle: React.CSSProperties = {
  color: '#3B82F6', textDecoration: 'none',
};

const ulStyle: React.CSSProperties = {
  listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={h2Style}>{title}</h2>
      {children}
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 16, marginBottom: 6 }}>
      {children}
    </h3>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#CBD5E1', lineHeight: 1.6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', flexShrink: 0, marginTop: 8 }} />
      <span>{children}</span>
    </li>
  );
}
