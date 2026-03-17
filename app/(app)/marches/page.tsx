'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Clock, Building2, MapPin, ArrowRight, Lock, X, Tag, Layers, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate, daysUntil, getNatureLabel, cleanTitle } from '@/lib/utils';
import Link from 'next/link';
import DepartmentSelect from '@/components/DepartmentSelect';
import TagInput from '@/components/TagInput';

/* ─── Nature badge ─── */
function NatureBadge({ nature }: { nature: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    FOURNITURES: { bg: '#DBEAFE', text: '#2563EB' },
    SERVICES: { bg: '#DBEAFE', text: '#2563EB' },
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

/* ─── Deadline badge ─── */
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
  const panelRef = useRef<HTMLDivElement>(null);
  const [marches, setMarches] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, pages: 0, isPaid: true, freeLimit: 3 });
  const [tags, setTags] = useState<string[]>([]);
  const [nature, setNature] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Advanced filters
  const [acheteur, setAcheteur] = useState('');
  const [cpvCode, setCpvCode] = useState('');
  const [datePublishedFrom, setDatePublishedFrom] = useState('');
  const [datePublishedTo, setDatePublishedTo] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');

  const hasFilters = nature || department || acheteur || cpvCode || datePublishedFrom || datePublishedTo || deadlineFrom || deadlineTo;
  const filterCount = [nature, department, acheteur, cpvCode, datePublishedFrom || datePublishedTo, deadlineFrom || deadlineTo].filter(Boolean).length;

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtersOpen && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filtersOpen]);

  // Lock scroll when panel open
  useEffect(() => {
    if (filtersOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (tags.length > 0) params.set('q', tags.join(','));
    if (nature) params.set('nature', nature);
    if (department) params.set('department', department);
    if (acheteur) params.set('buyer', acheteur);
    if (cpvCode) params.set('cpvCode', cpvCode);
    if (datePublishedFrom) params.set('datePublishedFrom', datePublishedFrom);
    if (datePublishedTo) params.set('datePublishedTo', datePublishedTo);
    if (deadlineFrom) params.set('deadlineFrom', deadlineFrom);
    if (deadlineTo) params.set('deadlineTo', deadlineTo);
    const res = await fetch(`/api/marches?${params}`);
    const data = await res.json();
    setMarches(data.data);
    setMeta(data.meta);
    setLoading(false);
  }, [tags, nature, department, acheteur, cpvCode, page, datePublishedFrom, datePublishedTo, deadlineFrom, deadlineTo]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setPage(1); load(); }

  function resetAllFilters() {
    setTags([]); setNature(''); setDepartment(''); setAcheteur(''); setCpvCode('');
    setDatePublishedFrom(''); setDatePublishedTo('');
    setDeadlineFrom(''); setDeadlineTo('');
  }

  function applyFilters() {
    setPage(1);
    setFiltersOpen(false);
    load();
  }

  const isPaid = meta.isPaid;
  const freeLimit = meta.freeLimit || 3;

  return (
    <div>
      {/* ─── Page header ─── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
          Consultations en cours
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          <strong style={{ color: '#3B82F6' }}>{meta.total.toLocaleString('fr-FR')}</strong> appels d&apos;offres ouverts
        </p>
      </div>

      {/* ─── Free user banner ─── */}
      {!isPaid && (
        <div style={{
          marginBottom: 16, padding: '12px 20px', borderRadius: 10,
          background: '#FFFBEB', border: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400E', fontSize: 13 }}>
            <Lock size={15} />
            <span><strong>{freeLimit}/{freeLimit}</strong> consultations gratuites aujourd&apos;hui</span>
          </div>
          <Link href="/abonnement" style={{
            padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: '#3B82F6', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Passer au plan Veille
          </Link>
        </div>
      )}

      {/* ─── Search bar + Filter button ─── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <TagInput
            tags={tags}
            onChange={(newTags) => { setTags(newTags); setPage(1); }}
            placeholder="Mots-clés : transport, nettoyage, BTP..."
          />
        </div>
        <button type="submit" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 20px', height: 44, border: 'none',
          background: '#3B82F6', color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>
          <Search size={15} /> Rechercher
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 16px', height: 44, borderRadius: 8,
            border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            color: hasFilters ? '#3B82F6' : '#64748B',
            position: 'relative',
          }}
        >
          <SlidersHorizontal size={15} /> Filtres
          {filterCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              width: 18, height: 18, borderRadius: '50%',
              background: '#3B82F6', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {filterCount}
            </span>
          )}
        </button>
      </form>

      {/* ─── Active filters summary ─── */}
      {hasFilters && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: '#94A3B8', marginRight: 4 }}>Filtres :</span>
          {nature && <FilterChip label={getNatureLabel(nature)} onRemove={() => { setNature(''); setPage(1); }} />}
          {department && <FilterChip label={`Dept. ${department}`} onRemove={() => { setDepartment(''); setPage(1); }} />}
          {acheteur && <FilterChip label={`Acheteur: ${acheteur}`} onRemove={() => { setAcheteur(''); setPage(1); }} />}
          {cpvCode && <FilterChip label={`CPV: ${cpvCode}`} onRemove={() => { setCpvCode(''); setPage(1); }} />}
          {(datePublishedFrom || datePublishedTo) && <FilterChip label="Date publication" onRemove={() => { setDatePublishedFrom(''); setDatePublishedTo(''); setPage(1); }} />}
          {(deadlineFrom || deadlineTo) && <FilterChip label="Date clôture" onRemove={() => { setDeadlineFrom(''); setDeadlineTo(''); setPage(1); }} />}
          <button onClick={() => { resetAllFilters(); setPage(1); }} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#3B82F6', fontWeight: 600, fontFamily: 'inherit',
          }}>
            <RotateCcw size={11} /> Tout effacer
          </button>
        </div>
      )}

      {/* ─── Results ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '64px 0', fontSize: 14 }}>Chargement...</div>
      ) : marches.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '64px 0', fontSize: 14, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          Aucune consultation trouvée.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {marches.map((m) => {
            const dl = daysUntil(m.deadline);
            const isLocked = m.locked === true;

            if (isLocked) {
              return (
                <div key={m.id} className="card" style={{ position: 'relative', overflow: 'hidden', padding: '20px 24px' }}>
                  <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.5 }}>{m.title}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{m.buyer}</div>
                  </div>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(255,255,255,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  }}>
                    <Lock size={16} style={{ color: '#6B7280' }} />
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                      Passez au plan Veille pour voir ce marché
                    </span>
                    <Link href="/abonnement" style={{
                      padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: '#3B82F6', color: '#fff', textDecoration: 'none',
                    }}>
                      Débloquer
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                onClick={() => router.push(`/marches/${m.id}`)}
                className="card"
                style={{ padding: '18px 24px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#93C5FD')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
              >
                {/* Row 1: Nature + Title + Amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <NatureBadge nature={m.nature} />
                      {m.procedureType && (
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{m.procedureType}</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', lineHeight: 1.45, margin: 0 }}>
                      {cleanTitle(m.title)}
                    </h3>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatCurrency(m.value)}
                  </div>
                </div>

                {/* Row 2: Meta info */}
                <div style={{
                  display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
                  marginTop: 10, fontSize: 13, color: '#64748B',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Building2 size={13} style={{ color: '#94A3B8' }} /> {m.buyer}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={13} style={{ color: '#94A3B8' }} /> {m.departmentName || m.department} ({m.department})
                  </span>
                  {m.cpvCode && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={12} style={{ color: '#94A3B8' }} /> CPV {m.cpvCode}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Layers size={12} style={{ color: '#94A3B8' }} /> {m.lots} lot{m.lots > 1 ? 's' : ''}
                  </span>
                  <DeadlineBadge days={dl} />
                  <span style={{ fontSize: 12, color: '#CBD5E1' }}>
                    {m.source} · {formatDate(m.publicationDate)}
                  </span>
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
          marginTop: 20, paddingTop: 16,
        }}>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>
            Page {meta.page} sur {meta.pages} — {meta.total.toLocaleString('fr-FR')} résultats
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '7px 16px', borderRadius: 6,
                border: '1px solid #E2E8F0', background: '#fff',
                fontSize: 13, fontWeight: 500, cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.4 : 1, fontFamily: 'inherit', color: '#374151',
              }}
            >
              Précédent
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
              disabled={page >= meta.pages}
              style={{
                padding: '7px 16px', borderRadius: 6,
                border: 'none', background: '#3B82F6',
                fontSize: 13, fontWeight: 600, cursor: page >= meta.pages ? 'not-allowed' : 'pointer',
                opacity: page >= meta.pages ? 0.4 : 1, fontFamily: 'inherit', color: '#fff',
              }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* ═══════ FILTER SIDE PANEL ═══════ */}
      {filtersOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)' }}
            onClick={() => setFiltersOpen(false)}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            style={{
              position: 'relative', width: 380, maxWidth: '90vw',
              background: '#fff', height: '100%',
              display: 'flex', flexDirection: 'column',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
              animation: 'slideInRight 0.2s ease-out',
            }}
          >
            {/* Panel header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 24px', borderBottom: '1px solid #E2E8F0',
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Filtres de recherche</h3>
              <button onClick={() => setFiltersOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
                padding: 4, borderRadius: 4, display: 'flex',
              }}>
                <X size={20} />
              </button>
            </div>

            {/* Panel body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* Mots-clés */}
              <FilterSection label="Mots-clés">
                <TagInput
                  tags={tags}
                  onChange={setTags}
                  placeholder="Ex: transport, nettoyage..."
                />
              </FilterSection>

              {/* Département */}
              <FilterSection label="Localisation / Département">
                <DepartmentSelect value={department} onChange={setDepartment} />
              </FilterSection>

              {/* Nature */}
              <FilterSection label="Nature des prestations">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { v: 'SERVICES', l: 'Services' },
                    { v: 'TRAVAUX', l: 'Travaux' },
                    { v: 'FOURNITURES', l: 'Fournitures' },
                  ].map(n => (
                    <label key={n.v} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="nature"
                        checked={nature === n.v}
                        onChange={() => setNature(nature === n.v ? '' : n.v)}
                        style={{ accentColor: '#3B82F6' }}
                      />
                      {n.l}
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Acheteur public */}
              <FilterSection label="Acheteur public">
                <input
                  value={acheteur}
                  onChange={e => setAcheteur(e.target.value)}
                  placeholder="Nom, code postal ou ville..."
                  className="input"
                  style={{ height: 38, fontSize: 13 }}
                />
              </FilterSection>

              {/* Code CPV */}
              <FilterSection label="Code CPV">
                <input
                  value={cpvCode}
                  onChange={e => setCpvCode(e.target.value)}
                  placeholder="Ex: 45000000"
                  className="input"
                  style={{ height: 38, fontSize: 13 }}
                />
              </FilterSection>

              {/* Date de publication */}
              <FilterSection label="Date de publication">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Du</label>
                    <input type="date" value={datePublishedFrom} onChange={e => setDatePublishedFrom(e.target.value)}
                      className="input" style={{ height: 36, fontSize: 12 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#CBD5E1', marginTop: 16 }}>→</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Au</label>
                    <input type="date" value={datePublishedTo} onChange={e => setDatePublishedTo(e.target.value)}
                      className="input" style={{ height: 36, fontSize: 12 }} />
                  </div>
                </div>
              </FilterSection>

              {/* Date de clôture */}
              <FilterSection label="Date limite de réponse">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Du</label>
                    <input type="date" value={deadlineFrom} onChange={e => setDeadlineFrom(e.target.value)}
                      className="input" style={{ height: 36, fontSize: 12 }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#CBD5E1', marginTop: 16 }}>→</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Au</label>
                    <input type="date" value={deadlineTo} onChange={e => setDeadlineTo(e.target.value)}
                      className="input" style={{ height: 36, fontSize: 12 }} />
                  </div>
                </div>
              </FilterSection>

            </div>

            {/* Panel footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #E2E8F0',
              display: 'flex', gap: 10,
            }}>
              <button onClick={() => { resetAllFilters(); }} style={{
                flex: 1, padding: '10px 0', borderRadius: 6,
                border: '1px solid #E2E8F0', background: '#fff',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                color: '#64748B',
              }}>
                Réinitialiser
              </button>
              <button onClick={applyFilters} style={{
                flex: 1, padding: '10px 0', borderRadius: 6,
                border: 'none', background: '#3B82F6',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                color: '#fff',
              }}>
                Rechercher
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Filter section in side panel ─── */
function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600, color: '#374151',
        marginBottom: 8, letterSpacing: '0.01em',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ─── Active filter chip ─── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: '#DBEAFE', color: '#3B82F6', border: '1px solid #93C5FD',
    }}>
      {label}
      <button onClick={onRemove} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        display: 'flex', color: '#3B82F6',
      }}>
        <X size={12} />
      </button>
    </span>
  );
}
