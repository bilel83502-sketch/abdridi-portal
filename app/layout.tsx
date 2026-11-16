import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import CookieBanner from '@/components/CookieBanner';
import { GoogleAnalytics } from '@/lib/analytics';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  title: 'AB DRIDI — Veille et montage de dossiers de marchés publics, tous secteurs',
  description: 'Les appels d\'offres de votre secteur repérés chaque matin sur 35+ sources officielles, et votre dossier de réponse monté à 100 % : mémoire technique, BPU, dépôt. 3 mois offerts sur la veille, sans carte bancaire.',
  keywords: 'marchés publics, appel d\'offres, veille marchés publics, marchés publics transport, transport sanitaire, transport scolaire, collecte déchets, nettoyage, BTP, BOAMP, dossier de réponse, mémoire technique, BPU, cabinet conseil marchés publics',
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
    description: 'Veille quotidienne sur 35+ sources officielles et montage complet de vos dossiers de réponse, tous secteurs. 3 mois offerts sur la veille.',
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
    description: 'Veille quotidienne sur 35+ sources officielles et montage complet de vos dossiers de réponse, tous secteurs. 3 mois offerts sur la veille.',
    images: ['https://abdridi.com/og-image.png'],
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AB DRIDI',
  url: 'https://abdridi.com',
  logo: 'https://abdridi.com/Logo AB DRIDI.png',
  description: 'Veille des marchés publics et montage de dossiers de réponse aux appels d\'offres, tous secteurs',
  foundingDate: '2023',
  telephone: '+33756895534',
  email: 'contact@abdridi.com',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+33756895534',
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

const jsonLdVeille = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  provider: { '@type': 'Organization', name: 'AB DRIDI' },
  name: 'Veille des marchés publics',
  description: 'Appels d\'offres de votre secteur sur 35+ sources officielles, alertes email quotidiennes et veille concurrentielle.',
  areaServed: 'France',
  offers: {
    '@type': 'Offer',
    price: '150',
    priceCurrency: 'EUR',
    description: '150 € par mois, sans engagement. 3 mois offerts à l\'inscription.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={outfit.variable}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdService) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdVeille) }} />
      </head>
      <body style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
