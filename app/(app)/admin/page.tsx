'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, RefreshCw, Shield, Calendar, CheckCircle, Check, Cookie } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: 'En attente', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  CONFIRMED: { label: 'Confirm\u00e9', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  DONE: { label: 'Termin\u00e9', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [data, setData] = useState<any>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [updatingAppt, setUpdatingAppt] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/admin').then((r) => r.json()).then(setData);
      fetch('/api/appointments?all=true').then((r) => r.json()).then((d) => {
        if (d.appointments) setAppointments(d.appointments);
      });
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

  async function updateAppointmentStatus(id: string, newStatus: string) {
    setUpdatingAppt(id);
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
      }
    } catch (e) {
      console.error(e);
    }
    setUpdatingAppt(null);
  }

  if (status === 'loading' || !data) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;
  }

  if (user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #3B82F6, #60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          { label: 'Abonn\u00e9s payants', value: data.paidUsers, icon: CreditCard, color: '#059669' },
          { label: 'Revenus mensuels', value: `${data.monthlyRevenue.toFixed(2).replace('.', ',')}€`, icon: TrendingUp, color: '#3B82F6' },
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

      {/* Appointments management */}
      <div className="card overflow-hidden mb-5">
        <div className="p-3.5 px-5 border-b border-gray-100 flex items-center gap-2">
          <Calendar size={15} style={{ color: '#059669' }} />
          <span className="text-[13px] font-semibold">Demandes de rendez-vous ({appointments.length})</span>
        </div>
        {appointments.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
            Aucune demande de rendez-vous
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full" style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {['Client', 'Email', 'Objet du march\u00e9', 'Date / Cr\u00e9neau', 'Statut', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((a: any, i: number) => {
                  const st = STATUS_LABELS[a.status] || STATUS_LABELS.PENDING;
                  const isUpdating = updatingAppt === a.id;
                  return (
                    <tr key={a.id} style={{ borderBottom: i < appointments.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>
                        {a.user?.name || '\u2014'}
                        {a.user?.company && (
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{a.user.company}</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#6B7280' }}>{a.user?.email || '\u2014'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{a.subject}</div>
                        {a.marketReference && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>R\u00e9f: {a.marketReference}</div>}
                        {a.message && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, fontStyle: 'italic' }}>{a.message.slice(0, 60)}{a.message.length > 60 ? '...' : ''}</div>}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>
                        <div style={{ fontWeight: 500 }}>{new Date(a.requestedDate).toLocaleDateString('fr-FR')}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.timeSlot}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                          color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {a.status === 'PENDING' && (
                            <button
                              onClick={() => updateAppointmentStatus(a.id, 'CONFIRMED')}
                              disabled={isUpdating}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 6, border: '1px solid #A7F3D0',
                                background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 600,
                                cursor: isUpdating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                opacity: isUpdating ? 0.5 : 1,
                              }}
                            >
                              <CheckCircle size={12} />
                              Confirmer
                            </button>
                          )}
                          {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                            <button
                              onClick={() => updateAppointmentStatus(a.id, 'DONE')}
                              disabled={isUpdating}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
                                background: '#F9FAFB', color: '#6B7280', fontSize: 11, fontWeight: 600,
                                cursor: isUpdating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                opacity: isUpdating ? 0.5 : 1,
                              }}
                            >
                              <Check size={12} />
                              Termin\u00e9
                            </button>
                          )}
                          {a.status === 'DONE' && (
                            <span style={{ fontSize: 11, color: '#9CA3AF', padding: '5px 0' }}>\u2014</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cookie consents */}
      {data.cookieConsents && (
        <div className="card overflow-hidden mb-5">
          <div className="p-3.5 px-5 border-b border-gray-100 flex items-center gap-2">
            <Cookie size={15} style={{ color: '#3B82F6' }} />
            <span className="text-[13px] font-semibold">Consentements cookies RGPD</span>
          </div>
          <div className="p-5">
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              {[
                { label: 'Total', value: data.cookieConsents.total, color: '#6B7280' },
                { label: 'Acceptés', value: data.cookieConsents.accepted, color: '#059669' },
                { label: 'Refusés', value: data.cookieConsents.refused, color: '#DC2626' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            {data.cookieConsents.recent.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {['Date', 'Utilisateur', 'Décision'].map((h) => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.cookieConsents.recent.map((c: any, i: number) => (
                    <tr key={c.id} style={{ borderBottom: i < data.cookieConsents.recent.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <td style={{ padding: '8px 12px', fontSize: 12, color: '#6B7280' }}>
                        {new Date(c.createdAt).toLocaleDateString('fr-FR')} {new Date(c.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12, color: '#6B7280' }}>
                        {c.userId || 'Anonyme'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px',
                          color: c.accepted ? '#059669' : '#DC2626',
                          background: c.accepted ? '#ECFDF5' : '#FEF2F2',
                          border: `1px solid ${c.accepted ? '#A7F3D0' : '#FECACA'}`,
                        }}>
                          {c.accepted ? 'Accepté' : 'Refusé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

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
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#3B82F6', background: '#DBEAFE', padding: '2px 6px', borderRadius: 3 }}>ADMIN</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#6B7280' }}>{u.email}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#6B7280' }}>{u.company || '\u2014'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px',
                      padding: '2px 8px', borderRadius: 3,
                      ...(u.hasSub ? { color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0' }
                        : u.role === 'ADMIN' ? { color: '#3B82F6', background: '#DBEAFE', border: '1px solid #93C5FD' }
                        : { color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB' })
                    }}>
                      {u.role === 'ADMIN' ? 'Admin' : u.plan}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#9CA3AF' }}>
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#9CA3AF' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : '\u2014'}
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
