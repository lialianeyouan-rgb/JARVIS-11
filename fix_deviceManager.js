import fs from 'fs';

let content = fs.readFileSync('server/computer_use/deviceManager.ts', 'utf8');

// 1. Remove the mock device from constructor
content = content.replace(
  /constructor\(\) \{[\s\S]*?this\.primaryDeviceId = defaultId;\s*\}/,
  `constructor() {
    this.primaryDeviceId = null;
  }`
);

// 2. Fix the getStatus method so battery and CPU are fetched from real device, or return undefined/0 if not present
content = content.replace(
  /batteryLevel: dev\?\.batteryLevel \?\? \(isOnline \? 95 : 100\),/g,
  `batteryLevel: dev?.batteryLevel ?? 0,`
);
content = content.replace(
  /cpuUsage: dev\?\.cpuUsage \?\? \(isOnline \? 12 : 3\),/g,
  `cpuUsage: dev?.cpuUsage ?? 0,`
);

// 3. Fix the customBridgeUrl device creation to NOT say it's online by default, unless it polls.
// Actually, it's easier to just remove the fake status 'online'.
content = content.replace(
  /status: 'online',(\s*)registeredAt/g,
  `status: 'offline',$1registeredAt`
);
content = content.replace(
  /lastHeartbeat: new Date\(\)\.toISOString\(\),(\s*)reconnectCount/g,
  `lastHeartbeat: new Date(0).toISOString(),$1reconnectCount`
);


fs.writeFileSync('server/computer_use/deviceManager.ts', content);
