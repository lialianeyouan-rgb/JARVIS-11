export interface Message {
  role: 'system' | 'user' | 'assistant' | 'model' | 'tool';
  content?: string;
  parts?: any[];
  tool_call_id?: string;
  [key: string]: any;
}

export interface ConversationContext {
  systemPrompt: string;
  history: Message[];
  userPrompt: string;
  tools?: any[];
  rawContents?: any[];
}

export interface LLMResponse {
  success: boolean;
  reply?: string;
  toolCalls?: any[];
  candidateContent?: any;
  rawResponse?: any;
  provider: string;
  model: string;
  metrics: {
    responseTimeMs: number;
    messageCount: number;
    roles: string[];
    toolsAvailableCount: number;
  };
  error?: {
    message: string;
    status?: number;
    stack?: string;
  };
}

export interface ToolResult {
  success: boolean;
  status: "ACTION_SUCCEEDED" | "ACTION_FAILED" | "ACTION_REQUIRES_CONFIRMATION" | "AUTHENTICATION_REQUIRED" | "PERMISSION_DENIED" | "RESOURCE_NOT_FOUND";
  data?: any;
  error?: string;
  message?: string;
  timestamp: string;
  toolName: string;
}
