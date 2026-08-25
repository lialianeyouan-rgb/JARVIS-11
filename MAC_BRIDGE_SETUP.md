# Guide d'Installation : Pont macOS pour J.A.R.V.I.S.

Ce guide explique comment installer et configurer l'agent local sur votre Mac pour permettre à J.A.R.V.I.S. d'exécuter des commandes dans votre terminal, de lancer des scripts et d'agir comme votre jumeau numérique.

---

### Étape 1 : Télécharger et préparer le script sur votre Mac

1. Copiez le fichier `jarvis_mac_bridge.py` sur votre Mac (par exemple dans votre dossier `Documents` ou `~/.jarvis`).
2. Ouvrez votre **Terminal** macOS.

### Étape 2 : Lancer le Daemon local

Exécutez la commande suivante dans votre terminal :

```bash
python3 jarvis_mac_bridge.py
```

Vous devriez voir un message indiquant :
`J.A.R.V.I.S. macOS Bridge Daemon is active` sur `http://127.0.0.1:8765`.

### Étape 3 : Exposer le pont en toute sécurité (Tunnel HTTPS)

Puisque J.A.R.V.I.S. tourne dans le cloud sécurisé et que votre Mac est chez vous, vous avez besoin d'un tunnel sécurisé (comme `ngrok` ou `cloudflare`) pour relier le cloud à votre Mac.

1. Installez ngrok si ce n'est pas déjà fait :
   ```bash
   brew install ngrok/ngrok/ngrok
   ```
2. Lancez le tunnel vers le port 8765 :
   ```bash
   ngrok http 8765
   ```
3. Copiez l'URL HTTPS générée par ngrok (par exemple : `https://xxxx-xxxx.ngrok-free.app`).

### Étape 4 : Connexion avec J.A.R.V.I.S.

Donnez l'URL de votre tunnel ngrok et votre jeton de sécurité (`jarvis-secure-mac-token-2026`) à J.A.R.V.I.S. dans le chat, et il sera désormais capable d'exécuter des commandes directement sur votre machine, Sir !
