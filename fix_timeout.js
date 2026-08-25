import fs from 'fs';

let content = fs.readFileSync('server/computer_use/deviceManager.ts', 'utf8');

// The Python polling script polls every 0.5s to 1.5s.
// A 180000ms (3 mins) window is way too long, making the UI look like a simulation.
// Let's reduce it to 10000ms (10 seconds).
content = content.replace(
  /const isRecentlyActive = \(Date\.now\(\) - lastHbTime\) < 180000; \/\/ 3 minutes window/g,
  `const isRecentlyActive = (Date.now() - lastHbTime) < 10000; // 10 seconds window for HTTP polling`
);

fs.writeFileSync('server/computer_use/deviceManager.ts', content);
