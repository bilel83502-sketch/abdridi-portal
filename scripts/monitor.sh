#!/bin/bash
# ==============================================================
# monitor.sh — Monitoring portal.abdridi.com
# Vérifie que le portail répond en HTTP 200.
# En cas de problème, envoie une alerte via DRIDI Agent (OpenClaw).
# ==============================================================

PORTAL_URL="https://portal.abdridi.com"
OPENCLAW_BIN="/Users/dridi/.nvm/versions/node/v22.22.1/bin/openclaw"
LOG_FILE="/tmp/abdridi-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# --- Vérification HTTP ---
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 --location "$PORTAL_URL")

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "[$TIMESTAMP] OK — $PORTAL_URL répond HTTP $HTTP_STATUS" >> "$LOG_FILE"
  exit 0
fi

# --- Site down : alerte ---
MESSAGE="🚨 ALERTE MONITORING — portal.abdridi.com

Statut détecté : HTTP $HTTP_STATUS
Heure : $TIMESTAMP

Le portail ne répond pas correctement. Vérification immédiate nécessaire."

echo "[$TIMESTAMP] ALERTE — HTTP $HTTP_STATUS — envoi notification" >> "$LOG_FILE"

# Envoi via OpenClaw (session principale)
"$OPENCLAW_BIN" message --session main "$MESSAGE" 2>> "$LOG_FILE"

exit 1
