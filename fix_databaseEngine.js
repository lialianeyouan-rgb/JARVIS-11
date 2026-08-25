import fs from 'fs';

let dbEngineContent = fs.readFileSync('server/core/databaseEngine.ts', 'utf8');

// Replace getTasks() with an empty array.
dbEngineContent = dbEngineContent.replace(
  /public getTasks\(\): TaskRow\[\] \{[\s\S]*?return \[[\s\S]*?\];\s*\}/,
  'public getTasks(): TaskRow[] {\n    return [];\n  }'
);

// Replace getSystemIntegrations() with real logic that doesn't mock latencies.
const getIntegrationsRegex = /public getSystemIntegrations\(\): SystemIntegrationRow\[\] \{[\s\S]*?return \[[\s\S]*?\];\s*\}/;
dbEngineContent = dbEngineContent.replace(
  getIntegrationsRegex,
  `public getSystemIntegrations(): SystemIntegrationRow[] {
    const isDeviceOnline = deviceManager.isDeviceOnline();
    let hasGoogle = false;
    try {
      hasGoogle = googleAuthService.getStatus().authenticated;
    } catch {
      hasGoogle = false;
    }
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY);
    const now = new Date().toISOString();

    return [
      {
        id: 1,
        service_name: "mac_bridge",
        service_title: "Mac OS Native Bridge Daemon (Port 8765 / WebSocket)",
        category: "Hardware OS Controller",
        status: isDeviceOnline ? "online" : "offline",
        last_checked: now,
        endpoint: isDeviceOnline ? "ws://localhost:3000/ws/device" : "Not connected",
        latency_ms: 0,
        error_message: isDeviceOnline ? null : "Daemon local hors ligne",
        version: "2.4.0",
        metadata: JSON.stringify({ protocol: "WebSocket / REST", target: "macOS Darwin arm64/x86_64", paired: isDeviceOnline })
      },
      {
        id: 2,
        service_name: "gemini_core",
        service_title: "Google Gemini 2.5/3.7 Quantum Engine",
        category: "LLM Provider",
        status: hasGemini ? "connected" : "unconfigured",
        last_checked: now,
        endpoint: "https://generativelanguage.googleapis.com",
        latency_ms: 0,
        error_message: hasGemini ? null : "GEMINI_API_KEY manquant",
        version: "@google/genai ^2.4.0",
        metadata: JSON.stringify({ modelChain: ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"] })
      },
      {
        id: 3,
        service_name: "google_workspace",
        service_title: "Google Workspace APIs (Drive, Docs, Sheets, Calendar, Fit)",
        category: "Productivity API",
        status: hasGoogle ? "connected" : "offline",
        last_checked: now,
        endpoint: "https://www.googleapis.com",
        latency_ms: 0,
        error_message: hasGoogle ? null : "Authentification OAuth requise",
        version: "v3 / v4",
        metadata: JSON.stringify({ scopes: ["drive.readonly", "documents", "spreadsheets", "calendar.events", "fitness.activity.read"] })
      },
      {
        id: 4,
        service_name: "gmail_smtp",
        service_title: "Gmail & SMTP Communication Gateway",
        category: "Email Gateway",
        status: hasGoogle ? "connected" : "offline",
        last_checked: now,
        endpoint: "https://gmail.googleapis.com",
        latency_ms: 0,
        error_message: hasGoogle ? null : "Authentification OAuth requise",
        version: "1.2.0",
        metadata: JSON.stringify({ draftStorage: "active", dispatchReady: hasGoogle })
      },
      {
        id: 5,
        service_name: "neural_tts",
        service_title: "Neural Speech Engine (ElevenLabs & Web Audio DSP)",
        category: "Voice Subsystem",
        status: "connected",
        last_checked: now,
        endpoint: hasElevenLabs ? "https://api.elevenlabs.io" : "WebAudioDSP://internal",
        latency_ms: 0,
        error_message: null,
        version: "3.0.0",
        metadata: JSON.stringify({ primaryProvider: hasElevenLabs ? "ElevenLabs Multilingual v2" : "Web Audio DSP HD", activePreset: "jarvis" })
      }
    ];
  }`
);

dbEngineContent = dbEngineContent.replace(
  /private initStaticTables\(\) \{[\s\S]*?\}\s*\]\);\s*\}/,
  `private initStaticTables() {
    this.customTables.set("device_nodes", []);
  }`
);

fs.writeFileSync('server/core/databaseEngine.ts', dbEngineContent);
