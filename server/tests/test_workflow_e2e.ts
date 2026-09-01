import { executeTool } from '../core/toolExecutor';
import { googleAuthService } from '../core/googleAuthService';

async function runWorkflowTest() {
  console.log("--- STARTING WORKFLOW E2E TEST: Gmail -> Docs ---");
  
  // Use googleAuthService to get valid token
  let token;
  try {
    token = await googleAuthService.getValidAccessToken();
    console.log("PASS: Authenticated with Google Workspace.");
  } catch (err: any) {
    console.error("FAIL: Authentication failed.", err.message);
    return;
  }

  // 1. List Gmail
  console.log("\n[Step 1] Searching Gmail...");
  const searchRes = await executeTool("listGmailMessages", { _googleAccessToken: token, query: "FinProtect" });
  console.log("Result:", JSON.stringify(searchRes, null, 2));

  if (!searchRes.success) {
      console.log("FAIL: Gmail search failed.");
      return;
  }

  // 2. Create Docs (Simulated content based on analysis)
  console.log("\n[Step 2] Creating Google Doc with summary...");
  const docRes = await executeTool("createGoogleDoc", { 
      _googleAccessToken: token, 
      title: "Rapport Synthèse FinProtect", 
      content: "Ceci est un rapport généré automatiquement pour FinProtect." 
  });
  console.log("Result:", JSON.stringify(docRes, null, 2));

  if (docRes.success) {
      console.log("PASS: Workflow Gmail -> Docs completed and verified.");
  } else {
      console.log("FAIL: Workflow failed at Doc creation.", docRes.error);
  }

  console.log("\n--- TEST COMPLETED ---");
}

runWorkflowTest();
