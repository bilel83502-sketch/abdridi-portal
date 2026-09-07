'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AuditChart({ chartData }: { chartData: { date: string; success: number; failure: number }[] }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: '16px 16px 8px', marginBottom: 16 }} role="img" aria-label="Graphique d'activité sur 30 jours : succès et échecs">
      <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', margin: '0 0 12px' }}>Activité sur 30 jours</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} barSize={8}>
          <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#94A3B8' }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="success" name="Succès" fill="#10B981" radius={[2, 2, 0, 0]} />
          <Bar dataKey="failure" name="Échecs" fill="#EF4444" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
