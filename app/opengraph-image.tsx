import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AB DRIDI — Marchés publics';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F0F23 0%, #1E293B 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-1px',
            }}
          >
            AB DRIDI
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#3B82F6',
              fontWeight: 600,
              textAlign: 'center',
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            Trouvez vos marchés publics sur une seule plateforme
          </div>
          <div
            style={{
              display: 'flex',
              gap: 40,
              marginTop: 24,
            }}
          >
            {[
              { n: '17+', t: 'sources officielles' },
              { n: '100%', t: 'dossiers montés' },
              { n: '24/7', t: 'veille automatique' },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 36, fontWeight: 800, color: '#F59E0B' }}>{s.n}</div>
                <div style={{ fontSize: 16, color: '#94A3B8' }}>{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
