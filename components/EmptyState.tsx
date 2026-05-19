import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref, ctaOnClick }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center',
      border: '2px dashed #334155', borderRadius: 12, background: 'rgba(30,41,59,0.3)',
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={28} style={{ color: '#3B82F6' }} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#E2E8F0', margin: '0 0 6px' }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 360, lineHeight: 1.5, margin: '0 0 20px' }}>{description}</p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 20px', fontSize: 13, fontWeight: 600,
          background: '#3B82F6', color: '#fff', textDecoration: 'none', borderRadius: 8,
        }}>
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && ctaOnClick && !ctaHref && (
        <button onClick={ctaOnClick} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 20px', fontSize: 13, fontWeight: 600,
          background: '#3B82F6', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 8, fontFamily: 'inherit',
        }}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
