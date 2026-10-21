/**
 * @file sapient-events.ts
 * @description SAPIENT v7 event bus for the simulation engine.
 *   Manages publish/subscribe for all SAPIENT message types within a simulation session.
 *   In the prototype, events are in-memory. Phase 2 migrates to Redis pub/sub.
 *
 * NATO SAPIENT Milestone 7 — BSI Flex 335 v2.0, 2024
 */

export enum SAPIENTEventType {
  /** Sensor reports a new detection */
  DETECTION          = 'DETECTION',
  /** Tracking update — position/velocity update for an existing track */
  TRACK_UPDATE       = 'TRACK_UPDATE',
  /** Operator alert — ROE violation, threat escalation, sector entry */
  ALERT              = 'ALERT',
  /** Sensor heartbeat status */
  STATUS             = 'STATUS',
  /** Tasking command from operator to sensor */
  COMMAND            = 'COMMAND',
  /** Kill-chain phase transition */
  PHASE_TRANSITION   = 'PHASE_TRANSITION',
  /** Session lifecycle events */
  SESSION_START      = 'SESSION_START',
  SESSION_END        = 'SESSION_END',
}

export interface SAPIENTEvent<T = unknown> {
  messageId: string;
  type: SAPIENTEventType;
  timestamp: string;
  sessionId: string;
  sensorId: string;
  payload: T;
}

type EventHandler<T = unknown> = (event: SAPIENTEvent<T>) => void | Promise<void>;

/** In-memory event bus — Phase 2: Redis pub/sub with DTLS 1.3 transport */
class SAPIENTEventBus {
  private handlers = new Map<SAPIENTEventType, Set<EventHandler>>();
  private history: SAPIENTEvent[] = [];
  private readonly maxHistory = 500;

  /**
   * Subscribe to a SAPIENT event type.
   * Returns an unsubscribe function.
   */
  subscribe<T>(type: SAPIENTEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler as EventHandler);
    return () => this.handlers.get(type)?.delete(handler as EventHandler);
  }

  /**
   * Publish a SAPIENT event to all subscribers.
   */
  async publish<T>(event: SAPIENTEvent<T>): Promise<void> {
    this.history.push(event as SAPIENTEvent);
    if (this.history.length > this.maxHistory) this.history.shift();

    const subscribers = this.handlers.get(event.type);
    if (!subscribers) return;

    await Promise.all(
      Array.from(subscribers).map((h) =>
        Promise.resolve(h(event as SAPIENTEvent)).catch((err) =>
          console.error(`[SAPIENT] Handler error for ${event.type}:`, err)
        )
      )
    );
  }

  /** Return recent event history for a session */
  getHistory(sessionId?: string): SAPIENTEvent[] {
    if (!sessionId) return [...this.history];
    return this.history.filter((e) => e.sessionId === sessionId);
  }

  /** Clear all handlers and history (used between sessions) */
  reset(): void {
    this.handlers.clear();
    this.history.length = 0;
  }
}

/** Singleton event bus instance */
export const eventBus = new SAPIENTEventBus();

// ── Factory helpers ──────────────────────────────────────────────────────────

let msgCounter = 0;
function nextMsgId(): string {
  return `SAPIENT-${Date.now()}-${String(++msgCounter).padStart(4, '0')}`;
}

export function publishDetection(params: {
  sessionId: string;
  sensorId: string;
  trackId: string;
  rangeM: number;
  azimuthDeg: number;
  classification: string;
  confidence: number;
}): Promise<void> {
  return eventBus.publish({
    messageId: nextMsgId(),
    type: SAPIENTEventType.DETECTION,
    timestamp: new Date().toISOString(),
    sessionId: params.sessionId,
    sensorId: params.sensorId,
    payload: {
      trackId: params.trackId,
      rangeM: params.rangeM,
      azimuthDeg: params.azimuthDeg,
      classification: params.classification,
      confidence: params.confidence,
    },
  });
}

export function publishPhaseTransition(params: {
  sessionId: string;
  sensorId: string;
  fromPhase: string;
  toPhase: string;
}): Promise<void> {
  return eventBus.publish({
    messageId: nextMsgId(),
    type: SAPIENTEventType.PHASE_TRANSITION,
    timestamp: new Date().toISOString(),
    sessionId: params.sessionId,
    sensorId: params.sensorId,
    payload: { fromPhase: params.fromPhase, toPhase: params.toPhase },
  });
}

export function publishAlert(params: {
  sessionId: string;
  sensorId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'ROE_VIOLATION';
  description: string;
}): Promise<void> {
  return eventBus.publish({
    messageId: nextMsgId(),
    type: SAPIENTEventType.ALERT,
    timestamp: new Date().toISOString(),
    sessionId: params.sessionId,
    sensorId: params.sensorId,
    payload: { severity: params.severity, description: params.description },
  });
}
