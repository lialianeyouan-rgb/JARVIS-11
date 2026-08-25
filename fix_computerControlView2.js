import fs from 'fs';

let content = fs.readFileSync('src/components/ComputerControlView.tsx', 'utf8');

content = content.replace(
  /const \[terminalLogs, setTerminalLogs\] = useState<string\[\]>\(\[[\s\S]*?\]\);/,
  `const [terminalLogs, setTerminalLogs] = useState<string[]>(['Type a command or select a quick script below.']);`
);

fs.writeFileSync('src/components/ComputerControlView.tsx', content);
