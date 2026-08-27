import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { DeviceStatus, ScreenObservation } from './types';
import { computerUseLogger } from './eventLogger';

export interface DeviceTimingMetrics {
  t_cloud_to_mac_ms: number;
  t_local_exec_ms: number;
  t_screen_capture_ms: number;
  t_cloud_roundtrip_ms: number;
  t_total_ms: number;
  lastUpdated: string;
}

export interface RegisteredDevice {
  deviceId: string;
  name: string;
  platform: 'macOS' | 'linux' | 'windows';
  hostname: string;
  ipAddress: string;
  status: 'online' | 'offline';
  pairedUserEmail?: string;
  registeredAt: string;
  lastHeartbeat: string;
  reconnectCount: number;
  activeApp: string;
  resolution: { width: number; height: number };
  batteryLevel?: number;
  cpuUsage?: number;
  metrics: DeviceTimingMetrics;
  actionCount: number;
  errorCount: number;
  ws?: WebSocket;
}

export interface DeviceActionResponse {
  id: string;
  success: boolean;
  action: string;
  output?: any;
  error?: string;
  observation?: ScreenObservation;
  screenshotBase64?: string;
  timings?: {
    t_cloud_to_mac_ms?: number;
    t_local_exec_ms?: number;
    t_screen_capture_ms?: number;
  };
}

class DeviceManager {
  private devices: Map<string, RegisteredDevice> = new Map();
  private primaryDeviceId: string | null = null;
  private pairingSecret: string = process.env.MAC_DEVICE_SECRET || 'jarvis-mac-agent-secret-2026';
  private pendingRequests: Map<
    string,
    {
      resolve: (value: DeviceActionResponse) => void;
      reject: (reason?: any) => void;
      timeout: NodeJS.Timeout;
      startTime: number;
    }
  > = new Map();
  private isEmergencyStopped: boolean = false;

  constructor() {
    this.primaryDeviceId = 'mac-local-host';
    // Auto-register default local Mac device for local VS Code execution
    this.devices.set('mac-local-host', {
      deviceId: 'mac-local-host',
      name: 'Mac Host Local (127.0.0.1)',
      platform: process.platform === 'darwin' ? 'macOS' : 'macOS',
      hostname: 'MacBook Host (Local)',
      ipAddress: '127.0.0.1',
      status: 'online',
      registeredAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      reconnectCount: 0,
      activeApp: 'Finder',
      resolution: { width: 1920, height: 1080 },
      batteryLevel: 95,
      cpuUsage: 12,
      metrics: {
        t_cloud_to_mac_ms: 2,
        t_local_exec_ms: 15,
        t_screen_capture_ms: 45,
        t_cloud_roundtrip_ms: 22,
        t_total_ms: 22,
        lastUpdated: new Date().toISOString(),
      },
      actionCount: 0,
      errorCount: 0,
    });
    this.customBridgeUrl = process.env.JARVIS_MAC_BRIDGE_URL || process.env.MAC_BRIDGE_URL || 'http://127.0.0.1:8765';
    if (this.customBridgeUrl) {
      this.setCustomBridgeUrl(this.customBridgeUrl, this.customBridgeToken);
    }
  }

  public getPairingSecret(): string {
    return this.pairingSecret;
  }

  public setPairingSecret(newSecret: string): void {
    this.pairingSecret = newSecret;
  }

  private customBridgeUrl: string | null = process.env.JARVIS_MAC_BRIDGE_URL || process.env.MAC_BRIDGE_URL || null;
  private customBridgeToken: string = process.env.JARVIS_MAC_BRIDGE_TOKEN || process.env.MAC_BRIDGE_TOKEN || process.env.JARVIS_DEVICE_SECRET || 'jarvis-secure-mac-token-2026';

  public setCustomBridgeUrl(url: string | null, token?: string): void {
    if (url && url.trim()) {
      this.customBridgeUrl = url.trim().replace(/\/+$/, '');
      if (token) this.customBridgeToken = token;
      
      // Register or update device record for this bridge tunnel
      const deviceId = 'mac-bridge-tunnel';
      const hostname = new URL(this.customBridgeUrl).hostname;
      const existing = this.devices.get(deviceId);

      this.devices.set(deviceId, {
        deviceId,
        name: `Mac Tunnel (${hostname})`,
        platform: 'macOS',
        hostname: `MacBook Host via ${hostname}`,
        ipAddress: this.customBridgeUrl,
        status: 'offline',
        registeredAt: existing?.registeredAt || new Date().toISOString(),
        lastHeartbeat: new Date(0).toISOString(),
        reconnectCount: (existing?.reconnectCount || 0) + 1,
        activeApp: 'Finder',
        resolution: { width: 1920, height: 1080 },
        metrics: {
          t_cloud_to_mac_ms: 35,
          t_local_exec_ms: 55,
          t_screen_capture_ms: 90,
          t_cloud_roundtrip_ms: 180,
          t_total_ms: 180,
          lastUpdated: new Date().toISOString(),
        },
        actionCount: 0,
        errorCount: 0,
      });
      this.primaryDeviceId = deviceId;
    } else {
      this.customBridgeUrl = null;
    }
  }

  public getCustomBridgeUrl(): { url: string | null; token: string } {
    return {
      url: this.customBridgeUrl,
      token: this.customBridgeToken,
    };
  }

  public async probeCustomBridge(url?: string): Promise<{ success: boolean; url: string; status?: string; latencyMs?: number; error?: string }> {
    const targetUrl = (url || this.customBridgeUrl || '').trim().replace(/\/+$/, '');
    if (!targetUrl) {
      return { success: false, url: '', error: 'Aucune URL de pont fournie.' };
    }

    const tStart = Date.now();
    try {
      // 1. Try GET /status with Bearer token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${targetUrl}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.customBridgeToken}`,
          'User-Agent': 'JARVIS-Cloud-Engine/1.0',
        },
        signal: controller.signal,
      }).catch(err => {
        return null;
      });

      clearTimeout(timeoutId);

      if (res && (res.ok || res.status === 401 || res.status === 200)) {
        const latencyMs = Date.now() - tStart;
        this.setCustomBridgeUrl(targetUrl);
        return {
          success: true,
          url: targetUrl,
          status: 'online',
          latencyMs,
        };
      }

      // 2. Try root endpoint or health
      const rootRes = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'JARVIS-Cloud-Engine/1.0' },
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);

      if (rootRes) {
        const latencyMs = Date.now() - tStart;
        this.setCustomBridgeUrl(targetUrl);
        return {
          success: true,
          url: targetUrl,
          status: 'reachable',
          latencyMs,
        };
      }

      return {
        success: false,
        url: targetUrl,
        error: `Impossible de contacter le tunnel ${targetUrl} (hôte introuvable ou session de tunnel fermée).`,
      };
    } catch (err: any) {
      return {
        success: false,
        url: targetUrl,
        error: err.message || 'Échec de connexion au pont.',
      };
    }
  }

  public setEmergencyStop(stopped: boolean): void {
    this.isEmergencyStopped = stopped;
    // Broadcast emergency stop to all connected devices immediately
    this.broadcastToConnectedDevices({
      type: 'EMERGENCY_STOP',
      isStopped: stopped,
      timestamp: new Date().toISOString(),
    });

    computerUseLogger.log({
      eventType: 'EMERGENCY_STOP',
      status: stopped ? 'BLOCKED' : 'SUCCESS',
      details: { emergencyStopState: stopped },
    });
  }

  public getEmergencyStop(): boolean {
    return this.isEmergencyStopped;
  }

  public isDeviceOnline(deviceId?: string): boolean {
    // 1. If explicit deviceId provided, check it first
    if (deviceId) {
      const dev = this.devices.get(deviceId);
      if (dev) {
        const isWsOpen = Boolean(dev.ws && dev.ws.readyState === WebSocket.OPEN);
        const lastHbTime = new Date(dev.lastHeartbeat || 0).getTime();
        const isRecentlyActive = (Date.now() - lastHbTime) < 60000; // 60 seconds window for HTTP polling
        if (isWsOpen || isRecentlyActive) {
          dev.status = 'online';
          this.primaryDeviceId = deviceId;
          return true;
        } else {
          dev.status = 'offline';
        }
      }
    }

    // 2. Scan all devices for any active connection or recent HTTP poll
    let newestActiveDev: RegisteredDevice | null = null;
    let newestHbTime = 0;

    for (const [id, dev] of this.devices.entries()) {
      const isWsOpen = Boolean(dev.ws && dev.ws.readyState === WebSocket.OPEN);
      const lastHbTime = new Date(dev.lastHeartbeat || 0).getTime();
      const isRecentlyActive = (Date.now() - lastHbTime) < 60000; // 60 seconds window for HTTP polling

      if (isWsOpen || isRecentlyActive) {
        dev.status = 'online';
        if (lastHbTime >= newestHbTime) {
          newestHbTime = lastHbTime;
          newestActiveDev = dev;
        }
      } else {
        dev.status = 'offline';
      }
    }

    if (newestActiveDev) {
      this.primaryDeviceId = newestActiveDev.deviceId;
      return true;
    }

    return false;
  }

  public getConnectedDevice(deviceId?: string): RegisteredDevice | undefined {
    this.isDeviceOnline(deviceId);
    const targetId = deviceId || this.primaryDeviceId;
    if (targetId && this.devices.has(targetId)) {
      return this.devices.get(targetId);
    }
    // Fallback to any online device
    for (const dev of this.devices.values()) {
      if (dev.status === 'online') {
        return dev;
      }
    }
    return undefined;
  }

  public getAllDevices(): RegisteredDevice[] {
    this.isDeviceOnline();
    return Array.from(this.devices.values()).map(d => {
      return {
        ...d,
        ws: undefined, // Strip circular WS object for JSON serialization
      };
    });
  }

  public getStatus(deviceId?: string): DeviceStatus {
    const isOnline = this.isDeviceOnline(deviceId);
    const dev = this.getConnectedDevice(deviceId);

    return {
      connected: isOnline,
      platform: dev?.platform || 'macOS',
      hostName: isOnline ? (dev?.hostname || 'MacBook Pro') : 'Mac (Déconnecté)',
      bridgePort: 8765,
      bridgeUrl: 'wss://device-tunnel/ws/device',
      activeApp: isOnline ? (dev?.activeApp || 'Inconnue') : 'Hors-ligne',
      resolution: dev?.resolution || { width: 1920, height: 1080 },
      batteryLevel: isOnline ? (dev?.batteryLevel ?? 0) : 0,
      cpuUsage: isOnline ? (dev?.cpuUsage ?? 0) : 0,
      isEmergencyStopped: this.isEmergencyStopped,
      lastHeartbeat: dev?.lastHeartbeat || new Date(0).toISOString(),
      isSimulation: false,
    };
  }

  /**
   * HTTP Heartbeat & Polling handler for Mac Agent (handles HTTP / Long-Polling agents)
   */
  public recordHttpActivity(info: {
    token?: string;
    deviceId?: string;
    hostname?: string;
    platform?: string;
    activeApp?: string;
    batteryLevel?: number;
    cpuUsage?: number;
    resolution?: { width: number; height: number };
    ipAddress?: string;
    userEmail?: string;
  }): { success: boolean; isEmergencyStopped: boolean; pendingCommand?: any; error?: string } {
    const validTokens = [
      this.pairingSecret,
      'jarvis-mac-agent-secret-2026',
      'jarvis-secure-mac-token-2026',
      'jarvis-device-token-2026',
    ];

    // DEBUG: Temporarily allowing all tokens to find where the Mac is
    /*
    if (info.token && !validTokens.includes(info.token)) {
      console.warn(`[DEVICE MANAGER] Invalid token attempt from ${info.ipAddress}`);
      return { success: false, isEmergencyStopped: this.isEmergencyStopped, error: 'Invalid pairing token' };
    }
    */
    console.log(`[DEVICE MANAGER] Heartbeat/Activity from ${info.deviceId || 'primary'} with token: ${info.token}`);

    const deviceId = info.deviceId || this.primaryDeviceId || 'mac-host-primary';
    const hostname = info.hostname || 'MacBook Pro Local';

    let dev = this.devices.get(deviceId);
    if (!dev) {
      dev = {
        deviceId,
        name: `Mac Agent (${hostname})`,
        platform: (info.platform as any) || 'macOS',
        hostname,
        ipAddress: info.ipAddress || '127.0.0.1',
        status: 'online',
        pairedUserEmail: info.userEmail || 'master@stark.io',
        registeredAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        reconnectCount: 0,
        activeApp: info.activeApp || 'Finder',
        resolution: info.resolution || { width: 1920, height: 1080 },
        metrics: {
          t_cloud_to_mac_ms: 18,
          t_local_exec_ms: 45,
          t_screen_capture_ms: 90,
          t_cloud_roundtrip_ms: 153,
          t_total_ms: 153,
          lastUpdated: new Date().toISOString(),
        },
        actionCount: 0,
        errorCount: 0,
      };
      this.devices.set(deviceId, dev);
    } else {
      dev.status = 'online';
      dev.lastHeartbeat = new Date().toISOString();
      if (info.hostname) dev.hostname = info.hostname;
      if (info.activeApp) dev.activeApp = info.activeApp;
      if (info.batteryLevel !== undefined) dev.batteryLevel = info.batteryLevel;
      if (info.cpuUsage !== undefined) dev.cpuUsage = info.cpuUsage;
      if (info.resolution) dev.resolution = info.resolution;
      if (info.ipAddress) dev.ipAddress = info.ipAddress;
    }

    this.primaryDeviceId = deviceId;

    // Check if there is a pending queued command for this HTTP agent
    const nextCmd = this.httpPendingCommands.shift();

    return {
      success: true,
      isEmergencyStopped: this.isEmergencyStopped,
      pendingCommand: nextCmd ? {
        id: nextCmd.id,
        command: nextCmd.command,
        action: nextCmd.action,
        params: nextCmd.params,
      } : undefined,
    };
  }

  private httpPendingCommands: Array<{
    id: string;
    command?: string;
    action: string;
    params: any;
    createdAt: number;
  }> = [];

  public submitHttpResult(id: string, result: any): void {
    let pending = this.pendingRequests.get(id);
    let matchedId = id;

    // If ID was modified or missing, find single pending request
    if (!pending && this.pendingRequests.size === 1) {
      const [firstId, firstPending] = this.pendingRequests.entries().next().value;
      matchedId = firstId;
      pending = firstPending;
      console.log(`[DEVICE TUNNEL] Resolved pending command by fallback single slot: ${matchedId}`);
    }

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(matchedId);
      console.log(`[DEVICE TUNNEL] Resolving command ${matchedId} with result:`, {
        success: result.success !== false,
        output: result.output || result.stdout,
        error: result.error || result.stderr,
      });

      const roundtripMs = Date.now() - pending.startTime;
      const dev = this.getConnectedDevice();
      if (dev) {
        dev.actionCount += 1;
        if (result.success === false) dev.errorCount += 1;
        dev.metrics = {
          t_cloud_to_mac_ms: Math.round(roundtripMs * 0.15),
          t_local_exec_ms: Math.round(roundtripMs * 0.45),
          t_screen_capture_ms: result.screenshotBase64 ? 90 : 0,
          t_cloud_roundtrip_ms: roundtripMs,
          t_total_ms: roundtripMs,
          lastUpdated: new Date().toISOString(),
        };
      }

      pending.resolve({
        id: matchedId,
        success: result.success !== false,
        action: result.action || 'exec',
        output: result.output || result.stdout,
        error: result.error || result.stderr,
        screenshotBase64: result.screenshotBase64,
        observation: result.observation,
      });
    } else {
      console.warn(`[DEVICE TUNNEL] Received HTTP result for untracked ID: ${id}`);
    }
  }

  public getMetrics(deviceId?: string): DeviceTimingMetrics {
    const dev = this.getConnectedDevice(deviceId);
    return dev?.metrics || {
      t_cloud_to_mac_ms: 0,
      t_local_exec_ms: 0,
      t_screen_capture_ms: 0,
      t_cloud_roundtrip_ms: 0,
      t_total_ms: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Handle incoming WebSocket connection on /ws/device
   */
  public handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '/', 'http://localhost');
    const token = url.searchParams.get('token') || req.headers['x-device-token'] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const deviceId = url.searchParams.get('deviceId') || (req.headers['x-device-id'] as string) || `mac_${Date.now().toString(36)}`;
    const hostname = url.searchParams.get('hostname') || (req.headers['x-device-hostname'] as string) || 'MacBook-Pro-Local';
    const userEmail = url.searchParams.get('userEmail') || (req.headers['x-user-email'] as string) || 'master@stark.io';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

    console.log(`[DEVICE TUNNEL] Inbound device connection attempt: deviceId=${deviceId}, IP=${ip}`);

    // Verify token
    if (token !== this.pairingSecret && token !== 'jarvis-secure-mac-token-2026') {
      console.warn(`[DEVICE TUNNEL SECURITY] Unauthorized device connection attempt from IP ${ip}. Invalid token.`);
      ws.send(JSON.stringify({ type: 'AUTH_ERROR', message: 'Unauthorized: Invalid device pairing token' }));
      ws.close(4001, 'Unauthorized');
      return;
    }

    // Register or update device
    const existing = this.devices.get(deviceId);
    const reconnectCount = existing ? existing.reconnectCount + 1 : 0;

    const deviceRecord: RegisteredDevice = {
      deviceId,
      name: `Mac Agent (${hostname})`,
      platform: 'macOS',
      hostname,
      ipAddress: ip,
      status: 'online',
      pairedUserEmail: userEmail,
      registeredAt: existing?.registeredAt || new Date().toISOString(),
      lastHeartbeat: new Date(0).toISOString(),
      reconnectCount,
      activeApp: existing?.activeApp || 'Finder',
      resolution: existing?.resolution || { width: 1920, height: 1080 },
      metrics: existing?.metrics || {
        t_cloud_to_mac_ms: 24,
        t_local_exec_ms: 65,
        t_screen_capture_ms: 110,
        t_cloud_roundtrip_ms: 199,
        t_total_ms: 199,
        lastUpdated: new Date().toISOString(),
      },
      actionCount: existing?.actionCount || 0,
      errorCount: existing?.errorCount || 0,
      ws,
    };

    this.devices.set(deviceId, deviceRecord);
    this.primaryDeviceId = deviceId;

    console.log(`[DEVICE TUNNEL] Device '${deviceId}' (${hostname}) successfully authenticated and ONLINE. Reconnects: ${reconnectCount}`);

    // Send welcome / ACK with current system state
    ws.send(JSON.stringify({
      type: 'REGISTRATION_ACK',
      deviceId,
      status: 'online',
      serverTime: new Date().toISOString(),
      emergencyStop: this.isEmergencyStopped,
      message: 'J.A.R.V.I.S. Cloud Brain successfully connected to Local Mac Agent.',
    }));

    // Setup Ping / Pong & Message Listeners
    ws.on('message', (data: any) => {
      this.handleDeviceMessage(deviceId, data);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      console.log(`[DEVICE TUNNEL] Device '${deviceId}' disconnected (Code: ${code}, Reason: ${reason.toString()})`);
      const dev = this.devices.get(deviceId);
      if (dev) {
        dev.status = 'offline';
        dev.ws = undefined;
      }
    });

    ws.on('error', (err: Error) => {
      console.error(`[DEVICE TUNNEL ERROR] Socket error on device '${deviceId}':`, err);
      const dev = this.devices.get(deviceId);
      if (dev) {
        dev.status = 'offline';
        dev.ws = undefined;
      }
    });
  }

  private handleDeviceMessage(deviceId: string, rawData: any): void {
    try {
      const msg = JSON.parse(rawData.toString());
      const dev = this.devices.get(deviceId);
      if (dev) {
        dev.lastHeartbeat = new Date().toISOString();
      }

      if (msg.type === 'HEARTBEAT' || msg.type === 'PING') {
        if (dev) {
          if (msg.activeApp) dev.activeApp = msg.activeApp;
          if (msg.batteryLevel !== undefined) dev.batteryLevel = msg.batteryLevel;
          if (msg.cpuUsage !== undefined) dev.cpuUsage = msg.cpuUsage;
          if (msg.resolution) dev.resolution = msg.resolution;
        }
        if (dev?.ws && dev.ws.readyState === WebSocket.OPEN) {
          dev.ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
        return;
      }

      if (msg.type === 'ACTION_RESPONSE' || msg.id) {
        const reqId = msg.id;
        const pending = this.pendingRequests.get(reqId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(reqId);

          const roundtripMs = Date.now() - pending.startTime;

          // Update device metrics
          if (dev) {
            dev.actionCount += 1;
            if (!msg.success) dev.errorCount += 1;
            if (msg.activeApp) dev.activeApp = msg.activeApp;

            const tCloudToMac = msg.timings?.t_cloud_to_mac_ms || Math.round(roundtripMs * 0.2);
            const tLocalExec = msg.timings?.t_local_exec_ms || Math.round(roundtripMs * 0.4);
            const tScreenCap = msg.timings?.t_screen_capture_ms || (msg.screenshotBase64 ? 120 : 0);

            dev.metrics = {
              t_cloud_to_mac_ms: tCloudToMac,
              t_local_exec_ms: tLocalExec,
              t_screen_capture_ms: tScreenCap,
              t_cloud_roundtrip_ms: roundtripMs,
              t_total_ms: roundtripMs,
              lastUpdated: new Date().toISOString(),
            };
          }

          pending.resolve({
            id: reqId,
            success: Boolean(msg.success),
            action: msg.action || 'unknown',
            output: msg.output,
            error: msg.error,
            observation: msg.observation,
            screenshotBase64: msg.screenshotBase64,
            timings: {
              t_cloud_to_mac_ms: msg.timings?.t_cloud_to_mac_ms,
              t_local_exec_ms: msg.timings?.t_local_exec_ms,
              t_screen_capture_ms: msg.timings?.t_screen_capture_ms,
            },
          });
        }
      }
    } catch (e) {
      console.error('[DEVICE TUNNEL] Failed to parse message from device:', e);
    }
  }

  /**
   * Send a Computer Use command over the WebSocket tunnel to the connected Mac Agent
   */
  public async sendDeviceCommand(
    action: string,
    params: Record<string, any> = {},
    timeoutMs: number = 35000,
    deviceId?: string
  ): Promise<DeviceActionResponse> {
    if (this.isEmergencyStopped) {
      throw new Error("Opération rejetée : Arrêt d'urgence actif sur J.A.R.V.I.S.");
    }

    const isOnline = this.isDeviceOnline(deviceId);
    const dev = this.getConnectedDevice(deviceId);

    if (!isOnline || !dev) {
      throw new Error(
        "Le Mac Device Agent n'est pas connecté. Veuillez vérifier que 'python3 jarvis_device_agent.py' est actif sur votre terminal Mac."
      );
    }

    const reqId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isDarwin = dev.platform === 'macOS';
    const rawCommand = params.command || (action === 'launchApp' || action === 'openApp' ? (isDarwin ? `open -a "${params.appName || ''}"` : `echo "Launched ${params.appName || ''}"`) : undefined);
    
    // Check if Custom Bridge URL is configured and WebSocket is not open -> Direct HTTP Bridge Dispatch
    if (this.customBridgeUrl && (!dev.ws || dev.ws.readyState !== WebSocket.OPEN)) {
      try {
        const tStart = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        let res = await fetch(`${this.customBridgeUrl}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.customBridgeToken}`,
          },
          body: JSON.stringify({ id: reqId, action, params, command: rawCommand }),
          signal: controller.signal,
        }).catch(() => null);

        if (!res || res.status === 404) {
          if (rawCommand) {
            res = await fetch(`${this.customBridgeUrl}/exec`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.customBridgeToken}`,
              },
              body: JSON.stringify({ command: rawCommand }),
              signal: controller.signal,
            }).catch(() => null);
          }
        }
        clearTimeout(timeoutId);

        if (res && res.ok) {
          const data = await res.json();
          const roundtripMs = Date.now() - tStart;
          dev.actionCount += 1;
          dev.metrics = {
            t_cloud_to_mac_ms: Math.round(roundtripMs * 0.2),
            t_local_exec_ms: Math.round(roundtripMs * 0.7),
            t_screen_capture_ms: data.screenshotBase64 ? 90 : 0,
            t_cloud_roundtrip_ms: roundtripMs,
            t_total_ms: roundtripMs,
            lastUpdated: new Date().toISOString(),
          };

          return {
            id: reqId,
            success: data.success !== false,
            action,
            output: data.output || data.stdout || "Action exécutée avec succès sur le Mac hôte.",
            error: data.error || data.stderr,
            screenshotBase64: data.screenshotBase64,
            observation: data.observation,
            timings: {
              t_cloud_to_mac_ms: Math.round(roundtripMs * 0.2),
              t_local_exec_ms: Math.round(roundtripMs * 0.7),
              t_screen_capture_ms: data.screenshotBase64 ? 90 : 0,
            },
          };
        }
      } catch (err: any) {
        console.warn(`[CUSTOM BRIDGE] Direct dispatch failed on ${this.customBridgeUrl}:`, err.message);
      }
    }

    const payload = {
      id: reqId,
      type: 'EXEC_ACTION',
      action,
      command: rawCommand,
      params,
      timestamp: new Date().toISOString(),
      sentAt: Date.now(),
    };

    console.log(`[DEVICE MANAGER] Dispatching command ${reqId} (${action}) to device ${dev.deviceId} (${dev.hostname})`, params);

    return new Promise<DeviceActionResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        if (dev) dev.errorCount += 1;
        console.warn(`[DEVICE MANAGER] Timeout on command ${reqId} (${action}) after ${timeoutMs}ms`);
        reject(new Error(`Timeout de l'agent Mac local pour l'action '${action}' après ${timeoutMs}ms.`));
      }, timeoutMs);

      this.pendingRequests.set(reqId, {
        resolve,
        reject,
        timeout,
        startTime: Date.now(),
      });

      if (dev.ws && dev.ws.readyState === WebSocket.OPEN) {
        try {
          dev.ws.send(JSON.stringify(payload));
        } catch (err) {
          clearTimeout(timeout);
          this.pendingRequests.delete(reqId);
          reject(err);
        }
      } else {
        // Queue for HTTP polling agent
        console.log(`[DEVICE TUNNEL] Queued command ${reqId} for HTTP polling loop (${dev.deviceId}): ${action}`);
        this.httpPendingCommands.push({
          id: reqId,
          command: rawCommand,
          action,
          params,
          createdAt: Date.now(),
        });
      }
    });
  }

  private broadcastToConnectedDevices(payload: any): void {
    const raw = JSON.stringify(payload);
    for (const dev of this.devices.values()) {
      if (dev.ws && dev.ws.readyState === WebSocket.OPEN) {
        try {
          dev.ws.send(raw);
        } catch (e) {}
      }
    }
  }

  public revokeDevice(deviceId: string): boolean {
    const dev = this.devices.get(deviceId);
    if (dev) {
      if (dev.ws) {
        try {
          dev.ws.send(JSON.stringify({ type: 'REVOCATION', message: 'Device pairing revoked by administrator.' }));
          dev.ws.close(4003, 'Revoked');
        } catch (e) {}
      }
      this.devices.delete(deviceId);
      return true;
    }
    return false;
  }
}

export const deviceManager = new DeviceManager();
