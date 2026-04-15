'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Lock, RotateCcw, Star, Download } from 'lucide-react';
import { getNatureLabel } from '@/lib/utils';
import Link from 'next/link';
import TagInput from '@/components/TagInput';
import EmptyState from '@/components/EmptyState';
import { SkeletonCards } from '@/components/Skeleton';
import FilterSidePanel, { FilterChip } from '@/components/marches/FilterSidePanel';
import MarcheCard from '@/components/marches/MarcheCard';

export default function MarchesPage() {
  const router = useRouter();
  const [marches, setMarches] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, pages: 0, isPaid: true, freeLimit: 3 });
  const [tags, setTags] = useState<string[]>([]);
  const [natures, setNatures] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
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

  // Favoris
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);
  useEffect(() => {
    fetch('/api/favoris').then(r => r.ok ? r.json() : { ids: [] }).then(d => setFavIds(new Set(d.ids)));
  }, []);

  useEffect(() => { document.title = 'Consultations | AB DRIDI'; }, []);

  const toggleFav = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch('/api/favoris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marcheId: id }) });
    if (res.ok) {
      const { favorited } = await res.json();
      setFavIds(prev => { const s = new Set(prev); favorited ? s.add(id) : s.delete(id); return s; });
    }
  };

  const hasFilters = natures.length > 0 || departments.length > 0 || acheteur || cpvCode || datePublishedFrom || datePublishedTo || deadlineFrom || deadlineTo;
  const filterCount = [natures.length > 0, departments.length > 0, !!acheteur, !!cpvCode, !!(datePublishedFrom || datePublishedTo), !!(deadlineFrom || deadlineTo)].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (tags.length > 0) params.set('q', tags.join(','));
    if (natures.length > 0) params.set('nature', natures.join(','));
    if (departments.length > 0) params.set('department', departments.join(','));
    if (acheteur) params.set('buyer', acheteur);
    if (cpvCode) params.set('cpvCode', cpvCode);
    if (datePublishedFrom) params.set('datePublishedFrom', datePublishedFrom);
    if (datePublishedTo) params.set('datePublishedTo', datePublishedTo);
    if (deadlineFrom) params.set('deadlineFrom', deadlineFrom);
    if (deadlineTo) params.set('deadlineTo', deadlineTo);
    if (showFavOnly) params.set('favOnly', '1');
    const res = await fetch(`/api/marches?${params}`);
    const data = await res.json();
    setMarches(data.data);
    setMeta(data.meta);
    setLoading(false);
  }, [tags, natures, departments, acheteur, cpvCode, page, datePublishedFrom, datePublishedTo, deadlineFrom, deadlineTo, showFavOnly]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setPage(1); load(); }

  function resetAllFilters() {
    setTags([]); setNatures([]); setDepartments([]); setAcheteur(''); setCpvCode('');
    setDatePublishedFrom(''); setDatePublishedTo('');
    setDeadlineFrom(''); setDeadlineTo('');
  }

  function applyFilters() {
    setPage(1);
    setFiltersOpen(false);
    load();
  }

  async function exportCSV() {
    const params = new URLSearchParams({ limit: '1000' });
    if (tags.length > 0) params.set('q', tags.join(','));
    if (natures.length > 0) params.set('nature', natures.join(','));
    if (departments.length > 0) params.set('department', departments.join(','));
    if (acheteur) params.set('buyer', acheteur);
    if (cpvCode) params.set('cpvCode', cpvCode);
    if (datePublishedFrom) params.set('datePublishedFrom', datePublishedFrom);
    if (datePublishedTo) params.set('datePublishedTo', datePublishedTo);
    if (deadlineFrom) params.set('deadlineFrom', deadlineFrom);
    if (deadlineTo) params.set('deadlineTo', deadlineTo);
    const res = await fetch(`/api/marches?${params}`);
    const json = await res.json();
    const rows = (json.data || []).filter((m: any) => !m.locked);
    const header = 'Titre;Acheteur;Département;Nature;Procédure;Date publication;Date limite;Source';
    const lines = rows.map((m: any) =>
      [m.title, m.buyer, m.department, m.nature, m.procedureType || '', m.publicationDate?.split('T')[0] || '', m.deadline?.split('T')[0] || '', m.source]
        .map(v => `"${(v || '').replace(/"/g, '""')}"`)
        .join(';')
    );
    const csv = '\uFEFF' + header + '\n' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `consultations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const isPaid = meta.isPaid;
  const freeLimit = meta.freeLimit || 3;

  return (
    <div>
      {/* --- Page header --- */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
          Consultations en cours
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          <strong style={{ color: '#3B82F6' }}>{meta.total.toLocaleString('fr-FR')}</strong> appels d&apos;offres ouverts
        </p>
      </div>

      {/* --- Free user banner --- */}
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

      {/* --- Search bar + Filter button --- */}
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
          onClick={exportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 14px', height: 44, borderRadius: 8,
            border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            color: '#64748B', whiteSpace: 'nowrap',
          }}
        >
          <Download size={15} /> CSV
        </button>
        <button
          type="button"
          onClick={() => { setShowFavOnly(!showFavOnly); setPage(1); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 14px', height: 44, borderRadius: 8,
            border: showFavOnly ? '2px solid #F59E0B' : '1px solid #E2E8F0',
            background: showFavOnly ? '#FFFBEB' : '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            color: showFavOnly ? '#92400E' : '#64748B', whiteSpace: 'nowrap',
          }}
        >
          <Star size={15} fill={showFavOnly ? '#F59E0B' : 'none'} color={showFavOnly ? '#F59E0B' : '#64748B'} /> Favoris
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

      {/* --- Active filters summary --- */}
      {hasFilters && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: '#94A3B8', marginRight: 4 }}>Filtres :</span>
          {natures.map(n => <FilterChip key={n} label={getNatureLabel(n)} onRemove={() => { setNatures(prev => prev.filter(x => x !== n)); setPage(1); }} />)}
          {departments.map(d => <FilterChip key={d} label={`Dept. ${d}`} onRemove={() => { setDepartments(prev => prev.filter(x => x !== d)); setPage(1); }} />)}
          {acheteur && <FilterChip label={`Acheteur: ${acheteur}`} onRemove={() => { setAcheteur(''); setPage(1); }} />}
          {cpvCode && <FilterChip label={`CPV: ${cpvCode}`} onRemove={() => { setCpvCode(''); setPage(1); }} />}
          {(datePublishedFrom || datePublishedTo) && <FilterChip label="Date publication" onRemove={() => { setDatePublishedFrom(''); setDatePublishedTo(''); setPage(1); }} />}
          {(deadlineFrom || deadlineTo) && <FilterChip label="Date cl&ocirc;ture" onRemove={() => { setDeadlineFrom(''); setDeadlineTo(''); setPage(1); }} />}
          <button onClick={() => { resetAllFilters(); setPage(1); }} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6,
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#3B82F6', fontWeight: 600, fontFamily: 'inherit',
          }}>
            <RotateCcw size={11} /> Tout effacer
          </button>
        </div>
      )}

      {/* --- Results --- */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : marches.length === 0 ? (
        <EmptyState icon={Search} title="Aucun marché trouvé" description="Essayez d'élargir votre recherche ou de modifier vos filtres pour trouver des consultations." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {marches.map((m) => (
            <MarcheCard
              key={m.id}
              marche={m}
              tags={tags}
              isFavorite={favIds.has(m.id)}
              onToggleFav={toggleFav}
            />
          ))}
        </div>
      )}

      {/* --- Pagination --- */}
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

      {/* --- Filter Side Panel --- */}
      <FilterSidePanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        isPaid={isPaid}
        tags={tags}
        onTagsChange={setTags}
        departments={departments}
        onDepartmentsChange={setDepartments}
        natures={natures}
        onNaturesChange={setNatures}
        acheteur={acheteur}
        onAcheteurChange={setAcheteur}
        cpvCode={cpvCode}
        onCpvCodeChange={setCpvCode}
        datePublishedFrom={datePublishedFrom}
        onDatePublishedFromChange={setDatePublishedFrom}
        datePublishedTo={datePublishedTo}
        onDatePublishedToChange={setDatePublishedTo}
        deadlineFrom={deadlineFrom}
        onDeadlineFromChange={setDeadlineFrom}
        deadlineTo={deadlineTo}
        onDeadlineToChange={setDeadlineTo}
        onReset={resetAllFilters}
        onApply={applyFilters}
      />
    </div>
  );
}
