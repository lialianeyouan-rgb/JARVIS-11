export type RiskLevel = 'low' | 'medium' | 'high';

export type ActionStatus = 
  | 'REQUESTED' 
  | 'PLANNED' 
  | 'EXECUTING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'BLOCKED' 
  | 'REQUIRES_CONFIRMATION';

export type ComputerUsePrimitive =
  | 'launchApplication'
  | 'closeApplication'
  | 'focusApplication'
  | 'getScreen'
  | 'click'
  | 'doubleClick'
  | 'typeText'
  | 'pressKey'
  | 'hotkey'
  | 'scroll'
  | 'moveMouse'
  | 'drag'
  | 'readScreen'
  | 'findElement'
  | 'waitForElement'
  | 'wait'
  | 'emergencyStop';

export interface ComputerUseAction {
  id: string;
  primitive: ComputerUsePrimitive;
  target?: string;
  params?: Record<string, any>;
  riskLevel: RiskLevel;
  status: ActionStatus;
  requiresConfirmation: boolean;
  confirmed?: boolean;
  timestamp: string;
  error?: string;
  observation?: ScreenObservation;
  durationMs?: number;
  description: string;
}

export interface ScreenObservation {
  timestamp: string;
  activeApp: string;
  windowTitle?: string;
  screenshotUrl?: string;
  detectedElements?: Array<{
    type: 'button' | 'input' | 'text' | 'link' | 'window';
    label: string;
    bounds?: { x: number; y: number; width: number; height: number };
    confidence?: number;
  }>;
  ocrText?: string;
  validationPassed?: boolean;
  validationNotes?: string;
}

export interface ComputerUsePlan {
  id: string;
  userIntent: string;
  steps: ComputerUseAction[];
  currentStepIndex: number;
  status: 'PLANNED' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'PAUSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  finalResult?: string;
  isEmergencyStopped?: boolean;
}

export interface DeviceStatus {
  connected: boolean;
  platform: 'macOS' | 'linux' | 'windows';
  hostName: string;
  bridgePort: number;
  bridgeUrl: string;
  activeApp: string;
  resolution: { width: number; height: number };
  batteryLevel?: number;
  cpuUsage?: number;
  isEmergencyStopped: boolean;
  lastHeartbeat: string;
  isSimulation: boolean;
}

export interface ComputerUseEvent {
  id: string;
  eventType: 
    | 'ACTION_STARTED' 
    | 'ACTION_COMPLETED' 
    | 'ACTION_FAILED' 
    | 'ACTION_BLOCKED' 
    | 'ACTION_REQUIRES_CONFIRMATION'
    | 'PLAN_CREATED'
    | 'PLAN_FINISHED'
    | 'EMERGENCY_STOP';
  action?: ComputerUsePrimitive;
  target?: string;
  riskLevel?: RiskLevel;
  status: ActionStatus | string;
  details?: Record<string, any>;
  timestamp: string;
}
