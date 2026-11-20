'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Le shader WebGL n'est chargé que côté navigateur (jamais au rendu serveur).
const LiquidMetal = dynamic(
  () => import('@paper-design/shaders-react').then(m => m.LiquidMetal),
  { ssr: false, loading: () => null },
);

/**
 * Logo AB DRIDI animé en « métal liquide » (Paper Shaders, licence Apache-2.0).
 * - Logo statique affiché tant que l'animation charge, et en secours si le
 *   navigateur ne gère pas WebGL ou si l'utilisateur a demandé moins d'animations.
 */
export default function LiquidLogo({ size = 132 }: { size?: number }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    try {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const gl = document.createElement('canvas').getContext('webgl2');
      setAnimate(!reduce && !!gl);
    } catch {
      setAnimate(false);
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, margin: '0 auto 18px', position: 'relative' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: animate ? 0 : 1, transition: 'opacity .6s' }}
      />
      {animate && (
        <LiquidMetal
          image="/logo-mark.svg"
          shape="none"
          colorBack="#0F0F2300"
          colorTint="#7DD3FC"
          repetition={2}
          softness={0.15}
          shiftRed={0.25}
          shiftBlue={0.35}
          distortion={0.08}
          contour={0.5}
          angle={70}
          speed={0.8}
          scale={0.9}
          fit="contain"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
}
