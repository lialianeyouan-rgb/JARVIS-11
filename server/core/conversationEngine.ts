import { memory } from "./memory";
import { invokeLLM, JARVIS_SYSTEM_PROMPT } from "./llmProvider";
import { jarvisToolDeclarations } from "./toolRegistry";
import { executeTool } from "./toolExecutor";
import { LLMResponse } from "../types";

export interface ConversationResult {
  reply: string;
  toolTriggered?: { tool: string; result: any };
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
  let executedToolInfo: { tool: string; result: any } | undefined = undefined;
  let toolExecMs = 0;
  let llmFollowupMs = 0;

  // 3. Handle Tool Calls if requested by model
  if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
    const call = llmResult.toolCalls[0];
    const toolName = call.name;
    const toolArgs = { ...(call.args || {}), ...(googleAccessToken ? { _googleAccessToken: googleAccessToken } : {}) };

    console.log(`[CONVERSATION ENGINE] Executing tool call: ${toolName}`, toolArgs);

    const tBeforeTool = Date.now();
    // Execute actual tool safely
    let toolOutput: any;
    try {
      toolOutput = await executeTool(toolName, toolArgs);
    } catch (toolErr: any) {
      toolOutput = {
        success: false,
        error: toolErr.message || String(toolErr),
        status: `Échec de l'exécution de l'outil '${toolName}' : ${toolErr.message || String(toolErr)}`,
      };
    }
    const tAfterTool = Date.now();
    toolExecMs = tAfterTool - tBeforeTool;

    executedToolInfo = { tool: toolName, result: toolOutput };

    // Construct valid Gemini multi-turn tool response sequence with preserved thoughtSignature
    const modelTurn = llmResult.candidateContent || {
      role: "model",
      parts: [{ functionCall: call }],
    };

    const toolResponseTurn = {
      role: "user",
      parts: [{ functionResponse: { name: toolName, response: { output: toolOutput } } }],
    };

    const followupContents = [...baseContents, modelTurn, toolResponseTurn];

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

      finalReply = followUpResult.reply || toolOutput.status || toolOutput.message || toolOutput.error || `Opération ${toolName} exécutée avec succès, Maître.`;
    } catch (llmErr) {
      finalReply = toolOutput.status || toolOutput.message || toolOutput.error || `À vos ordres, Maître. L'opération ${toolName} a été traitée.`;
    }
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
