#!/bin/bash
# ============================================================================
# Script d'installation des agents Launchd (macOS) pour J.A.R.V.I.S.
# ============================================================================

echo "🤖 Préparation de l'installation des agents J.A.R.V.I.S. sur votre Mac..."

# Définition des chemins
# Utilisation d'un répertoire stable pour éviter les problèmes de permissions sur ~/Downloads
STABLE_DIR="$HOME/Library/Application Support/Jarvis"
PLIST_BRIDGE="com.jarvis.macbridge.plist"
PLIST_TUNNEL="com.jarvis.cloudflared.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "📂 Création du répertoire stable : $STABLE_DIR"
mkdir -p "$STABLE_DIR"

# Copie des scripts vers le répertoire stable
echo "📂 Copie des fichiers de configuration vers $STABLE_DIR"
cp ../jarvis_device_agent.py "$STABLE_DIR/"
cp jarvis_tunnel_manager.sh "$STABLE_DIR/"
chmod +x "$STABLE_DIR/jarvis_tunnel_manager.sh"

# Remplacement de TARGET_DIR dans les fichiers .plist avec le dossier stable
echo "📝 Configuration des chemins absolus vers le répertoire stable : $STABLE_DIR"

sed "s|TARGET_DIR|$STABLE_DIR|g" "$PLIST_BRIDGE" > /tmp/$PLIST_BRIDGE
sed "s|TARGET_DIR|$STABLE_DIR|g" "$PLIST_TUNNEL" > /tmp/$PLIST_TUNNEL

# Copie des fichiers vers LaunchAgents
echo "📂 Copie des fichiers de configuration vers $LAUNCH_AGENTS_DIR"
mkdir -p "$LAUNCH_AGENTS_DIR"
cp /tmp/$PLIST_BRIDGE "$LAUNCH_AGENTS_DIR/"
cp /tmp/$PLIST_TUNNEL "$LAUNCH_AGENTS_DIR/"

# Chargement des services via launchctl
echo "🚀 Démarrage des services J.A.R.V.I.S...."
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_BRIDGE" 2>/dev/null
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_TUNNEL" 2>/dev/null

launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_BRIDGE"
launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_TUNNEL"

echo "✅ Installation terminée avec succès !"
echo "Les services suivants tourneront désormais en permanence en arrière-plan :"
echo "- jarvis_mac_bridge (Serveur d'automatisation Mac)"
echo "- jarvis_tunnel_manager (Tunnel Cloudflare + Ping du backend J.A.R.V.I.S.)"
echo ""
echo "En cas de redémarrage de votre Mac, tout se reconnectera tout seul."
echo "Pour consulter les logs :"
echo "tail -f /tmp/jarvis_macbridge.out.log"
echo "tail -f /tmp/jarvis_tunnel_manager.out.log"
