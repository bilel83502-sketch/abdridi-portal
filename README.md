# AB DRIDI Portal

**Plateforme SaaS de veille et d'accompagnement sur les marchés publics français.**

Production : [portal.abdridi.com](https://portal.abdridi.com)  
Site vitrine : [abdridi.com](https://abdridi.com)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 14 (App Router) |
| Base de données | PostgreSQL via Neon |
| ORM | Prisma 5 |
| Authentification | NextAuth.js (JWT + Credentials + Google OAuth + 2FA TOTP) |
| Paiement | Stripe (Checkout + Webhooks) |
| Email | Resend (transactionnel + alertes + nurturing) |
| Monitoring | Sentry (erreurs + PII scrubbing edge) |
| Hébergement | Vercel (région cdg1 / EU) |
| UI | Tailwind CSS 3, Recharts, React Big Calendar, Leaflet |

## Prérequis

- Node.js 20+
- npm ou pnpm
- Accès à une base Neon (ou PostgreSQL compatible)

## Installation locale

```bash
git clone https://github.com/bilel83502-sketch/abdridi-portal.git
cd abdridi-portal
npm install
cp .env.example .env.local  # puis remplir les variables
npx prisma db push
npm run dev
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Secret JWT NextAuth |
| `NEXTAUTH_URL` | URL du site (https://portal.abdridi.com) |
| `GOOGLE_CLIENT_ID` | OAuth Google (optionnel) |
| `GOOGLE_CLIENT_SECRET` | OAuth Google (optionnel) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe |
| `STRIPE_PRICE_ID` | ID du price Stripe (abonnement Veille) |
| `RESEND_API_KEY` | Clé API Resend |
| `RESEND_WEBHOOK_SECRET` | Secret webhook Resend (Svix) |
| `CRON_SECRET` | Secret partagé pour authentifier les crons Vercel |
| `SENTRY_DSN` | DSN Sentry pour le monitoring |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry côté client |

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run db:push` | Synchroniser le schéma Prisma → Neon |
| `npm run db:seed` | Peupler la base avec des données de test |
| `npm run security-test` | Lancer les tests de sécurité automatisés |
| `npm run sync:boamp` | Sync manuelle BOAMP |
| `npm run sync:ted` | Sync manuelle TED Europe |
| `npm run sync:decp` | Sync manuelle DECP |

## Structure du projet

```
app/
  (app)/          # Pages authentifiées (dashboard, marchés, alertes, pilotage...)
  auth/           # Pages login, register, verify, reset-password
  api/
    sync/         # 42 routes de scraping (BOAMP, TED, PLACE, régionales...)
    cron/         # Crons : alertes, close-expired, nurturing, purge, check-failures
    enrich/       # Enrichissement entreprises (SIRENE)
    stripe/       # Webhook Stripe
    resend/       # Webhook Resend
    pilotage/     # API admin (logs, audit, system-health, dashboard)
    health/       # Health check public
components/       # Composants réutilisables (Header, Chatbot, Skeleton, EmptyState...)
lib/              # Utilitaires (auth, prisma, scrapers, email, audit, cronLogger...)
prisma/           # Schéma + migrations + seed
public/           # Assets statiques (logo, favicon, sitemap, robots.txt)
docs/             # Documentation (RGPD, architecture, runbook)
```

## Modèles Prisma principaux

| Modèle | Description |
|--------|-------------|
| `User` | Utilisateurs (auth, Stripe, RGPD, 2FA) |
| `Marche` | Consultations ouvertes (13 000+) |
| `MarcheAttribue` | Marchés attribués historiques (555 000+) |
| `Alert` | Alertes utilisateur (mots-clés, départements, natures) |
| `Mission` | Missions de prospection |
| `Prospect` | Prospects dans le pipeline commercial |
| `CronLog` | Logs d'exécution des 46 crons |
| `AuditLog` | Journal d'audit sécurité complet |
| `StripeEventLog` | Idempotence webhook Stripe |

## Rôles et permissions

| Rôle | Accès |
|------|-------|
| `USER` (plan DECOUVERTE) | Dashboard, consultation marchés limitée |
| `USER` (plan VEILLE) | Accès complet, alertes email, export |
| `ADMIN` | Tout + pilotage, audit logs, gestion utilisateurs |

## Liens utiles

- **Production** : https://portal.abdridi.com
- **Vercel** : https://vercel.com/dashboard
- **Sentry** : https://sentry.io (projet abdridi-portal)
- **Stripe** : https://dashboard.stripe.com
- **Neon** : https://console.neon.tech
- **Resend** : https://resend.com/overview
