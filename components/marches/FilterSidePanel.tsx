'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Lock, RotateCcw } from 'lucide-react';
import DepartmentSelect from '@/components/DepartmentSelect';
import TagInput from '@/components/TagInput';

/* ─── Filter section in side panel ─── */
function FilterSection({ label, children, locked }: { label: string; children: React.ReactNode; locked?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (locked) {
    return (
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#94A3B8',
          marginBottom: 8, letterSpacing: '0.01em',
        }}>
          {label}
          <Lock size={12} />
        </label>
        <div
          onClick={() => setShowTooltip(true)}
          style={{ position: 'relative', opacity: 0.4, pointerEvents: 'none', filter: 'grayscale(1)', userSelect: 'none' }}
        >
          {children}
        </div>
        {/* Clickable overlay */}
        <div
          onClick={() => setShowTooltip(true)}
          style={{ position: 'absolute', top: 24, left: 0, right: 0, bottom: 0, cursor: 'pointer', pointerEvents: 'auto' }}
        />
        {/* Upgrade tooltip */}
        {showTooltip && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
            marginTop: 4, padding: '12px 16px', borderRadius: 8,
            background: '#0F172A', color: '#fff', fontSize: 12, lineHeight: 1.5,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              Debloquez tous les filtres avec l&apos;offre Veille &amp; Accompagnement
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a href="/abonnement" style={{
                padding: '6px 14px', borderRadius: 5, fontSize: 12, fontWeight: 600,
                background: '#3B82F6', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Voir les offres
              </a>
              <button onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: '#94A3B8', fontFamily: 'inherit',
              }}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

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
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
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

/* ─── Props ─── */
interface FilterSidePanelProps {
  open: boolean;
  onClose: () => void;
  isPaid: boolean;
  // Filter values
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  departments: string[];
  onDepartmentsChange: (deps: string[]) => void;
  natures: string[];
  onNaturesChange: (natures: string[]) => void;
  acheteur: string;
  onAcheteurChange: (v: string) => void;
  cpvCode: string;
  onCpvCodeChange: (v: string) => void;
  datePublishedFrom: string;
  onDatePublishedFromChange: (v: string) => void;
  datePublishedTo: string;
  onDatePublishedToChange: (v: string) => void;
  deadlineFrom: string;
  onDeadlineFromChange: (v: string) => void;
  deadlineTo: string;
  onDeadlineToChange: (v: string) => void;
  // Actions
  onReset: () => void;
  onApply: () => void;
}

export default function FilterSidePanel(props: FilterSidePanelProps) {
  const {
    open, onClose, isPaid,
    tags, onTagsChange, departments, onDepartmentsChange,
    natures, onNaturesChange, acheteur, onAcheteurChange,
    cpvCode, onCpvCodeChange,
    datePublishedFrom, onDatePublishedFromChange, datePublishedTo, onDatePublishedToChange,
    deadlineFrom, onDeadlineFromChange, deadlineTo, onDeadlineToChange,
    onReset, onApply,
  } = props;

  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Lock scroll when panel open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('filters-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('filters-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('filters-open');
    };
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)' }}
        onClick={onClose}
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
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8',
            padding: 4, borderRadius: 4, display: 'flex',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', paddingBottom: 120 }}>
          {/* Mots-cles */}
          <FilterSection label="Mots-cles">
            <TagInput
              tags={tags}
              onChange={onTagsChange}
              placeholder="Ex: transport, nettoyage..."
            />
          </FilterSection>

          {/* Departement */}
          <FilterSection label="Localisation / Departement" locked={!isPaid}>
            <DepartmentSelect multi value={departments} onChange={onDepartmentsChange} />
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
                    type="checkbox"
                    checked={natures.includes(n.v)}
                    onChange={() => onNaturesChange(natures.includes(n.v) ? natures.filter(x => x !== n.v) : [...natures, n.v])}
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
              onChange={e => onAcheteurChange(e.target.value)}
              placeholder="Nom, code postal ou ville..."
              className="input"
              style={{ height: 38, fontSize: 13 }}
            />
          </FilterSection>

          {/* Code CPV */}
          <FilterSection label="Code CPV" locked={!isPaid}>
            <input
              value={cpvCode}
              onChange={e => onCpvCodeChange(e.target.value)}
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
                <input type="date" value={datePublishedFrom} onChange={e => onDatePublishedFromChange(e.target.value)}
                  className="input" style={{ height: 36, fontSize: 12 }} />
              </div>
              <span style={{ fontSize: 12, color: '#CBD5E1', marginTop: 16 }}>&rarr;</span>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Au</label>
                <input type="date" value={datePublishedTo} onChange={e => onDatePublishedToChange(e.target.value)}
                  className="input" style={{ height: 36, fontSize: 12 }} />
              </div>
            </div>
          </FilterSection>

          {/* Date de cloture */}
          <FilterSection label="Date limite de reponse">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Du</label>
                <input type="date" value={deadlineFrom} onChange={e => onDeadlineFromChange(e.target.value)}
                  className="input" style={{ height: 36, fontSize: 12 }} />
              </div>
              <span style={{ fontSize: 12, color: '#CBD5E1', marginTop: 16 }}>&rarr;</span>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Au</label>
                <input type="date" value={deadlineTo} onChange={e => onDeadlineToChange(e.target.value)}
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
          <button onClick={onReset} style={{
            flex: 1, padding: '10px 0', borderRadius: 6,
            border: '1px solid #E2E8F0', background: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            color: '#64748B',
          }}>
            Reinitialiser
          </button>
          <button onClick={onApply} style={{
            flex: 1, padding: '10px 0', borderRadius: 6,
            border: 'none', background: '#3B82F6',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            color: '#fff',
          }}>
            Rechercher
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
