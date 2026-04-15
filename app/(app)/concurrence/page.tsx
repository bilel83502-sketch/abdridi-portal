'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  SlidersHorizontal,
  Building2,
  Trophy,
  Eye,
  TrendingUp,
  Lock,
  Download,
  Info,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { SkeletonCards } from '@/components/Skeleton';
import { Award } from 'lucide-react';
import Link from 'next/link';
import EntrepriseSearch from '@/components/EntrepriseSearch';
import { MarcheCard, MarcheCardLocked } from './MarcheCard';
import ConcurrenceFilters from './ConcurrenceFilters';

const AMOUNT_BRACKETS = [
  { label: 'Tous', min: '', max: '' },
  { label: '< 25K€', min: '', max: '25000' },
  { label: '25K – 90K€', min: '25000', max: '90000' },
  { label: '90K – 200K€', min: '90000', max: '200000' },
  { label: '> 200K€', min: '200000', max: '' },
];

type TabMode = 'entreprise' | 'marche';

export default function ConcurrencePage() {
  const [tab, setTab] = useState<TabMode>('entreprise');
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, pages: 0 });
  const [stats, setStats] = useState<any>({
    totalAll: 0,
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
    setStats(json.stats || { totalAll: 0, topTitulaire: null });
    setLoading(false);
  }, [tab, selectedEntreprise, q, nature, department, amountBracket, periode, page]);

  async function exportCSV() {
    const params = new URLSearchParams({ limit: '1000' });
    if (q) params.set('q', q);
    if (nature) params.set('nature', nature);
    if (department) params.set('department', department);
    const bracket = AMOUNT_BRACKETS[amountBracket];
    if (bracket.min) params.set('montantMin', bracket.min);
    if (bracket.max) params.set('montantMax', bracket.max);
    if (periode) params.set('periode', periode);
    const res = await fetch(`/api/marches-attribues?${params}`);
    const json = await res.json();
    const rows = (json.data || []).filter((m: any) => !m.locked);
    const header = 'Attributaire;Acheteur;Objet;Montant;Date notification;Département;Source';
    const lines = rows.map((m: any) =>
      [m.titulaireNom, m.acheteurNom, m.objet, m.montant || '', m.dateNotification?.split('T')[0] || '', m.departement || '', m.source]
        .map(v => `"${(String(v || '')).replace(/"/g, '""')}"`)
        .join(';')
    );
    const csv = '\uFEFF' + header + '\n' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `concurrence-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

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

      {/* Explanation block */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 20px', marginBottom: 16,
        background: '#1E293B', borderRadius: 8,
      }}>
        <Info size={18} style={{ color: '#60A5FA', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
          Analysez les marches deja attribues dans votre secteur. Identifiez vos concurrents, les montants pratiques et les acheteurs publics actifs. Utilisez ces donnees pour mieux positionner vos futures offres.
        </p>
      </div>

      {/* Stats bar */}
      <div className="card p-4 px-6 mb-5 flex items-center justify-between" style={{ borderTop: '2px solid #3B82F6' }}>
        {[
          { label: 'Marchés attribués', value: stats.totalAll.toLocaleString('fr-FR'), icon: <Trophy size={16} style={{ color: '#3B82F6' }} /> },
          { label: 'Top titulaire', value: stats.topTitulaire ? `${stats.topTitulaire.nom.slice(0, 25)} (${stats.topTitulaire.count})` : '—', icon: <TrendingUp size={16} style={{ color: '#3B82F6' }} /> },
          { label: 'Résultats filtrés', value: meta.total.toLocaleString('fr-FR'), icon: <Search size={16} style={{ color: '#3B82F6' }} /> },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 flex-1 px-4 ${i < 2 ? 'border-r border-gray-100' : ''}`}>
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
            <button type="button" onClick={exportCSV} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', height: 44, borderRadius: 8,
              border: '1px solid #E2E8F0', background: '#fff',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              color: '#64748B', whiteSpace: 'nowrap',
            }}>
              <Download size={15} /> CSV
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
        <ConcurrenceFilters
          nature={nature}
          setNature={setNature}
          department={department}
          setDepartment={setDepartment}
          periode={periode}
          setPeriode={setPeriode}
          onApply={() => { setPage(1); load(); }}
        />
      )}

      {/* Selected entreprise info */}
      {tab === 'entreprise' && selectedEntreprise && (
        <div className="card p-4 mb-3" style={{ borderLeft: '3px solid #3B82F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{selectedEntreprise.raisonSociale}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
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
        <SkeletonCards count={4} />
      ) : data.length === 0 ? (
        <EmptyState icon={Award} title={tab === 'entreprise' && !selectedEntreprise ? 'Recherchez une entreprise' : 'Aucun contrat trouvé'} description={tab === 'entreprise' && !selectedEntreprise ? 'Saisissez un nom d\'entreprise pour voir ses marchés attribués.' : 'Ajustez vos filtres pour voir les marchés attribués dans votre secteur.'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.map((m, idx) => {
            const isLocked = !meta.isPaid && idx >= 3;
            return isLocked
              ? <MarcheCardLocked key={m.id} m={m} />
              : <MarcheCard key={m.id} m={m} />;
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
