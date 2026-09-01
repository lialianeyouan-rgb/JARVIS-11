export type NavigationTab = 
  | 'home'
  | 'system'
  | 'tasks'
  | 'memory'
  | 'capabilities' 
  | 'integrations' 
  | 'activity'
  | 'settings' 
  | 'voice_settings'
  | 'communications'
  | 'files'
  | 'computer'
  | 'computer_use'
  | 'security'
  | 'monitoring'
  | 'history'
  | 'vision'
  | 'agent';

export interface AgentTask {
  id: string;
  title: string;
  category: 'research' | 'code' | 'workspace' | 'email' | 'system';
  status: 'running' | 'completed' | 'waiting_confirmation' | 'queued' | 'failed';
  progress: number;
  currentStep: string;
  steps: {
    id: string;
    label: string;
    status: 'pending' | 'active' | 'done' | 'failed';
    timestamp?: string;
  }[];
  startedAt: string;
  completedAt?: string;
  requiresAction?: {
    actionType: 'confirm_email' | 'confirm_file_deletion' | 'confirm_deploy';
    prompt: string;
    payload?: any;
  };
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  type: 'USER_REQUEST' | 'LLM_REASONING' | 'TOOL_CALL' | 'TOOL_RESULT' | 'RESPONSE_GENERATED' | 'SYSTEM_ALERT';
  level: 'info' | 'tool' | 'success' | 'warning' | 'error';
  title: string;
  details: string;
  toolName?: string;
  payload?: any;
  durationMs?: number;
}

export interface VoiceConfig {
  profile?: 'jarvis' | 'friday' | 'homer' | 'karen' | 'edith' | 'vision' | 'neo' | 'robot';
  voiceURI?: string;
  gender: 'masculine' | 'feminine' | 'auto';
  characteristic: 'grave' | 'calme' | 'dynamique' | 'standard' | 'tactique' | 'philosophique' | 'robotique';
  rate: number;
  pitch: number;
  lang: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  gender: 'masculine' | 'feminine';
  characteristic: 'grave' | 'calme' | 'dynamique' | 'tactique' | 'philosophique' | 'robotique';
  rate: number;
  pitch: number;
  icon: string;
}

export interface CommunicationDraft {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  channel: 'email' | 'system_notification' | 'slack';
  createdAt: string;
  status: 'draft' | 'ready_to_send' | 'dispatched' | 'failed';
}

export interface SystemIntegration {
  name: string;
  status: 'CONNECTED' | 'READY' | 'STANDBY_BRIDGE' | 'UNCONFIGURED' | 'ONLINE';
  type: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolTriggered?: {
    tool: string;
    status: string;
    result?: any;
  }[];
}

export interface MemoryItem {
  id: string;
  category: 'preference' | 'fact' | 'project' | 'objective';
  key: string;
  value: string;
  confidence: number;
  updatedAt: string;
}

export interface SystemProcess {
  pid: number;
  name: string;
  status: 'running' | 'idle' | 'suspended';
  cpu: string;
  memory: string;
}

export interface SecurityPermission {
  id: string;
  toolName: string;
  description: string;
  enabled: boolean;
  requiresConfirmation: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  status: 'SUCCESS' | 'BLOCKED' | 'PENDING';
  details: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  size: string;
  type: string;
  updatedAt: string;
  status: 'indexed' | 'processing' | 'secure';
}

export interface CalendarTask {
  id: string;
  title: string;
  time: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'pending' | 'completed' | 'in_progress';
}


