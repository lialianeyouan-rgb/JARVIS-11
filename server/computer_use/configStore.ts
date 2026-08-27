import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'server', '.jarvis-config.json');

export function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load jarvis config', e);
  }
  return {};
}

export function saveConfig(config: any) {
  try {
    const existing = loadConfig();
    fs.writeFileSync(configPath, JSON.stringify({ ...existing, ...config }, null, 2));
  } catch (e) {
    console.error('Failed to save jarvis config', e);
  }
}
