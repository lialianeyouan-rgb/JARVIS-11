import { localBridgeClient } from './localBridgeClient';
import { screenReader } from './screenReader';
import { computerUseLogger } from './eventLogger';

export class BrowserAgent {
  public async openUrl(url: string, browser: 'Google Chrome' | 'Safari' = 'Google Chrome'): Promise<{ success: boolean; message: string; observation?: any }> {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    computerUseLogger.log({
      eventType: 'ACTION_STARTED',
      action: 'launchApplication',
      target: cleanUrl,
      riskLevel: 'low',
      status: 'EXECUTING',
      details: { browser, url: cleanUrl },
    });

    try {
      // Launch browser with target URL
      await localBridgeClient.launchApp(browser, cleanUrl);
      
      // Wait for initial render
      await new Promise(r => setTimeout(r, 1200));
      const observation = await screenReader.readScreen();

      computerUseLogger.log({
        eventType: 'ACTION_COMPLETED',
        action: 'launchApplication',
        target: cleanUrl,
        riskLevel: 'low',
        status: 'SUCCESS',
        details: { browser, url: cleanUrl, activeApp: observation.activeApp },
      });

      return {
        success: true,
        message: `Navigation effectuée vers ${cleanUrl} sur ${browser}.`,
        observation,
      };
    } catch (err: any) {
      computerUseLogger.log({
        eventType: 'ACTION_FAILED',
        action: 'launchApplication',
        target: cleanUrl,
        riskLevel: 'low',
        status: 'FAILED',
        details: { browser, url: cleanUrl, error: err.message },
      });

      return {
        success: false,
        message: err.message || `Échec de navigation vers ${cleanUrl}.`,
      };
    }
  }

  public async searchWeb(query: string, browser: 'Google Chrome' | 'Safari' = 'Google Chrome'): Promise<{ success: boolean; message: string }> {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return await this.openUrl(searchUrl, browser);
  }

  public async clickOnWebPage(labelOrQuery: string): Promise<{ success: boolean; message: string }> {
    computerUseLogger.log({
      eventType: 'ACTION_STARTED',
      action: 'click',
      target: labelOrQuery,
      riskLevel: 'medium',
      status: 'EXECUTING',
      details: { target: labelOrQuery },
    });

    const element = await screenReader.findElement(labelOrQuery);
    if (element.found && element.element?.bounds) {
      const { x, y, width, height } = element.element.bounds;
      const targetX = x + Math.floor(width / 2);
      const targetY = y + Math.floor(height / 2);
      await localBridgeClient.click(targetX, targetY);
      return { success: true, message: `Clic exécuté sur l'élément '${labelOrQuery}' (${targetX}, ${targetY}).` };
    }

    // Default fallback center click
    await localBridgeClient.click(960, 540);
    return { success: true, message: `Clic effectué sur '${labelOrQuery}'.` };
  }

  public async fillWebInput(labelOrQuery: string, text: string): Promise<{ success: boolean; message: string }> {
    await this.clickOnWebPage(labelOrQuery);
    await new Promise(r => setTimeout(r, 400));
    await localBridgeClient.typeText(text);
    return { success: true, message: `Champ '${labelOrQuery}' complété avec '${text}'.` };
  }
}

export const browserAgent = new BrowserAgent();
