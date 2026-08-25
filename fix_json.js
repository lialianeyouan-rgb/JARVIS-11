import fs from 'fs';

let content = fs.readFileSync('src/components/ComputerUseView.tsx', 'utf8');

// The issue might be that fetchScreen is trying to parse JSON when the endpoint is returning a 500 error page because the Mac is not connected,
// which returns HTML.

content = content.replace(
`  const fetchScreen = async () => {
    setScreenLoading(true);
    try {
      const res = await fetch('/api/jarvis/computer-use/screen');
      if (res.ok) {
        const data = await res.json();
        if (data.observation) setScreenObservation(data.observation);
      }
    } catch {
      // Silently retry on next interval tick
    } finally {
      setScreenLoading(false);
    }
  };`,
`  const fetchScreen = async () => {
    if (!device?.connected) return; // Prevent fetching screen if offline to avoid 500 HTML responses
    setScreenLoading(true);
    try {
      const res = await fetch('/api/jarvis/computer-use/screen');
      if (res.ok) {
        const data = await res.json();
        if (data.observation) setScreenObservation(data.observation);
      }
    } catch {
      // Silently retry on next interval tick
    } finally {
      setScreenLoading(false);
    }
  };`
);

fs.writeFileSync('src/components/ComputerUseView.tsx', content);
