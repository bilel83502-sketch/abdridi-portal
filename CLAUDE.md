# Contexte projet AB DRIDI Portal

- Stack : Next.js 14, Prisma, Neon PostgreSQL, NextAuth, Stripe, Resend, Vercel
- URL prod : portal.abdridi.com
- Email FROM : noreply@abdridi.com
- DA : dark navy #0A1628, cyan #00C2FF, amber #F59E0B, typo Sora/DM Sans
- 555 437 marchés attribués (Concurrence) importés via DECP consolidé
- 13 253 consultations ouvertes
- 25 sources de scraping actives
- Cron alertes : tous les jours à 8h UTC
- Plan Vercel Hobby (cron max 1x/jour)
- Plan Neon Free (97,5% utilisé — upgrade Launch prévu)
- .env.local doit être chargé dans tous les scripts CLI (loadEnv pattern)
