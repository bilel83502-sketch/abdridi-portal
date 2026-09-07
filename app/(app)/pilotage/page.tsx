'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BarChart3, Phone, Video, FileText, TrendingUp, ChevronRight, Clock, Calendar as CalIcon, Activity } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

// Lazy-load heavy chart/calendar libraries
const WeeklyChart = dynamic(() => import('./WeeklyChart'), { ssr: false, loading: () => <ChartSkeleton /> });
const CalendarSection = dynamic(() => import('./CalendarSection'), { ssr: false, loading: () => <ChartSkeleton height={420} /> });

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#64748B', fontSize: 13 }}>
      Chargement...
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  INTERESSE: '#10B981',
  VISIO_PLANIFIEE: '#3B82F6',
  DEVIS_ENVOYE: '#F59E0B',
  DEVIS_SIGNE: '#10B981',
  REFUSE: '#EF4444',
  PAS_INTERESSE: '#EF4444',
  PAS_JOIGNABLE: '#64748B',
  RAPPELER: '#F59E0B',
  A_CONTACTER: '#3B82F6',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${Math.floor(hours / 24)}j`;
}

const PIPELINE_COLS = [
  { key: 'a_contacter', label: 'À contacter', statuses: ['A_CONTACTER'], color: '#3B82F6' },
  { key: 'contacted', label: 'Contacté', statuses: ['PAS_JOIGNABLE', 'RAPPELER', 'INTERESSE', 'PAS_INTERESSE', 'REFUSE'], color: '#00C2FF' },
  { key: 'visio', label: 'Visio', statuses: ['VISIO_PLANIFIEE'], color: '#8B5CF6' },
  { key: 'devis', label: 'Devis envoyé', statuses: ['DEVIS_ENVOYE'], color: '#F59E0B' },
  { key: 'signe', label: 'Signé', statuses: ['DEVIS_SIGNE'], color: '#10B981' },
];

export default function PilotagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const [data, setData] = useState<any>(null);
  const [calEvents, setCalEvents] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'authenticated' && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  useEffect(() => { document.title = 'Pilotage | AB DRIDI'; }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetch('/api/pilotage/dashboard').then(r => r.json()).then(setData);
      fetch('/api/pilotage/calendar').then(r => r.json()).then(events => {
        if (Array.isArray(events)) setCalEvents(events.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
      });
    }
  }, [user]);

  useEffect(() => { document.title = 'Pilotage | AB DRIDI'; }, []);

  if (status === 'loading' || !data) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#64748B' }}>Chargement...</div>;
  }

  if (user?.role !== 'ADMIN') return null;

  const { kpis, pipeline, recentActivity, weeklyData } = data;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #3B82F6, #00C2FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Pilotage</h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Suivi de la prospection commerciale</p>
          </div>
        </div>
        <Link href="/pilotage/missions" style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
          background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          Missions <ChevronRight size={14} />
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <KPICard icon={<Phone size={18} />} label="Appels cette semaine" value={kpis.callsThisWeek} objective="Obj: 10-15/sem" color="#3B82F6" />
        <KPICard icon={<Video size={18} />} label="Visios planifiées" value={kpis.visiosPlanned} objective="Obj: 3-4/sem" color="#00C2FF" />
        <KPICard icon={<FileText size={18} />} label="Devis en attente" value={`${kpis.devisEnAttente}`} sub={kpis.devisTotal > 0 ? `${Math.round(kpis.devisTotal).toLocaleString('fr-FR')} €` : undefined} objective="Obj: 2-3/mois" color="#F59E0B" />
        <KPICard icon={<TrendingUp size={18} />} label="CA signé ce mois" value={`${Math.round(kpis.caSigneMois).toLocaleString('fr-FR')} €`} objective="Obj: 5 000€+/mois" color="#10B981" />
      </div>

      {/* Pipeline */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0', margin: '0 0 12px' }}>Pipeline</h2>
        <div className="pipeline-grid">
          {PIPELINE_COLS.map(col => {
            const count = col.statuses.reduce((s, k) => s + (pipeline[k] || 0), 0);
            return (
              <div key={col.key} style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 16, borderTop: `3px solid ${col.color}` }}>
                <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#E2E8F0' }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly chart — lazy loaded */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0', margin: '0 0 12px' }}>Performance du mois</h2>
        <WeeklyChart weeklyData={weeklyData} />
      </div>

      {/* Calendar — lazy loaded */}
      <div style={{ marginBottom: 28 }}>
        <CalendarSection calEvents={calEvents} setCalEvents={setCalEvents} />
      </div>

      {/* Recent activity */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0', margin: '0 0 12px' }}>Activité récente</h2>
        <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
          {recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="Aucune activité récente" description="Commencez à prospecter vos missions actives pour voir l'activité ici." ctaLabel="Voir mes missions" ctaHref="/pilotage/missions" />
          ) : (
            recentActivity.slice(0, 10).map((a: any) => (
              <div key={a.id} style={{ padding: '12px 16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[a.result] || '#64748B', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>{a.company}</span>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}> — {a.result || a.action}</span>
                  {a.note && <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}> — &quot;{a.note}&quot;</span>}
                  <span style={{ fontSize: 12, color: '#94A3B8' }}> · {a.mission}</span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> {timeAgo(a.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub, objective, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; objective: string; color: string }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#E2E8F0' }}>{value}</div>
      {sub && <div style={{ fontSize: 14, color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>{objective}</div>
    </div>
  );
}
