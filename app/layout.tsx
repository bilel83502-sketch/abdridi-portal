import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import CookieBanner from '@/components/CookieBanner';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  title: 'AB DRIDI — Portail Marchés Publics',
  description: 'Plateforme de veille B2B sur les marchés publics. 102 sources agrégées.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={outfit.variable}>
      <body style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
