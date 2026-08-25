import fs from 'fs';

let content = fs.readFileSync('server/computer_use/localBridgeClient.ts', 'utf8');

// We want to completely replace this file to remove ALL simulation logic.
const newContent = `import { DeviceStatus, ScreenObservation } from './types';
import { computerUseLogger } from './eventLogger';
import { deviceManager } from './deviceManager';

export class LocalBridgeClient {
  public setEmergencyStop(stopped: boolean): void {
    deviceManager.setEmergencyStop(stopped);
  }

  public getEmergencyStop(): boolean {
    return deviceManager.getEmergencyStop();
  }

  public async getStatus(): Promise<DeviceStatus> {
    return deviceManager.getStatus();
  }

  public isOnline(): boolean {
    return deviceManager.isDeviceOnline();
  }

  private requireOnline(): void {
    if (this.getEmergencyStop()) {
      throw new Error("Opération rejetée : Arrêt d'urgence actif.");
    }
    if (!this.isOnline()) {
      throw new Error("Le Mac n'est pas connecté. Veuillez lancer le script Python sur votre machine locale.");
    }
  }

  public async launchApplication(appName: string, targetPath?: string): Promise<{ success: boolean; output: any; simulated: boolean; timings?: any }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('launchApp', { appName, targetPath });
    if (!res.success) {
      throw new Error(res.error || \`Échec du lancement de '\${appName}'.\`);
    }
    return { success: true, output: res.output, simulated: false, timings: res.timings };
  }

  public async closeApplication(appName: string): Promise<{ success: boolean; output: any; simulated: boolean }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('closeApp', { appName });
    if (!res.success) {
      throw new Error(res.error || \`Échec de fermeture de '\${appName}'.\`);
    }
    return { success: true, output: res.output, simulated: false };
  }

  public async focusApp(appName: string): Promise<{ success: boolean; output: any; simulated: boolean }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('focusApp', { appName });
    if (!res.success) {
      throw new Error(res.error || \`Échec de focus sur '\${appName}'.\`);
    }
    return { success: true, output: res.output, simulated: false };
  }

  public async click(
    x: number,
    y: number,
    type: 'left' | 'right' | 'double' = 'left'
  ): Promise<{ success: boolean; output: any; simulated: boolean; screenshotUrl?: string }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('click', { x, y, type });
    if (!res.success) {
      throw new Error(res.error || \`Échec du clic en (\${x}, \${y}).\`);
    }
    return { success: true, output: res.output, simulated: false, screenshotUrl: res.screenshotBase64 };
  }

  public async moveMouse(x: number, y: number): Promise<{ success: boolean; output: any; simulated: boolean }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('moveMouse', { x, y });
    if (!res.success) {
      throw new Error(res.error || \`Échec du déplacement souris vers (\${x}, \${y}).\`);
    }
    return { success: true, output: res.output, simulated: false };
  }

  public async drag(x1: number, y1: number, x2: number, y2: number): Promise<{ success: boolean; output: any; simulated: boolean }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('drag', { x1, y1, x2, y2 });
    if (!res.success) {
      throw new Error(res.error || \`Échec du glisser-déposer de (\${x1}, \${y1}) à (\${x2}, \${y2}).\`);
    }
    return { success: true, output: res.output, simulated: false };
  }

  public async scroll(deltaX: number, deltaY: number): Promise<{ success: boolean; output: any; simulated: boolean }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('scroll', { deltaX, deltaY });
    if (!res.success) {
      throw new Error(res.error || \`Échec du défilement (\${deltaX}, \${deltaY}).\`);
    }
    return { success: true, output: res.output, simulated: false };
  }

  public async typeText(text: string): Promise<{ success: boolean; output: any; simulated: boolean }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('typeText', { text });
    if (!res.success) {
      throw new Error(res.error || \`Échec de la saisie de texte.\`);
    }
    return { success: true, output: res.output, simulated: false };
  }

  public async pressKey(key: string, modifiers: string[] = []): Promise<{ success: boolean; output: any; simulated: boolean }> {
    this.requireOnline();
    const res = await deviceManager.sendDeviceCommand('pressKey', { key, modifiers });
    if (!res.success) {
      throw new Error(res.error || \`Échec de l'appui sur la touche '\${key}'.\`);
    }
    return { success: true, output: res.output, simulated: false };
  }

  public async executeCommand(command: string): Promise<{ success: boolean; output: any; error?: string; simulated?: boolean }> {
    this.requireOnline();
    try {
      const res = await deviceManager.sendDeviceCommand('execCommand', { command });
      return { success: res.success, output: res.output, error: res.error, simulated: false };
    } catch (e: any) {
      return { success: false, output: null, error: e.message, simulated: false };
    }
  }

  public async captureScreen(): Promise<ScreenObservation> {
    this.requireOnline();
    try {
      const res = await deviceManager.sendDeviceCommand('captureScreen', {});
      if (res && res.success) {
        return {
          timestamp: new Date().toISOString(),
          activeApp: res.observation?.activeApp || 'Finder',
          windowTitle: res.observation?.windowTitle || 'Mac Screen',
          screenshotUrl: res.screenshotBase64,
          detectedElements: res.observation?.detectedElements || [
            { type: 'window', label: res.observation?.activeApp || 'Main Window', bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
          ],
          ocrText: res.observation?.ocrText || \`Application active : \${res.observation?.activeApp}\`,
          validationPassed: true,
        };
      }
      throw new Error(res.error || "Capture d'écran échouée");
    } catch (e: any) {
      throw new Error(\`Erreur capture écran: \${e.message}\`);
    }
  }
}

export const localBridgeClient = new LocalBridgeClient();
`;
fs.writeFileSync('server/computer_use/localBridgeClient.ts', newContent);
