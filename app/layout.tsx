import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AB DRIDI — Portail Marchés Publics',
  description: 'Portail de veille et de gestion des appels d\'offres publics. 93 sources agrégées, mises à jour 3 fois par jour.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
