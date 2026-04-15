# Architecture AB DRIDI Portal

## Vue d'ensemble

```
                    ┌─────────────┐
                    │   Vercel    │
                    │  (cdg1 EU)  │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐
     │  Next.js 14 │ │  Crons  │  │  Webhooks   │
     │  App Router │ │ (46 jobs)│  │Stripe/Resend│
     └──────┬──────┘ └────┬────┘  └──────┬──────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────▼──────┐
                    │   Prisma    │
                    │   ORM 5    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Neon     │
                    │ PostgreSQL  │
                    └─────────────┘
```

## Flux d'authentification

```
Utilisateur → Login page
  ├─ Credentials (email + password)
  │   ├─ Rate limit : 5 tentatives / 15 min / email
  │   ├─ bcrypt.compare(password, hash)
  │   ├─ Si 2FA activé → vérification TOTP (otplib)
  │   │   └─ Backup codes disponibles
  │   └─ JWT signé (24h, timeout inactivité 2h)
  │
  └─ Google OAuth
      ├─ Auto-création compte si inexistant
      └─ Email marqué comme vérifié

Session : JWT strategy (pas de session DB)
  → Token contient : id, email, role, plan, company
  → Vérifié à chaque requête API via getServerSession()
```

## Flux de scraping

```
Vercel Cron (vercel.json, 46 jobs, 0h-22h UTC)
  │
  ├─ Auth : Bearer CRON_SECRET
  │
  ├─ CronLog → status: RUNNING
  │
  ├─ Scraper (lib/*.ts)
  │   ├─ Fetch API source (BOAMP, TED, PLACE, régionales...)
  │   ├─ Parse → normalise les données
  │   └─ Retourne Record[]
  │
  ├─ Upsert DB (par batch de 50)
  │   ├─ prisma.marche.upsert (clé: sourceRef)
  │   └─ Fallback individuel si batch échoue
  │
  ├─ CronLog → status: SUCCESS, durée, stats
  │
  └─ Réponse JSON { total, upserted, skipped, expired }

Sources : 25+ plateformes
  BOAMP, TED, PLACE, DECP v3, marchés-securises,
  achatpublic, maximilien, megalis, e-marchespublics,
  12 plateformes régionales (ATEXO), 8 métropoles (attribués)
```

## Flux des alertes

```
Cron quotidien (8h UTC) → /api/cron/alerts
  │
  ├─ Récupère toutes les Alert actives
  │   └─ Filtre : user ADMIN ou plan VEILLE avec abo actif
  │
  ├─ Pour chaque Alert :
  │   ├─ Construit la requête Prisma (keywords, natures, departments)
  │   ├─ Match marchés publiés depuis lastSentAt
  │   └─ Groupe par email utilisateur (déduplique)
  │
  ├─ Pour chaque utilisateur :
  │   ├─ 1 seul email regroupant toutes ses alertes
  │   ├─ Envoi via Resend (noreply@abdridi.com)
  │   └─ Update Alert.lastSentAt
  │
  └─ CronLog : alertsProcessed, emailsSent
```

## Flux Stripe

```
Inscription → /abonnement
  │
  ├─ stripe.checkout.sessions.create()
  │   └─ metadata: { userId }
  │
  ├─ Redirect → Stripe Checkout
  │
  └─ Webhook POST /api/stripe/webhook
      ├─ Vérifie signature (STRIPE_WEBHOOK_SECRET)
      ├─ Idempotence (StripeEventLog.stripeEventId)
      ├─ $transaction :
      │   ├─ checkout.session.completed → plan VEILLE
      │   ├─ subscription.updated → update period
      │   ├─ subscription.deleted → plan DECOUVERTE
      │   ├─ invoice.payment_failed → email admin
      │   ├─ charge.dispute.created → email urgent
      │   └─ charge.refunded → email info
      └─ StripeEventLog.create()
```

## Sécurité

| Mesure | Implémentation |
|--------|----------------|
| CSRF | Middleware Next.js (Origin/Referer check) |
| Rate limiting | Par IP + email (login: 5/15min) |
| Headers HTTP | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| 2FA | TOTP (otplib) + backup codes chiffrés |
| Audit trail | AuditLog complet (IP, UA, geo, action, durée) |
| PII scrubbing | Sentry edge beforeSend (emails, IPs) |
| Input validation | Zod sur les API routes |
| Auth | JWT signé + timeout inactivité 2h |
| Mot de passe | bcrypt (10 rounds) |

## Conformité RGPD

| Obligation | Implémentation |
|------------|----------------|
| Consentement | CookieBanner + CookieConsent DB + dates/IP/version |
| Droit d'accès | Export données utilisateur (API) |
| Droit suppression | Suppression cascade (User → Alerts, Favoris, Appointments) |
| Marketing | Opt-in explicite + désabonnement Resend webhook |
| Registre | docs/RGPD-registre-traitements.md |
| Sous-traitants | DPA signés (Stripe, Vercel, Sentry, Google) |
| Violation | docs/RGPD-procedure-violation.md |
| Purge | Cron purge-audit-logs (rétention limitée) |
