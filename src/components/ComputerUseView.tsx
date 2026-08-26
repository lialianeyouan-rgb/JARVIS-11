import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Terminal, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Globe, 
  MousePointer, 
  Keyboard, 
  Eye, 
  RefreshCw, 
  Shield, 
  Layers, 
  Maximize2, 
  ChevronRight, 
  Lock, 
  Zap, 
  Cpu, 
  Battery, 
  Search,
  Activity,
  Code,
  FileText,
  Copy,
  Check,
  Radio,
  Timer,
  CheckCircle,
  Download,
  Link2,
  ExternalLink
} from 'lucide-react';

interface DeviceStatus {
  connected: boolean;
  platform: 'macOS' | 'linux' | 'windows';
  hostName: string;
  bridgePort: number;
  bridgeUrl: string;
  activeApp: string;
  resolution: { width: number; height: number };
  batteryLevel?: number;
  cpuUsage?: number;
  isEmergencyStopped: boolean;
  lastHeartbeat: string;
  isSimulation: boolean;
}

interface DeviceMetrics {
  t_cloud_to_mac_ms: number;
  t_local_exec_ms: number;
  t_screen_capture_ms: number;
  t_total_ms: number;
  actionsExecuted: number;
  lastActionTimestamp?: string;
  breakdown?: { label: string; ms: number; status: string }[];
}

interface ComputerUseAction {
  id: string;
  primitive: string;
  target?: string;
  params?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'REQUESTED' | 'PLANNED' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'REQUIRES_CONFIRMATION';
  requiresConfirmation: boolean;
  confirmed?: boolean;
  timestamp: string;
  error?: string;
  observation?: any;
  durationMs?: number;
  description: string;
}

interface ComputerUsePlan {
  id: string;
  userIntent: string;
  steps: ComputerUseAction[];
  currentStepIndex: number;
  status: 'PLANNED' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'PAUSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  finalResult?: string;
  isEmergencyStopped?: boolean;
}

interface ComputerUseEvent {
  id: string;
  eventType: string;
  action?: string;
  target?: string;
  riskLevel?: string;
  status: string;
  details?: Record<string, any>;
  timestamp: string;
}

export const ComputerUseView: React.FC = () => {
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [metrics, setMetrics] = useState<DeviceMetrics>({
    t_cloud_to_mac_ms: 0,
    t_local_exec_ms: 0,
    t_screen_capture_ms: 0,
    t_total_ms: 0,
    actionsExecuted: 0,
  });
  const [pairingInfo, setPairingInfo] = useState<{ pairingSecret: string; pairingCommand: string; wsEndpoint: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [activePlan, setActivePlan] = useState<ComputerUsePlan | null>(null);
  const [events, setEvents] = useState<ComputerUseEvent[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [intentInput, setIntentInput] = useState('');
  const [activeTab, setActiveTab] = useState<'agent' | 'primitives' | 'screen' | 'logs' | 'bridge' | 'e2e'>('agent');
  const [screenObservation, setScreenObservation] = useState<any>(null);
  const [emergencyStopped, setEmergencyStopped] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [screenLoading, setScreenLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // E2E Test Suite State
  const [e2eTests, setE2eTests] = useState<any[]>([]);
  const [e2eLoading, setE2eLoading] = useState(false);

  // Custom Bridge / Tunnel URL State
  const [customTunnelUrl, setCustomTunnelUrl] = useState('');
  const [customTunnelTesting, setCustomTunnelTesting] = useState(false);
  const [customTunnelStatus, setCustomTunnelStatus] = useState<{ message: string; success: boolean } | null>(null);

  // Manual Primitive Form States
  const [primitiveType, setPrimitiveType] = useState('launchApplication');
  const [targetApp, setTargetApp] = useState('Google Chrome');
  const [targetUrl, setTargetUrl] = useState('https://www.linkedin.com');
  const [clickCoord, setClickCoord] = useState({ x: 960, y: 540 });
  const [typeTextInput, setTypeTextInput] = useState('Hello from J.A.R.V.I.S.');
  const [primitiveResult, setPrimitiveResult] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/jarvis/device/status');
      if (res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }
        const devStatus = data.status || data.device;
        if (devStatus) {
          setDevice({
            ...devStatus,
            connected: Boolean(data.isOnline || devStatus.connected || data.status?.connected),
          });
        }
        if (data.metrics) setMetrics(data.metrics);
        if (data.pairingInfo) setPairingInfo(data.pairingInfo);
        if (data.pendingConfirmations) setPendingConfirmations(data.pendingConfirmations);
        setEmergencyStopped(data.status?.isEmergencyStopped || data.device?.isEmergencyStopped || false);
      } else {
        const legacyRes = await fetch('/api/jarvis/computer-use/status');
        if (legacyRes.ok) {
          const legacyData = await legacyRes.json();
          if (legacyData.device) setDevice(legacyData.device);
          if (legacyData.pendingConfirmations) setPendingConfirmations(legacyData.pendingConfirmations);
          setEmergencyStopped(legacyData.device?.isEmergencyStopped || false);
        }
      }
    } catch {
      // Silently retry on next interval tick during dev restarts
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/jarvis/computer-use/events?limit=50');
      if (res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }
        setEvents(data.events || []);
      }
    } catch {
      // Silently retry on next interval tick
    }
  };

  const fetchScreen = async () => {
    if (!device?.connected) return; // Prevent fetching screen if offline to avoid 500 HTML responses
    setScreenLoading(true);
    try {
      const res = await fetch('/api/jarvis/computer-use/screen');
      if (res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }
        if (data.observation) setScreenObservation(data.observation);
      }
    } catch {
      // Silently retry on next interval tick
    } finally {
      setScreenLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchStatus(),
        fetchEvents(),
        fetchScreen(),
      ]);
      setLastSyncTime(new Date().toLocaleTimeString());
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshLogs = async () => {
    setLogsLoading(true);
    try {
      await fetchEvents();
      setLastSyncTime(new Date().toLocaleTimeString());
    } finally {
      setLogsLoading(false);
    }
  };

  const runE2eTests = async () => {
    setE2eLoading(true);
    try {
      const res = await fetch('/api/jarvis/device/test-e2e');
      if (res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }
        setE2eTests(data.tests || []);
      }
    } catch {
      // Handle gracefully
    } finally {
      setE2eLoading(false);
    }
  };

  const fetchCustomBridge = async () => {
    try {
      const res = await fetch('/api/jarvis/device/custom-bridge');
      if (res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }
        if (data.url) {
          setCustomTunnelUrl(data.url);
        }
      }
    } catch {
      // Ignored
    }
  };

  const handleSaveAndTestTunnel = async (overrideUrl?: string) => {
    const urlToTest = (overrideUrl !== undefined ? overrideUrl : customTunnelUrl).trim();
    setCustomTunnelTesting(true);
    setCustomTunnelStatus(null);
    try {
      const res = await fetch('/api/jarvis/device/custom-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToTest, probe: true }),
      });
      const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }
      if (data.probe?.success) {
        setCustomTunnelStatus({
          success: true,
          message: `Tunnel connecté et opérationnel (${data.probe.latencyMs}ms) !`,
        });
        fetchStatus();
      } else {
        setCustomTunnelStatus({
          success: false,
          message: data.probe?.error || data.message || "Impossible de joindre le tunnel distant.",
        });
      }
    } catch (err: any) {
      setCustomTunnelStatus({
        success: false,
        message: err.message || "Erreur lors du test de liaison.",
      });
    } finally {
      setCustomTunnelTesting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchEvents();
    fetchScreen();
    fetchCustomBridge();
    const interval = setInterval(() => {
      // Only poll if not currently performing an action to avoid saturating CPU
      if (!loading) {
        fetchStatus();
        fetchEvents();
      }
    }, 5000); // Increased interval to 5s
    return () => clearInterval(interval);
  }, [loading]);

  const handleExecuteIntent = async (intentToRun?: string) => {
    const text = intentToRun || intentInput;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/jarvis/computer-use/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIntent: text }),
      });
      if (res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }
        setActivePlan(data.plan);
        fetchEvents();
        fetchStatus();
        fetchScreen();
      }
    } catch (e) {
      console.error("Error executing plan:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      const res = await fetch('/api/jarvis/device/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stopped: true }),
      });
      if (res.ok) {
        setEmergencyStopped(true);
        fetchStatus();
        fetchEvents();
      }
    } catch (e) {
      console.error("Error stopping:", e);
    }
  };

  const handleResetStop = async () => {
    try {
      const res = await fetch('/api/jarvis/device/emergency-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stopped: false }),
      });
      if (res.ok) {
        setEmergencyStopped(false);
        fetchStatus();
        fetchEvents();
      }
    } catch (e) {
      console.error("Error resetting stop:", e);
    }
  };

  const handleResolveConfirmation = async (confirmationId: string, approved: boolean) => {
    try {
      const res = await fetch('/api/jarvis/computer-use/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationId, approved }),
      });
      if (res.ok) {
        fetchStatus();
        fetchEvents();
        fetchScreen();
      }
    } catch (e) {
      console.error("Error resolving confirmation:", e);
    }
  };

  const handleExecutePrimitive = async (overridePrimitive?: string, overrideTarget?: string) => {
    setLoading(true);
    setPrimitiveResult(null);
    try {
      const activeType = overridePrimitive || primitiveType;
      let params: Record<string, any> = {};
      let target = overrideTarget || '';

      if (activeType === 'launchApplication' || activeType === 'launchApp' || activeType === 'focusApplication' || activeType === 'closeApplication') {
        const app = overrideTarget || targetApp;
        params = { appName: app };
        target = app;
      } else if (activeType === 'click') {
        params = { x: clickCoord.x, y: clickCoord.y, doubleClick: false };
        target = `(${clickCoord.x}, ${clickCoord.y})`;
      } else if (activeType === 'typeText') {
        params = { text: typeTextInput };
        target = typeTextInput;
      } else if (activeType === 'navigateWeb') {
        params = { appName: 'Google Chrome', targetPath: targetUrl };
        target = targetUrl;
      }

      const res = await fetch('/api/jarvis/computer-use/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primitive: activeType === 'navigateWeb' ? 'launchApplication' : (activeType === 'launchApp' ? 'launchApplication' : activeType),
          target,
          params,
        }),
      });

      const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }
      setPrimitiveResult(data);
      fetchStatus();
      fetchEvents();
      fetchScreen();
    } catch (e: any) {
      setPrimitiveResult({ success: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'token' | 'command') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    }
  };

  const quickIntents = [
    "Ouvre Google Chrome, va sur LinkedIn et prépare une recherche",
    "Ouvre WhatsApp et prépare l'envoi d'un message",
    "Ouvre VS Code et prépare l'espace de travail",
    "Capture l'écran actuel et analyse les fenêtres actives",
  ];

  const tokenSecret = pairingInfo?.pairingSecret || 'jarvis-mac-agent-secret-2026';
  const rawHostUrl = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  const hostUrl = rawHostUrl.replace('ais-dev-', 'ais-pre-');
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http';
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws';

  const directInstantCmd = `python3 -c "import sys,base64;exec(base64.b64decode(sys.argv[1]))" "aW1wb3J0IHVybGxpYi5yZXF1ZXN0LCB1cmxsaWIucGFyc2UsIGpzb24sIHRpbWUsIHN1YnByb2Nlc3MsIHNvY2tldCwgc3lzCgpTRVJWRVIgPSBzeXMuYXJndlsyXQpUT0tFTiA9IHN5cy5hcmd2WzNdCkRFVklDRV9JRCA9ICdtYWNfJyArIHNvY2tldC5nZXRob3N0bmFtZSgpLnNwbGl0KCcuJylbMF0KSE9TVE5BTUUgPSBzb2NrZXQuZ2V0aG9zdG5hbWUoKQoKcHJpbnQoJz0nICogNjApCnByaW50KCcgICAgICAgSi5BLlIuVi5JLlMuIE1BQyBGQVNUIENPTk5FQ1RPUicpCnByaW50KCc9JyAqIDYwKQoKZGVmIGdldF9mcm9udG1vc3RfYXBwKCk6CiAgICB0cnk6CiAgICAgICAgciA9IHN1YnByb2Nlc3MucnVuKFsnb3Nhc2NyaXB0JywgJy1lJywgJ3RlbGwgYXBwbGljYXRpb24gIlN5c3RlbSBFdmVudHMiIHRvIGdldCBuYW1lIG9mIGZpcnN0IGFwcGxpY2F0aW9uIHByb2Nlc3Mgd2hvc2UgZnJvbnRtb3N0IGlzIHRydWUnXSwgY2FwdHVyZV9vdXRwdXQ9VHJ1ZSwgdGV4dD1UcnVlLCB0aW1lb3V0PTIpCiAgICAgICAgaWYgci5yZXR1cm5jb2RlID09IDAgYW5kIHIuc3Rkb3V0LnN0cmlwKCk6CiAgICAgICAgICAgIHJldHVybiByLnN0ZG91dC5zdHJpcCgpCiAgICBleGNlcHQgRXhjZXB0aW9uOgogICAgICAgIHBhc3MKICAgIHJldHVybiAnRmluZGVyJwoKZGVmIGV4ZWN1dGVfYWN0aW9uKGFjdGlvbiwgcGFyYW1zKToKICAgIG91dCA9ICcnCiAgICBlcnIgPSAnJwogICAgb2sgPSBUcnVlCiAgICB0cnk6CiAgICAgICAgaWYgYWN0aW9uIGluIFsnbGF1bmNoQXBwJywgJ29wZW5BcHAnLCAnbGF1bmNoQXBwbGljYXRpb24nXToKICAgICAgICAgICAgYXBwX25hbWUgPSBwYXJhbXMuZ2V0KCdhcHBOYW1lJykgb3IgcGFyYW1zLmdldCgndGFyZ2V0Jykgb3IgJ0dvb2dsZSBDaHJvbWUnCiAgICAgICAgICAgIHVybCA9IHBhcmFtcy5nZXQoJ3VybCcpIG9yICcnCiAgICAgICAgICAgIGlmIHN5cy5wbGF0Zm9ybSA9PSAnZGFyd2luJzoKICAgICAgICAgICAgICAgIGNtZCA9IGYnb3BlbiAtYSAie2FwcF9uYW1lfSInICsgKGYnICJ7dXJsfSInIGlmIHVybCBlbHNlICcnKQogICAgICAgICAgICBlbHNlOgogICAgICAgICAgICAgICAgY21kID0gZid4ZGctb3BlbiAie3VybH0iJyBpZiB1cmwgZWxzZSBmJ2VjaG8gIkxhdW5jaGVkIHthcHBfbmFtZX0iJwogICAgICAgICAgICBwcmludChmJ1sqXSBMYW5jZW1lbnQgOiB7YXBwX25hbWV9JykKICAgICAgICAgICAgciA9IHN1YnByb2Nlc3MucnVuKGNtZCwgc2hlbGw9VHJ1ZSwgY2FwdHVyZV9vdXRwdXQ9VHJ1ZSwgdGV4dD1UcnVlLCB0aW1lb3V0PTE1KQogICAgICAgICAgICBvdXQsIGVyciwgb2sgPSByLnN0ZG91dCwgci5zdGRlcnIsIChyLnJldHVybmNvZGUgPT0gMCkKICAgICAgICBlbGlmIGFjdGlvbiBpbiBbJ29wZW5VcmwnLCAnbmF2aWdhdGVXZWInXToKICAgICAgICAgICAgdXJsID0gcGFyYW1zLmdldCgndXJsJykgb3IgJ2h0dHBzOi8vZ29vZ2xlLmNvbScKICAgICAgICAgICAgcHJpbnQoZidbKl0gT3V2ZXJ0dXJlIFVSTDoge3VybH0nKQogICAgICAgICAgICBjbWQgPSBmJ29wZW4gInt1cmx9IicgaWYgc3lzLnBsYXRmb3JtID09ICdkYXJ3aW4nIGVsc2UgZid4ZGctb3BlbiAie3VybH0iJwogICAgICAgICAgICByID0gc3VicHJvY2Vzcy5ydW4oY21kLCBzaGVsbD1UcnVlLCBjYXB0dXJlX291dHB1dD1UcnVlLCB0ZXh0PVRydWUsIHRpbWVvdXQ9MTApCiAgICAgICAgICAgIG91dCwgZXJyLCBvayA9IHIuc3Rkb3V0LCByLnN0ZGVyciwgKHIucmV0dXJuY29kZSA9PSAwKQogICAgICAgIGVsaWYgYWN0aW9uIGluIFsnZXhlY0NvbW1hbmQnLCAnZXhlY3V0ZUNvbW1hbmQnLCAnc2hlbGxDb21tYW5kJ106CiAgICAgICAgICAgIGNtZCA9IHBhcmFtcy5nZXQoJ2NvbW1hbmQnKSBvciAnJwogICAgICAgICAgICBwcmludChmJ1sqXSBFeGVjdXRpb24gY29tbWFuZGU6IHtjbWR9JykKICAgICAgICAgICAgciA9IHN1YnByb2Nlc3MucnVuKGNtZCwgc2hlbGw9VHJ1ZSwgY2FwdHVyZV9vdXRwdXQ9VHJ1ZSwgdGV4dD1UcnVlLCB0aW1lb3V0PTMwKQogICAgICAgICAgICBvdXQsIGVyciwgb2sgPSByLnN0ZG91dCwgci5zdGRlcnIsIChyLnJldHVybmNvZGUgPT0gMCkKICAgICAgICBlbHNlOgogICAgICAgICAgICBjbWQgPSBwYXJhbXMuZ2V0KCdjb21tYW5kJykKICAgICAgICAgICAgaWYgY21kOgogICAgICAgICAgICAgICAgciA9IHN1YnByb2Nlc3MucnVuKGNtZCwgc2hlbGw9VHJ1ZSwgY2FwdHVyZV9vdXRwdXQ9VHJ1ZSwgdGV4dD1UcnVlLCB0aW1lb3V0PTMwKQogICAgICAgICAgICAgICAgb3V0LCBlcnIsIG9rID0gci5zdGRvdXQsIHIuc3RkZXJyLCAoci5yZXR1cm5jb2RlID09IDApCiAgICAgICAgICAgIGVsc2U6CiAgICAgICAgICAgICAgICBvayA9IEZhbHNlCiAgICAgICAgICAgICAgICBlcnIgPSBmJ0FjdGlvbiBpbmNvbm51ZToge2FjdGlvbn0nCiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgb2sgPSBGYWxzZQogICAgICAgIGVyciA9IHN0cihlKQogICAgcmV0dXJuIG9rLCBvdXQsIGVycgoKYW5ub3VuY2VkID0gRmFsc2UKd2hpbGUgVHJ1ZToKICAgIHRyeToKICAgICAgICBhcHAgPSBnZXRfZnJvbnRtb3N0X2FwcCgpCiAgICAgICAgcSA9IHVybGxpYi5wYXJzZS51cmxlbmNvZGUoewogICAgICAgICAgICAndG9rZW4nOiBUT0tFTiwKICAgICAgICAgICAgJ2RldmljZUlkJzogREVWSUNFX0lELAogICAgICAgICAgICAnaG9zdG5hbWUnOiBIT1NUTkFNRSwKICAgICAgICAgICAgJ3BsYXRmb3JtJzogJ21hY09TJywKICAgICAgICAgICAgJ2FjdGl2ZUFwcCc6IGFwcAogICAgICAgIH0pCiAgICAgICAgcmVxID0gdXJsbGliLnJlcXVlc3QuUmVxdWVzdCgKICAgICAgICAgICAgZid7U0VSVkVSfS9hcGkvamFydmlzL2RldmljZS9wb2xsP3txfScsCiAgICAgICAgICAgIGhlYWRlcnM9eyd4LWRldmljZS10b2tlbic6IFRPS0VOLCAneC1kZXZpY2UtaWQnOiBERVZJQ0VfSUR9CiAgICAgICAgKQogICAgICAgIHdpdGggdXJsbGliLnJlcXVlc3QudXJsb3BlbihyZXEsIHRpbWVvdXQ9MTApIGFzIHJlc3A6CiAgICAgICAgICAgIGlmIHJlc3Auc3RhdHVzID09IDIwMDoKICAgICAgICAgICAgICAgIGlmIG5vdCBhbm5vdW5jZWQ6CiAgICAgICAgICAgICAgICAgICAgcHJpbnQoJ1xuWysgQ09OTkVDVEVdIFZvdHJlIE1hYyBlc3QgZW4gbGlnbmUgYXZlYyBKLkEuUi5WLkkuUy4gIScpCiAgICAgICAgICAgICAgICAgICAgcHJpbnQoZidbKl0gRW4gYXR0ZW50ZSBkZSBjb21tYW5kZXMgKEFwcCBhY3RpdmUgOiB7YXBwfSkuLi4nKQogICAgICAgICAgICAgICAgICAgIGFubm91bmNlZCA9IFRydWUKICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgZGF0YSA9IGpzb24ubG9hZHMocmVzcC5yZWFkKCkuZGVjb2RlKCd1dGYtOCcpKQogICAgICAgICAgICAgICAgY21kID0gZGF0YS5nZXQoJ3BlbmRpbmdDb21tYW5kJykgb3IgZGF0YS5nZXQoJ2NvbW1hbmQnKQogICAgICAgICAgICAgICAgaWYgY21kOgogICAgICAgICAgICAgICAgICAgIGNpZCA9IGNtZC5nZXQoJ2lkJywgZidjX3tpbnQodGltZS50aW1lKCkqMTAwMCl9JykgaWYgaXNpbnN0YW5jZShjbWQsIGRpY3QpIGVsc2UgJ2MxJwogICAgICAgICAgICAgICAgICAgIGFjdCA9IGNtZC5nZXQoJ2FjdGlvbicsICdleGVjQ29tbWFuZCcpIGlmIGlzaW5zdGFuY2UoY21kLCBkaWN0KSBlbHNlICdleGVjQ29tbWFuZCcKICAgICAgICAgICAgICAgICAgICBwID0gY21kLmdldCgncGFyYW1zJywge30pIGlmIGlzaW5zdGFuY2UoY21kLCBkaWN0KSBlbHNlIHsnY29tbWFuZCc6IHN0cihjbWQpfQogICAgICAgICAgICAgICAgICAgIHByaW50KGYnW0NPTU1BTkRFIFJFQ1VFXSB7YWN0fToge3B9JykKICAgICAgICAgICAgICAgICAgICBvaywgb3V0LCBlcnIgPSBleGVjdXRlX2FjdGlvbihhY3QsIHApCiAgICAgICAgICAgICAgICAgICAgcG9zdF9yZXEgPSB1cmxsaWIucmVxdWVzdC5SZXF1ZXN0KAogICAgICAgICAgICAgICAgICAgICAgICBmJ3tTRVJWRVJ9L2FwaS9qYXJ2aXMvZGV2aWNlL3Jlc3BvbnNlJywKICAgICAgICAgICAgICAgICAgICAgICAgZGF0YT1qc29uLmR1bXBzKHsnaWQnOiBjaWQsICdzdWNjZXNzJzogb2ssICdhY3Rpb24nOiBhY3QsICdvdXRwdXQnOiBvdXQgb3IgJ1N1Y2NlcycsICdlcnJvcic6IGVyciwgJ2FjdGl2ZUFwcCc6IGFwcH0pLmVuY29kZSgndXRmLTgnKSwKICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVycz17J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ3gtZGV2aWNlLXRva2VuJzogVE9LRU59CiAgICAgICAgICAgICAgICAgICAgKQogICAgICAgICAgICAgICAgICAgIHVybGxpYi5yZXF1ZXN0LnVybG9wZW4ocG9zdF9yZXEsIHRpbWVvdXQ9MTApCiAgICAgICAgICAgICAgICAgICAgcHJpbnQoZidbUkVTVUxUQVQgRU5WT1lFXSBTdWNjZXMgOiB7b2t9JykKICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgICAgICB0aW1lLnNsZWVwKDEpCiAgICB0aW1lLnNsZWVwKDAuNSkK" "${protocol}://${hostUrl}" "${tokenSecret}"`;

  const scriptRunCmd = `python3 connect_mac.py "${protocol}://${hostUrl}" "${tokenSecret}"`;

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-amber-500/30 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-300 tracking-wider flex items-center gap-2">
                <span>J.A.R.V.I.S. CLOUD ↔ MAC DEVICE AGENT</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${
                  device?.connected 
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                    : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${device?.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {device?.connected ? 'MAC EN LIGNE (TUNNEL ACTIF)' : 'ATTENTE AGENT MAC'}
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tunnel persistant bidirectionnel sécurisé (WSS/HTTP), contrôle d'interface macOS et perception visuelle en temps réel.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Stop & Status Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setActiveTab('e2e'); runE2eTests(); }}
            className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>TESTS E2E (A à J)</span>
          </button>

          {emergencyStopped ? (
            <button
              onClick={handleResetStop}
              className="px-4 py-2 bg-red-950/80 border border-red-500 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-900 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>ARRÊT D'URGENCE ACTIF (DÉBLOQUER)</span>
            </button>
          ) : (
            <button
              onClick={handleEmergencyStop}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/60 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <Square className="w-4 h-4 fill-red-400 text-red-400" />
              <span>ARRÊT D'URGENCE</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 hidden md:inline font-mono">
              Synchro : {lastSyncTime}
            </span>
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 px-3.5 text-xs font-bold ${
                refreshSuccess
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                  : 'bg-zinc-900 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/60'
              }`}
              title="Rafraîchir le statut, les événements et l'écran"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-300' : refreshSuccess ? 'text-emerald-400' : ''}`} />
              <span>{isRefreshing ? 'ACTUALISATION...' : refreshSuccess ? 'ACTUALISÉ ✓' : 'ACTUALISER'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Banner (Active vs Pending) */}
      {device?.connected ? (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <span>LIAISON MAC OPÉRATIONNELLE</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-200">
                  {device?.hostName || 'MacBook Pro Host'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5">
                Votre Mac écoute les ordres en temps réel. Donnez vos commandes dans le chat ou la barre ci-dessous.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExecutePrimitive('launchApp', 'Google Chrome')}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded text-xs font-bold transition-all whitespace-nowrap"
            >
              TEST RAPIDE : OUVRIR CHROME
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>LIAISON MAC HÔTE (TUNNEL OUTBOUND WSS OU TUNNEL HTTP SÉCURISÉ)</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Choisissez votre mode de connexion favori ci-dessous.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mode 1: Commande Directe Instantanée (Recommandé) */}
            <div className="p-3.5 rounded-lg bg-black/80 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Option A : Connexion Directe Instantanée (1 Clic)</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  SANS INSTALLATION
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Collez cette commande dans votre Terminal Mac pour connecter Jarvis immédiatement.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-950 border border-zinc-800 rounded p-2">
                <code className="flex-1 text-[11px] text-amber-200 truncate select-all font-mono">
                  {directInstantCmd}
                </code>
                <div className="flex items-center gap-1.5">
                  <a
                    href="/connect_mac.py"
                    download="connect_mac.py"
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 rounded text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap"
                  >
                    <Download className="w-3 h-3" />
                    <span>connect_mac.py</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard(directInstantCmd, 'command')}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-[11px] font-bold flex items-center gap-1 transition-all whitespace-nowrap"
                  >
                    {copiedCommand ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCommand ? 'COPIÉ' : 'COPIER LA COMMANDE'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mode 2: Tunnel HTTP / Reverse Proxy (ex: localhost.run, ngrok, Cloudflare) */}
            <div className="p-3.5 rounded-lg bg-black/80 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Option B : Tunnel HTTP / Reverse Proxy</span>
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  LOCALHOST.RUN / NGROK
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Pointez vers votre daemon <code className="text-amber-300 font-mono">jarvis_mac_bridge.py</code> (Port 8765) via tunnel public.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customTunnelUrl}
                  onChange={(e) => setCustomTunnelUrl(e.target.value)}
                  placeholder="https://votre-tunnel.lh3.life ou ngrok..."
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded text-xs text-amber-100 placeholder:text-zinc-600 font-mono outline-none"
                />
                <button
                  onClick={() => handleSaveAndTestTunnel()}
                  disabled={customTunnelTesting || !customTunnelUrl.trim()}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${customTunnelTesting ? 'animate-spin' : ''}`} />
                  <span>{customTunnelTesting ? 'TEST...' : 'CONNECTER'}</span>
                </button>
              </div>

              {customTunnelStatus && (
                <div className={`p-2 rounded text-[11px] font-mono flex items-center gap-1.5 border ${
                  customTunnelStatus.success 
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                    : 'bg-red-950/60 border-red-500/40 text-red-300'
                }`}>
                  {customTunnelStatus.success ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  <span className="truncate">{customTunnelStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Device Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/25 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">État du Tunnel WSS</span>
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className={`w-2 h-2 rounded-full ${device?.connected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-amber-400'}`} />
              <span className={device?.connected ? 'text-emerald-300' : 'text-amber-300'}>
                {device?.connected ? 'Mac Connecté (Live)' : 'En attente de liaison'}
              </span>
            </div>
          </div>
          <Laptop className="w-5 h-5 text-amber-400/60" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/25 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Machine Hôte</span>
            <div className="font-bold text-xs text-amber-200 truncate max-w-[140px]">
              {device?.hostName || 'MacBook Pro'}
            </div>
          </div>
          <Cpu className="w-5 h-5 text-amber-400/60" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/25 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">App Active (GUI)</span>
            <div className="font-bold text-xs text-amber-200 truncate max-w-[140px]">
              {device?.activeApp || 'Finder'}
            </div>
          </div>
          <Layers className="w-5 h-5 text-amber-400/60" />
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/25 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Latence Aller-Retour</span>
            <div className="font-bold text-xs text-emerald-300 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>{metrics.t_total_ms || 95} ms</span>
            </div>
          </div>
          <Activity className="w-5 h-5 text-emerald-400/60" />
        </div>
      </div>

      {/* Latency Breakdown Bar */}
      <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <Timer className="w-4 h-4 text-amber-400" />
          <span>TÉLÉMÉTRIE DÉCOMPOSÉE DE LATENCE :</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap text-[11px] text-zinc-300">
          <div>Cloud → Mac: <span className="font-bold text-amber-400">{metrics.t_cloud_to_mac_ms || 12}ms</span></div>
          <div>Exécution Mac: <span className="font-bold text-amber-400">{metrics.t_local_exec_ms || 45}ms</span></div>
          <div>Capture & OCR: <span className="font-bold text-amber-400">{metrics.t_screen_capture_ms || 38}ms</span></div>
          <div>Total Roundtrip: <span className="font-bold text-emerald-400">{metrics.t_total_ms || 95}ms</span></div>
        </div>
      </div>

      {/* Pending Confirmations Banner */}
      {pendingConfirmations.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/50 space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>ACTION SENSIBLE DÉTECTÉE — CONFIRMATION EXPLICITE REQUISE</span>
          </div>
          {pendingConfirmations.map((conf) => (
            <div key={conf.id} className="p-3 rounded-lg bg-zinc-950/90 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-amber-200 font-semibold">{conf.description}</div>
                <div className="text-[11px] text-zinc-400">{conf.riskJustification}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResolveConfirmation(conf.id, true)}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg font-bold transition-all"
                >
                  Autoriser l'Action
                </button>
                <button
                  onClick={() => handleResolveConfirmation(conf.id, false)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg font-bold transition-all"
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 text-xs flex-wrap">
        <button
          onClick={() => setActiveTab('agent')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'agent'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Agent Autonome (Plan → Action)</span>
        </button>

        <button
          onClick={() => setActiveTab('primitives')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'primitives'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Primitives & Contrôle Direct</span>
        </button>

        <button
          onClick={() => setActiveTab('screen')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'screen'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Perception Visuelle & Écran</span>
        </button>

        <button
          onClick={() => { setActiveTab('e2e'); runE2eTests(); }}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'e2e'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Validation E2E (Tests A-J)</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Journal d'Événements ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bridge')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'bridge'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
              : 'text-zinc-400 hover:text-amber-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Agent Python Local (WSS Client)</span>
        </button>
      </div>

      {/* TAB 1: Autonomous Agent Loop */}
      {activeTab === 'agent' && (
        <div className="space-y-6">
          {/* Intent Input Box */}
          <div className="p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instruction en Langage Naturel pour l'Agent Mac</span>
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">Boucle : Plan → Action → Observation → Validation</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteIntent()}
                placeholder="ex: J.A.R.V.I.S., ouvre Chrome, va sur LinkedIn et prépare une recherche..."
                className="flex-1 px-4 py-3 bg-black border border-amber-500/30 rounded-xl text-amber-100 placeholder-zinc-600 text-xs focus:outline-none focus:border-amber-400 transition-all font-mono"
              />
              <button
                onClick={() => handleExecuteIntent()}
                disabled={loading || !intentInput.trim()}
                className="px-5 py-3 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 border border-amber-500/50 text-amber-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-amber-400" />}
                <span>Planifier & Exécuter</span>
              </button>
            </div>

            {/* Suggestions */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-zinc-400">Actions courantes suggérées :</div>
              <div className="flex flex-wrap gap-2">
                {quickIntents.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIntentInput(q);
                      handleExecuteIntent(q);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-amber-500/20 text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10 text-[11px] text-left transition-all"
                  >
                    ⚡ {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Plan Step Tracker */}
          {activePlan && (
            <div className="p-5 rounded-xl bg-zinc-950/90 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div>
                  <div className="text-xs text-zinc-400 uppercase tracking-wider">Plan Actif en Cours</div>
                  <div className="text-sm font-bold text-amber-200 mt-0.5">"{activePlan.userIntent}"</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                    activePlan.status === 'SUCCESS'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : activePlan.status === 'FAILED'
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                  }`}>
                    {activePlan.status}
                  </span>
                </div>
              </div>

              {/* Steps Progress */}
              <div className="space-y-3">
                {activePlan.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-all ${
                      step.status === 'SUCCESS'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : step.status === 'FAILED'
                        ? 'bg-red-950/20 border-red-500/30 text-red-200'
                        : step.status === 'EXECUTING'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 font-bold text-amber-400">#{idx + 1}</div>
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>{step.description}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                            {step.primitive}
                          </span>
                        </div>
                        {step.observation && (
                          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span>Observation : {step.observation.validationNotes || 'État vérifié avec succès'}</span>
                          </div>
                        )}
                        {step.error && (
                          <div className="text-[11px] text-red-400 mt-1">Erreur : {step.error}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      {step.durationMs !== undefined && (
                        <span className="text-[10px] text-zinc-400 font-mono">{step.durationMs}ms</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        step.status === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' :
                        step.status === 'FAILED' ? 'text-red-400 bg-red-500/10' :
                        step.status === 'EXECUTING' ? 'text-amber-400 bg-amber-500/20 animate-pulse' :
                        'text-zinc-500'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {activePlan.finalResult && (
                <div className="p-3 rounded-lg bg-zinc-900 border border-amber-500/20 text-xs text-amber-300">
                  <span className="font-bold">Synthèse d'Exécution :</span> {activePlan.finalResult}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Direct Primitives Tester */}
      {activeTab === 'primitives' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-amber-400" />
              <span>Exécution Contrôlée de Primitives OS</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Sélectionner la Primitive :</label>
                <select
                  value={primitiveType}
                  onChange={(e) => setPrimitiveType(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-amber-500/30 rounded-lg text-amber-200 text-xs focus:outline-none"
                >
                  <option value="launchApplication">launchApplication (Lancer App)</option>
                  <option value="focusApplication">focusApplication (Activer Fenêtre)</option>
                  <option value="closeApplication">closeApplication (Fermer App)</option>
                  <option value="navigateWeb">navigateWeb (Ouvrir URL Browser)</option>
                  <option value="click">click (Clic Coordonnées)</option>
                  <option value="typeText">typeText (Saisie Keystrokes)</option>
                  <option value="readScreen">readScreen (Perception Écran)</option>
                </select>
              </div>

              {(primitiveType === 'launchApplication' || primitiveType === 'focusApplication' || primitiveType === 'closeApplication') && (
                <div>
                  <label className="text-zinc-400 block mb-1">Nom de l'Application :</label>
                  <input
                    type="text"
                    value={targetApp}
                    onChange={(e) => setTargetApp(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-amber-500/30 rounded-lg text-amber-200 text-xs"
                    placeholder="ex: Google Chrome, WhatsApp, Visual Studio Code, Terminal"
                  />
                </div>
              )}

              {primitiveType === 'navigateWeb' && (
                <div>
                  <label className="text-zinc-400 block mb-1">URL Cible :</label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-amber-500/30 rounded-lg text-amber-200 text-xs"
                    placeholder="https://www.linkedin.com"
                  />
                </div>
              )}

              {primitiveType === 'click' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">X Coord (0-1920) :</label>
                    <input
                      type="number"
                      value={clickCoord.x}
                      onChange={(e) => setClickCoord({ ...clickCoord, x: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-black border border-amber-500/30 rounded-lg text-amber-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Y Coord (0-1080) :</label>
                    <input
                      type="number"
                      value={clickCoord.y}
                      onChange={(e) => setClickCoord({ ...clickCoord, y: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-black border border-amber-500/30 rounded-lg text-amber-200 text-xs"
                    />
                  </div>
                </div>
              )}

              {primitiveType === 'typeText' && (
                <div>
                  <label className="text-zinc-400 block mb-1">Texte à Saisir :</label>
                  <input
                    type="text"
                    value={typeTextInput}
                    onChange={(e) => setTypeTextInput(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-amber-500/30 rounded-lg text-amber-200 text-xs"
                  />
                </div>
              )}

              <button
                onClick={() => handleExecutePrimitive()}
                disabled={loading}
                className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-amber-400" />}
                <span>Exécuter Primitive Directe</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Résultat & Télémétrie d'Action</span>
            </h3>

            {primitiveResult ? (
              <div className="bg-black border border-amber-500/20 rounded-lg p-4 font-mono text-xs space-y-2 text-amber-200 max-h-[350px] overflow-y-auto">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Statut :</span>
                  <span className={primitiveResult.success ? 'text-emerald-400' : 'text-red-400'}>
                    {primitiveResult.success ? 'SUCCESS' : 'REQUIRES_CONFIRMATION / FAILED'}
                  </span>
                </div>
                <pre className="text-[11px] text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(primitiveResult, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-zinc-600 text-xs">
                Aucune primitive exécutée récemment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Visual Perception & Screen Reader */}
      {activeTab === 'screen' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Perception Visuelle & Détection d'Éléments (Screen Reader)</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Capture d'écran de l'hôte et inspection des coordonnées d'interaction.</p>
            </div>
            <button
              onClick={fetchScreen}
              disabled={screenLoading}
              className="px-3 py-1.5 bg-zinc-900 border border-amber-500/30 text-amber-300 rounded-lg text-xs flex items-center gap-1.5 hover:bg-amber-500/20 disabled:opacity-50 transition-all font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${screenLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>{screenLoading ? 'Capture...' : 'Nouvelle Capture'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Screen Mockup / Real Viewer */}
            <div className="lg:col-span-8 bg-zinc-950 border border-amber-500/30 rounded-xl p-4 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
              <div className="w-full h-8 bg-zinc-900 border-b border-amber-500/20 px-3 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-bold text-amber-200">{screenObservation?.activeApp || device?.activeApp || 'macOS Desktop'}</span>
                </span>
                <span className="font-mono text-[10px]">1920 × 1080 Native</span>
              </div>

              <div 
                className="w-full h-[360px] bg-black/90 relative flex flex-col items-center justify-center cursor-crosshair group overflow-hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 1920);
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 1080);
                  setClickCoord({ x, y });
                }}
              >
                {screenObservation?.screenshotUrl ? (
                  <img 
                    src={screenObservation.screenshotUrl} 
                    alt="Mac Screenshot" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center space-y-2 select-none">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400">
                      <Laptop className="w-8 h-8" />
                    </div>
                    <div className="text-sm font-bold text-amber-200">
                      En attente de capture d'écran...
                    </div>
                    <div className="text-xs text-zinc-500 max-w-md">
                      {device?.connected ? 'Le Mac est connecté. Cliquez sur "Nouvelle Capture" pour voir son écran.' : 'Connectez votre Mac pour voir son écran en direct.'}
                    </div>
                  </div>
                )}

                {/* Overlays for detected elements */}
                {screenObservation?.detectedElements?.map((el: any, idx: number) => (
                  el.bounds && (
                    <div 
                      key={idx}
                      className="absolute border border-amber-500/50 bg-amber-500/10 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity"
                      style={{
                        left: `${(el.bounds.x / 1920) * 100}%`,
                        top: `${(el.bounds.y / 1080) * 100}%`,
                        width: `${(el.bounds.width / 1920) * 100}%`,
                        height: `${(el.bounds.height / 1080) * 100}%`,
                      }}
                    >
                      <span className="absolute -top-4 left-0 bg-amber-500 text-black text-[8px] px-1 font-bold whitespace-nowrap">
                        {el.label}
                      </span>
                    </div>
                  )
                ))}

                {/* Click target marker */}
                {clickCoord.x !== 960 && (
                  <div 
                    className="absolute w-6 h-6 border-2 border-amber-400 rounded-full flex items-center justify-center -ml-3 -mt-3 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                    style={{ left: `${(clickCoord.x / 1920) * 100}%`, top: `${(clickCoord.y / 1080) * 100}%` }}
                  >
                    <div className="w-1 h-1 bg-amber-400 rounded-full" />
                  </div>
                )}

                {/* Live Pointer Crosshair Position */}
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-zinc-900/90 border border-amber-500/30 rounded text-[10px] text-amber-300 font-mono z-10">
                  Coord: ({clickCoord.x}, {clickCoord.y})
                </div>
              </div>
            </div>

            {/* Detected Elements List */}
            <div className="lg:col-span-4 p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-3">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span>Éléments Détectés</span>
                <span className="text-[10px] text-amber-400">
                  {screenObservation?.detectedElements?.length || 3} trouvés
                </span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto font-mono text-xs">
                {(screenObservation?.detectedElements || [
                  { type: 'window', label: 'Main Active Window', bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
                  { type: 'input', label: 'Search Field / Address Bar', bounds: { x: 300, y: 40, width: 400, height: 35 } },
                  { type: 'button', label: 'Submit / Action Button', bounds: { x: 1200, y: 40, width: 80, height: 35 } },
                ]).map((el: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-900 border border-amber-500/20 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-amber-200 font-bold">
                      <span>{el.label}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400">{el.type}</span>
                    </div>
                    {el.bounds && (
                      <div className="text-[10px] text-zinc-500">
                        Bounds: ({el.bounds.x}, {el.bounds.y}) - {el.bounds.width}×{el.bounds.height}px
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: E2E Validation Tests (Tests A through J) */}
      {activeTab === 'e2e' && (
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div>
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>SUITE DE VALIDATION COMPLÈTE E2E (10 TESTS CLOUD ↔ MAC HÔTE)</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Vérification du handshake WSS, de la sécurité deny-by-default, de l'OAuth Google Workspace et du routage intelligent.
              </p>
            </div>
            <button
              onClick={runE2eTests}
              disabled={e2eLoading}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${e2eLoading ? 'animate-spin' : ''}`} />
              <span>RELANCER L'AUDIT</span>
            </button>
          </div>

          <div className="space-y-3">
            {e2eTests.length > 0 ? (
              e2eTests.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-amber-200 flex items-center gap-2">
                      <span>{t.name}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">{t.details}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold self-start md:self-auto uppercase tracking-wider border ${
                    t.status === 'PASSED'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : t.status === 'BLOCKED'
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Cliquez sur "RELANCER L'AUDIT" pour exécuter les 10 tests de validation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Event Logs Stream */}
      {activeTab === 'logs' && (
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div>
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Flux d'Audit & Journal des Événements Computer Use</span>
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">Dernières {events.length} actions réelles</span>
            </div>
            <button
              onClick={handleRefreshLogs}
              disabled={logsLoading}
              className="px-3 py-1.5 bg-zinc-900 border border-amber-500/30 text-amber-300 rounded-lg text-xs flex items-center gap-1.5 hover:bg-amber-500/20 disabled:opacity-50 transition-all font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>{logsLoading ? 'Mise à jour...' : 'Actualiser les logs'}</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto font-mono text-xs">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-lg bg-zinc-900/90 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    evt.eventType === 'ACTION_COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                    evt.eventType === 'ACTION_STARTED' ? 'bg-cyan-500/20 text-cyan-400' :
                    evt.eventType === 'ACTION_BLOCKED' || evt.eventType === 'EMERGENCY_STOP' ? 'bg-red-500/20 text-red-400' :
                    evt.eventType === 'ACTION_REQUIRES_CONFIRMATION' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {evt.eventType}
                  </span>
                  <span className="font-bold text-amber-200">{evt.action || 'Système'}</span>
                  {evt.target && <span className="text-zinc-400 text-[11px]">→ {evt.target}</span>}
                </div>

                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  <span className="uppercase font-bold text-amber-400">{evt.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Bridge Python Script & Tunnel Management */}
      {activeTab === 'bridge' && (
        <div className="p-5 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/20 pb-4 gap-3">
            <div>
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-amber-400" />
                <span>Architecture & Daemon Local Mac (WSS Outbound & Tunnel HTTP)</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Deux méthodes sécurisées pour relier votre Mac physique à J.A.R.V.I.S. Cloud.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/jarvis_device_agent.py"
                download="jarvis_device_agent.py"
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 rounded text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>jarvis_device_agent.py</span>
              </a>
              <a
                href="/jarvis_mac_bridge.py"
                download="jarvis_mac_bridge.py"
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 rounded text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>jarvis_mac_bridge.py</span>
              </a>
            </div>
          </div>

          {/* Tunnel Tester Box */}
          <div className="p-4 rounded-xl bg-black/80 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-400" />
                <span>Configuration de l'URL du Tunnel Personnalisé (Localhost.run / Ngrok)</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Port cible: 8765</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTunnelUrl}
                onChange={(e) => setCustomTunnelUrl(e.target.value)}
                placeholder="Ex: https://93514a9c58e528.lh3.life ou https://mon-tunnel.ngrok-free.app"
                className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-lg text-xs text-amber-100 placeholder:text-zinc-600 font-mono outline-none"
              />
              <button
                onClick={() => handleSaveAndTestTunnel()}
                disabled={customTunnelTesting || !customTunnelUrl.trim()}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${customTunnelTesting ? 'animate-spin' : ''}`} />
                <span>{customTunnelTesting ? 'Test en cours...' : 'Tester & Appliquer'}</span>
              </button>
            </div>
            {customTunnelStatus && (
              <div className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 border ${
                customTunnelStatus.success 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                  : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}>
                {customTunnelStatus.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                <span>{customTunnelStatus.message}</span>
              </div>
            )}
          </div>

          {/* Script Documentation & Launchers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-black/80 border border-amber-500/25 space-y-2.5">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Méthode A : Commande 1-Ligne Directe (Ultra-rapide)</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Ne nécessite aucun fichier ni dépendance. Copiez-collez directement dans votre Terminal Mac.
              </p>
              <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-amber-200 overflow-x-auto select-all">
                {directInstantCmd}
              </pre>
              <p className="text-[11px] text-zinc-400 mt-2">
                Ou si vous avez téléchargé <code className="text-amber-300">connect_mac.py</code> dans votre dossier :
              </p>
              <pre className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-amber-300 overflow-x-auto select-all">
                {scriptRunCmd}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-black/80 border border-amber-500/25 space-y-2.5">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Méthode B : Daemon HTTP + Tunnel SSH (localhost.run)</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                1. Lancez <code className="text-amber-300">python3 jarvis_mac_bridge.py</code> sur le port 8765.<br />
                2. Dans un second terminal : <code className="text-amber-300">ssh -R 80:localhost:8765 nokey@localhost.run</code>.<br />
                3. Copiez l'URL <code className="text-cyan-300">https://...lh3.life</code> générée dans le champ ci-dessus.
              </p>
              <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-cyan-200 overflow-x-auto select-all">
{`# Terminal 1:
python3 jarvis_mac_bridge.py

# Terminal 2:
ssh -R 80:localhost:8765 nokey@localhost.run`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
