import { Message } from "../types";

export class ConversationMemory {
  private sessions: Map<string, Message[]> = new Map();

  constructor(private maxHistoryLength: number = 50) {}

  public getSessionHistory(sessionId: string = "default"): Message[] {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    return this.sessions.get(sessionId)!;
  }

  public addMessage(sessionId: string = "default", message: Message): void {
    const history = this.getSessionHistory(sessionId);
    history.push(message);
    if (history.length > this.maxHistoryLength) {
      // Keep oldest system or slice
      this.sessions.set(sessionId, history.slice(-this.maxHistoryLength));
    }
  }

  public setHistory(sessionId: string = "default", messages: Message[]): void {
    this.sessions.set(sessionId, messages);
  }

  public clearSession(sessionId: string = "default"): void {
    this.sessions.delete(sessionId);
  }

  public formatHistoryForGemini(messages: Message[]): any[] {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        let role = m.role === "assistant" ? "model" : m.role;
        if (role === "tool") role = "user"; // Gemini tool results mapping
        return {
          role,
          parts: m.parts || [{ text: m.content || "" }],
        };
      });
  }
}

export const memory = new ConversationMemory();
