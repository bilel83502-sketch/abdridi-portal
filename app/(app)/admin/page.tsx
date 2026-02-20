'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, RefreshCw, Shield } from 'lucide-react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [data, setData] = useState<any>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/admin').then((r) => r.json()).then(setData);
    }
  }, [user]);

  async function handleSync(source: string) {
    setSyncing(source);
    try {
      await fetch(`/api/sync/${source}`, { method: 'POST', headers: { 'x-cron-secret': 'manual-admin-sync' } });
    } catch (e) {
      console.error(e);
    }
    setSyncing(null);
  }

  if (status === 'loading' || !data) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  if (user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Administration</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Gestion du portail AB DRIDI</p>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-4 px-6 mb-5 flex items-center justify-between">
        {[
          { label: 'Utilisateurs inscrits', value: data.totalUsers, icon: Users, color: '#2563EB' },
          { label: 'Abonnés payants', value: data.paidUsers, icon: CreditCard, color: '#059669' },
          { label: 'Revenus mensuels', value: `${data.monthlyRevenue}€`, icon: TrendingUp, color: '#7C3AED' },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 flex-1 px-4 ${i < 2 ? 'border-r border-gray-100' : ''}`}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">{s.label}</div>
              <span className="text-xl font-bold text-gray-900">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sync buttons */}
      <div className="card p-5 mb-5">
        <h3 className="text-[13px] font-semibold mb-3">Synchronisation manuelle</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['boamp', 'decp', 'decp-attribue', 'ted'].map((source) => (
            <button
              key={source}
              onClick={() => handleSync(source)}
              disabled={syncing === source}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={syncing === source ? 'login-spinner' : ''} />
              Sync {source.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="p-3.5 px-5 border-b border-gray-100">
          <span className="text-[13px] font-semibold">Utilisateurs ({data.users.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                {['Nom', 'Email', 'Entreprise', 'Plan', 'Inscrit le', 'Dernier login'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map((u: any, i: number) => (
                <tr key={u.id} style={{ borderBottom: i < data.users.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500 }}>
                    {u.name}
                    {u.role === 'ADMIN' && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#7C3AED', background: '#EDE9FE', padding: '2px 6px', borderRadius: 3 }}>ADMIN</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#6B7280' }}>{u.email}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#6B7280' }}>{u.company || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px',
                      padding: '2px 8px', borderRadius: 3,
                      ...(u.hasSub ? { color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0' }
                        : u.role === 'ADMIN' ? { color: '#7C3AED', background: '#EDE9FE', border: '1px solid #C4B5FD' }
                        : { color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB' })
                    }}>
                      {u.role === 'ADMIN' ? 'Admin' : u.plan}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#9CA3AF' }}>
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#9CA3AF' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
