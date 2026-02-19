'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, Clock, Building2, MapPin, ExternalLink, FileText } from 'lucide-react';
import { formatCurrency, formatDate, daysUntil, getNatureLabel, getNatureBadge } from '@/lib/utils';

export default function MarchesPage() {
  const [marches, setMarches] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, pages: 0 });
  const [q, setQ] = useState('');
  const [nature, setNature] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (q) params.set('q', q);
    if (nature) params.set('nature', nature);
    if (department) params.set('department', department);
    const res = await fetch(`/api/marches?${params}`);
    const data = await res.json();
    setMarches(data.data);
    setMeta(data.meta);
    setLoading(false);
  }, [q, nature, department, page]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setPage(1); load(); }

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-xl font-bold">Consultations en cours</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{meta.total.toLocaleString('fr-FR')} appels d'offres ouverts — Agrégation de 93 sources officielles</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Clock size={13} /> Mise à jour il y a 4 min
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} className="input !pl-9" placeholder="Mots-clés, acheteur, code CPV, intitulé…" />
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
            <span className="text-xs font-bold">Critères de recherche</span>
            <button onClick={() => { setNature(''); setDepartment(''); }} className="text-[11px] text-blue-600 font-semibold bg-transparent border-none cursor-pointer">Réinitialiser</button>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
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
              <label className="label">Département</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="input">
                <option value="">Tous</option>
                <option value="75">75 — Paris</option>
                <option value="69">69 — Rhône</option>
                <option value="13">13 — Bouches-du-Rhône</option>
                <option value="33">33 — Gironde</option>
                <option value="59">59 — Nord</option>
                <option value="31">31 — Haute-Garonne</option>
                <option value="67">67 — Bas-Rhin</option>
              </select>
            </div>
            <div>
              <label className="label">Code CPV</label>
              <input className="input" placeholder="Ex: 45000000" />
            </div>
            <div>
              <label className="label">Montant estimé</label>
              <select className="input">
                <option>Tous</option>
                <option>{'< 100 K€'}</option>
                <option>100K – 500K€</option>
                <option>500K – 2M€</option>
                <option>{'> 2 M€'}</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={() => { setPage(1); load(); }} className="btn-primary !text-xs !py-[7px] !px-4">Appliquer</button>
            <span className="text-xs text-blue-600 font-semibold cursor-pointer">Sauvegarder comme alerte →</span>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : marches.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">Aucune consultation trouvée.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {marches.map(m => {
            const dl = daysUntil(m.deadline);
            return (
              <div key={m.id} className="card p-4 px-5 cursor-pointer hover:border-gray-300 transition-colors">
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
                      <span>{m.source} · Publié le {formatDate(m.publicationDate)}{m.duration ? ` · Durée ${m.duration}` : ''}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 min-w-[120px] flex flex-col justify-between">
                    <div>
                      <div className="text-[15px] font-bold">{formatCurrency(m.value)}</div>
                      <div className={`text-[11px] mt-1 flex items-center justify-end gap-1 ${dl !== null && dl <= 7 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                        <Clock size={13} /> {dl !== null ? `${dl} jours` : '—'}
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1 justify-end mt-2 cursor-pointer">
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
          <span className="text-xs text-gray-400">Page {meta.page} sur {meta.pages} — {meta.total.toLocaleString('fr-FR')} résultats</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40">Précédent</button>
            <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page >= meta.pages} className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40">Suivant</button>
          </div>
        </div>
      )}
    </div>
  );
}
