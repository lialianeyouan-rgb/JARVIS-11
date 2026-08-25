import fs from 'fs';

let content = fs.readFileSync('src/components/ComputerUseView.tsx', 'utf8');

// Similarly for handleExecuteIntent, it might try to parse HTML if the plan endpoint errors.
// Wait, the error is: Unexpected token '<', "<!doctype "... is not valid JSON
// We saw the POST request to /plan return JSON (because it's handled in Express and returned 500 JSON).
// But maybe another endpoint is returning HTML?

// Let's modify all res.json() calls to handle non-JSON responses.
content = content.replace(
  /const data = await res\.json\(\);/g,
  `const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON response:", text.substring(0, 50));
          throw new Error("Invalid JSON response");
        }`
);

fs.writeFileSync('src/components/ComputerUseView.tsx', content);
