#!/usr/bin/env python3
"""
J.A.R.V.I.S. Instant Mac Connector
Liaison ultra-rapide et directe entre macOS et J.A.R.V.I.S. Cloud.
Aucune dépendance externe requise (utilise uniquement les modules standards Python 3 et macOS).
"""

import sys
import os
import time
import json
import socket
import subprocess
import urllib.request
import urllib.parse
import urllib.error

# Paramètres de connexion
raw_server = os.environ.get("JARVIS_SERVER", "https://ais-pre-fyklqoiknp3abi6vi6m2kv-13868786629.europe-west2.run.app").rstrip("/")
SERVER_URL = raw_server.replace("ais-dev-", "ais-pre-")
TOKEN = os.environ.get("JARVIS_TOKEN", "jarvis-mac-agent-secret-2026")
DEVICE_ID = f"mac_{socket.gethostname().split('.')[0]}"
HOSTNAME = socket.gethostname()

def get_active_app():
    try:
        if sys.platform == "darwin":
            cmd = "osascript -e 'tell application \"System Events\" to get name of first application process whose frontmost is true'"
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=2)
            if res.returncode == 0 and res.stdout.strip():
                return res.stdout.strip()
    except Exception:
        pass
    return "Finder"

def capture_screenshot():
    tmp_file = "/tmp/jarvis_screen.jpg"
    try:
        if sys.platform == "darwin":
            subprocess.run(["screencapture", "-x", "-t", "jpg", "-C", tmp_file], timeout=4, check=True)
            if os.path.exists(tmp_file):
                import base64
                with open(tmp_file, "rb") as f:
                    data = base64.b64encode(f.read()).decode("utf-8")
                os.remove(tmp_file)
                return f"data:image/jpeg;base64,{data}"
    except Exception:
        pass
    return ""

def execute_mac_action(action, params):
    output = ""
    error = ""
    success = True

    try:
        if action in ["launchApp", "openApp", "launchApplication"]:
            app_name = params.get("appName") or params.get("target") or "Google Chrome"
            target_url = params.get("url") or params.get("targetPath") or params.get("command") or ""
            if sys.platform == "darwin":
                if target_url and target_url.startswith("http"):
                    cmd = f"open -a \"{app_name}\" \"{target_url}\""
                else:
                    cmd = f"open -a \"{app_name}\""
            else:
                cmd = f"xdg-open \"{target_url}\"" if target_url else f"echo 'Launched {app_name}'"
            print(f"[ACTION] Lancement application : {cmd}")
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            output, error, success = r.stdout, r.stderr, (r.returncode == 0)

        elif action in ["focusApp", "focusApplication"]:
            app_name = params.get("appName") or params.get("target") or "Finder"
            if sys.platform == "darwin":
                cmd = f"osascript -e 'tell application \"{app_name}\" to activate'"
            else:
                cmd = f"echo 'Focus {app_name}'"
            print(f"[ACTION] Focus application : {app_name}")
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            output, error, success = r.stdout, r.stderr, (r.returncode == 0)

        elif action in ["openUrl", "navigateWeb"]:
            url = params.get("url") or params.get("targetPath") or params.get("target") or "https://google.com"
            cmd = f"open \"{url}\"" if sys.platform == "darwin" else f"xdg-open \"{url}\""
            print(f"[ACTION] Ouverture URL : {cmd}")
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
            output, error, success = r.stdout, r.stderr, (r.returncode == 0)

        elif action == "click":
            x = params.get("x", 500)
            y = params.get("y", 500)
            print(f"[ACTION] Clic à ({x}, {y})")
            as_cmd = f"osascript -e 'tell application \"System Events\" to click at {{{x}, {y}}}'"
            r = subprocess.run(as_cmd, shell=True, capture_output=True, text=True, timeout=5)
            output, error, success = r.stdout, r.stderr, (r.returncode == 0)

        elif action == "typeText":
            text = params.get("text", "")
            escaped = text.replace("\"", "\\\"").replace("\\", "\\\\")
            print(f"[ACTION] Saisie texte : {text[:30]}...")
            as_cmd = f"osascript -e 'tell application \"System Events\" to keystroke \"{escaped}\"'"
            r = subprocess.run(as_cmd, shell=True, capture_output=True, text=True, timeout=5)
            output, error, success = r.stdout, r.stderr, (r.returncode == 0)

        elif action == "pressKey":
            key = params.get("key", "return")
            print(f"[ACTION] Touche : {key}")
            as_cmd = f"osascript -e 'tell application \"System Events\" to key code 36'" if key.lower() in ["return", "enter"] else f"osascript -e 'tell application \"System Events\" to keystroke \"{key}\"'"
            r = subprocess.run(as_cmd, shell=True, capture_output=True, text=True, timeout=5)
            output, error, success = r.stdout, r.stderr, (r.returncode == 0)

        elif action in ["execCommand", "executeCommand", "shellCommand"]:
            cmd = params.get("command") or ""
            print(f"[ACTION] Exécution commande : {cmd}")
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            output, error, success = r.stdout, r.stderr, (r.returncode == 0)

        elif action in ["captureScreen", "readScreen"]:
            output = "Capture et analyse d'écran effectuées."
            success = True

        else:
            cmd = params.get("command") or params.get("target")
            if cmd:
                r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
                output, error, success = r.stdout, r.stderr, (r.returncode == 0)
            else:
                success = False
                error = f"Action non gérée: {action}"

    except Exception as e:
        success = False
        error = str(e)

    return success, output, error

def main():
    if len(sys.argv) > 1 and sys.argv[1].startswith("http"):
        global SERVER_URL
        arg_url = sys.argv[1].rstrip("/")
        if "ais-dev-" in arg_url:
            arg_url = arg_url.replace("ais-dev-", "ais-pre-")
            print("[INFO] Redirection automatique de l'URL dev (ais-dev) vers l'URL publique (ais-pre) pour éviter le blocage HTTP 302.")
        SERVER_URL = arg_url
    if len(sys.argv) > 2:
        global TOKEN
        TOKEN = sys.argv[2]

    print("=" * 65)
    print("      J.A.R.V.I.S. Mac Direct Connector (Haute Vitesse)")
    print("=" * 65)
    print(f"[*] Serveur Cloud : {SERVER_URL}")
    print(f"[*] Périphérique   : {HOSTNAME} ({DEVICE_ID})")
    print("=" * 65)

    connected_announced = False
    poll_url = f"{SERVER_URL}/api/jarvis/device/poll"
    resp_url = f"{SERVER_URL}/api/jarvis/device/response"

    while True:
        try:
            active_app = get_active_app()
            query_data = urllib.parse.urlencode({
                "token": TOKEN,
                "deviceId": DEVICE_ID,
                "hostname": HOSTNAME,
                "platform": "macOS",
                "activeApp": active_app
            })

            req = urllib.request.Request(
                f"{poll_url}?{query_data}",
                headers={
                    "User-Agent": "JARVIS-Mac-Direct/1.0",
                    "x-device-token": TOKEN,
                    "x-device-id": DEVICE_ID
                }
            )

            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    if not connected_announced:
                        print(f"\n[✓ CONNECTÉ] Votre Mac est désormais relié à J.A.R.V.I.S. Cloud !")
                        print(f"[*] En écoute des commandes vocales et textuelles (App active: {active_app})...\n")
                        connected_announced = True

                    data = json.loads(response.read().decode("utf-8"))
                    pending = data.get("pendingCommand") or data.get("command")
                    if pending:
                        cmd_id = pending.get("id") if isinstance(pending, dict) else f"cmd_{int(time.time()*1000)}"
                        action = pending.get("action") or pending.get("primitive") or "execCommand"
                        params = pending.get("params", {}) if isinstance(pending, dict) else {"command": str(pending)}
                        if not params and isinstance(pending, dict) and pending.get("target"):
                            params = {"target": pending.get("target"), "appName": pending.get("target")}

                        print(f"\n[INSTRUCTION REÇUE] {action} -> {params}")
                        success, out, err = execute_mac_action(action, params)

                        screen_b64 = ""
                        if action in ["launchApp", "openApp", "launchApplication", "openUrl", "navigateWeb", "captureScreen", "readScreen"]:
                            screen_b64 = capture_screenshot()

                        result_payload = {
                            "id": cmd_id,
                            "success": success,
                            "action": action,
                            "output": out or "Exécution terminée avec succès.",
                            "error": err,
                            "activeApp": get_active_app(),
                            "screenshotBase64": screen_b64,
                        }

                        post_req = urllib.request.Request(
                            resp_url,
                            data=json.dumps(result_payload).encode("utf-8"),
                            headers={
                                "Content-Type": "application/json",
                                "x-device-token": TOKEN
                            }
                        )
                        urllib.request.urlopen(post_req, timeout=10)
                        print(f"[RÉSULTAT TRANSMIS] Statut: {'SUCCÈS' if success else 'ERREUR'}")

        except urllib.error.HTTPError as e:
            if e.code == 401:
                print(f"[ERREUR 401] Jeton d'authentification invalide.")
            time.sleep(2)
        except Exception as e:
            time.sleep(1)

        time.sleep(0.5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[*] Arrêt du connecteur J.A.R.V.I.S.")

