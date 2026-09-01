import { memory } from "./memory";
import { invokeLLM, JARVIS_SYSTEM_PROMPT } from "./llmProvider";
import { jarvisToolDeclarations } from "./toolRegistry";
import { executeTool } from "./toolExecutor";
import { LLMResponse } from "../types";

export interface ConversationResult {
  reply: string;
  toolTriggered?: { tool: string; result: any }[];
  metrics: any;
  modelUsed: string;
  timestamp: string;
}

export async function processConversation(
  sessionId: string, 
  userPrompt: string,
  googleAccessToken?: string
): Promise<ConversationResult> {
  const tStart = Date.now();
  
  // Hybrid Router: Bypass LLM for basic actions
  const p = userPrompt.toLowerCase();
  if (p.includes("ouvre") || p.includes("open")) {
    const app = p.replace(/(ouvre|open)/, "").trim();
    const toolOutput = await executeTool("openMacApplication", { appName: app });
    return {
      reply: `Application ${app} ouverte, Maître.`,
      metrics: { t_backend_total_ms: Date.now() - tStart },
      modelUsed: "router-bypass",
      timestamp: new Date().toISOString(),
    };
  }

  const sessionHistory = memory.getSessionHistory(sessionId);

  // 1. Prepare history representation
  const cleanPastHistory = sessionHistory
    .filter(m => (m.content && typeof m.content === 'string' && m.content.trim()) || (m.parts && m.parts[0]?.text))
    .map(m => ({
      role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content || m.parts[0]?.text || '' }],
    }));

  const userTurn = { role: 'user' as const, parts: [{ text: userPrompt }] };
  const baseContents = [...cleanPastHistory.slice(-3), userTurn];

  const tBeforeLlm1 = Date.now();
  // 2. Invoke LLM with structured history
  const llmResult = await invokeLLM({
    systemPrompt: JARVIS_SYSTEM_PROMPT,
    history: sessionHistory,
    userPrompt,
    rawContents: baseContents,
    tools: jarvisToolDeclarations,
  });
  const tAfterLlm1 = Date.now();
  const llmFirstMs = tAfterLlm1 - tBeforeLlm1;

  let finalReply = llmResult.reply || "";
  
  let executedToolInfo: { tool: string; result: any }[] | undefined = undefined;
  let toolExecMs = 0;
  let llmFollowupMs = 0;

  // 3. Handle Tool Calls if requested by model
  if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
    const calls = llmResult.toolCalls;
    
    // Group tool calls based on dependencies
    const toolGroups = groupToolCalls(calls);
    console.log(`[CONVERSATION ENGINE] Executing ${calls.length} tool calls in ${toolGroups.length} stages...`);

    const tBeforeTool = Date.now();
    const toolResults: any[] = [];
    
    for (const group of toolGroups) {
        const groupPromises = group.map(async (call) => {
            const toolName = call.name;
            const toolArgs = { ...(call.args || {}), ...(googleAccessToken ? { _googleAccessToken: googleAccessToken } : {}) };
            
            try {
                const toolOutput = await executeTool(toolName, toolArgs);
                return { toolName, toolOutput, success: true };
            } catch (toolErr: any) {
                return {
                    toolName,
                    toolOutput: {
                        success: false,
                        error: toolErr.message || String(toolErr),
                        status: `Échec de l'exécution de l'outil '${toolName}' : ${toolErr.message || String(toolErr)}`,
                    },
                    success: false
                };
            }
        });
        const groupResults = await Promise.all(groupPromises);
        toolResults.push(...groupResults);
    }
    
    const tAfterTool = Date.now();
    toolExecMs = tAfterTool - tBeforeTool;

    executedToolInfo = toolResults.map(r => ({ 
      tool: r.toolName, 
      status: r.success ? "ACTION_SUCCEEDED" : "ACTION_FAILED",
      result: r.toolOutput 
    }));

    // Construct valid Gemini multi-turn tool response sequence
    const modelTurn = llmResult.candidateContent || {
      role: "model",
      parts: calls.map(call => ({ functionCall: call })),
    };

    const toolResponseTurn = {
      role: "user",
      parts: toolResults.map(res => ({
        functionResponse: { name: res.toolName, response: { output: res.toolOutput } }
      })),
    };

    const followupContents = [...baseContents, modelTurn, toolResponseTurn];

    // Check if Direct Response is possible
    if (canDirectRespond(toolResults)) {
      finalReply = constructDirectReply(toolResults);
    } else {
      const tBeforeLlm2 = Date.now();
      try {
        // Re-invoke LLM with tool output for final synthesis
        const followUpResult = await invokeLLM({
          systemPrompt: JARVIS_SYSTEM_PROMPT,
          history: [],
          userPrompt: userPrompt,
          rawContents: followupContents,
          tools: jarvisToolDeclarations,
        });
        const tAfterLlm2 = Date.now();
        llmFollowupMs = tAfterLlm2 - tBeforeLlm2;

        finalReply = followUpResult.reply || "Opérations exécutées avec succès, Maître.";
      } catch (llmErr) {
        finalReply = `À vos ordres, Maître. Les opérations ont été traitées.`;
      }
    }
  }

  // Helper functions for dependency analysis and direct response
  function groupToolCalls(calls: any[]) {
      // Very simple dependency logic: if a tool needs documentId, it depends on createGoogleDoc
      const groups: any[][] = [];
      const createdDocs = new Set<string>();
      
      let currentGroup: any[] = [];
      
      for (const call of calls) {
          // If tool depends on previous doc creation, it must wait
          if (call.args && (call.args.documentId || call.args.draftId) && currentGroup.length > 0) {
             groups.push(currentGroup);
             currentGroup = [call];
          } else {
             currentGroup.push(call);
          }
      }
      if (currentGroup.length > 0) groups.push(currentGroup);
      
      return groups;
  }

  function canDirectRespond(results: any[]) {
      // If any tool failed, we need LLM to explain
      if (results.some(r => !r.success)) return false;
      // If all tools are simple creation/confirmation
      return results.every(r => ["createGoogleDoc", "createGoogleSheet", "sendGmailDraft"].includes(r.toolName));
  }

  function constructDirectReply(results: any[]) {
      return results.map(r => {
         if (r.toolName === "createGoogleDoc") return `Le document "${r.toolOutput.title}" a été créé avec succès.`;
         if (r.toolName === "createGoogleSheet") return `La feuille "${r.toolOutput.title}" a été créée avec succès.`;
         return "Opération effectuée avec succès.";
      }).join(" ");
  }


  // 4. Record clean conversational turn to memory
  sessionHistory.push({
    role: "user",
    content: userPrompt,
    parts: [{ text: userPrompt }],
  });

  sessionHistory.push({
    role: "assistant",
    content: finalReply,
    parts: [{ text: finalReply }],
    toolTriggered: executedToolInfo,
  });

  memory.setHistory(sessionId, sessionHistory);

  const tTotal = Date.now() - tStart;

  const telemetryMetrics = {
    ...llmResult.metrics,
    t_backend_total_ms: tTotal,
    t_llm_first_ms: llmFirstMs,
    t_tool_exec_ms: toolExecMs,
    t_llm_followup_ms: llmFollowupMs,
    timestamp_start: new Date(tStart).toISOString(),
    timestamp_end: new Date().toISOString(),
  };

  console.log(`[LATENCY TELEMETRY] Total Backend: ${tTotal}ms (LLM1: ${llmFirstMs}ms, Tool: ${toolExecMs}ms, LLM2: ${llmFollowupMs}ms)`);

  return {
    reply: finalReply,
    toolTriggered: executedToolInfo,
    metrics: telemetryMetrics,
    modelUsed: llmResult.model,
    timestamp: new Date().toISOString(),
  };
}
