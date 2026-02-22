'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Clock, Building2, MapPin, ExternalLink, Lock, Calendar, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate, daysUntil, getNatureLabel, getNatureBadge } from '@/lib/utils';
import Link from 'next/link';

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
      <div className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-xl font-bold">Consultations en cours</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{meta.total.toLocaleString('fr-FR')} appels d&apos;offres ouverts &mdash; Agr&eacute;gation de 93 sources officielles</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Clock size={13} /> Mise &agrave; jour il y a 4 min
        </div>
      </div>

      {/* Free user counter */}
      {!isPaid && (
        <div style={{
          marginBottom: 12, padding: '10px 16px', borderRadius: 8,
          background: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)',
          border: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400E' }}>
            <Lock size={14} />
            <span><strong>{freeLimit}/{freeLimit}</strong> consultations gratuites utilis&eacute;es aujourd&apos;hui</span>
          </div>
          <Link
            href="/abonnement"
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
              color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            D&eacute;bloquer &mdash; 25,90&euro;/mois
          </Link>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} className="input !pl-9" placeholder="Mots-cl&eacute;s, acheteur, code CPV, intitul&eacute;..." />
        </div>
        <button type="button" onClick={() => setShowFilters(!showFilters)} className={`btn-secondary !text-xs !px-3.5 !gap-[5px] ${showFilters ? '!bg-blue-50 !text-blue-600 !border-blue-600' : ''}`}>
          <SlidersHorizontal size={15} /> Filtres
        </button>
        <button type="submit" className="btn-gradient !text-xs">Rechercher</button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="card p-5 mb-3">
          <div className="flex justify-between mb-3.5">
            <span className="text-xs font-bold">Crit&egrave;res de recherche</span>
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-blue-600 font-semibold bg-transparent border-none cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={10} />
              R&eacute;initialiser les filtres
            </button>
          </div>

          {/* Row 1: Nature, Department, CPV, Montant */}
          <div className="grid grid-cols-4 gap-2.5 mb-4 marches-filters-grid">
            <div>
              <label className="label">Nature</label>
              <select value={nature} onChange={e => setNature(e.target.value)} className="input">
                <option value="">Toutes</option>
                <option value="TRAVAUX">Travaux</option>
                <option value="FOURNITURES">Fournitures</option>
                <option value="SERVICES">Services</option>
              </select>
            </div>
            <div>
              <label className="label">D&eacute;partement</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="input">
                <option value="">Tous</option>
                <option value="75">75 &mdash; Paris</option>
                <option value="69">69 &mdash; Rh&ocirc;ne</option>
                <option value="13">13 &mdash; Bouches-du-Rh&ocirc;ne</option>
                <option value="33">33 &mdash; Gironde</option>
                <option value="59">59 &mdash; Nord</option>
                <option value="31">31 &mdash; Haute-Garonne</option>
                <option value="67">67 &mdash; Bas-Rhin</option>
              </select>
            </div>
            <div>
              <label className="label">Code CPV</label>
              <input className="input" placeholder="Ex: 45000000" />
            </div>
            <div>
              <label className="label">Montant estim&eacute;</label>
              <select className="input">
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
              {/* Publication date range */}
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Date de publication
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 3 }}>Du</label>
                    <input
                      type="date"
                      value={datePublishedFrom}
                      onChange={e => setDatePublishedFrom(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: 6,
                        border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit',
                        background: '#fff', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: '#D1D5DB', marginTop: 14 }}>&rarr;</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 3 }}>Au</label>
                    <input
                      type="date"
                      value={datePublishedTo}
                      onChange={e => setDatePublishedTo(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: 6,
                        border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit',
                        background: '#fff', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Deadline date range */}
              <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Date limite de r&eacute;ponse
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 3 }}>Du</label>
                    <input
                      type="date"
                      value={deadlineFrom}
                      onChange={e => setDeadlineFrom(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: 6,
                        border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit',
                        background: '#fff', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: '#D1D5DB', marginTop: 14 }}>&rarr;</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 3 }}>Au</label>
                    <input
                      type="date"
                      value={deadlineTo}
                      onChange={e => setDeadlineTo(e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: 6,
                        border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit',
                        background: '#fff', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={() => { setPage(1); load(); }} className="btn-primary !text-xs !py-[7px] !px-4">Appliquer</button>
            <span className="text-xs text-blue-600 font-semibold cursor-pointer">Sauvegarder comme alerte &rarr;</span>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : marches.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">Aucune consultation trouv&eacute;e.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {marches.map((m, idx) => {
            const dl = daysUntil(m.deadline);
            const isLocked = m.locked === true;

            if (isLocked) {
              return (
                <div
                  key={m.id}
                  className="card p-4 px-5"
                  style={{ position: 'relative', overflow: 'hidden', cursor: 'default' }}
                >
                  {/* Blurred content */}
                  <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
                    <div className="flex justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-[5px] mb-1.5 items-center flex-wrap">
                          <span className={getNatureBadge(m.nature)}>{getNatureLabel(m.nature)}</span>
                        </div>
                        <h3 className="text-sm font-semibold leading-snug mb-1.5">{m.title}</h3>
                        <div className="flex gap-3.5 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><Building2 size={13} className="text-gray-400" /> {m.buyer}</span>
                          <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" /> {m.departmentName || m.department}</span>
                        </div>
                        <div className="flex gap-2.5 mt-1.5 text-[11px] text-gray-400">
                          <span>{m.source} &middot; Publi&eacute; le {formatDate(m.publicationDate)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 min-w-[120px]">
                        <div className="text-[15px] font-bold">&mdash;</div>
                        <div className="text-[11px] mt-1 text-gray-400">
                          <Clock size={13} /> {dl !== null ? `${dl} jours` : '\u2014'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lock overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 8,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: '#F3F4F6', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Lock size={18} style={{ color: '#6B7280' }} />
                    </div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, textAlign: 'center' }}>
                      Passez au plan Veille pour voir ce march&eacute;
                    </span>
                    <Link
                      href="/abonnement"
                      style={{
                        padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                        color: '#fff', textDecoration: 'none',
                      }}
                    >
                      D&eacute;bloquer &mdash; 25,90&euro;/mois
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} onClick={() => router.push(`/marches/${m.id}`)} className="card p-4 px-5 cursor-pointer hover:border-gray-300 transition-colors">
                <div className="flex justify-between gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-[5px] mb-1.5 items-center flex-wrap">
                      <span className={getNatureBadge(m.nature)}>{getNatureLabel(m.nature)}</span>
                      {m.procedureType && <span className="px-[7px] py-[2px] rounded text-[10px] bg-gray-100 text-gray-500">{m.procedureType}</span>}
                      <span className="text-[10px] text-gray-400 font-mono">{m.sourceRef || ''}</span>
                    </div>
                    <h3 className="text-sm font-semibold leading-snug mb-1.5">{m.title}</h3>
                    <div className="flex gap-3.5 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Building2 size={13} className="text-gray-400" /> {m.buyer}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" /> {m.departmentName || m.department} ({m.department})</span>
                      <span>{m.lots} lot{m.lots > 1 ? 's' : ''}</span>
                      {m.cpvCode && <span>CPV {m.cpvCode}</span>}
                    </div>
                    <div className="flex gap-2.5 mt-1.5 text-[11px] text-gray-400">
                      <span>{m.source} &middot; Publi&eacute; le {formatDate(m.publicationDate)}{m.duration ? ` \u00B7 Dur\u00e9e ${m.duration}` : ''}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 min-w-[120px] flex flex-col justify-between">
                    <div>
                      <div className="text-[15px] font-bold">{formatCurrency(m.value)}</div>
                      <div className={`text-[11px] mt-1 flex items-center justify-end gap-1 ${dl !== null && dl <= 7 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                        <Clock size={13} /> {dl !== null ? `${dl} jours` : '\u2014'}
                      </div>
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); router.push(`/marches/${m.id}`); }}
                      className="text-xs text-blue-600 font-medium flex items-center gap-1 justify-end mt-2 cursor-pointer hover:text-blue-800"
                    >
                      Voir la consultation <ExternalLink size={11} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex justify-between items-center mt-5">
          <span className="text-xs text-gray-400">Page {meta.page} sur {meta.pages} &mdash; {meta.total.toLocaleString('fr-FR')} r&eacute;sultats</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40">Pr&eacute;c&eacute;dent</button>
            <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page >= meta.pages} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40">Suivant</button>
          </div>
        </div>
      )}

      {/* Responsive */}
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
