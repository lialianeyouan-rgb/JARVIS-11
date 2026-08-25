import { ComputerUsePrimitive, RiskLevel, ActionStatus } from './types';
import { computerUseLogger } from './eventLogger';

export interface PendingConfirmation {
  id: string;
  action: ComputerUsePrimitive;
  target?: string;
  params: Record<string, any>;
  riskLevel: RiskLevel;
  description: string;
  riskJustification: string;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

class PermissionEngine {
  private pendingConfirmations: Map<string, PendingConfirmation> = new Map();
  
  // Strict Whitelist of standard applications permitted for immediate launch without high risk
  private allowedApplications: Set<string> = new Set([
    'google chrome',
    'chrome',
    'safari',
    'visual studio code',
    'code',
    'vs code',
    'terminal',
    'iterm2',
    'iterm',
    'finder',
    'spotify',
    'slack',
    'discord',
    'notes',
    'calendar',
    'calculator',
    'settings',
    'system preferences',
  ]);

  // Sensitive application keywords or actions that always trigger HIGH risk
  private highRiskKeywords = [
    'send',
    'envoyer',
    'delete',
    'supprimer',
    'pay',
    'payer',
    'buy',
    'acheter',
    'purchase',
    'rm -rf',
    'sudo',
    'chmod',
    'password',
    'mot de passe',
    'bank',
    'banque',
    'transfer',
    'checkout',
  ];

  public evaluateAction(
    primitive: ComputerUsePrimitive, 
    params: Record<string, any> = {}
  ): {
    allowed: boolean;
    riskLevel: RiskLevel;
    requiresConfirmation: boolean;
    reason: string;
  } {
    // 1. Check if it is a safe passive inspection primitive (Low risk)
    if (
      primitive === 'getScreen' ||
      primitive === 'readScreen' ||
      primitive === 'findElement' ||
      primitive === 'waitForElement' ||
      primitive === 'wait' ||
      primitive === 'moveMouse' ||
      primitive === 'scroll'
    ) {
      return {
        allowed: true,
        riskLevel: 'low',
        requiresConfirmation: false,
        reason: 'Passive inspection or low-impact UI navigation permitted.',
      };
    }

    // 2. Emergency Stop is always allowed immediately with top priority
    if (primitive === 'emergencyStop') {
      return {
        allowed: true,
        riskLevel: 'low',
        requiresConfirmation: false,
        reason: 'Emergency stop override accepted immediately.',
      };
    }

    // 3. Application Launch and Focus evaluation
    if (primitive === 'launchApplication' || primitive === 'focusApplication') {
      const appName = (params.appName || params.target || '').toLowerCase().trim();
      if (!appName) {
        return {
          allowed: false,
          riskLevel: 'low',
          requiresConfirmation: false,
          reason: 'Application name is required.',
        };
      }

      if (this.allowedApplications.has(appName)) {
        return {
          allowed: true,
          riskLevel: 'low',
          requiresConfirmation: false,
          reason: `Application '${appName}' is in the verified application whitelist.`,
        };
      }

      // If application is unknown or not explicitly in whitelist, require user validation
      return {
        allowed: true,
        riskLevel: 'medium',
        requiresConfirmation: false,
        reason: `Application '${appName}' is not in standard whitelist; executing with standard sandboxed isolation.`,
      };
    }

    // 4. Keyboard / Typing actions
    if (primitive === 'typeText') {
      const text = (params.text || '').toLowerCase();
      const containsHighRisk = this.highRiskKeywords.some(kw => text.includes(kw));

      if (containsHighRisk || params.isSensitiveSubmission) {
        return {
          allowed: false,
          riskLevel: 'high',
          requiresConfirmation: true,
          reason: `Typing contains sensitive or transaction keywords ('${params.text}'). Explicit user confirmation required.`,
        };
      }

      return {
        allowed: true,
        riskLevel: 'medium',
        requiresConfirmation: false,
        reason: 'Standard alphanumeric keystroke injection permitted.',
      };
    }

    // 5. Hotkeys & Key Press
    if (primitive === 'hotkey' || primitive === 'pressKey') {
      const key = (params.key || '').toLowerCase();
      const modifiers = (params.modifiers || []).map((m: string) => m.toLowerCase());
      
      // Destructive shortcut checks (Cmd+W close, Cmd+Q quit, Cmd+Delete delete)
      if (modifiers.includes('command') || modifiers.includes('ctrl')) {
        if (key === 'q' || key === 'delete' || key === 'backspace') {
          return {
            allowed: false,
            riskLevel: 'high',
            requiresConfirmation: true,
            reason: `Potentially destructive keyboard shortcut (${modifiers.join('+')}+${key}) requires confirmation.`,
          };
        }
      }

      return {
        allowed: true,
        riskLevel: 'medium',
        requiresConfirmation: false,
        reason: 'Standard keyboard navigation hotkey permitted.',
      };
    }

    // 6. Clicks & Mouse Actions
    if (primitive === 'click' || primitive === 'doubleClick' || primitive === 'drag') {
      const targetLabel = (params.targetLabel || params.target || '').toLowerCase();
      const isDangerousButton = this.highRiskKeywords.some(kw => targetLabel.includes(kw));

      if (isDangerousButton || params.isHighRiskTarget) {
        return {
          allowed: false,
          riskLevel: 'high',
          requiresConfirmation: true,
          reason: `Targeting high-risk UI element '${targetLabel}'. Explicit user confirmation required.`,
        };
      }

      return {
        allowed: true,
        riskLevel: 'medium',
        requiresConfirmation: false,
        reason: 'Standard UI pointer interaction permitted.',
      };
    }

    // 7. Close Application
    if (primitive === 'closeApplication') {
      return {
        allowed: true,
        riskLevel: 'medium',
        requiresConfirmation: false,
        reason: 'Application closure request permitted.',
      };
    }

    // Default Fallback: Deny-by-default
    return {
      allowed: false,
      riskLevel: 'high',
      requiresConfirmation: true,
      reason: `Unknown or unclassified primitive '${primitive}'. Deny-by-default policy enforced.`,
    };
  }

  public createPendingConfirmation(params: {
    action: ComputerUsePrimitive;
    target?: string;
    params: Record<string, any>;
    description: string;
    riskJustification: string;
  }): PendingConfirmation {
    const confirmationId = `conf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const confirmation: PendingConfirmation = {
      id: confirmationId,
      action: params.action,
      target: params.target,
      params: params.params,
      riskLevel: 'high',
      description: params.description,
      riskJustification: params.riskJustification,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes validity
      status: 'PENDING',
    };

    this.pendingConfirmations.set(confirmationId, confirmation);

    computerUseLogger.log({
      eventType: 'ACTION_REQUIRES_CONFIRMATION',
      action: params.action,
      target: params.target,
      riskLevel: 'high',
      status: 'REQUIRES_CONFIRMATION',
      details: {
        confirmationId,
        description: params.description,
        justification: params.riskJustification,
      },
    });

    return confirmation;
  }

  public getPendingConfirmations(): PendingConfirmation[] {
    const now = Date.now();
    // Filter out expired
    const active: PendingConfirmation[] = [];
    for (const [id, conf] of this.pendingConfirmations.entries()) {
      if (new Date(conf.expiresAt).getTime() < now && conf.status === 'PENDING') {
        conf.status = 'EXPIRED';
      }
      if (conf.status === 'PENDING') {
        active.push(conf);
      }
    }
    return active;
  }

  public resolveConfirmation(id: string, approved: boolean): PendingConfirmation | null {
    const conf = this.pendingConfirmations.get(id);
    if (!conf) return null;

    if (approved) {
      conf.status = 'APPROVED';
      computerUseLogger.log({
        eventType: 'ACTION_STARTED',
        action: conf.action,
        target: conf.target,
        riskLevel: conf.riskLevel,
        status: 'EXECUTING',
        details: { confirmationId: id, status: 'User manually confirmed high-risk action' },
      });
    } else {
      conf.status = 'REJECTED';
      computerUseLogger.log({
        eventType: 'ACTION_BLOCKED',
        action: conf.action,
        target: conf.target,
        riskLevel: conf.riskLevel,
        status: 'BLOCKED',
        details: { confirmationId: id, status: 'User explicitly denied action' },
      });
    }

    return conf;
  }
}

export const permissionEngine = new PermissionEngine();
