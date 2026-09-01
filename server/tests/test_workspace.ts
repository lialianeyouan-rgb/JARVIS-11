import { executeTool } from '../core/toolExecutor';

async function runTests() {
  console.log("--- STARTING WORKSPACE E2E TESTS ---");
  
  // Test 1: List Calendar Events
  console.log("\n[Test 1] List Calendar Events");
  try {
    const res = await executeTool("listGoogleCalendarEvents", { _googleAccessToken: process.env.GOOGLE_ACCESS_TOKEN });
    console.log("Result:", JSON.stringify(res, null, 2));
    if (res.success) {
      console.log("PASS: Calendar events retrieved.");
    } else {
      console.log("FAIL: Calendar events failed.", res.error);
    }
  } catch (err) {
    console.error("FAIL: Calendar test threw error", err);
  }

  console.log("\n--- TESTS COMPLETED ---");
}

runTests();
