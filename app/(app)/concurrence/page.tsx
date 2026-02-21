'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Building2,
  MapPin,
  Trophy,
  Banknote,
  Eye,
  Calendar,
  TrendingUp,
  ExternalLink,
  Tag,
  User,
} from 'lucide-react';
import { formatCurrency, formatDate, getNatureLabel } from '@/lib/utils';

const AMOUNT_BRACKETS = [
  { label: 'Tous', min: '', max: '' },
  { label: '< 25K€', min: '', max: '25000' },
  { label: '25K – 90K€', min: '25000', max: '90000' },
  { label: '90K – 200K€', min: '90000', max: '200000' },
  { label: '> 200K€', min: '200000', max: '' },
];

export default function ConcurrencePage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, pages: 0 });
  const [stats, setStats] = useState<any>({
    totalAll: 0,
    montantCumule: 0,
    topTitulaire: null,
  });
  const [q, setQ] = useState('');
  const [titulaire, setTitulaire] = useState('');
  const [nature, setNature] = useState('');
  const [department, setDepartment] = useState('');
  const [amountBracket, setAmountBracket] = useState(0);
  const [periode, setPeriode] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    });
    if (q) params.set('q', q);
    if (titulaire) params.set('titulaire', titulaire);
    if (nature) params.set('nature', nature);
    if (department) params.set('department', department);
    const bracket = AMOUNT_BRACKETS[amountBracket];
    if (bracket.min) params.set('montantMin', bracket.min);
    if (bracket.max) params.set('montantMax', bracket.max);
    if (periode) params.set('periode', periode);

    const res = await fetch(`/api/marches-attribues?${params}`);
    const json = await res.json();
    setData(json.data || []);
    setMeta(json.meta || { total: 0, page: 1, pages: 0 });
    setStats(
      json.stats || { totalAll: 0, montantCumule: 0, topTitulaire: null }
    );
    setLoading(false);
  }, [q, titulaire, nature, department, amountBracket, periode, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function getNatureBadgeConcurrence(n: string) {
    const map: Record<string, string> = {
      TRAVAUX:
        'px-[7px] py-[2px] rounded text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200',
      FOURNITURES:
        'px-[7px] py-[2px] rounded text-[10px] font-bold uppercase tracking-wide bg-violet-50 text-violet-700 border border-violet-200',
      SERVICES:
        'px-[7px] py-[2px] rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200',
    };
    return map[n] || '';
  }

  function getMontantBadge(montant: number | null) {
    if (!montant) return { bg: '#F9FAFB', color: '#9CA3AF', border: '#E5E7EB' };
    if (montant < 25000) return { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
    if (montant < 90000) return { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
    if (montant < 200000) return { bg: '#FDF4FF', color: '#7C3AED', border: '#D8B4FE' };
    return { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' };
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Eye size={22} className="text-violet-500" />
            <h1 className="text-xl font-bold">Veille Concurrentielle</h1>
          </div>
          <p className="text-[13px] text-gray-500">
            Contrats attribués (DECP) — Découvrez qui remporte quoi, à quel prix
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="card p-4 px-6 mb-5 flex items-center justify-between" style={{ borderTop: '2px solid #7C3AED' }}>
        {[
          {
            label: 'Marchés attribués',
            value: stats.totalAll.toLocaleString('fr-FR'),
            icon: <Trophy size={16} className="text-violet-500" />,
          },
          {
            label: 'Montant cumulé',
            value: formatCurrency(stats.montantCumule),
            icon: <Banknote size={16} className="text-violet-500" />,
          },
          {
            label: 'Top titulaire',
            value: stats.topTitulaire
              ? `${stats.topTitulaire.nom.slice(0, 25)} (${stats.topTitulaire.count})`
              : '—',
            icon: <TrendingUp size={16} className="text-violet-500" />,
          },
          {
            label: 'Résultats filtrés',
            value: meta.total.toLocaleString('fr-FR'),
            icon: <Search size={16} className="text-violet-500" />,
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 flex-1 px-4 ${i < 3 ? 'border-r border-gray-100' : ''}`}
          >
            <div className="shrink-0">{s.icon}</div>
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">{s.label}</div>
              <div className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search bars */}
      <form onSubmit={handleSearch} className="flex flex-col gap-2 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input !pl-9"
              placeholder="Rechercher un marché attribué, un acheteur..."
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary !text-xs !px-3.5 !gap-[5px] ${showFilters ? '!bg-violet-50 !text-violet-600 !border-violet-600' : ''}`}
          >
            <SlidersHorizontal size={15} /> Filtres
          </button>
          <button
            type="submit"
            className="!text-xs"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: '6px', padding: '9px 20px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Rechercher
          </button>
        </div>

        {/* Attributaire search */}
        <div className="relative">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" />
          <input
            value={titulaire}
            onChange={(e) => setTitulaire(e.target.value)}
            className="input !pl-9"
            placeholder="Rechercher par entreprise attributaire (ex: Vinci, Bouygues, Eiffage...)"
            style={{ borderColor: titulaire ? '#7C3AED' : undefined }}
          />
        </div>

        {/* Amount brackets */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-semibold shrink-0">Montant :</span>
          <div className="flex gap-1">
            {AMOUNT_BRACKETS.map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setAmountBracket(i); setPage(1); }}
                style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  border: amountBracket === i ? '1px solid #7C3AED' : '1px solid #E5E7EB',
                  background: amountBracket === i ? '#7C3AED' : '#fff',
                  color: amountBracket === i ? '#fff' : '#6B7280',
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-5 mb-3" style={{ borderLeft: '3px solid #7C3AED' }}>
          <div className="flex justify-between mb-3.5">
            <span className="text-xs font-bold">Critères avancés</span>
            <button
              onClick={() => { setNature(''); setDepartment(''); setPeriode(''); }}
              className="text-[11px] text-violet-600 font-semibold bg-transparent border-none cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="label">Nature</label>
              <select value={nature} onChange={(e) => setNature(e.target.value)} className="input">
                <option value="">Toutes</option>
                <option value="TRAVAUX">Travaux</option>
                <option value="FOURNITURES">Fournitures</option>
                <option value="SERVICES">Services</option>
              </select>
            </div>
            <div>
              <label className="label">Département</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input">
                <option value="">Tous</option>
                <option value="75">75 — Paris</option>
                <option value="69">69 — Rhône</option>
                <option value="13">13 — Bouches-du-Rhône</option>
                <option value="33">33 — Gironde</option>
                <option value="59">59 — Nord</option>
                <option value="31">31 — Haute-Garonne</option>
                <option value="67">67 — Bas-Rhin</option>
                <option value="44">44 — Loire-Atlantique</option>
                <option value="34">34 — Hérault</option>
                <option value="06">06 — Alpes-Maritimes</option>
              </select>
            </div>
            <div>
              <label className="label">Période</label>
              <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="input">
                <option value="">Toutes</option>
                <option value="6m">6 derniers mois</option>
                <option value="1a">1 an</option>
                <option value="2a">2 ans</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={() => { setPage(1); load(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                borderRadius: '6px', border: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                color: '#fff', fontWeight: 600, fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit', padding: '7px 16px',
              }}
            >
              Appliquer
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : data.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          Aucun contrat attribué trouvé.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {data.map((m) => {
            const badge = getMontantBadge(m.montant);
            return (
              <div
                key={m.id}
                onClick={() => router.push(`/concurrence/${m.id}`)}
                className="card p-4 px-5 cursor-pointer hover:border-violet-300 transition-colors"
              >
                <div className="flex justify-between gap-5">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex gap-[5px] mb-1.5 items-center flex-wrap">
                      <span className={getNatureBadgeConcurrence(m.nature)}>
                        {getNatureLabel(m.nature)}
                      </span>
                      {m.procedure && (
                        <span className="px-[7px] py-[2px] rounded text-[10px] bg-gray-100 text-gray-500">
                          {m.procedure}
                        </span>
                      )}
                      {m.codeCPV && (
                        <span className="px-[7px] py-[2px] rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                          <Tag size={9} /> CPV {m.codeCPV}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-mono">
                        {m.source}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold leading-snug mb-1.5 line-clamp-2">
                      {m.objet}
                    </h3>

                    {/* Buyer */}
                    <div className="flex gap-3.5 text-xs text-gray-500 flex-wrap mb-1">
                      <span className="flex items-center gap-1">
                        <Building2 size={13} className="text-gray-400" />
                        {m.acheteurNom}
                      </span>
                      {m.departementNom && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-gray-400" />
                          {m.departementNom} ({m.departement})
                        </span>
                      )}
                      {m.labelCPV && (
                        <span className="text-gray-400">{m.labelCPV}</span>
                      )}
                    </div>

                    {/* Winner — HIGHLIGHTED */}
                    <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 bg-violet-50 rounded border border-violet-100 w-fit">
                      <Trophy size={13} className="text-violet-500 shrink-0" />
                      <span className="text-[12px] font-bold text-violet-700">
                        {m.titulaireNom}
                      </span>
                      {m.titulaireSiret && (
                        <span className="text-[10px] text-violet-400 font-mono ml-1">
                          SIRET {m.titulaireSiret}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex gap-2.5 mt-1.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Notifié le {formatDate(m.dateNotification)}
                      </span>
                      {m.dureeMois && <span>Durée {m.dureeMois} mois</span>}
                    </div>
                  </div>

                  {/* Right — Montant + CTA */}
                  <div className="text-right shrink-0 min-w-[130px] flex flex-col justify-between">
                    <div>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {formatCurrency(m.montant)}
                      </div>
                      {m.formePrix && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          Prix {m.formePrix.toLowerCase()}
                        </div>
                      )}
                    </div>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/concurrence/${m.id}`);
                      }}
                      className="text-xs text-violet-600 font-medium flex items-center gap-1 justify-end mt-2 cursor-pointer hover:text-violet-800"
                    >
                      Voir les détails <ExternalLink size={11} />
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
          <span className="text-xs text-gray-400">
            Page {meta.page} sur {meta.pages} —{' '}
            {meta.total.toLocaleString('fr-FR')} résultats
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page >= meta.pages}
              className="btn-secondary !py-1.5 !px-3 !text-xs disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
