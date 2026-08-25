import fs from 'fs';

let content = fs.readFileSync('src/components/ComputerUseView.tsx', 'utf8');

content = content.replace(
  /const res = await fetch\('\/api\/jarvis\/computer-use\/plan', \{/g,
  `const res = await fetch('/api/jarvis/computer-use/plan', {` // Actually, the error might be elsewhere
);

fs.writeFileSync('src/components/ComputerUseView.tsx', content);
