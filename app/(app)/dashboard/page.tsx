'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const OnboardingTour = dynamic(() => import('@/components/OnboardingTour'), { ssr: false });
import { formatCurrency, formatDate, daysUntil, getNatureLabel, getNatureBadge, cleanTitle, decodeHtml } from '@/lib/utils';
import { Clock, Lightbulb, Bell, Search, Calendar, X } from 'lucide-react';
import Image from 'next/image';
import { DEPARTMENTS } from '@/components/DepartmentSelect';
import { useSession } from 'next-auth/react';
import { SkeletonStats, SkeletonCards, SkeletonChart } from '@/components/Skeleton';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [favMarches, setFavMarches] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => { fetch('/api/dashboard').then(r => r.json()).then(setData); }, []);

  useEffect(() => {
    fetch('/api/favoris').then(r => r.ok ? r.json() : { ids: [] }).then(async d => {
      if (d.ids?.length > 0) {
        const res = await fetch(`/api/marches?limit=5&favOnly=1`);
        const json = await res.json();
        setFavMarches(json.data || []);
      }
    });
  }, []);

  useEffect(() => { document.title = 'Tableau de bord | AB DRIDI'; }, []);

  // Show onboarding for new users (< 7 days)
  useEffect(() => {
    if (data && data.userPlan) {
      const isNew = data.totalOpen > 0 && data.userAlerts === 0;
      setShowOnboarding(isNew);
      setRunTour(isNew);
    }
  }, [data]);

  async function dismissOnboarding() {
    setShowOnboarding(false);
    try { await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboardingDismissed: true }) }); } catch {}
  }

  if (!data) return <div style={{ padding: '20px 0' }}><SkeletonStats count={5} /><SkeletonChart /><div style={{ marginTop: 20 }}><SkeletonCards count={3} /></div></div>;

  const totalNature = data.byNature.reduce((s: number, b: any) => s + b.count, 0) || 1;
  const userName = (session?.user as any)?.name?.split(' ')[0] || '';

  return (
    <div>
      {/* Tour guidé */}
      <OnboardingTour shouldRun={runTour} onComplete={async () => {
        setRunTour(false);
        try { await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboardingDismissed: true }) }); } catch {}
      }} />

      {/* Onboarding banner */}
      {showOnboarding && (
        <div style={{ marginBottom: 20, padding: 20, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(0,194,255,0.05))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, position: 'relative' }}>
          <button onClick={dismissOnboarding} aria-label="Fermer" style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}><X size={16} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Lightbulb size={18} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0' }}>Bienvenue{userName ? ` ${userName}` : ''} ! Voici comment démarrer :</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: <Bell size={16} />, label: 'Créez votre première alerte', href: '/alertes', color: '#3B82F6' },
              { icon: <Search size={16} />, label: 'Consultez les marchés du jour', href: '/marches', color: '#00C2FF' },
              { icon: <Calendar size={16} />, label: 'Planifiez un RDV avec Bilel', href: '/rendez-vous', color: '#10B981' },
            ].map((step, i) => (
              <Link key={i} href={step.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#1E293B', borderRadius: 8, border: '1px solid #334155', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${step.color}22`, color: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.icon}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#E2E8F0' }}>{step.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <Image src="/logo.png" alt="AB DRIDI" width={32} height={32} className="rounded-md" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Vue d&apos;ensemble — Données mises à jour quotidiennement</p>
        </div>
      </div>

      {/* Upgrade banner for free users */}
      {!data.userPlan || data.userPlan === 'DECOUVERTE' ? (
        <div style={{
          marginBottom: 16, padding: '12px 20px', borderRadius: 8,
          background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: '#92400E' }}>
            Vous utilisez l&apos;offre <strong>Découverte</strong>. Passez à Veille pour des alertes illimitées et l&apos;accès complet.
          </span>
          <Link href="/abonnement" style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: '#F59E0B', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Voir les offres →
          </Link>
        </div>
      ) : null}

      {/* Stats bar */}
      <div className="card p-4 px-6 mb-5">
        <div className="dashboard-stats-grid">
          {[
            { label: 'Consultations ouvertes', value: data.totalOpen.toLocaleString('fr-FR'), href: '/marches' },
            { label: 'Nouvelles cette semaine', value: data.newThisWeek.toLocaleString('fr-FR'), href: '/marches?sort=recent' },
            { label: 'Clôture < 7 jours', value: data.closingSoon.toLocaleString('fr-FR'), href: '/marches?deadline=7days' },
            { label: 'Contrats attribués suivis', value: (data.totalAttribues || 0).toLocaleString('fr-FR'), href: '/concurrence' },
            { label: 'Vos alertes actives', value: data.userAlerts.toString(), href: '/alertes' },
          ].map((s, i) => (
            <Link key={i} href={s.href} className={`flex items-center gap-3 flex-1 px-4 py-1 no-underline hover:bg-gray-50 rounded transition-colors ${i < 4 ? 'dashboard-stat-border' : ''}`}>
              <div>
                <div className="text-[11px] text-gray-400 mb-0.5">{s.label}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-gray-900">{s.value}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <style jsx>{`
          .dashboard-stats-grid {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .dashboard-stat-border {
            border-right: 1px solid #F3F4F6;
          }
          @media (max-width: 768px) {
            .dashboard-stats-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .dashboard-stat-border {
              border-right: none;
              border-bottom: 1px solid #F3F4F6;
            }
          }
        `}</style>
      </div>

      {/* Activity chart */}
      {data.dailyCounts && data.dailyCounts.length > 0 && (() => {
        const counts: any[] = data.dailyCounts;
        const total = counts.reduce((s: number, d: any) => s + d.count, 0);
        const prevTotal: number = data.previousPeriodTotal || 0;
        const trendPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;
        const max = Math.max(...counts.map((x: any) => x.count), 1);
        const rawStep = max / 4;
        const step = rawStep <= 10 ? Math.ceil(rawStep / 5) * 5 || 5
          : rawStep <= 50 ? Math.ceil(rawStep / 10) * 10
          : Math.ceil(rawStep / 50) * 50;
        const ticks: number[] = [];
        for (let v = 0; v <= max + step; v += step) ticks.push(v);
        const yMax = ticks[ticks.length - 1];
        const chartH = 160;
        const MONTHS_SHORT = ['jan', 'fev', 'mar', 'avr', 'mai', 'jun', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec'];
        const fmtShort = (day: string) => { const d = new Date(day); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };
        const fmtLong = (day: string) => { const d = new Date(day); return `${d.getDate()} ${['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'][d.getMonth()]}`; };

        return (
          <div className="card p-5 mb-5">
            {/* Header with title + summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>Nouvelles consultations (30 derniers jours)</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  Total : {total.toLocaleString('fr-FR')}
                </span>
                {prevTotal > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: trendPct >= 0 ? '#059669' : '#DC2626',
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}>
                    {trendPct >= 0 ? '↑' : '↓'} {trendPct >= 0 ? '+' : ''}{trendPct}% vs mois precedent
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 0 }}>
              {/* Y axis */}
              <div style={{ width: 40, height: chartH, position: 'relative', flexShrink: 0 }}>
                {ticks.map(v => (
                  <span key={v} style={{
                    position: 'absolute', right: 6,
                    top: `${(1 - v / yMax) * 100}%`, transform: 'translateY(-50%)',
                    fontSize: 10, color: '#94A3B8', fontVariantNumeric: 'tabular-nums',
                  }}>{v.toLocaleString('fr-FR')}</span>
                ))}
              </div>
              {/* Bars area */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: chartH }}>
                  {/* Dashed grid lines */}
                  {ticks.map(v => (
                    <div key={v} style={{
                      position: 'absolute', left: 0, right: 0,
                      top: `${(1 - v / yMax) * 100}%`,
                      borderTop: v === 0 ? '1px solid #E2E8F0' : '1px dashed #E2E8F0',
                    }} />
                  ))}
                  {/* Bars */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: '100%', position: 'relative', zIndex: 1 }}>
                    {counts.map((d: any, i: number) => {
                      const h = yMax > 0 ? (d.count / yMax) * 100 : 0;
                      return (
                        <div
                          key={i}
                          style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', cursor: 'default' }}
                          className="chart-bar-wrap"
                        >
                          <div className="chart-tooltip" style={{
                            position: 'absolute', bottom: `calc(${Math.max(h, 4)}% + 8px)`, left: '50%', transform: 'translateX(-50%)',
                            background: '#0F172A', color: '#fff', padding: '5px 10px', borderRadius: 6,
                            fontSize: 11, whiteSpace: 'nowrap', pointerEvents: 'none',
                            opacity: 0, transition: 'opacity 0.15s', zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}>
                            {fmtLong(d.day)} : <b>{d.count}</b> consultation{d.count > 1 ? 's' : ''}
                          </div>
                          <div style={{
                            width: '100%', borderRadius: '4px 4px 0 0',
                            height: `${Math.max(h, 2)}%`,
                            background: '#00C2FF',
                            opacity: 0.75, transition: 'opacity 0.15s',
                          }} className="chart-bar" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* X axis — horizontal, every 5 days */}
                <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                  {counts.map((d: any, i: number) => {
                    const show = i % 5 === 0 || i === counts.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                        {show && (
                          <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            {fmtShort(d.day)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <style jsx>{`
              .chart-bar-wrap:hover .chart-tooltip { opacity: 1 !important; }
              .chart-bar-wrap:hover .chart-bar { opacity: 1 !important; background: #33d4ff !important; }
            `}</style>
          </div>
        );
      })()}

      <div className="grid grid-cols-[3fr_2fr] gap-3.5">
        {/* Recent consultations */}
        <div className="card overflow-hidden">
          <div className="p-3.5 px-5 border-b border-gray-100 flex justify-between items-center">
            <span className="text-[13px] font-semibold">Dernières consultations publiées</span>
            <Link href="/marches" className="text-xs text-blue-600 font-medium no-underline">Tout voir →</Link>
          </div>
          {data.recentMarches.slice(0, 4).map((m: any, i: number) => {
            const dl = daysUntil(m.deadline);
            return (
              <div key={m.id} className={`p-3 px-5 ${i < 3 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-1.5 mb-0.5 items-center">
                      <span className={getNatureBadge(m.nature)}>{getNatureLabel(m.nature)}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{m.source}</span>
                    </div>
                    <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">{cleanTitle(m.title)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{decodeHtml(m.buyer)}{(m.departmentName || (m.department && m.department !== '00')) ? ` — ${m.departmentName || m.department}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[13px] font-semibold">{formatCurrency(m.value)}</div>
                    <div className={`text-[10px] mt-0.5 ${dl !== null && dl <= 7 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                      {dl !== null ? `${dl}j restants` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {/* By nature */}
          <div className="card p-5">
            <h3 className="text-[13px] font-semibold mb-3.5">Répartition par nature</h3>
            {data.byNature.map((n: any, i: number) => {
              const pct = Math.round((n.count / totalNature) * 100);
              const colors: Record<string, string> = { TRAVAUX: '#D97706', SERVICES: '#2563EB', FOURNITURES: '#2563EB' };
              return (
                <div key={i} className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">{getNatureLabel(n.nature)}</span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-sm">
                    <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: colors[n.nature] || '#9CA3AF' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top departments */}
          <div className="card p-5">
            <h3 className="text-[13px] font-semibold mb-3">Top départements (30 derniers jours)</h3>
            <table className="w-full">
              <tbody>
                {data.topDepartments.slice(0, 5).map((d: any, i: number) => {
                  const dept = DEPARTMENTS.find(dep => dep.code === d.department);
                  return (
                    <tr key={i} className={i < 4 ? 'border-b border-gray-100' : ''}>
                      <td className="py-[7px] text-xs font-semibold text-gray-500 w-7">{d.department}</td>
                      <td className="py-[7px] text-xs">{dept ? dept.name : d.department}</td>
                      <td className="py-[7px] text-xs font-semibold text-right">{d.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Saved consultations */}
      <div className="card overflow-hidden mt-3.5">
        <div className="p-3.5 px-5 border-b border-gray-100 flex justify-between items-center">
          <span className="text-[13px] font-semibold">Consultations sauvegardées</span>
          <Link href="/marches" className="text-xs text-blue-600 font-medium no-underline">Voir tout →</Link>
        </div>
        {favMarches.length === 0 ? (
          <div className="p-5 text-center text-[13px] text-gray-400">Aucune consultation sauvegardée</div>
        ) : (
          favMarches.slice(0, 5).map((m: any, i: number) => (
            <Link key={m.id} href={`/marches/${m.id}`} className="block p-3 px-5 border-b border-gray-100 last:border-0 no-underline hover:bg-gray-50 transition-colors">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{cleanTitle(m.title)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{decodeHtml(m.buyer)} — {m.deadline ? formatDate(m.deadline) : '—'}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
