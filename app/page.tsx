import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/marches');

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F23', color: '#E2E8F0', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image src="/logo.png" alt="AB DRIDI" width={36} height={36} priority />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.1em' }}>DRIDI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/auth/login" style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#94A3B8', textDecoration: 'none', border: '1px solid #334155', borderRadius: 8 }}>
            Se connecter
          </Link>
          <Link href="/auth/register" style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#3B82F6', textDecoration: 'none', borderRadius: 8 }}>
            Créer un compte
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 16, fontFamily: "'Instrument Serif', Georgia, serif" }}>
          Le portail professionnel pour détecter et remporter vos <em style={{ color: '#3B82F6', fontStyle: 'italic' }}>marchés publics</em>
        </h1>
        <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 32px' }}>
          Veille quotidienne sur 17+ sources officielles, accompagnement au montage de dossiers, et suivi de vos opportunités. Tout sur une seule plateforme.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register" style={{ padding: '14px 32px', fontSize: 15, fontWeight: 700, color: '#fff', background: '#3B82F6', textDecoration: 'none', borderRadius: 8 }}>
            Essai gratuit
          </Link>
          <Link href="/auth/login" style={{ padding: '14px 32px', fontSize: 15, fontWeight: 600, color: '#94A3B8', textDecoration: 'none', border: '1px solid #334155', borderRadius: 8 }}>
            Se connecter
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '40px 24px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { emoji: '1', title: 'Veille quotidienne', desc: '17 sources agrégées : BOAMP, TED, PLACE, Maximilien, Mégalis et 12 autres. Alertes email personnalisées chaque matin.', color: '#3B82F6' },
            { emoji: '2', title: 'Accompagnement sur-mesure', desc: 'Mémoire technique, BPU, pièces administratives et dépôt dématérialisé. Votre dossier monté de A à Z.', color: '#00C2FF' },
            { emoji: '3', title: 'Suivi de vos opportunités', desc: 'Dashboard de pilotage, pipeline commercial, gestion des prospects et relances automatisées.', color: '#10B981' },
          ].map(f => (
            <div key={f.title} style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 28, borderTop: `3px solid ${f.color}` }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: f.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{f.emoji}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section style={{ padding: '40px 24px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Secteurs accompagnés</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Transport médical', 'Funéraire', 'Déchets & propreté', 'Alimentaire', 'Messagerie & logistique', 'BTP', 'Services'].map(s => (
            <span key={s} style={{ padding: '6px 14px', fontSize: 12, color: '#94A3B8', border: '1px solid #334155', borderRadius: 20 }}>{s}</span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid #1E293B', marginTop: 40 }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: '#64748B', marginBottom: 16 }}>
          <a href="https://abdridi.com" style={{ color: '#64748B', textDecoration: 'none' }}>abdridi.com</a>
          <Link href="/mentions-legales" style={{ color: '#64748B', textDecoration: 'none' }}>Mentions légales</Link>
          <Link href="/confidentialite" style={{ color: '#64748B', textDecoration: 'none' }}>Confidentialité</Link>
          <Link href="/accessibilite" style={{ color: '#64748B', textDecoration: 'none' }}>Accessibilité</Link>
        </div>
        <p style={{ fontSize: 12, color: '#475569' }}>AB DRIDI — Monsieur Bilel DRIDI, EI — SIREN 949654487</p>
      </footer>
    </div>
  );
}
