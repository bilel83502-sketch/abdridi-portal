'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate, daysUntil, getNatureLabel, getNatureBadge } from '@/lib/utils';
import { Clock } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetch('/api/dashboard').then(r => r.json()).then(setData); }, []);

  if (!data) return <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>;

  const totalNature = data.byNature.reduce((s: number, b: any) => s + b.count, 0) || 1;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Image src="/logo.png" alt="AB DRIDI" width={32} height={32} className="rounded-md" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Vue d'ensemble — Données issues de 94 sources, mises à jour 3×/jour</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="card p-4 px-6 mb-5 flex items-center justify-between">
        {[
          { label: 'Consultations ouvertes', value: data.totalOpen.toLocaleString('fr-FR') },
          { label: 'Nouvelles cette semaine', value: data.newThisWeek.toLocaleString('fr-FR'), badge: true },
          { label: 'Clôture < 7 jours', value: data.closingSoon.toLocaleString('fr-FR') },
          { label: 'Contrats attribués suivis', value: (data.totalAttribues || 0).toLocaleString('fr-FR') },
          { label: 'Vos alertes actives', value: data.userAlerts.toString() },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 flex-1 px-4 ${i < 4 ? 'border-r border-gray-100' : ''}`}>
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">{s.label}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-gray-900">{s.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                      <span className="text-[10px] text-gray-400 font-mono">{m.sourceRef || m.source}</span>
                    </div>
                    <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">{m.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{m.buyer} — {m.departmentName || m.department}</p>
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
              const colors: Record<string, string> = { TRAVAUX: '#D97706', SERVICES: '#2563EB', FOURNITURES: '#4F46E5' };
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
                {data.topDepartments.slice(0, 5).map((d: any, i: number) => (
                  <tr key={i} className={i < 4 ? 'border-b border-gray-100' : ''}>
                    <td className="py-[7px] text-xs font-semibold text-gray-500 w-7">{d.department}</td>
                    <td className="py-[7px] text-xs">{d.department}</td>
                    <td className="py-[7px] text-xs font-semibold text-right">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
