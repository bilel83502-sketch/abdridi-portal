# Runbook Opérationnel — AB DRIDI Portal

## Déploiement

**Déploiement automatique** : chaque push sur `main` déclenche un build Vercel.

```bash
git push origin main  # → build + deploy automatique
```

Vérifier le déploiement : https://vercel.com/dashboard → projet abdridi-portal

## Rollback

1. Aller sur le dashboard Vercel
2. Section "Deployments"
3. Trouver le déploiement précédent fonctionnel
4. Cliquer "..." → "Promote to Production"

## Consulter les logs

| Source | Comment y accéder |
|--------|-------------------|
| Logs serveur Vercel | Vercel Dashboard → Logs (temps réel) |
| Erreurs applicatives | https://sentry.io → projet abdridi-portal |
| Logs crons | https://portal.abdridi.com/pilotage/logs (admin) |
| Audit trail | https://portal.abdridi.com/pilotage/audit-logs (admin) |
| Métriques système | https://portal.abdridi.com/pilotage/system-health (admin) |

## Vérifier le statut de la base de données

1. **Endpoint health** : `GET https://portal.abdridi.com/api/health`
   - `200 { status: "ok", db: "connected" }` = tout va bien
   - `503 { status: "error", db: "disconnected" }` = problème Neon
2. **Dashboard Neon** : https://console.neon.tech → vérifier connexions et stockage
3. **Dashboard pilotage** : section "Base de Données" pour la latence

## Ajouter une nouvelle source de scraping

1. Créer le scraper : `lib/nom-source.ts`
   - Exporter une fonction `fetchNomSourceRecords(options)` qui retourne `Record[]`
   - Normaliser les champs : title, buyer, nature, department, value, deadline, source, sourceRef...

2. Créer la route API : `app/api/sync/nom-source/route.ts`
   ```typescript
   import { withCronLogging } from '@/lib/cronLogger';
   // Utiliser le même pattern que les routes existantes (auth, withCronLogging, upsert batch)
   ```

3. Ajouter au `vercel.json` :
   ```json
   { "path": "/api/sync/nom-source", "schedule": "30 9 * * *" }
   ```

4. Push → la route sera automatiquement disponible

## Ajouter un utilisateur ADMIN

```bash
# Via la console Neon ou un script
npx tsx -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { role: 'ADMIN' }
  }).then(console.log);
"
```

## Debugger un cron en échec

1. Aller sur `/pilotage/logs` → filtrer par nom du job
2. Vérifier le message d'erreur dans le CronLog
3. Causes fréquentes :
   - **Timeout** (max 60s sur Hobby) : la source est lente ou retourne trop de données
   - **Erreur réseau** : la plateforme source est en maintenance
   - **Rate limit source** : attendre et réessayer
   - **Schema change** : la source a changé son API/HTML
4. Tester manuellement : `curl -H "Authorization: Bearer $CRON_SECRET" https://portal.abdridi.com/api/sync/nom-source`
5. Si 3 échecs consécutifs → email automatique envoyé à contact@abdridi.com

## Changer le tarif Stripe

1. Aller sur https://dashboard.stripe.com/products
2. Modifier le prix ou créer un nouveau prix
3. Mettre à jour `STRIPE_PRICE_ID` dans les variables d'environnement Vercel
4. Redéployer

Note : les abonnements existants restent sur l'ancien prix. Seuls les nouveaux abonnements utiliseront le nouveau prix.

## Exporter les données d'un utilisateur (RGPD)

```sql
-- Via la console Neon
SELECT * FROM "User" WHERE email = 'utilisateur@example.com';
SELECT * FROM "Alert" WHERE "userId" = '<user_id>';
SELECT * FROM "Favori" WHERE "userId" = '<user_id>';
SELECT * FROM "Appointment" WHERE "userId" = '<user_id>';
SELECT * FROM "AuditLog" WHERE "userId" = '<user_id>' ORDER BY "createdAt" DESC;
SELECT * FROM "CookieConsent" WHERE "userId" = '<user_id>';
```

Pour la suppression (droit à l'effacement) :
```sql
DELETE FROM "User" WHERE email = 'utilisateur@example.com';
-- Les relations en cascade suppriment automatiquement : Alert, Favori, Appointment
```

## Procédure d'incident sécurité

Se référer à `docs/RGPD-procedure-violation.md` pour la procédure complète.

Résumé :
1. Identifier et contenir l'incident
2. Évaluer la gravité (données personnelles impactées ?)
3. Si violation de données personnelles : notification CNIL sous 72h
4. Documenter l'incident et les mesures prises
5. Notifier les personnes concernées si risque élevé

## Contacts

| Rôle | Contact |
|------|---------|
| Responsable | Bilel DRIDI — contact@abdridi.com |
| Téléphone | 07 56 89 55 34 |
| Support technique | contact@abdridi.com |
