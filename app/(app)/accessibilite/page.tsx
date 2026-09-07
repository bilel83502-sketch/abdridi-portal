import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Déclaration d\'accessibilité — AB DRIDI',
  description: 'Déclaration d\'accessibilité du portail AB DRIDI conformément au RGAA 4.1 et WCAG 2.1 niveau AA.',
};

export default function AccessibilitePage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 0 80px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#E2E8F0', marginBottom: 8, fontFamily: "'Instrument Serif', Georgia, serif" }}>
        Déclaration d&apos;accessibilité
      </h1>
      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 40, lineHeight: 1.6 }}>
        Dernière mise à jour : 14 avril 2026
      </p>

      <Section title="Engagement">
        <p style={pStyle}>
          AB DRIDI s&apos;engage à rendre son portail internet accessible conformément à l&apos;article 47
          de la loi n° 2005-102 du 11 février 2005 pour l&apos;égalité des droits et des chances,
          la participation et la citoyenneté des personnes handicapées.
        </p>
      </Section>

      <Section title="État de conformité">
        <p style={pStyle}>
          Le site <strong style={{ color: '#E2E8F0' }}>portal.abdridi.com</strong> est <strong style={{ color: '#10B981' }}>conforme</strong> avec
          le Référentiel Général d&apos;Amélioration de l&apos;Accessibilité (RGAA 4.1) et les Web Content
          Accessibility Guidelines (WCAG 2.1) niveau AA.
        </p>
      </Section>

      <Section title="Résultats des tests">
        <p style={pStyle}>
          Un audit d&apos;accessibilité WCAG 2.1 niveau AA a été réalisé le 14 avril 2026. Le taux de conformité
          estimé est de <strong style={{ color: '#10B981' }}>95%</strong> des critères testés.
        </p>
        <div style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: '20px 24px', marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>Conformité</span>
            <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>95%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: '#334155', overflow: 'hidden' }}>
            <div style={{ width: '95%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #10B981, #3B82F6)' }} />
          </div>
        </div>
      </Section>

      <Section title="Contenus non accessibles">
        <p style={pStyle}>Les contenus suivants ne sont pas encore totalement accessibles :</p>
        <ul style={ulStyle}>
          <Li>Graphiques Recharts : accessibles via légendes et tooltips mais pas de données tabulaires alternatives</Li>
          <Li>Certains composants tiers (calendrier react-big-calendar) ont une navigation clavier limitée</Li>
        </ul>
      </Section>

      <Section title="Technologies utilisées">
        <ul style={ulStyle}>
          <Li>HTML5</Li>
          <Li>CSS3 (Tailwind CSS)</Li>
          <Li>JavaScript / TypeScript</Li>
          <Li>React 18 / Next.js 14</Li>
          <Li>ARIA (Accessible Rich Internet Applications)</Li>
        </ul>
      </Section>

      <Section title="Environnements de test">
        <ul style={ulStyle}>
          <Li>Navigateurs : Chrome, Firefox, Safari (dernières versions)</Li>
          <Li>Lecteur d&apos;écran : VoiceOver (macOS)</Li>
          <Li>Outils : Lighthouse, axe-core, tests manuels clavier</Li>
        </ul>
      </Section>

      <Section title="Pages testées">
        <ul style={ulStyle}>
          <Li>Page d&apos;accueil (/) et connexion (/auth/login)</Li>
          <Li>Inscription (/auth/register)</Li>
          <Li>Consultations (/marches) et détail marché</Li>
          <Li>Pilotage (/pilotage) et journal d&apos;audit</Li>
          <Li>Prospection (/prospection)</Li>
          <Li>Alertes (/alertes)</Li>
          <Li>Paramètres (/parametres)</Li>
        </ul>
      </Section>

      <Section title="Amélioration et contact">
        <p style={pStyle}>
          Si vous rencontrez un défaut d&apos;accessibilité vous empêchant d&apos;accéder à un contenu ou une
          fonctionnalité du site, veuillez nous contacter :
        </p>
        <div style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: '16px 20px', marginTop: 12 }}>
          <p style={{ fontSize: 14, color: '#E2E8F0', margin: 0 }}>
            <a href="mailto:contact@abdridi.com" style={{ color: '#3B82F6', textDecoration: 'none' }}>contact@abdridi.com</a>
          </p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
            Bilel DRIDI — AB DRIDI — 06 21 35 96 40
          </p>
        </div>
      </Section>

      <Section title="Voies de recours">
        <p style={pStyle}>
          Si vous constatez un défaut d&apos;accessibilité et que nous n&apos;avons pas répondu à votre demande
          dans un délai de 30 jours, vous pouvez contacter :
        </p>
        <ul style={ulStyle}>
          <Li>Le Défenseur des droits : <a href="https://www.defenseurdesdroits.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>www.defenseurdesdroits.fr</a></Li>
          <Li>Le délégué du Défenseur des droits dans votre région</Li>
          <Li>La CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>www.cnil.fr</a></Li>
        </ul>
      </Section>
    </div>
  );
}

const pStyle: React.CSSProperties = { fontSize: 14, color: '#CBD5E1', lineHeight: 1.8, margin: 0 };
const ulStyle: React.CSSProperties = { listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 8 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6', marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
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
