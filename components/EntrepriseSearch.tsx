'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Building2 } from 'lucide-react';

interface EntrepriseResult {
  siren: string;
  raisonSociale: string;
  activite?: string | null;
  effectifs?: string | null;
  formeJuridique?: string | null;
  adresse?: string | null;
}

export default function EntrepriseSearch({ onSelect }: { onSelect: (entreprise: EntrepriseResult) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EntrepriseResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setIsOpen(false); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/entreprises/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une entreprise (nom, SIRET, SIREN)..."
          style={{
            width: '100%', padding: '12px 16px 12px 42px',
            border: '1px solid #E2E8F0', fontSize: 14,
            fontFamily: 'inherit', outline: 'none', background: '#fff',
            boxSizing: 'border-box', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#3B82F6')}
          onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94A3B8' }}>...</div>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #E2E8F0',
          maxHeight: 300, overflowY: 'auto', zIndex: 50,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          {results.map((ent) => (
            <div
              key={ent.siren}
              onClick={() => { onSelect(ent); setQuery(ent.raisonSociale); setIsOpen(false); }}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <strong style={{ fontSize: 14, color: '#0F172A' }}>{ent.raisonSociale}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, marginLeft: 22 }}>
                  SIREN {ent.siren}
                  {ent.activite && <span> · {ent.activite}</span>}
                </div>
              </div>
              {ent.effectifs && (
                <span style={{ fontSize: 12, color: '#64748B', flexShrink: 0, marginLeft: 12 }}>{ent.effectifs}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {isOpen && results.length === 0 && query.length >= 2 && !loading && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #E2E8F0',
          padding: 16, color: '#94A3B8', fontSize: 13,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          Aucune entreprise trouvée pour &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
