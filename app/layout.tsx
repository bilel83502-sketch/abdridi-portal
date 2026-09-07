import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import CookieBanner from '@/components/CookieBanner';
import { GoogleAnalytics } from '@/lib/analytics';
import Script from 'next/script';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  title: 'AB DRIDI — Trouvez vos marchés publics sur une seule plateforme',
  description: 'AB DRIDI centralise 17+ sources officielles de marchés publics et monte 100% de vos dossiers de réponse. Veille automatique, mémoire technique, BPU, dépôt. Essai gratuit.',
  keywords: 'marchés publics, appel d\'offres, BOAMP, dossier de réponse, mémoire technique, BPU, cabinet conseil marchés publics',
  authors: [{ name: 'AB DRIDI' }],
  robots: 'index, follow',
  alternates: {
    canonical: 'https://portal.abdridi.com/',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'AB DRIDI — Votre partenaire marchés publics',
    description: 'Veille quotidienne sur 17+ sources officielles et montage complet de vos dossiers de réponse.',
    url: 'https://portal.abdridi.com/',
    siteName: 'AB DRIDI',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: 'https://abdridi.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AB DRIDI — Marchés publics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AB DRIDI — Votre partenaire marchés publics',
    description: 'Veille quotidienne sur 17+ sources officielles et montage complet de vos dossiers de réponse.',
    images: ['https://abdridi.com/og-image.png'],
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AB DRIDI',
  url: 'https://abdridi.com',
  logo: 'https://abdridi.com/Logo AB DRIDI.png',
  description: 'Cabinet conseil spécialisé dans la réponse aux appels d\'offres publics',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@abdridi.com',
    contactType: 'Customer Service',
    availableLanguage: 'French',
  },
  sameAs: [],
};

const jsonLdService = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  provider: {
    '@type': 'Organization',
    name: 'AB DRIDI',
  },
  name: 'Montage de dossiers de réponse aux appels d\'offres publics',
  description: 'Rédaction complète du mémoire technique, montage du BPU, pièces administratives et dépôt dématérialisé',
  areaServed: 'France',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={outfit.variable}>
      <head>
        <Script
          id="json-ld-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <Script
          id="json-ld-service"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdService) }}
        />
      </head>
      <body style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
