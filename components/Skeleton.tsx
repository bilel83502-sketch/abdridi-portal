'use client';

export function SkeletonBlock({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 6 }} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, borderRadius: 4, width: i === lines - 1 ? '60%' : '100%' }} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20 }}>
          <SkeletonBlock height={16} width="40%" />
          <div style={{ marginTop: 10 }}><SkeletonText lines={2} /></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 16, marginBottom: 24 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20 }}>
          <SkeletonBlock height={12} width="60%" />
          <div style={{ marginTop: 12 }}><SkeletonBlock height={28} width="50%" /></div>
          <div style={{ marginTop: 8 }}><SkeletonBlock height={10} width="40%" /></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155', display: 'flex', gap: 16 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} height={10} width={i === 0 ? '25%' : '15%'} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #334155', display: 'flex', gap: 16, alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonBlock key={j} height={14} width={j === 0 ? '30%' : '18%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 220 }: { height?: number }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 20 }}>
      <SkeletonBlock height={12} width="30%" />
      <div style={{ marginTop: 16 }}>
        <SkeletonBlock height={height} />
      </div>
    </div>
  );
}
