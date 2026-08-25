import fs from 'fs';

let content = fs.readFileSync('src/components/ComputerUseView.tsx', 'utf8');

content = content.replace(
  /const \[metrics, setMetrics\] = useState<DeviceMetrics>\(\{[\s\S]*?actionsExecuted: 0,\s*\}\);/,
  `const [metrics, setMetrics] = useState<DeviceMetrics>({
    t_cloud_to_mac_ms: 0,
    t_local_exec_ms: 0,
    t_screen_capture_ms: 0,
    t_total_ms: 0,
    actionsExecuted: 0,
  });`
);

content = content.replace(
  /const \[customTunnelUrl, setCustomTunnelUrl\] = useState\('https:\/\/93514a9c58e528\.lh3\.life'\);/,
  `const [customTunnelUrl, setCustomTunnelUrl] = useState('');`
);

fs.writeFileSync('src/components/ComputerUseView.tsx', content);
