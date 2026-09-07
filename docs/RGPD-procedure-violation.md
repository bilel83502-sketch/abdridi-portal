# Procédure de Notification de Violation de Données — AB DRIDI

**Responsable** : Bilel DRIDI — contact@abdridi.com — 06 21 35 96 40
**Date de création** : 13 avril 2026
**Conformité** : Article 33 et 34 du RGPD

---

## 1. Détection

### Sources d'alerte
- **Sentry** : alertes automatiques en cas d'erreur serveur, tentatives d'injection, accès non autorisés
- **Audit logs** : actions suspectes détectées (LOGIN_FAILED multiples, CSRF_REJECTED, accès depuis pays inhabituels)
- **Signalement utilisateur** : email à contact@abdridi.com
- **Monitoring Vercel** : alertes de déploiement, pics de trafic anormaux

### Actions immédiates (H+0 à H+1)
1. Isoler le système compromis si nécessaire (désactivation de la route/fonction)
2. Documenter l'incident : date, heure, nature, données potentiellement affectées
3. Évaluer la gravité selon la matrice ci-dessous

---

## 2. Évaluation de la gravité

| Niveau | Critères | Exemples | Action |
|--------|----------|----------|--------|
| **Faible** | Pas de données personnelles, incident technique | Erreur 500 ponctuelle, timeout scraper | Corriger + documenter |
| **Moyen** | Données personnelles exposées mais pas exploitées | Fuite de logs contenant des emails, accès non autorisé détecté et bloqué | Notifier CNIL sous 72h |
| **Élevé** | Données sensibles compromises, exploitation confirmée | Fuite de mots de passe, accès aux données de paiement, exfiltration de base | Notifier CNIL + personnes concernées |

---

## 3. Notification CNIL (si risque moyen ou élevé)

### Délai : 72 heures maximum après prise de connaissance

### Procédure
1. Se connecter sur https://notifications.cnil.fr/notifications/index
2. Remplir le formulaire de notification avec :
   - Nature de la violation (confidentialité, intégrité, disponibilité)
   - Catégories et nombre approximatif de personnes concernées
   - Catégories et nombre approximatif de données concernées
   - Conséquences probables
   - Mesures prises ou envisagées

### Template email (si formulaire indisponible)
```
Destinataire : notification@cnil.fr
Objet : Notification de violation de données — AB DRIDI — SIREN 949654487

Madame, Monsieur,

Conformément à l'article 33 du RGPD, nous vous notifions une violation de données personnelles :

Date de détection : [DATE]
Nature : [confidentialité / intégrité / disponibilité]
Description : [DESCRIPTION]
Données concernées : [TYPES]
Personnes concernées : [NOMBRE ESTIMÉ]
Mesures prises : [ACTIONS]
Contact : Bilel DRIDI — contact@abdridi.com — 06 21 35 96 40

Cordialement,
Bilel DRIDI
AB DRIDI — SIREN 949 654 487
```

---

## 4. Notification aux personnes concernées (si risque élevé)

### Délai : dans les meilleurs délais

### Template email aux utilisateurs
```
Objet : Information importante concernant la sécurité de votre compte AB DRIDI

Bonjour [NOM],

Nous vous informons qu'un incident de sécurité a été détecté le [DATE] concernant [DESCRIPTION].

Données potentiellement concernées : [TYPES]

Mesures prises :
- [MESURE 1]
- [MESURE 2]

Actions recommandées :
- Changez votre mot de passe immédiatement
- Activez la double authentification (2FA) si ce n'est pas déjà fait
- Surveillez toute activité suspecte sur votre compte

Contact : contact@abdridi.com

Cordialement,
L'équipe AB DRIDI
```

---

## 5. Registre des violations

Chaque violation doit être documentée dans un registre interne (même si non notifiée à la CNIL) :

| Date | Nature | Données | Personnes | Gravité | Notif CNIL | Notif personnes | Mesures |
|------|--------|---------|-----------|---------|------------|-----------------|---------|
| — | — | — | — | — | — | — | — |

---

## 6. Revue post-incident

Dans les 7 jours suivant la résolution :
1. Analyse des causes racines
2. Mise à jour des mesures de sécurité
3. Communication interne
4. Mise à jour de ce document si nécessaire
