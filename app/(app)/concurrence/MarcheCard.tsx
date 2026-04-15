'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  MapPin,
  Tag,
  Clock,
  Calendar,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { formatCurrency, formatDate, getNatureLabel } from '@/lib/utils';
import { getRegionLogo } from '@/lib/regions';

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

export function MarcheCardLocked({ m }: { m: any }) {
  return (
    <div className="card consultation-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', padding: '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{m.objet}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{m.acheteurNom}</div>
      </div>
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        <Lock size={16} style={{ color: '#6B7280' }} />
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Passez au plan Veille</span>
        <Link href="/abonnement" style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, background: '#3B82F6', color: '#fff', textDecoration: 'none' }}>
          Débloquer
        </Link>
      </div>
    </div>
  );
}

export function MarcheCard({ m }: { m: any }) {
  return (
    <div className="card consultation-card">
      {/* HEADER: Titulaire + Date + Montant */}
      <div className="consultation-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            <Image src={getRegionLogo(m.departement)} alt="" width={40} height={40} style={{ objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
            {(m.titulaireNom || 'Attributaire non renseigné').replace(/\)\s*$/, '')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Clock size={13} style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 14 }}>
            {m.dateNotification ? formatDate(m.dateNotification) : '—'}
          </span>
          {m.montant ? (
            <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 4 }}>
              {formatCurrency(m.montant)}
            </span>
          ) : null}
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title */}
        <Link
          href={`/concurrence/${m.id}`}
          style={{ textDecoration: 'none', display: 'block' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="consultation-card-title">
            {m.objet}
          </h3>
        </Link>

        {/* Acheteur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748B' }}>
          <Building2 size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
          <span>{(m.acheteurNom || '—').replace(/\)\s*$/, '')}</span>
        </div>

        {/* Location + Nature + CPV + Duration */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {(m.departementNom || m.departement) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: '#64748B' }}>
              <MapPin size={14} style={{ color: '#94A3B8' }} />
              ({m.departement}) {m.departementNom || ''}
            </span>
          )}
          <NatureBadge nature={m.nature} />
          {m.codeCPV && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#94A3B8' }}>
              <Tag size={13} /> {m.codeCPV}
            </span>
          )}
          {m.dureeMois && (
            <span style={{ fontSize: 14, color: '#94A3B8' }}>
              {m.dureeMois} mois
            </span>
          )}
          {m.titulaireSiret && (
            <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
              SIRET {m.titulaireSiret}
            </span>
          )}
        </div>

        {/* Enterprise enrichment */}
        {m.entreprise && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {m.entreprise.formeJuridique && <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, background: '#ECFDF5', color: '#065F46' }}>{m.entreprise.formeJuridique}</span>}
            {m.entreprise.effectifs && <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, background: '#F0F9FF', color: '#0369A1' }}>{m.entreprise.effectifs}</span>}
            {m.entreprise.activite && <span style={{ padding: '2px 8px', fontSize: 10, color: '#6B7280', background: '#F9FAFB', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.entreprise.activite}</span>}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="consultation-card-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#94A3B8' }}>
          <Calendar size={13} />
          Notifié le {formatDate(m.dateNotification)}
          <span style={{ color: '#CBD5E1', margin: '0 2px' }}>·</span>
          {m.source}
          {m.formePrix && (
            <>
              <span style={{ color: '#CBD5E1', margin: '0 2px' }}>·</span>
              Prix {m.formePrix.toLowerCase()}
            </>
          )}
        </span>
        <Link
          href={`/concurrence/${m.id}`}
          className="consultation-card-btn"
          onClick={(e) => e.stopPropagation()}
        >
          Voir le détail <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
