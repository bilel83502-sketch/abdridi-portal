import Link from 'next/link';
import Image from 'next/image';
import { CONTACT_PHONE, CONTACT_PHONE_HREF, CONTACT_EMAIL } from '@/lib/contact';

/** En-tête et pied de page des pages publiques du portail (accueil, contact). */
export const PC = {
  bg: '#0F0F23', card: '#1E293B', line: '#334155', text: '#E2E8F0', muted: '#94A3B8', dim: '#64748B',
  blue: '#3B82F6', cyan: '#00C2FF', green: '#10B981', amber: '#F59E0B',
};

const navLink = { fontSize: 14, color: PC.muted, textDecoration: 'none', whiteSpace: 'nowrap' as const };

export function SiteHeader() {
  return (
    <header style={{ borderBottom: `1px solid ${PC.card}` }}>
      <nav aria-label="Navigation principale" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', maxWidth: 1100, margin: '0 auto', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: PC.text }}>
          <Image src="/logo.png" alt="" width={34} height={34} priority />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>AB DRIDI</span>
        </Link>
        <div className="site-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Link href="/#methode" style={navLink}>Méthode</Link>
          <Link href="/#tarifs" style={navLink}>Tarifs</Link>
          <Link href="/contact" style={navLink}>Contact</Link>
          <a href={CONTACT_PHONE_HREF} style={{ ...navLink, color: PC.text, fontWeight: 600 }}>{CONTACT_PHONE}</a>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/auth/login" style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: PC.muted, textDecoration: 'none', border: `1px solid ${PC.line}`, borderRadius: 8, whiteSpace: 'nowrap' }}>
            Se connecter
          </Link>
          <Link href="/auth/register" style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#fff', background: PC.blue, textDecoration: 'none', borderRadius: 8, whiteSpace: 'nowrap' }}>
            3 mois offerts
          </Link>
        </div>
      </nav>
      <style>{`@media (max-width: 720px) { .site-nav-links { order: 3; width: 100%; justify-content: center; gap: 16px !important; } }`}</style>
    </header>
  );
}

export function SiteFooter() {
  const l = { color: PC.dim, textDecoration: 'none' };
  return (
    <footer style={{ padding: '32px 16px', textAlign: 'center', borderTop: `1px solid ${PC.card}` }}>
      <p style={{ fontSize: 15, marginBottom: 14 }}>
        <a href={CONTACT_PHONE_HREF} style={{ color: PC.text, fontWeight: 700, textDecoration: 'none' }}>{CONTACT_PHONE}</a>
        <span style={{ color: PC.dim }}> · </span>
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: PC.text, textDecoration: 'none' }}>{CONTACT_EMAIL}</a>
      </p>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, marginBottom: 14 }}>
        <a href="https://abdridi.com" style={l}>abdridi.com</a>
        <Link href="/contact" style={l}>Contact</Link>
        <Link href="/mentions-legales" style={l}>Mentions légales</Link>
        <Link href="/confidentialite" style={l}>Confidentialité</Link>
        <Link href="/accessibilite" style={l}>Accessibilité</Link>
      </div>
      <p style={{ fontSize: 12, color: '#475569' }}>AB DRIDI — Monsieur Bilel DRIDI, EI — SIREN 949654487</p>
    </footer>
  );
}
