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
  Lock,
} from 'lucide-react';
import { formatCurrency, formatDate, getNatureLabel } from '@/lib/utils';
import Link from 'next/link';
import DepartmentSelect from '@/components/DepartmentSelect';
import EntrepriseSearch from '@/components/EntrepriseSearch';

const AMOUNT_BRACKETS = [
  { label: 'Tous', min: '', max: '' },
  { label: '< 25K€', min: '', max: '25000' },
  { label: '25K – 90K€', min: '25000', max: '90000' },
  { label: '90K – 200K€', min: '90000', max: '200000' },
  { label: '> 200K€', min: '200000', max: '' },
];

type TabMode = 'entreprise' | 'marche';

export default function ConcurrencePage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabMode>('entreprise');
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, pages: 0 });
  const [stats, setStats] = useState<any>({
    totalAll: 0,
    montantCumule: 0,
    topTitulaire: null,
  });

  // Entreprise tab state
  const [selectedEntreprise, setSelectedEntreprise] = useState<any>(null);

  // Marche tab state
  const [q, setQ] = useState('');

  // Shared filters
  const [nature, setNature] = useState('');
  const [department, setDepartment] = useState('');
  const [amountBracket, setAmountBracket] = useState(0);
  const [periode, setPeriode] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });

    if (tab === 'entreprise' && selectedEntreprise) {
      params.set('titulaire', selectedEntreprise.raisonSociale);
    } else if (tab === 'marche' && q) {
      params.set('q', q);
    }

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
    setStats(json.stats || { totalAll: 0, montantCumule: 0, topTitulaire: null });
    setLoading(false);
  }, [tab, selectedEntreprise, q, nature, department, amountBracket, periode, page]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function handleEntrepriseSelect(ent: any) {
    setSelectedEntreprise(ent);
    setPage(1);
  }

  function getMontantBadge(montant: number | null) {
    if (!montant) return { bg: '#F9FAFB', color: '#9CA3AF', border: '#E5E7EB' };
    if (montant < 25000) return { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
    if (montant < 90000) return { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
    if (montant < 200000) return { bg: '#EFF6FF', color: '#3B82F6', border: '#93C5FD' };
    return { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' };
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Eye size={22} style={{ color: '#3B82F6' }} />
            <h1 className="text-xl font-bold">Veille Concurrentielle</h1>
          </div>
          <p className="text-[13px] text-gray-500">
            Contrats attribués (DECP) — Découvrez qui remporte quoi, à quel prix
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="card p-4 px-6 mb-5 flex items-center justify-between" style={{ borderTop: '2px solid #3B82F6' }}>
        {[
          { label: 'Marchés attribués', value: stats.totalAll.toLocaleString('fr-FR'), icon: <Trophy size={16} style={{ color: '#3B82F6' }} /> },
          { label: 'Montant cumulé', value: formatCurrency(stats.montantCumule), icon: <Banknote size={16} style={{ color: '#3B82F6' }} /> },
          { label: 'Top titulaire', value: stats.topTitulaire ? `${stats.topTitulaire.nom.slice(0, 25)} (${stats.topTitulaire.count})` : '—', icon: <TrendingUp size={16} style={{ color: '#3B82F6' }} /> },
          { label: 'Résultats filtrés', value: meta.total.toLocaleString('fr-FR'), icon: <Search size={16} style={{ color: '#3B82F6' }} /> },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 flex-1 px-4 ${i < 3 ? 'border-r border-gray-100' : ''}`}>
            <div className="shrink-0">{s.icon}</div>
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">{s.label}</div>
              <div className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #E2E8F0' }}>
        {([
          { key: 'entreprise' as TabMode, label: 'Par entreprise', icon: <Building2 size={14} /> },
          { key: 'marche' as TabMode, label: 'Par marché / émetteur', icon: <Search size={14} /> },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#3B82F6' : '#64748B',
              background: 'transparent', border: 'none',
              borderBottom: tab === t.key ? '2px solid #3B82F6' : '2px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Search area */}
      <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
        {tab === 'entreprise' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <EntrepriseSearch onSelect={handleEntrepriseSelect} />
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`btn-secondary !text-xs !px-3.5 !gap-[5px]`} style={{ height: 44 }}>
              <SlidersHorizontal size={15} /> Filtres
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un marché attribué, un acheteur..."
                style={{
                  width: '100%', height: 44, paddingLeft: 42, paddingRight: 14,
                  border: '1px solid #E2E8F0', fontSize: 14,
                  fontFamily: 'inherit', outline: 'none', background: '#fff',
                  boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3B82F6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
            </div>
            <button
              type="submit"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 20px', height: 44, border: 'none',
                background: '#3B82F6', color: '#fff', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Rechercher
            </button>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`btn-secondary !text-xs !px-3.5 !gap-[5px]`} style={{ height: 44 }}>
              <SlidersHorizontal size={15} /> Filtres
            </button>
          </div>
        )}

        {/* Amount brackets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, flexShrink: 0 }}>Montant :</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {AMOUNT_BRACKETS.map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setAmountBracket(i); setPage(1); }}
                style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  border: amountBracket === i ? '1px solid #3B82F6' : '1px solid #E5E7EB',
                  background: amountBracket === i ? '#3B82F6' : '#fff',
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
        <div className="card p-5 mb-3" style={{ borderLeft: '3px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Critères avancés</span>
            <button
              onClick={() => { setNature(''); setDepartment(''); setPeriode(''); }}
              style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Réinitialiser
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
              <DepartmentSelect value={department} onChange={setDepartment} />
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
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => { setPage(1); load(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                border: 'none', background: '#3B82F6',
                color: '#fff', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit', padding: '7px 16px',
              }}
            >
              Appliquer
            </button>
          </div>
        </div>
      )}

      {/* Selected entreprise info */}
      {tab === 'entreprise' && selectedEntreprise && (
        <div className="card p-4 mb-3" style={{ borderLeft: '3px solid #3B82F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{selectedEntreprise.raisonSociale}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              SIREN {selectedEntreprise.siren}
              {selectedEntreprise.activite && <span> · {selectedEntreprise.activite}</span>}
              {selectedEntreprise.effectifs && <span> · {selectedEntreprise.effectifs}</span>}
            </div>
          </div>
          <button
            onClick={() => setSelectedEntreprise(null)}
            style={{ fontSize: 12, color: '#3B82F6', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Effacer
          </button>
        </div>
      )}

      {/* Free user banner */}
      {!meta.isPaid && !loading && data.length > 0 && (
        <div style={{
          marginBottom: 12, padding: '10px 16px',
          background: '#DBEAFE', border: '1px solid #93C5FD',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1E40AF' }}>
            <Lock size={14} />
            <span>Version gratuite — <strong>3 résultats visibles</strong> sur {meta.total.toLocaleString('fr-FR')}</span>
          </div>
          <Link href="/abonnement" style={{ padding: '5px 14px', fontSize: 12, fontWeight: 600, background: '#3B82F6', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Débloquer — 25,90€/mois
          </Link>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '64px 0', fontSize: 14 }}>Chargement...</div>
      ) : data.length === 0 ? (
        <div className="card" style={{ padding: '64px 40px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
          {tab === 'entreprise' && !selectedEntreprise
            ? 'Recherchez une entreprise pour voir ses marchés attribués.'
            : 'Aucun contrat attribué trouvé.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((m, idx) => {
            const badge = getMontantBadge(m.montant);
            const isLocked = !meta.isPaid && idx >= 3;

            if (isLocked) {
              return (
                <div key={m.id} className="card" style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{m.objet}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{m.acheteurNom}</div>
                  </div>
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
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

            return (
              <div
                key={m.id}
                onClick={() => router.push(`/concurrence/${m.id}`)}
                className="card"
                style={{ padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#93C5FD')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <NatureBadge nature={m.nature} />
                      {m.procedure && <span style={{ padding: '2px 7px', fontSize: 10, background: '#F3F4F6', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>{m.procedure}</span>}
                      {m.codeCPV && <span style={{ padding: '2px 7px', fontSize: 10, background: '#DBEAFE', color: '#2563EB', fontWeight: 600 }}>CPV {m.codeCPV}</span>}
                      <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>{m.source}</span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, margin: '0 0 6px' }}>{m.objet}</h3>

                    {/* Meta */}
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#64748B', flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Building2 size={12} style={{ color: '#94A3B8' }} /> {m.acheteurNom}
                      </span>
                      {m.departementNom && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} style={{ color: '#94A3B8' }} /> {m.departementNom} ({m.departement})
                        </span>
                      )}
                    </div>

                    {/* Winner */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', background: '#DBEAFE', marginBottom: 4,
                    }}>
                      <Trophy size={12} style={{ color: '#2563EB' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>{m.titulaireNom}</span>
                      {m.titulaireSiret && <span style={{ fontSize: 10, color: '#3B82F6', fontFamily: 'monospace' }}>SIRET {m.titulaireSiret}</span>}
                    </div>

                    {/* Enterprise info */}
                    {m.entreprise && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {m.entreprise.formeJuridique && <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 600, background: '#ECFDF5', color: '#065F46' }}>{m.entreprise.formeJuridique}</span>}
                        {m.entreprise.effectifs && <span style={{ padding: '1px 6px', fontSize: 9, fontWeight: 600, background: '#F0F9FF', color: '#0369A1' }}>{m.entreprise.effectifs}</span>}
                        {m.entreprise.activite && <span style={{ padding: '1px 6px', fontSize: 9, color: '#6B7280', background: '#F9FAFB', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.entreprise.activite}</span>}
                      </div>
                    )}

                    {/* Date */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: '#94A3B8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> Notifié le {formatDate(m.dateNotification)}</span>
                      {m.dureeMois && <span>Durée {m.dureeMois} mois</span>}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 130, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{
                        display: 'inline-block', padding: '4px 10px',
                        background: badge.bg, border: `1px solid ${badge.border}`,
                        color: badge.color, fontSize: 15, fontWeight: 700,
                      }}>
                        {formatCurrency(m.montant)}
                      </div>
                      {m.formePrix && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>Prix {m.formePrix.toLowerCase()}</div>}
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); router.push(`/concurrence/${m.id}`); }}
                      style={{ fontSize: 12, color: '#3B82F6', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 8, cursor: 'pointer' }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>
            Page {meta.page} sur {meta.pages} — {meta.total.toLocaleString('fr-FR')} résultats
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '7px 16px', border: '1px solid #E2E8F0', background: '#fff',
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
                padding: '7px 16px', border: 'none', background: '#3B82F6',
                fontSize: 13, fontWeight: 600, cursor: page >= meta.pages ? 'not-allowed' : 'pointer',
                opacity: page >= meta.pages ? 0.4 : 1, fontFamily: 'inherit', color: '#fff',
              }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NatureBadge({ nature }: { nature: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    TRAVAUX: { bg: '#FFFBEB', text: '#B45309' },
    FOURNITURES: { bg: '#DBEAFE', text: '#2563EB' },
    SERVICES: { bg: '#DBEAFE', text: '#1E40AF' },
  };
  const style = map[nature] || { bg: '#F3F4F6', text: '#6B7280' };
  return (
    <span style={{
      padding: '2px 7px', fontSize: 10, fontWeight: 700,
      background: style.bg, color: style.text, textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {getNatureLabel(nature)}
    </span>
  );
}
