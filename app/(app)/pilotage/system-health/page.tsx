'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type HealthData = {
  timestamp: string;
  errors24h: number;
  securityEvents24h: number;
  loginFailures24h: number;
  rateLimitHits24h: number;
  uptimePercent: number;
  avgResponseTimeMs: number;
  totalUsers: number;
  activeUsersLast24h: number;
  recentCronJobs: { jobName: string; success: boolean; executedAt: string; message: string | null }[];
  stripeLastWebhook: string | null;
  stripePaymentsFailed: number;
  stripeDisputes: number;
  emailBounces: number;
  emailComplaints: number;
  dbLatencyMs: number;
  totalMarches: number;
  totalMarchesAttribues: number;
};

export default function SystemHealthPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ((session?.user as any)?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetch('/api/pilotage/system-health')
      .then(r => r.json())
      .then(setHealth)
      .finally(() => setLoading(false));
  }, [session, router]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Chargement...</div>;
  if (!health) return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>Erreur de chargement</div>;

  const cards = [
    { label: 'Erreurs (24h)', value: health.errors24h, color: health.errors24h > 10 ? '#EF4444' : '#10B981', icon: 'E' },
    { label: 'Events Sécurité (24h)', value: health.securityEvents24h, color: health.securityEvents24h > 5 ? '#F59E0B' : '#10B981', icon: 'S' },
    { label: 'Logins Échoués (24h)', value: health.loginFailures24h, color: health.loginFailures24h > 20 ? '#EF4444' : '#10B981', icon: 'L' },
    { label: 'Rate Limits (24h)', value: health.rateLimitHits24h, color: '#3B82F6', icon: 'R' },
    { label: 'Uptime (7j)', value: `${health.uptimePercent}%`, color: health.uptimePercent >= 99 ? '#10B981' : '#F59E0B', icon: 'U' },
    { label: 'Temps Réponse Moy.', value: `${health.avgResponseTimeMs}ms`, color: health.avgResponseTimeMs > 500 ? '#F59E0B' : '#10B981', icon: 'T' },
    { label: 'Utilisateurs Total', value: health.totalUsers, color: '#8B5CF6', icon: 'P' },
    { label: 'Actifs (24h)', value: health.activeUsersLast24h, color: '#06B6D4', icon: 'A' },
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0F1724', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00C2FF', fontWeight: 700, fontSize: 18 }}>
          H
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>System Health</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
            Dernière maj : {new Date(health.timestamp).toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map(c => (
          <div key={c.label} style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Cron Jobs */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Derniers Cron Jobs</h2>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B' }}>Job</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B' }}>Statut</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B' }}>Date</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {health.recentCronJobs.map((job, i) => (
              <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#1E293B' }}>{job.jobName}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: job.success ? '#ECFDF5' : '#FEF2F2',
                    color: job.success ? '#059669' : '#DC2626',
                  }}>
                    {job.success ? 'OK' : 'FAIL'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: '#64748B' }}>
                  {new Date(job.executedAt).toLocaleString('fr-FR')}
                </td>
                <td style={{ padding: '10px 16px', color: '#64748B', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.message || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stripe Section */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16, marginTop: 32 }}>Stripe</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Dernier webhook</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{health.stripeLastWebhook || '—'}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Paiements échoués (30j)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: health.stripePaymentsFailed > 0 ? '#EF4444' : '#10B981' }}>{health.stripePaymentsFailed}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Litiges ouverts</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: health.stripeDisputes > 0 ? '#EF4444' : '#10B981' }}>{health.stripeDisputes}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener" style={{ fontSize: 14, color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>Ouvrir Stripe Dashboard →</a>
        </div>
      </div>

      {/* Resend Section */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Resend (Email)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Bounces (30j)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: health.emailBounces > 5 ? '#EF4444' : '#10B981' }}>{health.emailBounces}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Complaints (30j)</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: health.emailComplaints > 0 ? '#F59E0B' : '#10B981' }}>{health.emailComplaints}</div>
        </div>
      </div>

      {/* DB Neon Section */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Base de Données (Neon)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Latence DB</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: health.dbLatencyMs > 200 ? '#F59E0B' : '#10B981' }}>{health.dbLatencyMs}ms</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Marchés en base</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#8B5CF6' }}>{health.totalMarches?.toLocaleString('fr-FR')}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Marchés attribués</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#8B5CF6' }}>{health.totalMarchesAttribues?.toLocaleString('fr-FR')}</div>
        </div>
      </div>
    </div>
  );
}
