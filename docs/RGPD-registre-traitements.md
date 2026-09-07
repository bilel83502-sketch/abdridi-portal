# Registre des Traitements — AB DRIDI

**Responsable de traitement** : Monsieur Bilel DRIDI, EI — SIREN 949 654 487
**Contact RGPD** : contact@abdridi.com
**Date de création** : 13 avril 2026
**Dernière mise à jour** : 13 avril 2026

---

## Traitement #1 — Gestion des comptes utilisateurs

| Champ | Détail |
|-------|--------|
| **Finalité** | Authentification, gestion de l'abonnement, accès au portail |
| **Base légale** | Exécution du contrat (art. 6.1.b RGPD) |
| **Catégories de personnes** | Utilisateurs inscrits sur portal.abdridi.com |
| **Catégories de données** | Email, nom, mot de passe (hashé bcrypt), entreprise, SIRET, téléphone, secteur d'activité |
| **Destinataires** | Neon (base de données UE), Vercel (hébergement USA — SCCs), Stripe (facturation USA — SCCs+DPF) |
| **Transferts hors UE** | Vercel (USA — SCCs), Stripe (USA — SCCs+DPF) |
| **Durée de conservation** | Durée de l'abonnement + 3 ans après résiliation |
| **Mesures de sécurité** | bcrypt 12 rounds, 2FA TOTP, HTTPS forcé, audit logs, rate limiting |

---

## Traitement #2 — Veille sur les marchés publics

| Champ | Détail |
|-------|--------|
| **Finalité** | Détection automatique d'appels d'offres pertinents, envoi d'alertes personnalisées |
| **Base légale** | Exécution du contrat (art. 6.1.b RGPD) |
| **Catégories de personnes** | Utilisateurs inscrits avec plan VEILLE |
| **Catégories de données** | Alertes (mots-clés, natures, départements), favoris, consultations sauvegardées |
| **Sources de données** | BOAMP, TED, DECP, Place, Maximilien, Mégalis + 20 autres sources publiques |
| **Destinataires** | Resend (emails transactionnels UE), Neon (DB UE) |
| **Transferts hors UE** | Aucun (Resend et Neon sont en UE) |
| **Durée de conservation** | Durée du compte actif |
| **Mesures de sécurité** | Accès authentifié, données publiques uniquement |

---

## Traitement #3 — Prospection commerciale (module PROSPECTOR)

| Champ | Détail |
|-------|--------|
| **Finalité** | Aide au montage de dossiers d'appels d'offres pour les clients d'AB DRIDI |
| **Base légale** | Intérêt légitime B2B (art. 6.1.f RGPD) — cf. note justificative ci-dessous |
| **Catégories de personnes** | Contacts professionnels d'entreprises tierces (B2B) |
| **Catégories de données** | Nom du contact, téléphone professionnel, email professionnel, nom d'entreprise, statut du contact |
| **Destinataires** | Bilel DRIDI et utilisateurs avec rôle PROSPECTOR autorisés |
| **Transferts hors UE** | Vercel (USA — SCCs) pour l'hébergement uniquement |
| **Durée de conservation** | Durée de la mission + 1 an, puis suppression |
| **Mesures de sécurité** | Accès restreint par RBAC (rôles ADMIN/PROSPECTOR), audit logs de chaque action |

### Note justificative — Intérêt légitime (art. 6.1.f)

L'activité d'AB DRIDI consiste à accompagner les entreprises dans leur réponse aux marchés publics. Dans ce cadre, le traitement des coordonnées professionnelles de contacts B2B est nécessaire pour :
- Identifier les interlocuteurs pertinents chez les acheteurs publics
- Assurer le suivi commercial des missions de montage de dossiers
- Faciliter la prise de rendez-vous professionnels

Ce traitement est proportionné : seules des données professionnelles sont collectées, les contacts sont informés de leur droit d'opposition (contact@abdridi.com), et les données sont supprimées à la fin de la mission.

---

## Traitement #4 — Audit logs / Sécurité

| Champ | Détail |
|-------|--------|
| **Finalité** | Détection d'incidents de sécurité, traçabilité des actions, prévention de la fraude |
| **Base légale** | Intérêt légitime (art. 6.1.f) + Obligation légale (art. 6.1.c — LCEN) |
| **Catégories de personnes** | Tous les utilisateurs du portail |
| **Catégories de données** | userId, adresse IP, user-agent, pays (géolocalisation), action effectuée, horodatage, code HTTP |
| **Destinataires** | Sentry (monitoring USA — SCCs), Neon (DB UE) |
| **Transferts hors UE** | Sentry (USA — SCCs) — données filtrées (pas de mots de passe, tokens) |
| **Durée de conservation** | **12 mois maximum** — purge automatique quotidienne |
| **Mesures de sécurité** | Accès réservé ADMIN, anonymisation en cas de suppression de compte |

---

## Traitement #5 — Mesure d'audience (Google Analytics)

| Champ | Détail |
|-------|--------|
| **Finalité** | Statistiques de fréquentation anonymisées pour améliorer le service |
| **Base légale** | **Consentement** (art. 6.1.a RGPD) — recueilli via bandeau cookies |
| **Catégories de personnes** | Visiteurs du site ayant accepté les cookies analytics |
| **Catégories de données** | Pages visitées, durée de session, navigateur, résolution écran (anonymisé via `anonymize_ip`) |
| **Destinataires** | Google Ireland Limited (UE) / Google LLC (USA) |
| **Transferts hors UE** | Google (USA — DPF + SCCs) |
| **Durée de conservation** | 13 mois maximum (paramétrage `cookie_expires: 34164000`) |
| **Mesures de sécurité** | IP anonymisée, pas de données nominatives, conditionné au consentement cookie |

---

## Traitement #6 — Emails transactionnels et marketing

| Champ | Détail |
|-------|--------|
| **Finalité** | Alertes marché, vérification email, réinitialisation mot de passe, nurturing commercial |
| **Base légale** | Contrat (transactionnels) + Consentement (marketing — opt-in séparé) |
| **Catégories de personnes** | Utilisateurs inscrits |
| **Catégories de données** | Email, nom, contenu de l'alerte |
| **Destinataires** | Resend (UE) |
| **Transferts hors UE** | Aucun |
| **Durée de conservation** | Durée du compte (transactionnels), retrait du consentement possible à tout moment (marketing) |
| **Mesures de sécurité** | SPF/DKIM configurés, envoi via noreply@abdridi.com |
