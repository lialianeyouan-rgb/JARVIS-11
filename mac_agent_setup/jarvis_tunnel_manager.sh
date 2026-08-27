#!/bin/bash
# ============================================================================
# J.A.R.V.I.S. Cloudflare Quick Tunnel Manager
# Démarrage automatique du tunnel et enregistrement dynamique dans le cloud.
# ============================================================================

CLOUD_API_URL="https://ais-dev-fyklqoiknp3abi6vi6m2kv-13868786629.europe-west2.run.app"
TOKEN="jarvis-secure-mac-token-2026"
LOG_FILE="/tmp/jarvis_cloudflared.log"
PORT=8765

echo "[$(date)] Lancement du gestionnaire de tunnel J.A.R.V.I.S."

while true; do
  echo "[$(date)] Démarrage de cloudflared..."
  
  # Lancement du tunnel en tâche de fond avec log détaillé
  cloudflared tunnel --url http://127.0.0.1:$PORT > $LOG_FILE 2>&1 &
  CF_PID=$!
  
  echo "[$(date)] cloudflared lancé (PID: $CF_PID). En attente de l'URL..."
  
  # Attente et extraction de l'URL Cloudflare dynamique (TryCloudflare)
  TUNNEL_URL=""
  TIMEOUT=0
  while [ -z "$TUNNEL_URL" ]; do
    sleep 2
    TIMEOUT=$((TIMEOUT + 2))
    
    # On cherche l'URL dans les logs
    TUNNEL_URL=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG_FILE" | head -n 1)
    
    # Vérification si le processus est tombé
    if ! kill -0 $CF_PID 2>/dev/null; then
       echo "[$(date)] cloudflared s'est arrêté inopinément."
       break
    fi
    
    if [ $TIMEOUT -ge 60 ]; then
       echo "[$(date)] Timeout : Aucune URL générée après 60 secondes."
       kill -9 $CF_PID 2>/dev/null
       break
    fi
  done
  
  if [ -n "$TUNNEL_URL" ]; then
    echo "[$(date)] ============================================="
    echo "[$(date)] TUNNEL ÉTABLI : $TUNNEL_URL"
    echo "[$(date)] ============================================="
    
    # Boucle de maintien en vie et enregistrement (Heartbeat)
    while kill -0 $CF_PID 2>/dev/null; do
      echo "[$(date)] Envoi du Heartbeat/Enregistrement au J.A.R.V.I.S. Cloud..."
      
      curl -s -X POST "$CLOUD_API_URL/api/jarvis/device/custom-bridge" \
           -H "Content-Type: application/json" \
           -d "{\"url\":\"$TUNNEL_URL\",\"token\":\"$TOKEN\",\"probe\":true}"
           
      # Pause de 30 secondes avant le prochain heartbeat
      sleep 30
    done
  fi
  
  echo "[$(date)] Relance du cycle complet dans 5 secondes..."
  sleep 5
done
