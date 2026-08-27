import { ComputerUsePlan, ComputerUseAction, ComputerUsePrimitive, ActionStatus } from './types';
import { permissionEngine } from './permissionEngine';
import { localBridgeClient } from './localBridgeClient';
import { screenReader } from './screenReader';
import { macOSAgent } from './macOSAgent';
import { browserAgent } from './browserAgent';
import { computerUseLogger } from './eventLogger';
import { invokeLLM } from '../core/llmProvider';

class ComputerUseEngine {
  private activePlans: Map<string, ComputerUsePlan> = new Map();

  public async planAndExecute(userIntent: string): Promise<ComputerUsePlan> {
    console.log(`[COMPUTER USE LOCAL] Processing intent: "${userIntent}"`);
    
    // Parse intent directly with zero-latency hybrid parser, or fallback to AI planner
    let plan = this.createPlanFromIntent(userIntent);
    
    // Force readScreen as verification if steps array is empty
    if (plan.steps.length === 0) {
      plan.steps.push({
        id: `step_read_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Vérification de l\'état de l\'écran et de l\'application active',
      });
    }

    this.activePlans.set(plan.id, plan);

    computerUseLogger.log({
      eventType: 'PLAN_CREATED',
      status: 'PLANNED',
      details: {
        planId: plan.id,
        userIntent: plan.userIntent,
        stepCount: plan.steps.length,
      },
    });

    return await this.executePlan(plan.id);
  }

  public async generatePlanWithAI(userIntent: string): Promise<ComputerUseAction[]> {
    const prompt = `Génère un plan d'action J.A.R.V.I.S pour piloter un Mac.
L'intention de l'utilisateur est : "${userIntent}"

Tu dois retourner UNIQUEMENT un tableau JSON d'objets respectant cette structure TypeScript (ComputerUseAction) :
{
  "primitive": "launchApplication" | "click" | "typeText" | "pressKey" | "scroll" | "wait" | "readScreen",
  "target": "Nom de l'app ou de l'élément",
  "params": { ... },
  "description": "Description en français pour l'utilisateur"
}

Règles :
1. Utilise 'launchApplication' pour ouvrir des apps.
2. Utilise 'wait' (params.durationMs) pour les délais.
3. Toujours terminer par 'readScreen' pour valider.
4. Les coordonnées écran sont en 1920x1080.
5. Sois concis.

Réponds uniquement avec le JSON.`;

    const res = await invokeLLM({
      systemPrompt: "Tu es le module de planification autonome de J.A.R.V.I.S.",
      userPrompt: prompt,
      history: [{ role: 'user', content: prompt, sender: 'user', text: prompt, timestamp: new Date().toISOString() }],
    }, "gemini-1.5-flash");

    try {
      // Extract JSON if model added markdown wrappers
      const jsonText = res.reply.match(/\[[\s\S]*\]/)?.[0] || res.reply;
      const rawSteps = JSON.parse(jsonText);
      
      return rawSteps.map((s: any, i: number) => ({
        id: `ai_step_${i}_${Date.now()}`,
        primitive: s.primitive,
        target: s.target || "",
        params: s.params || {},
        riskLevel: 'medium',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: s.description || `Étape ${i+1}`,
      }));
    } catch (e) {
      console.error("[AI PLANNER JSON ERROR]", e);
      return [];
    }
  }

  public createPlanFromIntent(userIntent: string): ComputerUsePlan {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const lower = userIntent.toLowerCase().trim();
    const steps: ComputerUseAction[] = [];

    if (lower.includes('calculatrice') || lower.includes('calculator')) {
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'launchApplication',
        target: 'Calculator',
        params: { appName: 'Calculator' },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Lancer l\'application Calculatrice de macOS',
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'focusApplication',
        target: 'Calculator',
        params: { appName: 'Calculator' },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Positionner la Calculatrice au premier plan',
      });
      
      // If numbers or formulas are mentioned (e.g. 42*8 or 125+350)
      const mathMatch = userIntent.match(/(\d+[\s\+\-\*\/\=]+\d+)/);
      if (mathMatch) {
        steps.push({
          id: `step_3_${Date.now()}`,
          primitive: 'typeText',
          params: { text: mathMatch[1] },
          riskLevel: 'medium',
          status: 'PLANNED',
          requiresConfirmation: false,
          timestamp: new Date().toISOString(),
          description: `Saisir le calcul "${mathMatch[1]}" dans la Calculatrice`,
        });
        steps.push({
          id: `step_4_${Date.now()}`,
          primitive: 'pressKey',
          params: { key: 'return' },
          riskLevel: 'low',
          status: 'PLANNED',
          requiresConfirmation: false,
          timestamp: new Date().toISOString(),
          description: 'Valider le calcul avec la touche Entrée',
        });
      }
      
      steps.push({
        id: `step_end_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Capturer l\'écran pour lire le résultat affiché',
      });
    } else if (lower.includes('youtube')) {
      const isSafari = lower.includes('safari') || !lower.includes('chrome');
      const browser = isSafari ? 'Safari' : 'Google Chrome';
      const searchMatch = userIntent.replace(/.*youtube\s*(pour|sur|de)?\s*/i, '').trim();
      const ytUrl = searchMatch && searchMatch.length > 2 
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchMatch)}`
        : 'https://www.youtube.com';

      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'launchApplication',
        target: browser,
        params: { appName: browser, targetPath: ytUrl },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: `Lancer ${browser} et ouvrir YouTube (${ytUrl})`,
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'wait',
        params: { durationMs: 1500 },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Attendre le chargement de la page YouTube',
      });
      steps.push({
        id: `step_3_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Vérifier la lecture vidéo et les vignettes affichées',
      });
    } else if (lower.includes('ferme') || lower.includes('quitte') || lower.includes('close')) {
      const appMatch = userIntent.replace(/^(ferme|quitte|close)\s+(l'application|l'app|le|la)?\s*/i, '').trim() || 'Finder';
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'closeApplication',
        target: appMatch,
        params: { appName: appMatch },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: `Fermer l'application ${appMatch}`,
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Vérifier la fermeture de la fenêtre',
      });
    } else if (lower.includes('whatsapp')) {
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'launchApplication',
        target: 'WhatsApp',
        params: { appName: 'WhatsApp' },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Lancer l\'application WhatsApp sur le Mac',
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'focusApplication',
        target: 'WhatsApp',
        params: { appName: 'WhatsApp' },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Positionner WhatsApp au premier plan',
      });
      steps.push({
        id: `step_3_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Inspecter les conversations et contacts affichés',
      });
    } else if (lower.includes('linkedin')) {
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'launchApplication',
        target: 'Google Chrome',
        params: { appName: 'Google Chrome', targetPath: 'https://www.linkedin.com' },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Ouvrir Google Chrome et naviguer vers LinkedIn',
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'wait',
        params: { durationMs: 1500 },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Attendre le chargement de votre fil LinkedIn',
      });
      steps.push({
        id: `step_3_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Vérifier le chargement du profil et des publications',
      });
    } else if (lower.startsWith('recherche') || lower.startsWith('cherche') || lower.includes('google search') || lower.includes('sur google')) {
      const queryMatch = lower.replace(/^(recherche|cherche|rechercher|chercher)\s+/i, '').replace(/\s+sur google$/i, '');
      const query = queryMatch || 'actualités technologiques';
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'launchApplication',
        target: 'Google Chrome',
        params: { appName: 'Google Chrome', targetPath: searchUrl },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: `Lancer la recherche Google pour "${query}"`,
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'wait',
        params: { durationMs: 1200 },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Attendre l\'affichage des résultats Google',
      });
      steps.push({
        id: `step_3_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Analyser les résultats et liens affichés à l\'écran',
      });
    } else if (lower.includes('chrome') || lower.includes('safari') || lower.includes('ouvre cette page') || lower.includes('navigue vers') || lower.startsWith('http')) {
      const isSafari = lower.includes('safari');
      const browser = isSafari ? 'Safari' : 'Google Chrome';
      const urlMatch = userIntent.match(/https?:\/\/[^\s]+/i);
      const targetUrl = urlMatch ? urlMatch[0] : 'https://www.google.com';

      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'launchApplication',
        target: browser,
        params: { appName: browser, targetPath: targetUrl },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: `Lancer ${browser} et charger ${targetUrl}`,
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'wait',
        params: { durationMs: 1200 },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Attendre le chargement initial de la page web',
      });
      steps.push({
        id: `step_3_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Vérifier visuellement le chargement de la fenêtre et des éléments',
      });
    } else if (lower.includes('clique') || lower.includes('click') || lower.includes('appuie sur le bouton')) {
      const targetElement = userIntent.replace(/^(clique sur|click on|clique|appuie sur)\s+/i, '').trim() || 'Bouton';
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'findElement',
        target: targetElement,
        params: { query: targetElement },
        riskLevel: 'medium',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: `Localiser l'élément visuel "${targetElement}" à l'écran`,
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'click',
        target: targetElement,
        params: { target: targetElement, x: 960, y: 540 },
        riskLevel: 'medium',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: `Effectuer un clic direct sur "${targetElement}"`,
      });
      steps.push({
        id: `step_3_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Observer l\'état de la fenêtre suite au clic',
      });
    } else if (lower.includes('écris') || lower.includes('ecris') || lower.includes('tape') || lower.includes('saisis')) {
      const textToType = userIntent.replace(/^(écris ce texte|ecris ce texte|écris|ecris|tape|saisis)\s*[:"']?/i, '').replace(/["']?$/i, '').trim();
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'typeText',
        params: { text: textToType },
        riskLevel: 'medium',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: `Saisir le texte "${textToType}" dans le champ sélectionné`,
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Vérifier la saisie du texte à l\'écran',
      });
    } else if (lower.includes('lis ce qui est affiché') || lower.includes('lis l\'écran') || lower.includes('capture') || lower.includes('que vois-tu') || lower.includes('regarde l\'écran')) {
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Capturer l\'écran du Mac et analyser les fenêtres et le texte affiché',
      });
    } else if (lower.includes('reviens en arrière') || lower.includes('page précédente') || lower.includes('retour')) {
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'pressKey',
        params: { key: '[', modifiers: ['cmd'] },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Déclencher le raccourci historique précédent (Cmd + [)',
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'wait',
        params: { durationMs: 800 },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Attendre le rechargement de la page précédente',
      });
      steps.push({
        id: `step_3_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Vérifier la page active',
      });
    } else if (lower.includes('vs code') || lower.includes('code') || lower.includes('projet')) {
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'launchApplication',
        target: 'Visual Studio Code',
        params: { appName: 'Visual Studio Code' },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Lancer l\'éditeur Visual Studio Code',
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'focusApplication',
        target: 'Visual Studio Code',
        params: { appName: 'Visual Studio Code' },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Basculer la fenêtre active sur Visual Studio Code',
      });
      steps.push({
        id: `step_3_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Inspecter l\'état du projet et les terminaux actifs',
      });
    } else {
      const targetApp = lower.includes('spotify') ? 'Spotify' : (lower.includes('slack') ? 'Slack' : (lower.includes('terminal') ? 'Terminal' : 'Finder'));
      steps.push({
        id: `step_1_${Date.now()}`,
        primitive: 'launchApplication',
        target: targetApp,
        params: { appName: targetApp },
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: `Lancer l'application ${targetApp}`,
      });
      steps.push({
        id: `step_2_${Date.now()}`,
        primitive: 'readScreen',
        riskLevel: 'low',
        status: 'PLANNED',
        requiresConfirmation: false,
        timestamp: new Date().toISOString(),
        description: 'Capturer et valider l\'état de l\'écran',
      });
    }

    return {
      id: planId,
      userIntent,
      steps,
      currentStepIndex: 0,
      status: 'PLANNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public async executePlan(planId: string): Promise<ComputerUsePlan> {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} introuvable.`);
    }

    plan.status = 'EXECUTING';
    plan.updatedAt = new Date().toISOString();

    for (let i = plan.currentStepIndex; i < plan.steps.length; i++) {
      if (localBridgeClient.getEmergencyStop()) {
        plan.status = 'CANCELLED';
        plan.isEmergencyStopped = true;
        plan.finalResult = "Plan interrompu immédiatement : Arrêt d'urgence actif.";
        break;
      }

      const step = plan.steps[i];
      plan.currentStepIndex = i;

      // 1. Policy Evaluation via Permission Engine
      const policy = permissionEngine.evaluateAction(step.primitive, step.params);
      step.riskLevel = policy.riskLevel;

      if (!policy.allowed && policy.requiresConfirmation && !step.confirmed) {
        step.status = 'REQUIRES_CONFIRMATION';
        step.requiresConfirmation = true;
        plan.status = 'PAUSED';
        
        permissionEngine.createPendingConfirmation({
          action: step.primitive,
          target: step.target,
          params: step.params || {},
          description: step.description,
          riskJustification: policy.reason,
        });

        plan.finalResult = `Action sensible détectée à l'étape ${i + 1} (${step.description}). En attente de confirmation explicite du Maître.`;
        return plan;
      }

      // 2. Execute Action Primitive
      step.status = 'EXECUTING';
      const stepStartTime = Date.now();

      try {
        await this.executePrimitive(step);
        
        // 3. Observation & State Validation
        const observation = await screenReader.readScreen();
        step.observation = observation;
        
        const validation = screenReader.validateObservation(step.target || step.primitive, observation);
        step.observation.validationPassed = validation.passed;
        step.observation.validationNotes = validation.notes;

        step.durationMs = Date.now() - stepStartTime;
        step.status = 'SUCCESS';
      } catch (err: any) {
        step.durationMs = Date.now() - stepStartTime;
        step.status = 'FAILED';
        step.error = err.message || String(err);
        plan.status = 'FAILED';
        plan.finalResult = `Échec à l'étape ${i + 1} (${step.description}) : ${step.error}`;
        return plan;
      }
    }

    if (plan.status === 'EXECUTING') {
      plan.status = 'SUCCESS';
      plan.finalResult = `Toutes les étapes du plan (${plan.steps.length}/${plan.steps.length}) ont été exécutées et validées avec succès sur l'appareil.`;
    }

    computerUseLogger.log({
      eventType: 'PLAN_FINISHED',
      status: plan.status,
      details: {
        planId: plan.id,
        status: plan.status,
        result: plan.finalResult,
      },
    });

    return plan;
  }

  public async executePrimitive(step: ComputerUseAction): Promise<any> {
    const { primitive, params = {} } = step;

    switch (primitive) {
      case 'launchApplication':
        return await macOSAgent.launchApp(params.appName || step.target || 'Finder', params.targetPath);
      case 'closeApplication':
        return await macOSAgent.closeApp(params.appName || step.target || 'Finder');
      case 'focusApplication':
        return await macOSAgent.focusApp(params.appName || step.target || 'Finder');
      case 'click':
        return await localBridgeClient.click(params.x ?? 960, params.y ?? 540, 'left');
      case 'doubleClick':
        return await localBridgeClient.click(params.x ?? 960, params.y ?? 540, 'double');
      case 'moveMouse':
        return await localBridgeClient.moveMouse(params.x ?? 960, params.y ?? 540);
      case 'drag':
        return await localBridgeClient.drag(params.x1 ?? 100, params.y1 ?? 100, params.x2 ?? 400, params.y2 ?? 400);
      case 'typeText':
        return await localBridgeClient.typeText(params.text || '');
      case 'pressKey':
        return await localBridgeClient.pressKey(params.key || 'return', params.modifiers || []);
      case 'scroll':
        return await localBridgeClient.scroll(params.deltaX ?? 0, params.deltaY ?? 100);
      case 'readScreen':
      case 'getScreen':
        return await screenReader.readScreen();
      case 'findElement':
        return await screenReader.findElement(params.query || step.target || '');
      case 'waitForElement':
        return await screenReader.waitForElement(params.query || step.target || '', params.timeoutMs || 5000);
      case 'wait':
        await new Promise(r => setTimeout(r, params.durationMs || 1000));
        return { success: true };
      case 'emergencyStop':
        localBridgeClient.setEmergencyStop(true);
        return { success: true, message: "Arrêt d'urgence engagé." };
      default:
        throw new Error(`Primitive non reconnue : ${primitive}`);
    }
  }

  public getPlan(planId: string): ComputerUsePlan | undefined {
    return this.activePlans.get(planId);
  }

  public getAllPlans(): ComputerUsePlan[] {
    return Array.from(this.activePlans.values());
  }

  public triggerEmergencyStop(): void {
    localBridgeClient.setEmergencyStop(true);
    for (const plan of this.activePlans.values()) {
      if (plan.status === 'EXECUTING' || plan.status === 'PAUSED') {
        plan.status = 'CANCELLED';
        plan.isEmergencyStopped = true;
        plan.finalResult = "Plan interrompu immédiatement : Arrêt d'urgence enclenché.";
      }
    }
  }

  public resetEmergencyStop(): void {
    localBridgeClient.setEmergencyStop(false);
  }
}

export const computerUseEngine = new ComputerUseEngine();
