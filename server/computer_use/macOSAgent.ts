import { localBridgeClient } from './localBridgeClient';
import { screenReader } from './screenReader';
import { computerUseLogger } from './eventLogger';

export class MacOSAgent {
  public async launchApp(appName: string, targetPath?: string): Promise<{ success: boolean; message: string; details?: any }> {
    computerUseLogger.log({
      eventType: 'ACTION_STARTED',
      action: 'launchApplication',
      target: appName,
      riskLevel: 'low',
      status: 'EXECUTING',
      details: { appName, targetPath },
    });

    try {
      const res = await localBridgeClient.launchApp(appName, targetPath);
      // Observe screen after launch
      const observation = await screenReader.readScreen();

      const success = res.success;
      computerUseLogger.log({
        eventType: success ? 'ACTION_COMPLETED' : 'ACTION_FAILED',
        action: 'launchApplication',
        target: appName,
        riskLevel: 'low',
        status: success ? 'SUCCESS' : 'FAILED',
        details: { appName, observation, output: res.output, simulated: res.simulated },
      });

      return {
        success,
        message: `Application '${appName}' ${success ? 'lancée et affichée' : 'échec de lancement'}${res.simulated ? ' (Mode simulation actif)' : ''}.`,
        details: { observation, output: res.output, simulated: res.simulated },
      };
    } catch (err: any) {
      computerUseLogger.log({
        eventType: 'ACTION_FAILED',
        action: 'launchApplication',
        target: appName,
        riskLevel: 'low',
        status: 'FAILED',
        details: { appName, error: err.message },
      });

      return {
        success: false,
        message: err.message || `Échec du lancement de '${appName}'.`,
        details: { error: err.message },
      };
    }
  }

  public async focusApp(appName: string): Promise<{ success: boolean; message: string }> {
    computerUseLogger.log({
      eventType: 'ACTION_STARTED',
      action: 'focusApplication',
      target: appName,
      riskLevel: 'low',
      status: 'EXECUTING',
      details: { appName },
    });

    try {
      const res = await localBridgeClient.focusApp(appName);
      return {
        success: res.success,
        message: `Focus basculé sur '${appName}'.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || `Impossible de basculer sur '${appName}'.`,
      };
    }
  }

  public async closeApp(appName: string): Promise<{ success: boolean; message: string }> {
    computerUseLogger.log({
      eventType: 'ACTION_STARTED',
      action: 'closeApplication',
      target: appName,
      riskLevel: 'medium',
      status: 'EXECUTING',
      details: { appName },
    });

    try {
      const res = await localBridgeClient.closeApp(appName);
      return {
        success: res.success,
        message: `Application '${appName}' fermée.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || `Impossible de fermer '${appName}'.`,
      };
    }
  }
}

export const macOSAgent = new MacOSAgent();
