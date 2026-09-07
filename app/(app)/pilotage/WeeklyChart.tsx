'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function WeeklyChart({ weeklyData }: { weeklyData: { week: string; appels: number; rdv: number; signes: number }[] }) {
  const hasData = weeklyData && weeklyData.some((w) => w.appels > 0 || w.rdv > 0 || w.signes > 0);

  return (
    <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20 }} role="img" aria-label="Graphique hebdomadaire : appels, RDV décrochés et devis signés">
      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData} barGap={4}>
            <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#E2E8F0' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
            <Bar dataKey="appels" name="Appels" fill="#3B82F6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="rdv" name="RDV décrochés" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="signes" name="Devis signés" fill="#10B981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B', fontSize: 13 }}>
          Les données s&apos;afficheront au fil de l&apos;activité
        </div>
      )}
    </div>
  );
}
