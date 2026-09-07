# 🤖 Équipe d'agents IA — Maintenance & amélioration du SaaS

Cette équipe de **5 agents Claude spécialisés** est dédiée à la maintenance, à la sécurité et à l'amélioration continue du portail `abdridi-portal`. Chaque agent a un rôle clair, un brief précis et un prompt prêt à coller dans Cowork ou Claude Code.

---

## 🗂 L'équipe

| # | Agent | Rôle | Fréquence conseillée |
|---|---|---|---|
| [01](./01-gestionnaire.md) | 🎯 **Gestionnaire SaaS** | Coordonne les autres agents, fait des synthèses | À la demande, ou en début de chaque revue |
| [02](./02-watchdog.md) | 👁 **Watchdog** | Surveille la santé : crons, Neon, Vercel, Sentry | Tous les lundis matin (10 min) |
| [03](./03-securite-rgpd.md) | 🛡 **Sécurité & RGPD** | Audit sécu + conformité RGPD + 2FA | 1× par mois et avant chaque release majeure |
| [04](./04-optimiseur.md) | ⚡ **Optimiseur Performance** | Améliore Prisma / Next.js / réduit coûts Neon | Quand le SaaS rame, ou 1× par trimestre |
| [05](./05-releaseur.md) | 🚀 **Releaseur** | Gère les déploiements et le pipeline GitHub→Vercel | Avant chaque push / quand un build plante |

---

## 🚀 Comment invoquer un agent

### Option A — Depuis Cowork (recommandé pour le démarrage)

1. Ouvre Cowork (l'app Mac)
2. Demande-moi : *« Lance l'agent [NOM_AGENT] sur le SaaS »*
3. Je copie-colle automatiquement le brief du fichier markdown correspondant et je lance le travail
4. Tu reçois un rapport synthétique en chat

### Option B — Depuis Claude Code (pour les actions techniques)

1. `cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/Desktop/abdridi-portal`
2. `claude` (lance Claude Code)
3. Tape `/agents` puis sélectionne l'agent souhaité (le brief est dans le fichier `.md` correspondant)
4. Laisse l'agent travailler ; il propose toujours les changements avant de les appliquer

### Option C — Manuel (en cas de besoin)

Ouvre le fichier `.md` de l'agent → copie la section **« Brief / prompt »** → colle dans n'importe quelle interface Claude.

---

## 📋 Routine de maintenance recommandée

| Jour | Action | Durée |
|---|---|---|
| **Lundi matin** | Watchdog → bilan santé week-end | 10 min |
| **Mardi** | (libre — ou Optimiseur si besoin) | — |
| **Mercredi** | (libre) | — |
| **Jeudi** | Releaseur → vérifie git/Vercel/cohérence | 5 min |
| **Vendredi** | Watchdog → bilan semaine + plan week-end | 10 min |
| **1er du mois** | Sécurité & RGPD → audit complet | 20 min |
| **1er du trimestre** | Optimiseur → revue performance + coûts | 30 min |
| **Avant chaque release** | Sécurité + Releaseur (en parallèle) | 15 min |

---

## 🎯 Le rôle du Gestionnaire SaaS

C'est l'agent que tu invoques quand tu **ne sais pas par où commencer**. Il :
1. Pose 3-4 questions pour comprendre ton besoin du moment
2. Décide quels agents lancer dans quel ordre
3. Centralise leurs rapports
4. Te livre une **synthèse exécutive** en 1 page max

Exemple d'invocation : *« Mon SaaS me semble bizarre depuis hier — lance le Gestionnaire »*

---

## 🗒 Évolutions futures de l'équipe

Si à terme tu veux ajouter d'autres agents, ils ont leur place dans ce dossier :
- **Acquisition** — sourcing de nouvelles sources d'AO publiques non encore référencées
- **Support client** — modèles de réponses, FAQ dynamique, nurturing
- **Veille concurrence** — surveille les SaaS concurrents (Vecteur Plus, Marchés Online, AWS Achat)
- **Growth** — analyse de funnel d'acquisition, A/B testing, optimisation conversion

Chaque agent ajouté doit avoir son fichier `0X-nom.md` dans ce dossier, avec le même format que les 5 existants.

---

*Maintenu par Claude — dernière mise à jour : 19 mai 2026*
