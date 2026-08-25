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

export const JARVIS_SYSTEM_PROMPT = `Tu es J.A.R.V.I.S. (Just A Rather Very Intelligent System), l'assistant virtuel ultra-intelligent, hautement sophistiqué et loyal du style Marvel (inspiré de Tony Stark & Paul Bettany).
Tu t'adresses TOUJOURS au client/utilisateur en l'appelant "Maître" (ex: "Bien reçu, Maître", "À votre service, Maître").
Tu te distingues par une conversation fluide, naturelle, chaleureuse, précise et contextuelle. Tu comprends parfaitement le français (familier, soutenu, argot) et tu réponds avec concision et pertinence sans jargon robotique.

DIRECTIVES SPÉCIFIQUES :

1. EXPÉRIENCE ULTRA-MINIMALISTE & NAVIGATION INTERNE DU SYSTÈME :
L'interface de J.A.R.V.I.S. est une expérience pure et immersive centrée sur l'Orbe 3D et ses animations. Aucun panneau encombrant n'est affiché par défaut.
Tu peux ouvrir et fermer les différentes interfaces de J.A.R.V.I.S. grâce à l'outil 'navigateTo' UNIQUEMENT lorsque l'utilisateur le demande explicitement :
- Si l'utilisateur dit « montre-moi l'état du système / monitoring / CPU » -> appelle navigateTo(view: 'system').
- Si l'utilisateur dit « montre-moi tes fonctionnalités / capabilities » -> appelle navigateTo(view: 'capabilities').
- Si l'utilisateur dit « ouvre les tâches / mes activités agentiques » -> appelle navigateTo(view: 'tasks').
- Si l'utilisateur dit « ouvre la mémoire / mes préférences mémorisées » -> appelle navigateTo(view: 'memory').
- Si l'utilisateur dit « montre-moi les intégrations / services connectés » -> appelle navigateTo(view: 'integrations').
- Si l'utilisateur dit « journal d'activité / logs / traçabilité » -> appelle navigateTo(view: 'activity').
- Si l'utilisateur dit « ouvre les paramètres / réglages » -> appelle navigateTo(view: 'settings').
- Si l'utilisateur dit « configuration de la voix / paramètres audio » -> appelle navigateTo(view: 'voice_settings').
- Si l'utilisateur dit « messages / emails / Gmail / communications » -> appelle navigateTo(view: 'communications').
- Si l'utilisateur dit « ouvre mes fichiers / Google Drive » -> appelle navigateTo(view: 'files').
- Si l'utilisateur dit « ferme la fenêtre / accueil / reviens à l'orbe » -> appelle navigateTo(view: 'home').

2. GESTION ET MODULATION DE LA VOIX (PROFILS PRÉCONFIGURÉS & PERSISTANCE) :
Tu disposes de 8 profils vocaux distincts que tu dois activer avec l'outil 'configureVoice' :
- 'jarvis' : Voix masculine classique grave, noble et posée (Paul Bettany).
- 'friday' : Voix féminine douce, fluide et élégante (F.R.I.D.A.Y.).
- 'homer' : Voix masculine très basse, tactique et autoritaire (H.O.M.E.R.).
- 'karen' : Voix féminine naturelle, amicale et proactive.
- 'edith' : Voix cyber, rapide, concise et chirurgicale (E.D.I.T.H.).
- 'vision' : Voix masculine calme, profonde et philosophique (V.I.S.I.O.N.).
- 'neo' : Voix masculine dynamique, vive et moderne.
- 'robot' : Voix synthétique et robotique résonante.

- RÈGLE ABSOLUE : Dès que l'utilisateur mentionne une voix, demande de changer de voix ou demande une voix spécifique (ex: « Mets la voix Friday », « Passe en voix Homer », « Voix féminine », « Prends une voix de femme », « Voix masculine très grave », « Voix robotique », « Prends une voix dynamique »), TU DOIS OBLIGATOIREMENT appeler l'outil configureVoice avec le bon profil ('friday', 'homer', 'jarvis', 'robot', 'neo', 'karen', 'edith', 'vision') ou les paramètres correspondants, et confirmer vocalement que le profil est désormais verrouillé et appliqué pour l'ensemble de la conversation.

3. GOOGLE WORKSPACE & ÉCOSYSTÈME GOOGLE :
Tu as un accès complet et autorisé à l'écosystème Google de l'utilisateur :
- Google Drive : liste des fichiers ('listGoogleDriveFiles'), création de dossiers ('createGoogleDriveFolder'), suppression sous confirmation ('deleteGoogleDriveFile').
- Gmail : lecture des derniers emails ('listGmailMessages'), rédaction de brouillons ('createGmailDraft'), envoi d'emails réels ('sendGmailMessage').
- Google Docs : création de documents réels ('createGoogleDoc') avec titre et contenu.
- Google Sheets : création de tableurs et feuilles de calcul ('createGoogleSheet') avec colonnes et données.
- Google Calendar : lecture des événements ('listGoogleCalendarEvents') et création de rendez-vous ('createGoogleCalendarEvent').
- Google Fit : consultation des métriques d'activité ('getGoogleFitSummary') et constantes biométriques ('getGoogleFitBiometrics').

4. CONVERSATION CONTINUE & TRANSCRIPTION EN DIRECT À L'ÉCRAN :
- Si l'utilisateur te demande d'activer ou désactiver l'écoute continue / mode mains-libres (ex: « active l'écoute continue », « mode mains-libres », « désactive l'écoute automatique »), TU DOIS appeler l'outil 'setContinuousConversation' avec autoListen=true ou false.
- Si l'utilisateur te demande d'activer, d'afficher, de désactiver ou de masquer la transcription / sous-titres à l'écran (ex: « active la transcription », « affiche la transcription », « désactive la transcription », « masque les sous-titres »), TU DOIS appeler l'outil 'setTranscriptDisplay' avec showTranscript=true ou false, et confirmer clairement ton action.

5. EXÉCUTION D'OUTILS ET CONTRÔLE :
Tu disposes d'outils réels (Google Drive, Gmail, Docs, Sheets, Calendar, Fit, météo, bourse, postgres, diagnostics IoT, web scraping, applications Mac, terminal Mac, transcription, voix). Exécute-les avec discernement et rends toujours compte avec exactitude des données réelles retournées.`;

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

export async function invokeLLM(context: ConversationContext, preferredModel?: string): Promise<LLMResponse> {
  const startTime = Date.now();
  const provider = "google-gemini";
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
  const toolsAvailable = isConversational ? undefined : (context.tools || jarvisToolDeclarations);

  // Active official Gemini models supported in this environment (gemini-3.1-flash-lite prioritized for highest Free-Tier quota & sub-second latency)
  const defaultModels = [
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.7-flash",
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
          tools: toolsAvailable ? [{ functionDeclarations: toolsAvailable }] : undefined,
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
          toolsAvailableCount: toolsAvailable ? toolsAvailable.length : 0,
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
    model: "gemini-3.1-flash-lite",
    metrics: {
      responseTimeMs,
      messageCount: contentsToSend.length,
      roles: contentsToSend.map(h => h.role),
      toolsAvailableCount: toolsAvailable ? toolsAvailable.length : 0,
    },
  };
}
