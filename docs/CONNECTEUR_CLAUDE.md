# Connecteur Claude (MCP)

Le portail expose un serveur MCP distant à l'adresse :

```
https://portal.abdridi.com/api/mcp
```

Il permet à Claude de consulter la veille **en lecture seule**.

## Ce que Claude peut faire

| Outil | Rôle |
|---|---|
| `rechercher_marches` | Chercher des consultations ouvertes (mots-clés, secteur, départements, région, nature, acheteur, fraîcheur, délai restant, montant). 25 résultats maximum par appel. |
| `detail_marche` | Fiche complète d'une consultation, avec ses documents publics. |
| `selection_semaine` | Les consultations récentes par secteur (transport, nettoyage, informatique, restauration, bâtiment), pour la publication « marchés à ne pas rater ». |
| `statistiques_veille` | Nombre de consultations ouvertes, publiées sur 7 jours, sources actives. |

## Ce que Claude ne peut pas faire

- Aucune écriture : le code ne contient que des `SELECT`.
- Aucun accès aux utilisateurs, alertes clients, prospects, missions ou documents de mission : seule la table `Marche` (avis publics) est lue.
- Aucune écriture de log en base (la base Neon est proche de sa limite).

Code : `app/api/mcp/route.ts` (authentification et déclaration des outils) et `lib/mcp-marches.ts` (requêtes).

## Mise en service

1. **Créer la clé** (32 caractères minimum) :
   ```bash
   openssl rand -hex 32
   ```
2. **L'ajouter dans Vercel** : Project → Settings → Environment Variables → `MCP_API_KEY` (Production), puis redéployer.
   Sans cette variable, le connecteur répond `503` et reste fermé.
3. **L'ajouter dans Claude** : Paramètres → Connecteurs → Ajouter un connecteur personnalisé.
   - Nom : `AB DRIDI Veille`
   - URL : `https://portal.abdridi.com/api/mcp`
   - En-tête de requête : `Authorization` = `Bearer <la clé>`

## Vérifier

```bash
# Sans clé : 401
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://portal.abdridi.com/api/mcp -d '{}'

# Avec la clé : liste des outils
curl -s -X POST https://portal.abdridi.com/api/mcp \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Révoquer l'accès

Changer ou supprimer `MCP_API_KEY` dans Vercel puis redéployer : l'ancienne clé cesse aussitôt de fonctionner.

## Dépendances ajoutées

- `mcp-handler` et `@modelcontextprotocol/server` (kit officiel MCP).
- `zod4` : alias npm vers zod 4, requis par le kit. Le reste du projet continue d'utiliser `zod` 3 sans changement.
