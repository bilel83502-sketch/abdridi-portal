'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export const DEPARTMENTS = [
  { code: '01', name: 'Ain' }, { code: '02', name: 'Aisne' }, { code: '03', name: 'Allier' },
  { code: '04', name: 'Alpes-de-Haute-Provence' }, { code: '05', name: 'Hautes-Alpes' },
  { code: '06', name: 'Alpes-Maritimes' }, { code: '07', name: 'Ardèche' }, { code: '08', name: 'Ardennes' },
  { code: '09', name: 'Ariège' }, { code: '10', name: 'Aube' }, { code: '11', name: 'Aude' },
  { code: '12', name: 'Aveyron' }, { code: '13', name: 'Bouches-du-Rhône' }, { code: '14', name: 'Calvados' },
  { code: '15', name: 'Cantal' }, { code: '16', name: 'Charente' }, { code: '17', name: 'Charente-Maritime' },
  { code: '18', name: 'Cher' }, { code: '19', name: 'Corrèze' }, { code: '2A', name: 'Corse-du-Sud' },
  { code: '2B', name: 'Haute-Corse' }, { code: '21', name: 'Côte-d\'Or' }, { code: '22', name: 'Côtes-d\'Armor' },
  { code: '23', name: 'Creuse' }, { code: '24', name: 'Dordogne' }, { code: '25', name: 'Doubs' },
  { code: '26', name: 'Drôme' }, { code: '27', name: 'Eure' }, { code: '28', name: 'Eure-et-Loir' },
  { code: '29', name: 'Finistère' }, { code: '30', name: 'Gard' }, { code: '31', name: 'Haute-Garonne' },
  { code: '32', name: 'Gers' }, { code: '33', name: 'Gironde' }, { code: '34', name: 'Hérault' },
  { code: '35', name: 'Ille-et-Vilaine' }, { code: '36', name: 'Indre' }, { code: '37', name: 'Indre-et-Loire' },
  { code: '38', name: 'Isère' }, { code: '39', name: 'Jura' }, { code: '40', name: 'Landes' },
  { code: '41', name: 'Loir-et-Cher' }, { code: '42', name: 'Loire' }, { code: '43', name: 'Haute-Loire' },
  { code: '44', name: 'Loire-Atlantique' }, { code: '45', name: 'Loiret' }, { code: '46', name: 'Lot' },
  { code: '47', name: 'Lot-et-Garonne' }, { code: '48', name: 'Lozère' }, { code: '49', name: 'Maine-et-Loire' },
  { code: '50', name: 'Manche' }, { code: '51', name: 'Marne' }, { code: '52', name: 'Haute-Marne' },
  { code: '53', name: 'Mayenne' }, { code: '54', name: 'Meurthe-et-Moselle' }, { code: '55', name: 'Meuse' },
  { code: '56', name: 'Morbihan' }, { code: '57', name: 'Moselle' }, { code: '58', name: 'Nièvre' },
  { code: '59', name: 'Nord' }, { code: '60', name: 'Oise' }, { code: '61', name: 'Orne' },
  { code: '62', name: 'Pas-de-Calais' }, { code: '63', name: 'Puy-de-Dôme' },
  { code: '64', name: 'Pyrénées-Atlantiques' }, { code: '65', name: 'Hautes-Pyrénées' },
  { code: '66', name: 'Pyrénées-Orientales' }, { code: '67', name: 'Bas-Rhin' }, { code: '68', name: 'Haut-Rhin' },
  { code: '69', name: 'Rhône' }, { code: '70', name: 'Haute-Saône' }, { code: '71', name: 'Saône-et-Loire' },
  { code: '72', name: 'Sarthe' }, { code: '73', name: 'Savoie' }, { code: '74', name: 'Haute-Savoie' },
  { code: '75', name: 'Paris' }, { code: '76', name: 'Seine-Maritime' }, { code: '77', name: 'Seine-et-Marne' },
  { code: '78', name: 'Yvelines' }, { code: '79', name: 'Deux-Sèvres' }, { code: '80', name: 'Somme' },
  { code: '81', name: 'Tarn' }, { code: '82', name: 'Tarn-et-Garonne' }, { code: '83', name: 'Var' },
  { code: '84', name: 'Vaucluse' }, { code: '85', name: 'Vendée' }, { code: '86', name: 'Vienne' },
  { code: '87', name: 'Haute-Vienne' }, { code: '88', name: 'Vosges' }, { code: '89', name: 'Yonne' },
  { code: '90', name: 'Territoire de Belfort' }, { code: '91', name: 'Essonne' },
  { code: '92', name: 'Hauts-de-Seine' }, { code: '93', name: 'Seine-Saint-Denis' },
  { code: '94', name: 'Val-de-Marne' }, { code: '95', name: 'Val-d\'Oise' },
  { code: '971', name: 'Guadeloupe' }, { code: '972', name: 'Martinique' }, { code: '973', name: 'Guyane' },
  { code: '974', name: 'La Réunion' }, { code: '976', name: 'Mayotte' },
  // Suisse (cantons)
  { code: 'CH', name: 'Suisse (national)' },
  { code: 'CH-GE', name: 'Genève (Suisse)' }, { code: 'CH-VD', name: 'Vaud (Suisse)' },
  { code: 'CH-VS', name: 'Valais (Suisse)' }, { code: 'CH-NE', name: 'Neuchâtel (Suisse)' },
  { code: 'CH-JU', name: 'Jura (Suisse)' }, { code: 'CH-FR', name: 'Fribourg (Suisse)' },
  { code: 'CH-BE', name: 'Berne (Suisse)' }, { code: 'CH-BS', name: 'Bâle-Ville (Suisse)' },
  { code: 'CH-BL', name: 'Bâle-Campagne (Suisse)' }, { code: 'CH-SO', name: 'Soleure (Suisse)' },
  { code: 'CH-AG', name: 'Argovie (Suisse)' }, { code: 'CH-ZH', name: 'Zurich (Suisse)' },
  { code: 'CH-LU', name: 'Lucerne (Suisse)' }, { code: 'CH-ZG', name: 'Zoug (Suisse)' },
  { code: 'CH-SZ', name: 'Schwyz (Suisse)' }, { code: 'CH-UR', name: 'Uri (Suisse)' },
  { code: 'CH-OW', name: 'Obwald (Suisse)' }, { code: 'CH-NW', name: 'Nidwald (Suisse)' },
  { code: 'CH-GL', name: 'Glaris (Suisse)' }, { code: 'CH-SH', name: 'Schaffhouse (Suisse)' },
  { code: 'CH-SG', name: 'Saint-Gall (Suisse)' }, { code: 'CH-AR', name: 'Appenzell Rh.-Ext. (Suisse)' },
  { code: 'CH-AI', name: 'Appenzell Rh.-Int. (Suisse)' }, { code: 'CH-TG', name: 'Thurgovie (Suisse)' },
  { code: 'CH-GR', name: 'Grisons (Suisse)' }, { code: 'CH-TI', name: 'Tessin (Suisse)' },
];

type MultiProps = { multi: true; value: string[]; onChange: (v: string[]) => void };
type SingleProps = { multi?: false; value: string; onChange: (v: string) => void };
type Props = MultiProps | SingleProps;

export default function DepartmentSelect(props: Props) {
  const isMulti = props.multi === true;
  const selectedArr: string[] = isMulti ? props.value : (props.value ? [props.value] : []);
  const selectedSet = new Set(selectedArr);

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? DEPARTMENTS.filter(d =>
        d.code.toLowerCase().includes(search.toLowerCase()) ||
        d.name.toLowerCase().includes(search.toLowerCase())
      )
    : DEPARTMENTS;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setHighlightIdx(-1); }, [search, open]);

  const handleSelect = useCallback((code: string) => {
    if (isMulti) {
      const cb = props.onChange as (v: string[]) => void;
      if (selectedSet.has(code)) cb(selectedArr.filter(c => c !== code));
      else cb([...selectedArr, code]);
    } else {
      const cb = props.onChange as (v: string) => void;
      cb(props.value === code ? '' : code);
      setOpen(false);
      setSearch('');
    }
  }, [isMulti, props, selectedArr, selectedSet]);

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    setSearch('');
    if (isMulti) (props.onChange as (v: string[]) => void)([]);
    else (props.onChange as (v: string) => void)('');
  }

  function removeChip(code: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (isMulti) (props.onChange as (v: string[]) => void)(selectedArr.filter(c => c !== code));
  }

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightIdx >= 0 && highlightIdx < filtered.length) {
          handleSelect(filtered[highlightIdx].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        setHighlightIdx(0);
        break;
      case 'End':
        e.preventDefault();
        setHighlightIdx(filtered.length - 1);
        break;
    }
  }

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const el = listRef.current.children[isMulti ? highlightIdx : highlightIdx + 1] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx, isMulti]);

  const displayText = selectedArr.length === 0
    ? 'Tous'
    : isMulti
      ? `${selectedArr.length} département${selectedArr.length > 1 ? 's' : ''}`
      : (() => { const d = DEPARTMENTS.find(d => d.code === selectedArr[0]); return d ? `${d.code} — ${d.name}` : selectedArr[0]; })();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {isMulti && selectedArr.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {selectedArr.map(code => {
            const dept = DEPARTMENTS.find(d => d.code === code);
            return (
              <span key={code} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                background: '#DBEAFE', color: '#2563EB', border: '1px solid #93C5FD',
              }}>
                {code}{dept ? ` ${dept.name}` : ''}
                <button type="button" onClick={(e) => removeChip(code, e)} aria-label={`Retirer ${dept?.name || code}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#2563EB' }}>
                  <X size={11} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="dept-listbox"
        aria-label={`Départements : ${displayText}`}
        className="input"
        style={{
          width: '100%', height: 40, fontSize: 13, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', textAlign: 'left',
        }}
      >
        <span style={{ color: selectedArr.length > 0 ? '#111827' : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayText}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {selectedArr.length > 0 && (
            <span onClick={clearAll} role="button" tabIndex={-1} aria-label="Tout effacer"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#9CA3AF' }}>
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} style={{ color: '#9CA3AF', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          marginTop: 4, background: '#fff', border: '1px solid #E5E7EB',
          borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxHeight: 280, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher..."
              aria-label="Rechercher un département"
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 6,
                border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'inherit',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2563EB')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />
          </div>
          <div ref={listRef} id="dept-listbox" role="listbox" aria-multiselectable={isMulti || undefined} style={{ overflowY: 'auto', flex: 1 }}>
            {!isMulti && (
              <div
                role="option"
                aria-selected={selectedArr.length === 0}
                onClick={() => { handleSelect(''); setOpen(false); setSearch(''); }}
                style={{
                  padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                  background: selectedArr.length === 0 ? '#EFF6FF' : 'transparent',
                  color: selectedArr.length === 0 ? '#2563EB' : '#374151',
                  fontWeight: selectedArr.length === 0 ? 600 : 400,
                }}
              >
                Tous les départements
              </div>
            )}
            {filtered.map((d, idx) => {
              const isSelected = selectedSet.has(d.code);
              const isHighlighted = idx === highlightIdx;
              return (
                <div
                  key={d.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(d.code)}
                  style={{
                    padding: '7px 12px', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: isHighlighted ? '#DBEAFE' : isSelected ? '#EFF6FF' : 'transparent',
                    color: isSelected ? '#2563EB' : '#374151',
                    fontWeight: isSelected ? 600 : 400,
                    outline: isHighlighted ? '2px solid #3B82F6' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  {isMulti && (
                    <span style={{
                      width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                      border: isSelected ? '2px solid #2563EB' : '2px solid #D1D5DB',
                      background: isSelected ? '#2563EB' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                    </span>
                  )}
                  {d.code} — {d.name}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '12px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                Aucun département trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
