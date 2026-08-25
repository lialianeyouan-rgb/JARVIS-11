import fs from 'fs';

let content = fs.readFileSync('src/components/SystemMonitoringView.tsx', 'utf8');

content = content.replace(
  /const \[processes, setProcesses\] = useState\(\[[\s\S]*?\]\);/,
  `const [processes, setProcesses] = useState([]);`
);

fs.writeFileSync('src/components/SystemMonitoringView.tsx', content);
