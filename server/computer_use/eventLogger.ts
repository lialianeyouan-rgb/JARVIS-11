import { ComputerUseEvent, ComputerUsePrimitive, RiskLevel, ActionStatus } from './types';

class EventLogger {
  private events: ComputerUseEvent[] = [];
  private readonly maxEvents = 200;

  constructor() {
    this.log({
      eventType: 'ACTION_COMPLETED',
      status: 'SUCCESS',
      details: { message: 'Computer Use Event Logger initialized in Secure Mode' },
    });
  }

  public log(params: {
    eventType: ComputerUseEvent['eventType'];
    action?: ComputerUsePrimitive;
    target?: string;
    riskLevel?: RiskLevel;
    status: ActionStatus | string;
    details?: Record<string, any>;
  }): ComputerUseEvent {
    const event: ComputerUseEvent = {
      id: `cue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: params.eventType,
      action: params.action,
      target: params.target,
      riskLevel: params.riskLevel,
      status: params.status,
      details: params.details,
      timestamp: new Date().toISOString(),
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    console.log(`[COMPUTER USE EVENT] [${event.eventType}] ${event.action || ''} -> Status: ${event.status}`, event.details || '');
    return event;
  }

  public getEvents(limit = 50): ComputerUseEvent[] {
    return this.events.slice(0, limit);
  }

  public clear(): void {
    this.events = [];
  }
}

export const computerUseLogger = new EventLogger();
