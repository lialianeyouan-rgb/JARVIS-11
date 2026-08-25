#!/usr/bin/env python3
"""
J.A.R.V.I.S. macOS Local Host Bridge Daemon with Strict Whitelist & Security
"""

import http.server
import json
import os
import subprocess
import re

PORT = 8765
AUTH_TOKEN = os.environ.get("JARVIS_BRIDGE_TOKEN", "jarvis-secure-mac-token-2026")

# Strict Whitelist of allowed command patterns for Computer Use
WHITELIST_PATTERNS = [
    r'^open -a "(Visual Studio Code|Google Chrome|Safari|Terminal|Finder|Spotify|WhatsApp|Instagram|TikTok|Facebook|Discord|Slack)"(\s+".*")?$',
    r'^npm run dev$',
    r'^git status$',
    r'^echo\s+.*$',
    r'^mkdir -p\s+.*$',
    r'^mv\s+.*$',
    r'^cp\s+.*$',
    r'^ls(\s+.*)?$',
]

def is_command_allowed(command: str) -> bool:
    for pattern in WHITELIST_PATTERNS:
        if re.match(pattern, command.strip()):
            return True
    return False

class JarvisBridgeHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.read_body(content_length)
        
        # 1. Verify Bearer Token Authentication
        auth_header = self.headers.get('Authorization', '')
        if auth_header != f"Bearer {AUTH_TOKEN}":
            print(f"[SECURITY ALERT] Invalid or missing token: '{auth_header}'")
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": False,
                "error": "Unauthorized: Invalid or missing token",
                "code": 401
            }).encode('utf-8'))
            return

        if self.path == '/exec':
            command = body.get('command')
            if not command:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing 'command' parameter"}).encode('utf-8'))
                return

            # 2. Verify Whitelist Security
            if not is_command_allowed(command):
                print(f"[SECURITY BLOCK] Command rejected by whitelist: {command}")
                self.send_response(403)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": f"Forbidden: Command '{command}' is not authorized by the local Mac Bridge whitelist.",
                    "code": 403
                }).encode('utf-8'))
                return

            print(f"[JARVIS BRIDGE] Executing whitelisted command: {command}")
            try:
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                response_data = {
                    "success": result.returncode == 0,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "code": result.returncode
                }
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
            except subprocess.TimeoutExpired:
                self.send_response(504)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Command execution timed out (60s limit)"}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header != f"Bearer {AUTH_TOKEN}":
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unauthorized"}).encode('utf-8'))
            return

        if self.path == '/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "online",
                "system": "macOS",
                "agent": "JARVIS-Bridge",
                "whitelistActive": True
            }).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def read_body(self, length):
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode('utf-8'))
        except:
            return {}

def run():
    server_address = ('127.0.0.1', PORT)
    httpd = http.server.HTTPServer(server_address, JarvisBridgeHandler)
    print(f"==================================================")
    print(f" J.A.R.V.I.S. macOS Bridge Daemon active with Whitelist")
    print(f" Listening on http://127.0.0.1:{PORT}")
    print(f" Security Token: {AUTH_TOKEN}")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[JARVIS BRIDGE] Shutting down bridge daemon...")
        httpd.server_close()

if __name__ == '__main__':
    run()
