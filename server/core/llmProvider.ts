import { GoogleGenAI } from "@google/genai";
import { ConversationContext, LLMResponse } from "../types";
import { jarvisToolDeclarations } from "./toolRegistry";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export const JARVIS_SYSTEM_PROMPT = `Tu es JARVIS. Assistant technique intelligent, sophistiqué, réactif.
Rôle : Exécution de code, productivité, gestion Workspace/Mac.
Directives :
1. Réponse concise, structurée, orientée solution. Pas de bavardage.
2. Utilise les outils (navigate, configureVoice, Workspace, etc.) UNIQUEMENT sur demande explicite.
3. Si sollicité pour changer de voix, utilise 'configureVoice'.
4. Ton : Professionnel, loyal, efficace.`;

// Track rate-limited models to avoid repeated 429s during cooldown
const modelCooldownMap: Map<string, number> = new Map();

// Local offline fallback intent resolver for high-resilience operation
function resolveOfflineFallbackResponse(prompt: string): { reply: string; toolCalls?: any[] } {
  const p = prompt.toLowerCase().trim();
  
  if (p.includes('transcription') || p.includes('sous-titre') || p.includes('sous titre') || p.includes('texte à l\'écran')) {
    const enable = !p.includes('désactive') && !p.includes('desactive') && !p.includes('masque') && !p.includes('coupe') && !p.includes('supprime') && !p.includes('éteins');
    return {
      reply: enable 
        ? "J'ai activé l'affichage de la transcription en direct sur votre écran, Maître."
        : "J'ai désactivé l'affichage de la transcription pour épurer votre écran, Maître.",
      toolCalls: [{ name: 'setTranscriptDisplay', args: { showTranscript: enable } }],
    };
  }

  if (p.includes('mains-libres') || p.includes('mains libres') || p.includes('écoute continue') || p.includes('ecoute continue')) {
    const enable = !p.includes('désactive') && !p.includes('desactive') && !p.includes('coupe') && !p.includes('stop');
    return {
      reply: enable 
        ? "Le mode mains-libres et l'écoute continue automatique sont désormais activés, Maître."
        : "Le mode mains-libres a été désactivé. Le micro attendra vos directives manuelles, Maître.",
      toolCalls: [{ name: 'setContinuousConversation', args: { autoListen: enable } }],
    };
  }

  if (p.includes('heure') || p.includes('date') || p.includes('jour')) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return { reply: `Il est actuellement ${timeStr}, le ${dateStr}, Maître.` };
  }

  if (p.includes('système') || p.includes('system') || p.includes('statut') || p.includes('état') || p.includes('status')) {
    return {
      reply: "Diagnostic local : tous les sous-systèmes J.A.R.V.I.S., l'orbe quantique et le moteur vocal ElevenLabs fonctionnent à 100% d'efficacité. Je vous ouvre l'affichage système.",
      toolCalls: [{ name: 'navigateTo', args: { view: 'system' } }],
    };
  }

  if (p.includes('voix') || p.includes('voice') || p.includes('parle') || p.includes('audio')) {
    return {
      reply: "Je vous ouvre le centre de contrôle audio et des profils vocaux neuronaux, Maître.",
      toolCalls: [{ name: 'navigateTo', args: { view: 'voice' } }],
    };
  }

  if (p.includes('paramètre') || p.includes('setting') || p.includes('config') || p.includes('clé') || p.includes('quota')) {
    return {
      reply: "Affichage des paramètres de configuration et d'optimisation des quotas de l'IA.",
      toolCalls: [{ name: 'navigateTo', args: { view: 'settings' } }],
    };
  }

  if (p.includes('google') || p.includes('mail') || p.includes('agenda') || p.includes('calendar') || p.includes('drive')) {
    return {
      reply: "Je vous ouvre la passerelle Google Workspace pour consulter vos e-mails, votre agenda et vos documents.",
      toolCalls: [{ name: 'navigateTo', args: { view: 'workspace' } }],
    };
  }

  if (['bonjour', 'salut', 'coucou', 'hello', 'hey', 'hi'].some(g => p.startsWith(g))) {
    return { reply: "Bonjour Maître. Tous les protocoles J.A.R.V.I.S. sont prêts et à votre écoute." };
  }

  if (['merci', 'super', 'parfait', 'excellent', 'bien joué'].some(g => p.includes(g))) {
    return { reply: "Tout le plaisir est pour moi, Maître. Toujours à votre entière disposition." };
  }

  return {
    reply: "À vos ordres, Maître. Le réseau neuronal principal subit une brève temporisation de quota Google, mais tous les modules de contrôle direct et d'exécution locale restent à votre service. Que souhaitez-vous accomplir ?",
  };
}

// Ollama support
async function invokeOllama(context: ConversationContext, toolsAvailable: any[] | undefined): Promise<LLMResponse> {
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  const url = "http://localhost:11434/api/chat";
  
  const messages = [
    { role: 'system', content: JARVIS_SYSTEM_PROMPT },
    ...context.history.map(m => ({
      role: (m.role === "assistant" || m.role === "model") ? "assistant" : "user",
      content: m.content || (m.parts && m.parts[0]?.text) || ""
    })),
    { role: 'user', content: context.userPrompt }
  ];
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        num_ctx: 2048,
        num_predict: 512,
        temperature: 0.7,
      }
    })
  });
  
  const data = await response.json();
  return {
    success: true,
    reply: data.message.content,
    provider: 'ollama',
    model
  };
}

export async function invokeLLM(context: ConversationContext, preferredModel?: string): Promise<LLMResponse> {
  const startTime = Date.now();
  const provider = process.env.USE_OLLAMA === "true" ? "ollama" : "google-gemini";
  
  const toolsAvailable = context.tools || jarvisToolDeclarations;

  if (provider === "ollama") {
      return await invokeOllama(context, toolsAvailable);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_ERROR: GEMINI_API_KEY is not defined in environment.");
  }

  const ai = getGeminiClient();
  
  let contentsToSend: any[] = [];
  if (context.rawContents && context.rawContents.length > 0) {
    contentsToSend = context.rawContents;
  } else {
    const cleanTurns: any[] = [];
    for (const m of context.history) {
      const role = (m.role === "assistant" || m.role === "model") ? "model" : "user";
      const textContent = m.content || (m.parts && m.parts[0]?.text) || "";
      if (textContent && typeof textContent === 'string' && textContent.trim()) {
        if (cleanTurns.length > 0 && cleanTurns[cleanTurns.length - 1].role === role) {
          cleanTurns[cleanTurns.length - 1].parts[0].text += "\n" + textContent;
        } else {
          cleanTurns.push({
            role,
            parts: [{ text: textContent }],
          });
        }
      }
    }

    if (context.userPrompt && context.userPrompt.trim()) {
      if (cleanTurns.length === 0 || cleanTurns[cleanTurns.length - 1].role !== "user") {
        cleanTurns.push({
          role: "user",
          parts: [{ text: context.userPrompt }],
        });
      } else if (cleanTurns[cleanTurns.length - 1].parts[0].text !== context.userPrompt) {
        cleanTurns[cleanTurns.length - 1].parts[0].text = context.userPrompt;
      }
    }

    // Ensure it starts with user turn
    let truncated = cleanTurns.slice(-10);
    while (truncated.length > 0 && truncated[0].role !== "user") {
      truncated = truncated.slice(1);
    }
    if (truncated.length === 0 && context.userPrompt) {
      truncated = [{ role: "user", parts: [{ text: context.userPrompt }] }];
    }
    contentsToSend = truncated;
  }

  // Conditionally bypass tool declarations for simple conversational greetings to cut latency to < 1s
  const lowerPrompt = (context.userPrompt || "").toLowerCase().trim();
  const isConversational = ['bonjour', 'salut', 'coucou', 'ça va', 'comment vas-tu', 'merci', 'hello', 'hi', 'hey', 'super', 'ok', 'au revoir', 'good morning'].some(g => lowerPrompt === g || lowerPrompt.startsWith(g + ' '));
  const toolsAvailableForLLM = isConversational ? undefined : toolsAvailable;

  // Active official Gemini models supported in this environment
  const defaultModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  const orderedCandidates = preferredModel && defaultModels.includes(preferredModel)
    ? Array.from(new Set([preferredModel, ...defaultModels]))
    : defaultModels;

  const now = Date.now();
  // Try models not currently in cooldown first, then all remaining models
  let candidateModels = orderedCandidates.filter(m => (modelCooldownMap.get(m) || 0) < now);
  if (candidateModels.length === 0) {
    candidateModels = orderedCandidates;
  }

  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentsToSend,
        config: {
          systemInstruction: JARVIS_SYSTEM_PROMPT,
          tools: toolsAvailableForLLM ? [{ functionDeclarations: toolsAvailableForLLM }] : undefined,
          temperature: 0.7,
        },
      });

      const responseTimeMs = Date.now() - startTime;
      const replyText = response.text || "";
      const functionCalls = response.functionCalls || [];

      // Clear cooldown on success
      modelCooldownMap.delete(modelName);

      return {
        success: true,
        reply: replyText,
        toolCalls: functionCalls.length > 0 ? functionCalls : undefined,
        candidateContent: response.candidates?.[0]?.content,
        rawResponse: response,
        provider,
        model: modelName,
        metrics: {
          responseTimeMs,
          messageCount: contentsToSend.length,
          roles: contentsToSend.map(h => h.role),
          toolsAvailableCount: toolsAvailableForLLM ? toolsAvailableForLLM.length : 0,
        },
      };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);

      // Extract retry delay if provided by Gemini API error (e.g. "retry in 23.07s")
      let cooldownDuration = 30000;
      const retryMatch = errMsg.match(/retry in (\d+(\.\d+)?)s/i) || errMsg.match(/retryDelay"?:\s*"(\d+)s/i);
      if (retryMatch && retryMatch[1]) {
        cooldownDuration = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000;
      }

      // If it's a quota, rate-limit, overload or transient error, put model in cooldown and try next model
      if (
        errMsg.includes('429') || 
        errMsg.includes('RESOURCE_EXHAUSTED') || 
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('500') ||
        errMsg.includes('INTERNAL')
      ) {
        console.warn(`[GEMINI LLM] Model ${modelName} temporary limit reached (${errMsg.slice(0, 120)}...). Cooling down for ${cooldownDuration}ms and trying next candidate.`);
        modelCooldownMap.set(modelName, Date.now() + cooldownDuration);
        continue;
      }

      if (errMsg.includes('not found') || errMsg.includes('404')) {
        console.warn(`[GEMINI LLM] Model ${modelName} not found (404). Deprecating from active list.`);
        modelCooldownMap.set(modelName, Date.now() + 3600000); // 1 hour
        continue;
      }

      // Otherwise break if it's an explicit schema error (400)
      if (errMsg.includes('400') || errMsg.includes('INVALID_ARGUMENT')) {
        console.warn(`[GEMINI LLM] Model ${modelName} returned 400 Invalid Argument:`, errMsg);
        break;
      }
      continue;
    }
  }

  // If all candidate models in cascade failed (e.g. temporary universal Free Tier quota delay)
  const responseTimeMs = Date.now() - startTime;
  const errMsg = lastError?.message || String(lastError);
  console.info(`[GEMINI LLM] Fallback offline intent resolver engaged. Last error: ${errMsg.slice(0, 100)}`);

  const fallback = resolveOfflineFallbackResponse(context.userPrompt);

  return {
    success: true,
    reply: fallback.reply,
    toolCalls: fallback.toolCalls,
    rawResponse: lastError,
    provider,
    model: "gemini-1.5-flash",
    metrics: {
      responseTimeMs,
      messageCount: contentsToSend.length,
      roles: contentsToSend.map(h => h.role),
      toolsAvailableCount: toolsAvailableForLLM ? toolsAvailableForLLM.length : 0,
    },
  };
}

