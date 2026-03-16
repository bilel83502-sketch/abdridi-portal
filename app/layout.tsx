import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import CookieBanner from '@/components/CookieBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['600', '700'],
  display: 'swap',
});

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
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        <Providers>{children}</Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
