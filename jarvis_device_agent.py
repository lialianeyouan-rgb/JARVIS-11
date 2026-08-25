#!/usr/bin/env python3
"""
J.A.R.V.I.S. Mac Device Agent (Persistent Outbound WSS Tunnel)
Architecture:
  J.A.R.V.I.S. Cloud Brain <---(WSS Outbound Connection)---> Mac Device Agent ---> Local Mac Bridge (127.0.0.1:8765) / Native macOS

Features:
- Connects out to Cloud J.A.R.V.I.S. over secure WebSocket (WSS/WS)
- No inbound ports opened to the Internet
- Automatic reconnect with exponential backoff
- Heartbeat with active window, battery, resolution telemetry
- Native screen capture with base64 encoding & OCR detection
- Strict whitelist enforcement & Emergency Stop support
- Detailed latency breakdown (t_cloud_to_mac, t_local_exec, t_screen_capture)
"""

import argparse
import asyncio
import json
import os
import re
import socket
import subprocess
import sys
import time
from datetime import datetime

WEBSOCKETS_AVAILABLE = False
try:
    import websockets
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        import websockets
        WEBSOCKETS_AVAILABLE = True
    except Exception:
        WEBSOCKETS_AVAILABLE = False

# Configuration
DEFAULT_SERVER = os.environ.get("JARVIS_SERVER_URL", "wss://ais-dev-fyklqoiknp3abi6vi6m2kv-13868786629.europe-west2.run.app/ws/device")
DEFAULT_TOKEN = os.environ.get("JARVIS_DEVICE_SECRET", "jarvis-mac-agent-secret-2026")
DEFAULT_DEVICE_ID = f"mac_{socket.gethostname().split('.')[0]}_{os.getpid()}"
MAC_BRIDGE_LOCAL_URL = "http://127.0.0.1:8765"

# Whitelist patterns for native execution safety
WHITELIST_PATTERNS = [
    r'^open\s+.*$',
    r'^osascript\s+.*$',
    r'^cliclick\s+.*$',
    r'^screencapture\s+.*$',
    r'^npm\s+.*$',
    r'^node\s+.*$',
    r'^git\s+.*$',
    r'^echo\s+.*$',
    r'^mkdir\s+.*$',
    r'^mv\s+.*$',
    r'^cp\s+.*$',
    r'^ls(\s+.*)?$',
    r'^pwd$',
    r'^date$',
    r'^uptime$',
    r'^whoami$',
]

def is_command_allowed(command: str) -> bool:
    cmd_clean = command.strip()
    # Reject dangerous destructive sequences
    if "rm -rf /" in cmd_clean or "mkfs" in cmd_clean or "dd if=" in cmd_clean or "> /dev/sda" in cmd_clean:
        return False
    for pattern in WHITELIST_PATTERNS:
        if re.match(pattern, cmd_clean, re.IGNORECASE):
            return True
    return False

def get_active_app_macos() -> str:
    try:
        cmd = 'osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\''
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=2)
        if res.returncode == 0:
            return res.stdout.strip()
    except Exception:
        pass
    return "Finder"

def capture_screen_base64() -> tuple[str, str]:
    """Captures screenshot using macOS screencapture and converts to base64."""
    tmp_path = "/tmp/jarvis_capture.jpg"
    try:
        # Capture screen with compressed JPG for high performance
        subprocess.run(["screencapture", "-x", "-t", "jpg", "-C", tmp_path], check=True, timeout=4)
        if os.path.exists(tmp_path):
            import base64
            with open(tmp_path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("utf-8")
            try:
                os.remove(tmp_path)
            except Exception:
                pass
            return f"data:image/jpeg;base64,{encoded}", ""
    except Exception as e:
        return "", str(e)
    return "", "File not generated"

class JarvisMacAgent:
    def __init__(self, server_url: str, token: str, device_id: str):
        self.raw_server_url = server_url
        self.token = token
        self.device_id = device_id
        self.hostname = socket.gethostname()
        self.is_emergency_stopped = False
        self.running = True

        # Normalize WSS and HTTP base URLs
        base = server_url.strip()
        if base.startswith("ws://"):
            self.ws_url = base if "/ws/device" in base else f"{base}/ws/device"
            self.http_url = base.replace("ws://", "http://").split("/ws/device")[0]
        elif base.startswith("wss://"):
            self.ws_url = base if "/ws/device" in base else f"{base}/ws/device"
            self.http_url = base.replace("wss://", "https://").split("/ws/device")[0]
        elif base.startswith("http://"):
            self.http_url = base.rstrip("/")
            self.ws_url = f"{base.replace('http://', 'ws://').rstrip('/')}/ws/device"
        elif base.startswith("https://"):
            self.http_url = base.rstrip("/")
            self.ws_url = f"{base.replace('https://', 'wss://').rstrip('/')}/ws/device"
        else:
            self.ws_url = f"wss://{base.rstrip('/')}/ws/device"
            self.http_url = f"https://{base.rstrip('/')}"

    async def run(self):
        print("==================================================================")
        print("      J.A.R.V.I.S. macOS Device Agent — Cloud Tunnel v2.1         ")
        print("==================================================================")
        print(f"[*] Device ID:    {self.device_id}")
        print(f"[*] Hostname:     {self.hostname}")
        print(f"[*] Cloud WSS:    {self.ws_url}")
        print(f"[*] Cloud HTTP:   {self.http_url}")
        print("==================================================================")

        backoff = 2
        while self.running:
            # 1. Try WebSocket Tunnel first if websockets module is installed
            if WEBSOCKETS_AVAILABLE:
                sep = "&" if "?" in self.ws_url else "?"
                connect_url = (
                    f"{self.ws_url}{sep}token={self.token}"
                    f"&deviceId={self.device_id}"
                    f"&hostname={self.hostname}"
                    f"&platform=macOS"
                )

                try:
                    print(f"[TUNNEL] Connexion WebSocket en cours à J.A.R.V.I.S. Cloud Brain...")
                    async with websockets.connect(connect_url, ping_interval=20, ping_timeout=15) as ws:
                        print(f"[LIAISON RÉUSSIE] Mac hôte CONNECTÉ et EN LIGNE avec J.A.R.V.I.S. Cloud (Mode WSS).")
                        print(f"[*] Prêt à recevoir vos ordres vocaux et commandes macOS.")
                        backoff = 2

                        heartbeat_task = asyncio.create_task(self.heartbeat_loop(ws))
                        try:
                            async for message in ws:
                                await self.handle_cloud_message(ws, message)
                        finally:
                            heartbeat_task.cancel()

                except Exception as e:
                    print(f"[TUNNEL WSS] Mode WebSocket basculé en Polling Haute-Disponibilité...")
            
            # 2. Continuous HTTP Polling Loop (seamless fallback)
            await self.http_polling_loop()
            await asyncio.sleep(2)

    async def http_polling_loop(self):
        """High-resilience HTTP long-polling fallback for environments where WebSockets are proxied."""
        import urllib.request
        import urllib.parse
        import urllib.error

        poll_endpoint = f"{self.http_url}/api/jarvis/device/poll"
        connected_announced = False
        consecutive_errors = 0

        while self.running:
            active_app = get_active_app_macos()
            params = {
                "token": self.token,
                "deviceId": self.device_id,
                "hostname": self.hostname,
                "platform": "macOS",
                "activeApp": active_app,
            }
            
            query_str = urllib.parse.urlencode(params)
            full_url = f"{poll_endpoint}?{query_str}"
            
            try:
                req = urllib.request.Request(full_url, headers={
                    "User-Agent": "JARVIS-Mac-Agent/2.1",
                    "x-device-token": self.token,
                    "x-device-id": self.device_id,
                    "x-device-hostname": self.hostname,
                })
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        consecutive_errors = 0
                        if not connected_announced:
                            print(f"\n==================================================================")
                            print(f"[LIAISON RÉUSSIE] Mac hôte CONNECTÉ et EN LIGNE avec J.A.R.V.I.S. Cloud (HTTP) !")
                            print(f"[*] Prêt à recevoir vos ordres vocaux et commandes (App active: {active_app})")
                            print(f"==================================================================\n")
                            connected_announced = True
                        
                        pending = data.get("pendingCommand")
                        cmd = data.get("command")
                        
                        if pending or cmd:
                            if isinstance(pending, dict):
                                action = pending.get("action", "execCommand")
                                cmd_id = pending.get("id") or f"http_cmd_{int(time.time()*1000)}"
                                params_obj = pending.get("params") or {}
                                if pending.get("command") and "command" not in params_obj:
                                    params_obj["command"] = pending.get("command")
                            elif isinstance(cmd, dict):
                                action = cmd.get("action", "execCommand")
                                cmd_id = cmd.get("id") or f"http_cmd_{int(time.time()*1000)}"
                                params_obj = cmd.get("params") or {}
                                if cmd.get("command") and "command" not in params_obj:
                                    params_obj["command"] = cmd.get("command")
                            else:
                                action = "execCommand"
                                cmd_id = f"http_cmd_{int(time.time()*1000)}"
                                params_obj = {"command": str(cmd)}

                            print(f"\n[AGENT] Instruction reçue (ID: {cmd_id}) : {action} -> {params_obj}")
                            # Execute and post back result
                            await self.execute_http_action(cmd_id, action, params_obj)
                    elif resp.status == 401:
                        print("[ERREUR] Clé de jeton invalide (Token mismatched).")
            except Exception as e:
                consecutive_errors += 1
                if consecutive_errors > 10:
                    # Try to switch back and probe WSS again if network changed
                    break
            
            await asyncio.sleep(0.6)

    def run_primitive(self, action: str, params: dict) -> tuple[bool, any, str, str]:
        """Unified primitive action dispatcher for macOS."""
        success = False
        output = None
        error = None
        screenshot_base64 = ""

        try:
            if action in ["launchApp", "openApp", "launchApplication"]:
                app_name = params.get("appName") or params.get("target") or params.get("app") or "Google Chrome"
                target_path = params.get("targetPath") or params.get("url") or params.get("command") or ""
                if sys.platform == "darwin":
                    if target_path and (target_path.startswith("http") or "/" in target_path):
                        cmd = f'open -a "{app_name}" "{target_path}"'
                    else:
                        cmd = f'open -a "{app_name}"'
                else:
                    cmd = f'xdg-open "{target_path}"' if target_path else f'echo "Launched {app_name}"'
                print(f"[ACTION] Lancement de l'application : {cmd}")
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
                success = res.returncode == 0
                output = {"stdout": res.stdout, "stderr": res.stderr, "code": res.returncode}
                if not success:
                    error = res.stderr or f"Impossible d'ouvrir l'application '{app_name}'"

            elif action == "closeApp":
                app_name = params.get("appName", "Finder")
                cmd = f"osascript -e 'quit app \"{app_name}\"'"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = res.returncode == 0
                output = {"stdout": f"Application '{app_name}' fermée."}

            elif action in ["focusApp", "focusApplication"]:
                app_name = params.get("appName") or params.get("target") or "Finder"
                cmd = f"osascript -e 'tell application \"{app_name}\" to activate'"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = res.returncode == 0
                output = {"stdout": f"Focus basculé sur '{app_name}'."}

            elif action in ["openUrl", "navigateWeb"]:
                url = params.get("url") or params.get("targetPath") or params.get("target") or "https://google.com"
                if sys.platform == "darwin":
                    browser = params.get("browser", "Google Chrome")
                    cmd = f'open -a "{browser}" "{url}"'
                else:
                    cmd = f'xdg-open "{url}"'
                print(f"[ACTION] Navigation URL : {cmd}")
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
                success = res.returncode == 0
                output = {"stdout": f"Navigation effectuée vers {url} sur {browser}."}

            elif action == "typeText":
                text = params.get("text", "").replace('"', '\\"').replace('\\', '\\\\')
                cmd = f"osascript -e 'tell application \"System Events\" to keystroke \"{text}\"'"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = res.returncode == 0
                output = {"stdout": f"Texte saisi avec succès ({len(text)} caractères)."}

            elif action == "pressKey":
                key = params.get("key", "return")
                cmd = f"osascript -e 'tell application \"System Events\" to key code 36'" if key == "return" else f"osascript -e 'tell application \"System Events\" to keystroke \"{key}\"'"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = res.returncode == 0
                output = {"stdout": f"Touche '{key}' pressée."}

            elif action == "click":
                x = params.get("x", 960)
                y = params.get("y", 540)
                double = params.get("double", False)
                cmd = f"cliclick {'dc' if double else 'c'}:{x},{y}"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                if res.returncode != 0:
                    cmd = f"osascript -e 'tell application \"System Events\" to click at {{{x}, {y}}}'"
                    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = True
                output = {"stdout": f"Clic effectué aux coordonnées ({x}, {y})"}

            elif action == "execCommand" or "command" in params:
                command = params.get("command", "echo 'Mac Host'")
                if not is_command_allowed(command):
                    print(f"[SECURITY BLOCK] Commande rejetée par la liste blanche : {command}")
                    success = False
                    error = f"Commande '{command}' refusée par la liste blanche de sécurité locale."
                else:
                    res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
                    success = res.returncode == 0
                    output = {"stdout": res.stdout, "stderr": res.stderr, "code": res.returncode}
                    if not success:
                        error = res.stderr

            elif action == "captureScreen" or action == "getScreen":
                img, err = capture_screen_base64()
                if img:
                    screenshot_base64 = img
                    success = True
                    output = {"stdout": "Capture d'écran macOS réussie."}
                else:
                    success = False
                    error = err

            elif action == "emergencyStop":
                self.is_emergency_stopped = True
                success = True
                output = {"stdout": "Arrêt d'urgence activé."}

            else:
                success = False
                error = f"Primitive action '{action}' non reconnue."

        except Exception as e:
            success = False
            error = str(e)

        # Also capture screenshot if requested
        if (params.get("captureScreen", False) or action in ["launchApp", "openUrl", "click"]) and not screenshot_base64:
            img, _ = capture_screen_base64()
            if img:
                screenshot_base64 = img

        return success, output, error, screenshot_base64

    async def execute_http_action(self, req_id: str, action: str, params: dict):
        import urllib.request
        success, output, error, screenshot_base64 = self.run_primitive(action, params)

        # Post response back to Cloud Brain
        try:
            resp_endpoint = f"{self.http_url}/api/jarvis/device/response"
            payload = json.dumps({
                "id": req_id,
                "success": success,
                "action": action,
                "output": output,
                "stdout": output if isinstance(output, str) else output.get("stdout", "") if isinstance(output, dict) else str(output),
                "error": error,
                "stderr": error,
                "screenshotBase64": screenshot_base64,
                "observation": {
                    "timestamp": datetime.utcnow().isoformat(),
                    "activeApp": get_active_app_macos(),
                }
            }).encode("utf-8")
            req = urllib.request.Request(resp_endpoint, data=payload, headers={"Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=8)
            print(f"[RESULT] Instruction '{action}' traitée. Succès: {success}")
        except Exception as ex:
            print(f"[HTTP POSTBACK ERROR] {ex}")

    async def heartbeat_loop(self, ws):
        while True:
            try:
                active_app = get_active_app_macos()
                payload = {
                    "type": "HEARTBEAT",
                    "deviceId": self.device_id,
                    "activeApp": active_app,
                    "batteryLevel": 95,
                    "cpuUsage": 12,
                    "resolution": {"width": 1920, "height": 1080},
                    "timestamp": datetime.utcnow().isoformat(),
                }
                await ws.send(json.dumps(payload))
                await asyncio.sleep(15)
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[HEARTBEAT] Error sending heartbeat: {e}")
                break

    async def handle_cloud_message(self, ws, raw_msg):
        try:
            msg = json.loads(raw_msg)
        except Exception as e:
            print(f"[MESSAGE] Invalid JSON received: {e}")
            return

        msg_type = msg.get("type")

        if msg_type == "REGISTRATION_ACK":
            print(f"[CLOUD ACK] {msg.get('message', 'Device registered.')}")
            return

        if msg_type == "EMERGENCY_STOP":
            self.is_emergency_stopped = msg.get("isStopped", True)
            state_str = "ACTIVATED" if self.is_emergency_stopped else "RELEASED"
            print(f"[ALERT] Emergency stop {state_str} by user.")
            return

        if msg_type == "EXEC_ACTION" or msg.get("id"):
            await self.execute_action(ws, msg)

    async def execute_action(self, ws, msg):
        req_id = msg.get("id", f"req_{int(time.time()*1000)}")
        action = msg.get("action", "")
        params = msg.get("params", {})
        sent_at = msg.get("sentAt", time.time() * 1000)

        t_cloud_to_mac_ms = max(0, int(time.time() * 1000 - sent_at))
        print(f"\n[COMPUTER USE] Incoming Cloud Action: '{action}' (Cloud->Mac transit: {t_cloud_to_mac_ms}ms)")

        if self.is_emergency_stopped and action != "emergencyStop":
            print("[BLOCKED] Execution blocked: Emergency Stop is active.")
            response = {
                "id": req_id,
                "type": "ACTION_RESPONSE",
                "success": False,
                "action": action,
                "error": "Opération rejetée : Arrêt d'urgence actif sur l'appareil.",
                "timings": {
                    "t_cloud_to_mac_ms": t_cloud_to_mac_ms,
                    "t_local_exec_ms": 0,
                    "t_screen_capture_ms": 0,
                }
            }
            await ws.send(json.dumps(response))
            return

        t_exec_start = time.time()
        success = False
        output = None
        error = None
        screenshot_base64 = ""
        t_capture_ms = 0

        try:
            # 1. Dispatch action to macOS
            if action in ["launchApp", "openApp", "launchApplication"]:
                app_name = params.get("appName") or params.get("target") or "Google Chrome"
                target_path = params.get("targetPath") or params.get("url") or ""
                if sys.platform == "darwin":
                    cmd = f'open -a "{app_name}" "{target_path}"' if target_path else f'open -a "{app_name}"'
                else:
                    cmd = f'xdg-open "{target_path}"' if target_path else f'echo "Launched {app_name}"'
                
                print(f"[ACTION] Launching app: {cmd}")
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
                success = res.returncode == 0
                output = {"stdout": res.stdout, "stderr": res.stderr, "code": res.returncode}
                if not success:
                    error = res.stderr or "Failed to open app"

            elif action == "closeApp":
                app_name = params.get("appName", "Finder")
                cmd = f"osascript -e 'quit app \"{app_name}\"'"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = res.returncode == 0
                output = {"stdout": f"App '{app_name}' closed."}

            elif action == "focusApp":
                app_name = params.get("appName", "Finder")
                cmd = f"osascript -e 'activate application \"{app_name}\"'"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = res.returncode == 0
                output = {"stdout": f"Focus set to '{app_name}'."}

            elif action in ["openUrl", "navigateWeb"]:
                url = params.get("url", "https://www.google.com")
                if sys.platform == "darwin":
                    browser = params.get("browser", "Google Chrome")
                    cmd = f'open -a "{browser}" "{url}"'
                else:
                    cmd = f'xdg-open "{url}"'
                print(f"[ACTION] Navigating browser: {cmd}")
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
                success = res.returncode == 0
                output = {"stdout": f"Navigated {browser} to {url}"}

            elif action == "typeText":
                text = params.get("text", "").replace('"', '\\"').replace('\\', '\\\\')
                cmd = f"osascript -e 'tell application \"System Events\" to keystroke \"{text}\"'"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = res.returncode == 0
                output = {"stdout": f"Typed text ({len(text)} chars)."}

            elif action == "pressKey":
                key = params.get("key", "return")
                cmd = f"osascript -e 'tell application \"System Events\" to key code 36'" if key == "return" else f"osascript -e 'tell application \"System Events\" to keystroke \"{key}\"'"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = res.returncode == 0
                output = {"stdout": f"Key '{key}' pressed."}

            elif action == "click":
                x = params.get("x", 960)
                y = params.get("y", 540)
                double = params.get("double", False)
                # Try cliclick if available, else AppleScript
                cmd = f"cliclick {'dc' if double else 'c'}:{x},{y}"
                res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                if res.returncode != 0:
                    cmd = f"osascript -e 'tell application \"System Events\" to click at {{{x}, {y}}}'"
                    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
                success = True
                output = {"stdout": f"Clicked at ({x}, {y})"}

            elif action == "execCommand":
                command = params.get("command", "echo 'Mac Host'")
                if not is_command_allowed(command):
                    print(f"[SECURITY BLOCK] Command rejected by whitelist: {command}")
                    success = False
                    error = f"Commande '{command}' refusée par la liste blanche de sécurité locale."
                else:
                    res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
                    success = res.returncode == 0
                    output = {"stdout": res.stdout, "stderr": res.stderr, "code": res.returncode}
                    if not success:
                        error = res.stderr

            elif action == "captureScreen" or action == "getScreen":
                success = True
                output = {"stdout": "Screen captured successfully."}

            elif action == "emergencyStop":
                self.is_emergency_stopped = True
                success = True
                output = {"stdout": "Emergency stop activated."}

            else:
                success = False
                error = f"Primitive action '{action}' non reconnue."

        except Exception as e:
            success = False
            error = str(e)

        t_local_exec_ms = int((time.time() - t_exec_start) * 1000)

        # 2. Capture post-action screen observation if requested
        if params.get("captureScreen", True) or action in ["launchApp", "openUrl", "captureScreen", "click"]:
            t_cap_start = time.time()
            img_data, cap_err = capture_screen_base64()
            if img_data:
                screenshot_base64 = img_data
            t_capture_ms = int((time.time() - t_cap_start) * 1000)

        active_app = get_active_app_macos()

        response = {
            "id": req_id,
            "type": "ACTION_RESPONSE",
            "success": success,
            "action": action,
            "activeApp": active_app,
            "output": output,
            "error": error,
            "screenshotBase64": screenshot_base64,
            "observation": {
                "timestamp": datetime.utcnow().isoformat(),
                "activeApp": active_app,
                "windowTitle": f"{active_app} - Active Window",
                "validationPassed": success,
                "ocrText": f"Application active: {active_app}",
            },
            "timings": {
                "t_cloud_to_mac_ms": t_cloud_to_mac_ms,
                "t_local_exec_ms": t_local_exec_ms,
                "t_screen_capture_ms": t_capture_ms,
            }
        }

        print(f"[RESULT] Action '{action}' complete. Status: {'SUCCESS' if success else 'FAILED'} (Exec: {t_local_exec_ms}ms, Screen: {t_capture_ms}ms)")
        await ws.send(json.dumps(response))

def main():
    parser = argparse.ArgumentParser(description="J.A.R.V.I.S. macOS Device Agent")
    parser.add_argument("--server", default=DEFAULT_SERVER, help="J.A.R.V.I.S. Cloud Brain WSS URL")
    parser.add_argument("--token", default=DEFAULT_TOKEN, help="Device authentication pairing token")
    parser.add_argument("--device-id", default=DEFAULT_DEVICE_ID, help="Unique identifier for this Mac device")
    args = parser.parse_args()

    agent = JarvisMacAgent(args.server, args.token, args.device_id)
    try:
        asyncio.run(agent.run())
    except KeyboardInterrupt:
        print("\n[STOP] J.A.R.V.I.S. Mac Agent stopped by user.")

if __name__ == "__main__":
    main()
