import { deviceManager } from './server/computer_use/deviceManager.ts';

async function test() {
  deviceManager.setCustomBridgeUrl("https://wellington-allows-cpu-host.trycloudflare.com", "jarvis-secure-mac-token-2026");
  try {
    const res = await deviceManager.sendDeviceCommand("launchApp", { appName: "Safari" });
    console.log("Response:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
