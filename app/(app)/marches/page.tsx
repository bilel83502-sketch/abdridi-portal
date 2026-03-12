'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Clock, Building2, MapPin, ArrowRight, Lock, Calendar, RotateCcw, Layers, Tag } from 'lucide-react';
import { formatCurrency, formatDate, daysUntil, getNatureLabel } from '@/lib/utils';
import Link from 'next/link';
import DepartmentSelect from '@/components/DepartmentSelect';

/* ─── Nature badge with requested color mapping ─── */
function NatureBadge({ nature }: { nature: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    FOURNITURES: { bg: '#DBEAFE', text: '#1D4ED8' },
    SERVICES: { bg: '#EDE9FE', text: '#6D28D9' },
    TRAVAUX: { bg: '#FFEDD5', text: '#C2410C' },
  };
  const style = map[nature] || { bg: '#F3F4F6', text: '#6B7280' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: style.bg, color: style.text, whiteSpace: 'nowrap',
    }}>
      {getNatureLabel(nature)}
    </span>
  );
}

/* ─── Deadline badge (green / orange / red) ─── */
function DeadlineBadge({ days }: { days: number | null }) {
  if (days === null) return <span style={{ fontSize: 12, color: '#9CA3AF' }}>--</span>;
  let bg = '#ECFDF5'; let text = '#065F46'; let border = '#A7F3D0';
  if (days <= 7) { bg = '#FEF2F2'; text = '#991B1B'; border = '#FECACA'; }
  else if (days <= 14) { bg = '#FFFBEB'; text = '#92400E'; border = '#FDE68A'; }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: bg, color: text, border: `1px solid ${border}`, whiteSpace: 'nowrap',
    }}>
      <Clock size={12} />
      {days <= 0 ? 'Expire' : `${days} jour${days > 1 ? 's' : ''}`}
    </span>
  );
}

export default function MarchesPage() {
  const router = useRouter();
  const [marches, setMarches] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, pages: 0, isPaid: true, freeLimit: 3 });
  const [q, setQ] = useState('');
  const [nature, setNature] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [datePublishedFrom, setDatePublishedFrom] = useState('');
  const [datePublishedTo, setDatePublishedTo] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');

  const hasDateFilters = datePublishedFrom || datePublishedTo || deadlineFrom || deadlineTo;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (q) params.set('q', q);
    if (nature) params.set('nature', nature);
    if (department) params.set('department', department);
    if (datePublishedFrom) params.set('datePublishedFrom', datePublishedFrom);
    if (datePublishedTo) params.set('datePublishedTo', datePublishedTo);
    if (deadlineFrom) params.set('deadlineFrom', deadlineFrom);
    if (deadlineTo) params.set('deadlineTo', deadlineTo);
    const res = await fetch(`/api/marches?${params}`);
    const data = await res.json();
    setMarches(data.data);
    setMeta(data.meta);
    setLoading(false);
  }, [q, nature, department, page, datePublishedFrom, datePublishedTo, deadlineFrom, deadlineTo]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setPage(1); load(); }

  function resetAllFilters() {
    setNature('');
    setDepartment('');
    setDatePublishedFrom('');
    setDatePublishedTo('');
    setDeadlineFrom('');
    setDeadlineTo('');
  }

  const isPaid = meta.isPaid;
  const freeLimit = meta.freeLimit || 3;

  return (
    <div>
      {/* ─── Page header ─── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B0F1A', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
          Consultations en cours
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            <strong style={{ color: '#2563EB' }}>{meta.total.toLocaleString('fr-FR')}</strong> appels d&apos;offres ouverts &mdash; 99 sources officielles
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9CA3AF' }}>
            <Clock size={13} /> Mise &agrave; jour il y a 4 min
          </div>
        </div>
      </div>

      {/* ─── Free user banner ─── */}
      {!isPaid && (
        <div style={{
          marginBottom: 20, padding: '14px 20px', borderRadius: 12,
          background: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)',
          border: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#92400E', fontSize: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} style={{ color: '#92400E' }} />
            </div>
            <span><strong>{freeLimit}/{freeLimit}</strong> consultations gratuites utilis&eacute;es aujourd&apos;hui</span>
          </div>
          <Link
            href="/abonnement"
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
              color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            D&eacute;bloquer &mdash; 25,90&euro;/mois
          </Link>
        </div>
      )}

      {/* ─── Search bar ─── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Mots-cl&eacute;s, acheteur, code CPV, intitul&eacute;..."
            style={{
              width: '100%', height: 48, paddingLeft: 46, paddingRight: 16,
              borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 15,
              fontFamily: 'inherit', outline: 'none', background: '#fff',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#2563EB')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 16px', height: 48, borderRadius: 12,
            border: showFilters ? '1px solid #2563EB' : '1px solid #E5E7EB',
            background: showFilters ? '#EFF6FF' : '#fff',
            color: showFilters ? '#2563EB' : '#374151',
            fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          <SlidersHorizontal size={16} /> Filtres
        </button>
        <button
          type="submit"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 24px', height: 48, borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
        >
          <Search size={16} /> Rechercher
        </button>
      </form>

      {/* ─── Filters panel ─── */}
      {showFilters && (
        <div style={{
          marginBottom: 20, padding: 24, borderRadius: 12,
          background: '#fff', border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Criteres de recherche</span>
            <button
              onClick={resetAllFilters}
              style={{
                fontSize: 12, color: '#2563EB', fontWeight: 600,
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
              }}
            >
              <RotateCcw size={11} /> Reinitialiser
            </button>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-3 mb-5 marches-filters-grid">
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nature</label>
              <select value={nature} onChange={e => setNature(e.target.value)} className="input" style={{ height: 40, fontSize: 13 }}>
                <option value="">Toutes</option>
                <option value="TRAVAUX">Travaux</option>
                <option value="FOURNITURES">Fournitures</option>
                <option value="SERVICES">Services</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Departement</label>
              <DepartmentSelect value={department} onChange={setDepartment} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Code CPV</label>
              <input className="input" placeholder="Ex: 45000000" style={{ height: 40, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Montant estime</label>
              <select className="input" style={{ height: 40, fontSize: 13 }}>
                <option>Tous</option>
                <option>{'< 100 K\u20AC'}</option>
                <option>100K &ndash; 500K&euro;</option>
                <option>500K &ndash; 2M&euro;</option>
                <option>{'> 2 M\u20AC'}</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date filters */}
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Calendar size={13} style={{ color: '#6B7280' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Filtres par date</span>
              {hasDateFilters && (
                <span style={{
                  marginLeft: 8, fontSize: 10, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 4,
                  background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE',
                }}>
                  Actif
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 marches-date-grid">
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Date de publication
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 3 }}>Du</label>
                    <input type="date" value={datePublishedFrom} onChange={e => setDatePublishedFrom(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#D1D5DB', marginTop: 14 }}>&rarr;</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 3 }}>Au</label>
                    <input type="date" value={datePublishedTo} onChange={e => setDatePublishedTo(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Date limite de reponse
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 3 }}>Du</label>
                    <input type="date" value={deadlineFrom} onChange={e => setDeadlineFrom(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#D1D5DB', marginTop: 14 }}>&rarr;</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 3 }}>Au</label>
                    <input type="date" value={deadlineTo} onChange={e => setDeadlineTo(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => { setPage(1); load(); }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Appliquer</button>
            <span style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>Sauvegarder comme alerte &rarr;</span>
          </div>
        </div>
      )}

      {/* ─── Results ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '64px 0', fontSize: 15 }}>Chargement...</div>
      ) : marches.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '64px 0', fontSize: 15, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
          Aucune consultation trouvee.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {marches.map((m) => {
            const dl = daysUntil(m.deadline);
            const isLocked = m.locked === true;

            /* ─── Locked card ─── */
            if (isLocked) {
              return (
                <div key={m.id} className="marche-card" style={{
                  position: 'relative', overflow: 'hidden',
                  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
                  padding: 28, cursor: 'default',
                }}>
                  <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      <NatureBadge nature={m.nature} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', lineHeight: 1.45, margin: '0 0 10px' }}>{m.title}</h3>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6B7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Building2 size={14} style={{ color: '#9CA3AF' }} /> {m.buyer}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={14} style={{ color: '#9CA3AF' }} /> {m.departmentName || m.department}</span>
                    </div>
                  </div>
                  {/* Lock overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={20} style={{ color: '#6B7280' }} />
                    </div>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 500, textAlign: 'center' }}>
                      Passez au plan Veille pour voir ce marche
                    </span>
                    <Link
                      href="/abonnement"
                      style={{
                        padding: '9px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        color: '#fff', textDecoration: 'none',
                      }}
                    >
                      Debloquer &mdash; 25,90&euro;/mois
                    </Link>
                  </div>
                </div>
              );
            }

            /* ─── Normal card ─── */
            return (
              <div
                key={m.id}
                onClick={() => router.push(`/marches/${m.id}`)}
                className="marche-card"
                style={{
                  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
                  padding: 28, cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
              >
                {/* Top: badges + amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <NatureBadge nature={m.nature} />
                    {m.procedureType && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#F3F4F6', color: '#6B7280' }}>
                        {m.procedureType}
                      </span>
                    )}
                    {m.sourceRef && (
                      <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>
                        {m.sourceRef}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0B0F1A' }}>{formatCurrency(m.value)}</div>
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 17, fontWeight: 600, color: '#111827', lineHeight: 1.45, margin: '0 0 10px' }}>
                  {m.title}
                </h3>

                {/* Buyer + Location */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14, color: '#4B5563', marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={15} style={{ color: '#9CA3AF' }} /> {m.buyer}
                  </span>
                </div>

                {/* Publication + duration */}
                <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 0 }}>
                  {m.source} &middot; Publie le {formatDate(m.publicationDate)}{m.duration ? ` \u00B7 Duree ${m.duration}` : ''}
                </div>

                {/* ─── Bottom section ─── */}
                <div style={{
                  borderTop: '1px solid #F3F4F6', marginTop: 16, paddingTop: 16,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: 10,
                }}>
                  {/* Left: location + CPV + lots + deadline */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: '#6B7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} style={{ color: '#9CA3AF' }} />
                      {m.departmentName || m.department} ({m.department})
                    </span>
                    {m.cpvCode && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag size={13} style={{ color: '#9CA3AF' }} />
                        CPV {m.cpvCode}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={13} style={{ color: '#9CA3AF' }} />
                      {m.lots} lot{m.lots > 1 ? 's' : ''}
                    </span>
                    <DeadlineBadge days={dl} />
                  </div>

                  {/* Right: CTA button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/marches/${m.id}`); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 18px', borderRadius: 8,
                      border: 'none', background: '#2563EB', color: '#fff',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      whiteSpace: 'nowrap', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1D4ED8')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#2563EB')}
                  >
                    Voir la consultation <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {meta.pages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 24, padding: '14px 0',
        }}>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>
            Page {meta.page} sur {meta.pages} &mdash; {meta.total.toLocaleString('fr-FR')} resultats
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '8px 18px', borderRadius: 8,
                border: '1px solid #E5E7EB', background: '#fff',
                fontSize: 13, fontWeight: 500, cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.4 : 1, fontFamily: 'inherit', color: '#374151',
              }}
            >
              Precedent
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
              disabled={page >= meta.pages}
              style={{
                padding: '8px 18px', borderRadius: 8,
                border: 'none', background: '#2563EB',
                fontSize: 13, fontWeight: 600, cursor: page >= meta.pages ? 'not-allowed' : 'pointer',
                opacity: page >= meta.pages ? 0.4 : 1, fontFamily: 'inherit', color: '#fff',
              }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* ─── Responsive ─── */}
      <style jsx>{`
        @media (max-width: 768px) {
          .marches-filters-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .marches-date-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .marches-filters-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
