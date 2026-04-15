import { Clock, MapPin, ArrowRight, Lock, Tag, Layers, Calendar, Star } from 'lucide-react';
import { formatCurrency, formatDate, daysUntil, getNatureLabel, cleanTitle, decodeHtml } from '@/lib/utils';
import { getRegionLogo } from '@/lib/regions';
import Link from 'next/link';
import Image from 'next/image';

/* ─── Nature badge ─── */
function NatureBadge({ nature }: { nature: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    FOURNITURES: { bg: 'rgba(59,130,246,0.08)', text: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
    SERVICES: { bg: 'rgba(0,194,255,0.08)', text: '#00A8DD', border: 'rgba(0,194,255,0.2)' },
    TRAVAUX: { bg: 'rgba(245,158,11,0.08)', text: '#D97706', border: 'rgba(245,158,11,0.2)' },
  };
  const s = map[nature] || { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
  return (
    <span style={{
      padding: '4px 10px', fontSize: 10, fontWeight: 700,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {getNatureLabel(nature)}
    </span>
  );
}

/* ─── Deadline countdown ─── */
function DeadlineCountdown({ days }: { days: number | null }) {
  if (days === null) return null;
  let bg: string, text: string, border: string, label: string;
  if (days <= 0) {
    bg = 'rgba(239,68,68,0.1)'; text = '#DC2626'; border = 'rgba(239,68,68,0.25)'; label = 'Expire';
  } else if (days <= 7) {
    bg = 'rgba(239,68,68,0.08)'; text = '#DC2626'; border = 'rgba(239,68,68,0.2)'; label = `${days}j restant${days > 1 ? 's' : ''}`;
  } else if (days <= 14) {
    bg = 'rgba(245,158,11,0.08)'; text = '#D97706'; border = 'rgba(245,158,11,0.2)'; label = `${days}j restants`;
  } else {
    bg = 'rgba(16,185,129,0.08)'; text = '#059669'; border = 'rgba(16,185,129,0.2)'; label = `${days}j restants`;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', fontSize: 11, fontWeight: 600,
      background: bg, color: text, border: `1px solid ${border}`, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

/* ─── Highlight search terms in text ─── */
function HighlightText({ text, keywords }: { text: string; keywords: string[] }) {
  if (!keywords.length || !text) return <>{text}</>;
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: '#FEF08A', color: 'inherit', padding: '0 1px' }}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ─── Props ─── */
interface MarcheCardProps {
  marche: any;
  tags: string[];
  isFavorite: boolean;
  onToggleFav: (id: string, e: React.MouseEvent) => void;
}

export default function MarcheCard({ marche: m, tags, isFavorite, onToggleFav }: MarcheCardProps) {
  const dl = daysUntil(m.deadline);
  const isLocked = m.locked === true;

  if (isLocked) {
    return (
      <div className="card consultation-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', padding: '20px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.5 }}>{decodeHtml(m.title)}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{decodeHtml(m.buyer)}</div>
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <Lock size={16} style={{ color: '#6B7280' }} />
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
            Passez au plan Veille pour voir ce marche
          </span>
          <Link href="/abonnement" style={{
            padding: '6px 16px', fontSize: 12, fontWeight: 600,
            background: '#3B82F6', color: '#fff', textDecoration: 'none',
          }}>
            Debloquer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card consultation-card">
      {/* -- HEADER: Buyer + Deadline -- */}
      <div className="consultation-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            <Image src={getRegionLogo(m.department)} alt="" width={40} height={40} style={{ objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
            {decodeHtml((m.buyer || 'Acheteur non renseigne').replace(/\)\s*$/, ''))}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Clock size={13} style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 14 }}>
            {m.deadline ? formatDate(m.deadline) : '\u2014'}
          </span>
          <DeadlineCountdown days={dl} />
          {m.value ? (
            <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>
              {formatCurrency(m.value)}
            </span>
          ) : null}
        </div>
      </div>

      {/* -- BODY -- */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Procedure type */}
        {m.procedureType && (
          <div style={{ fontSize: 13, color: '#64748B' }}>
            {m.procedureType}
          </div>
        )}

        {/* Title -- clickable */}
        <Link
          href={`/marches/${m.id}`}
          style={{ textDecoration: 'none', display: 'block' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="consultation-card-title">
            <HighlightText text={cleanTitle(m.title)} keywords={tags} />
          </h2>
        </Link>

        {/* Location + Nature + Lots + CPV */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}>
          {(m.departmentName || (m.department && m.department !== '00')) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: '#64748B' }}>
              <MapPin size={14} style={{ color: '#94A3B8' }} />
              {m.department && m.department !== '00' ? `(${m.department}) ` : ''}{m.departmentName || ''}
            </span>
          )}
          <NatureBadge nature={m.nature} />
          {m.lots > 1 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 14, color: '#64748B', fontWeight: 500,
            }}>
              <Layers size={13} style={{ color: '#94A3B8' }} /> {m.lots} lots
            </span>
          )}
          {m.cpvCode && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 14, color: '#94A3B8',
            }}>
              <Tag size={13} /> {m.cpvCode}
            </span>
          )}
        </div>
      </div>

      {/* -- FOOTER -- */}
      <div className="consultation-card-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#94A3B8' }}>
          <Calendar size={13} />
          Publiee le {formatDate(m.publicationDate)}
          <span style={{ color: '#CBD5E1', margin: '0 2px' }}>&middot;</span>
          {m.source}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={(e) => onToggleFav(m.id, e)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star size={18} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : '#CBD5E1'} />
          </button>
          <Link
            href={`/marches/${m.id}`}
            className="consultation-card-btn"
            onClick={(e) => e.stopPropagation()}
          >
            Voir la consultation <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
