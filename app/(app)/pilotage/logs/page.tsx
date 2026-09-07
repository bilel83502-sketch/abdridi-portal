'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function CronLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') router.push('/dashboard');
  }, [status, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/pilotage/logs').then(r => r.json()).then(d => { if (Array.isArray(d)) setLogs(d); });
    }
  }, [user]);

  if (status === 'loading') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#64748B' }}>Chargement...</div>;
  }
  if (user?.role !== 'ADMIN') return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/pilotage" style={{ color: '#64748B', display: 'flex' }}><ChevronLeft size={20} /></Link>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={18} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Logs Cron</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Historique des exécutions cron</p>
        </div>
      </div>

      <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 80px 2fr', padding: '10px 16px', borderBottom: '1px solid #334155', fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
          <span>Job</span><span>Date</span><span>Alertes</span><span>Emails</span><span>Message</span>
        </div>
        {logs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Aucun log — le cron n'a pas encore tourné</div>
        ) : (
          logs.map((l: any) => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 80px 2fr', padding: '10px 16px', borderBottom: '1px solid #334155', alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{l.jobName}</span>
              <span style={{ color: '#94A3B8' }}>{new Date(l.executedAt).toLocaleString('fr-FR')}</span>
              <span style={{ color: '#64748B' }}>{l.alertsProcessed}</span>
              <span style={{ color: l.emailsSent > 0 ? '#10B981' : '#64748B', fontWeight: 600 }}>{l.emailsSent}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {l.success ? <CheckCircle size={13} style={{ color: '#10B981', flexShrink: 0 }} /> : <XCircle size={13} style={{ color: '#EF4444', flexShrink: 0 }} />}
                <span style={{ color: l.success ? '#94A3B8' : '#EF4444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.message || '—'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
