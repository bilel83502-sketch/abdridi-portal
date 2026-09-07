#!/bin/bash
# Import DECP consolidé + métropoles + enrichissement
# Lance en chaîne, notify WhatsApp à chaque étape

set -e
LOGDIR="/tmp/abdridi-import"
mkdir -p "$LOGDIR"

echo "🚀 Démarrage import complet — $(date)" | tee "$LOGDIR/main.log"

# ── ÉTAPE 1 : DECP Consolidé 2024+2025+2026 ──────────────────────
echo "" | tee -a "$LOGDIR/main.log"
echo "📥 ÉTAPE 1 : DECP Consolidé (2024+2025+2026)..." | tee -a "$LOGDIR/main.log"

npx tsx scripts/sync-decp-consolide.ts --from=2024 2>&1 | tee "$LOGDIR/decp-consolide.log"
DECP_STATUS=$?

if [ $DECP_STATUS -eq 0 ]; then
  DECP_COUNT=$(grep -oP "Total marchés attribués en base : \K[0-9]+" "$LOGDIR/decp-consolide.log" 2>/dev/null || echo "?")
  openclaw system event --text "✅ DECP Consolidé terminé — $DECP_COUNT marchés en base. Lancement métropoles..." --mode now
else
  openclaw system event --text "❌ DECP Consolidé ERREUR (code $DECP_STATUS). Voir /tmp/abdridi-import/decp-consolide.log" --mode now
  exit 1
fi

sleep 3

# ── ÉTAPE 2 : Métropoles manquantes ──────────────────────────────
echo "" | tee -a "$LOGDIR/main.log"
echo "🏙️  ÉTAPE 2 : Métropoles (Hauts-de-Seine, AMP, Nice, Lille, Montpellier)..." | tee -a "$LOGDIR/main.log"

npx tsx scripts/sync-metropoles.ts 2>&1 | tee "$LOGDIR/metropoles.log"
METRO_STATUS=$?

if [ $METRO_STATUS -eq 0 ]; then
  openclaw system event --text "✅ Métropoles terminées. Lancement enrichissement entreprises..." --mode now
else
  openclaw system event --text "⚠️ Métropoles terminées avec erreurs (code $METRO_STATUS). Lancement enrichissement quand même..." --mode now
fi

sleep 3

# ── ÉTAPE 3 : Enrichissement entreprises ─────────────────────────
echo "" | tee -a "$LOGDIR/main.log"
echo "🔍 ÉTAPE 3 : Enrichissement entreprises (SIRENE)..." | tee -a "$LOGDIR/main.log"

npx tsx scripts/enrich-entreprises.ts --limit=2000 2>&1 | tee "$LOGDIR/enrichissement.log"
ENRICH_STATUS=$?

if [ $ENRICH_STATUS -eq 0 ]; then
  openclaw system event --text "✅ Import complet terminé ! DECP + Métropoles + Enrichissement. portal.abdridi.com est à jour." --mode now
else
  openclaw system event --text "⚠️ Import terminé mais enrichissement avec erreurs. DECP + Métropoles sont OK." --mode now
fi

echo "" | tee -a "$LOGDIR/main.log"
echo "🏁 Import complet terminé — $(date)" | tee -a "$LOGDIR/main.log"
