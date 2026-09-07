'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronLeft, Shield, CheckCircle, XCircle, ChevronRight, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';

const AuditChart = dynamic(() => import('./AuditChart'), { ssr: false, loading: () => <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: 13 }}>Chargement...</div> });

const ACTIONS = ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'MISSION_CREATE', 'MISSION_UPDATE', 'MISSION_DELETE', 'PROSPECT_UPDATE', 'PROSPECT_ACTIVITY', 'PROSPECT_BULK_CREATE', 'DOCUMENT_UPLOAD', 'DOCUMENT_CREATE', 'DOCUMENT_DELETE', 'ALERT_CREATE', 'ALERT_DELETE', 'PASSWORD_RESET', 'TOKEN_ROTATED', 'SESSION_EXPIRED', 'CSRF_REJECTED'];
const PERIODS = [{ key: '24h', label: '24h' }, { key: '7d', label: '7 jours' }, { key: '30d', label: '30 jours' }];

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: '#10B981', LOGIN_FAILED: '#EF4444',
  MISSION_CREATE: '#3B82F6', MISSION_UPDATE: '#F59E0B', MISSION_DELETE: '#EF4444',
  PROSPECT_UPDATE: '#00C2FF', PROSPECT_ACTIVITY: '#8B5CF6', PROSPECT_BULK_CREATE: '#3B82F6',
  DOCUMENT_UPLOAD: '#10B981', DOCUMENT_CREATE: '#10B981', DOCUMENT_DELETE: '#EF4444',
  ALERT_CREATE: '#F59E0B', ALERT_DELETE: '#EF4444', PASSWORD_RESET: '#F59E0B',
  TOKEN_ROTATED: '#64748B', SESSION_EXPIRED: '#F59E0B', CSRF_REJECTED: '#EF4444',
};

const COUNTRIES = [
  { code: '', label: 'Tous les pays' },
  { code: 'FR', label: 'France' },
  { code: 'US', label: 'USA' },
  { code: 'DE', label: 'Allemagne' },
  { code: 'GB', label: 'Royaume-Uni' },
];

function DeviceIcon({ type }: { type: string | null }) {
  if (type === 'mobile') return <Smartphone size={12} style={{ color: '#64748B' }} />;
  if (type === 'tablet') return <Tablet size={12} style={{ color: '#64748B' }} />;
  return <Monitor size={12} style={{ color: '#64748B' }} />;
}

function StatusBadge({ action, statusCode, success }: { action: string; statusCode?: number; success: boolean }) {
  const isBad = !success || (statusCode && statusCode >= 400) || action.includes('FAILED') || action.includes('REJECTED') || action.includes('EXPIRED');
  if (isBad) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 4, background: '#7F1D1D', color: '#FCA5A5', fontSize: 10, fontWeight: 600 }}>
      <XCircle size={10} /> {statusCode || 'ERR'}
    </span>;
  }
  return <CheckCircle size={13} style={{ color: '#10B981' }} />;
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [period, setPeriod] = useState('7d');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard');
  }, [status, user, router]);

  useEffect(() => { loadLogs(); }, [user, page, actionFilter, userFilter, countryFilter, period]);

  async function loadLogs() {
    if (!user || user.role !== 'ADMIN') return;
    const params = new URLSearchParams({ page: String(page), period });
    if (actionFilter) params.set('action', actionFilter);
    if (userFilter) params.set('user', userFilter);
    if (countryFilter) params.set('country', countryFilter);
    const res = await fetch(`/api/pilotage/audit-logs?${params}`);
    const data = await res.json();
    if (data.logs) { setLogs(data.logs); setTotal(data.total); setPages(data.pages); }
    if (data.chartData) setChartData(data.chartData);
  }

  if (status === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#64748B' }}>Chargement...</div>;
  }
  if (user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link href="/pilotage" style={{ color: '#64748B', display: 'flex' }}><ChevronLeft size={20} /></Link>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{total} événement{total > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Chart — 30 days success vs failure (lazy loaded) */}
      {chartData.length > 0 && <AuditChart chartData={chartData} />}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 12 }}>
          <option value="">Toutes les actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(1); }} placeholder="Filtrer par email..."
          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 12, width: 180 }} />
        <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0F172A', color: '#E2E8F0', fontSize: 12 }}>
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => { setPeriod(p.key); setPage(1); }} style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: period === p.key ? '#3B82F6' : '#1E293B', color: period === p.key ? '#fff' : '#64748B',
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1.2fr 1fr 60px 70px 70px 60px 50px', padding: '8px 16px', borderBottom: '1px solid #334155', fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 700 }}>
          <span>Date</span><span>Action</span><span>Utilisateur</span><span>Pays</span><span>Device</span><span>Navigateur</span><span>IP</span><span></span>
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Aucun log pour cette période</div>
        ) : (
          logs.map((l: any) => {
            const color = ACTION_COLORS[l.action] || '#64748B';
            const isSuspicious = l.country && l.country !== 'FR' && (l.action === 'LOGIN_SUCCESS' || l.action === 'LOGIN_FAILED');
            return (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '130px 1.2fr 1fr 60px 70px 70px 60px 50px', padding: '8px 16px', borderBottom: '1px solid #334155', alignItems: 'center', fontSize: 12, minWidth: 700 }}>
                <span style={{ color: '#94A3B8', fontSize: 11 }}>{new Date(l.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ color, fontWeight: 600, fontSize: 11 }}>{l.action}</span>
                <span style={{ color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.userEmail || '—'}</span>
                <span style={{ fontSize: 11 }}>
                  {l.country ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 600,
                      background: isSuspicious ? '#7F1D1D' : '#1E293B',
                      color: isSuspicious ? '#FCA5A5' : '#94A3B8',
                      border: isSuspicious ? '1px solid #991B1B' : '1px solid #334155',
                    }}>
                      <Globe size={9} /> {l.country}
                    </span>
                  ) : '—'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#94A3B8' }}>
                  <DeviceIcon type={l.deviceType} /> {l.deviceType || '—'}
                </span>
                <span style={{ color: '#64748B', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.browserName || '—'}</span>
                <span style={{ color: '#64748B', fontSize: 10, fontFamily: 'monospace' }}>{l.ipAddress?.slice(0, 15) || '—'}</span>
                <span><StatusBadge action={l.action} statusCode={l.statusCode} success={l.success} /></span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '10px 14px', borderRadius: 5, background: '#1E293B', color: '#94A3B8', border: 'none', cursor: 'pointer', opacity: page === 1 ? 0.3 : 1, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>Page {page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '10px 14px', borderRadius: 5, background: '#1E293B', color: '#94A3B8', border: 'none', cursor: 'pointer', opacity: page === pages ? 0.3 : 1, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
