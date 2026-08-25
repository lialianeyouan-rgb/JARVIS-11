import fs from 'fs';

let content = fs.readFileSync('src/components/SystemMonitoringView.tsx', 'utf8');

content = content.replace(
  /const \[telemetry, setTelemetry\] = useState\(\{[\s\S]*?\}\);/,
  `const [telemetry, setTelemetry] = useState({
    cpu: 0,
    gpu: 0,
    ram: 0,
    storage: 0,
    networkDown: 0,
    networkUp: 0,
    coreTemp: 0,
    battery: 0,
    uptime: '0j 0h 0m',
    bridgeStatus: 'OFFLINE',
    bridgePort: 8765,
    jarvisLatencyAvg: 0,
    totalRequests: 0,
    errorRate: 0,
    tokensConsumed: '0',
    modelActive: 'gemini-3.1-flash-lite',
  });`
);

content = content.replace(
  /useEffect\(\(\) => \{\s*const interval = setInterval\(\(\) => \{[\s\S]*?\}, 2500\);\s*return \(\) => clearInterval\(interval\);\s*\}, \[\]\);/,
  `useEffect(() => {\n    // Simulation logic completely removed.\n  }, []);`
);

fs.writeFileSync('src/components/SystemMonitoringView.tsx', content);
