import fs from 'fs';

let content = fs.readFileSync('src/components/ComputerControlView.tsx', 'utf8');

content = content.replace(
  /const \[processes, setProcesses\] = useState<SystemProcess\[\]>\(\[[\s\S]*?\]\);/,
  `const [processes, setProcesses] = useState<SystemProcess[]>([]);`
);

fs.writeFileSync('src/components/ComputerControlView.tsx', content);
