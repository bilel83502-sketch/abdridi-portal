import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#0F0F23', color: '#E2E8F0', fontFamily: "'Outfit', system-ui, sans-serif", padding: 24, textAlign: 'center',
    }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 80, fontWeight: 800, color: '#3B82F6', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '16px 0 8px', color: '#E2E8F0' }}>Page introuvable</h1>
        <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 420, lineHeight: 1.6 }}>
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', background: '#3B82F6', color: '#fff',
          fontSize: 14, fontWeight: 600, textDecoration: 'none', borderRadius: 8,
        }}>
          Retour au tableau de bord
        </Link>
        <a href="mailto:contact@abdridi.com" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', background: 'transparent', color: '#94A3B8',
          fontSize: 14, fontWeight: 600, textDecoration: 'none', borderRadius: 8,
          border: '1px solid #334155',
        }}>
          Nous contacter
        </a>
      </div>
      <p style={{ fontSize: 12, color: '#64748B', marginTop: 48 }}>
        AB DRIDI — Marchés publics
      </p>
    </div>
  );
}
