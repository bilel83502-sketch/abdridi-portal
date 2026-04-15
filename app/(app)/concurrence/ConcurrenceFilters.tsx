'use client';

import DepartmentSelect from '@/components/DepartmentSelect';

interface ConcurrenceFiltersProps {
  nature: string;
  setNature: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  periode: string;
  setPeriode: (v: string) => void;
  onApply: () => void;
}

export default function ConcurrenceFilters({
  nature,
  setNature,
  department,
  setDepartment,
  periode,
  setPeriode,
  onApply,
}: ConcurrenceFiltersProps) {
  return (
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
      <div className="concurrence-filters">
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
          onClick={onApply}
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
  );
}
