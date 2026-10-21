/**
 * @file simulation.controller.ts
 * @description Core simulation session controller.
 *   Orchestrates session lifecycle, ROE evaluation, SAPIENT report publication,
 *   and scoring pipeline integration.
 *
 * Phase 2: Replace in-memory store with PostgreSQL sessions + Redis pub/sub.
 * Phase 3: Integrate DDQN adversary model via ONNX runtime for adaptive AI.
 */

import { SapientService } from '../services/sapient.service';
import { PhysicsService } from '../services/physics.service';
import { ScoringService } from '../services/scoring.service';
import type { StartSessionBody, OperatorActionBody } from '../../../shared/types/scenario.types';
import type { KillChainPhase } from '../../../shared/constants/kill-chain';

/** In-memory session store — Phase 2: migrate to PostgreSQL */
const activeSessions = new Map<string, SimulationSessionState>();

interface SimulationSessionState {
  sessionId: string;
  traineeId: string;
  scenarioId: string;
  startTime: Date;
  phase: KillChainPhase;
  score: number;
  roeViolations: string[];
  actions: OperatorActionBody[];
  threatPositions: ThreatPosition[];
  sensorReadings: SensorReading[];
}

interface ThreatPosition {
  id: string;
  lat: number;
  lon: number;
  altitudeM: number;
  speedMps: number;
  type: 'SOLO_DRONE' | 'FPV_FIBER_OPTIC' | 'SWARM_ELEMENT';
}

interface SensorReading {
  sensor: 'RADAR' | 'EOIR' | 'RF_SPECTRUM' | 'MICRO_DOPPLER';
  confidence: number;
  snrDb: number;
  timestamp: Date;
}

export class SimulationController {
  private sapient = new SapientService();
  private physics = new PhysicsService();
  private scoring = new ScoringService();

  /**
   * Initialise a new simulation session.
   * Generates initial threat waypoints and sensor baselines for the given scenario.
   */
  async startSession(body: StartSessionBody): Promise<Partial<SimulationSessionState>> {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const initialState: SimulationSessionState = {
      sessionId,
      traineeId: body.traineeId,
      scenarioId: body.scenarioId,
      startTime: new Date(),
      phase: 'DETECT',
      score: 0,
      roeViolations: [],
      actions: [],
      threatPositions: this._generateInitialThreats(body.scenarioId),
      sensorReadings: this._generateInitialSensorReadings(),
    };

    activeSessions.set(sessionId, initialState);

    // Publish SAPIENT session-start event
    await this.sapient.publishStatus({
      sensorId: `RAKSHAK-${body.scenarioId.toUpperCase()}`,
      status: 'ACTIVE',
      sessionId,
      timestamp: new Date().toISOString(),
    });

    return {
      sessionId,
      scenarioId: body.scenarioId,
      startTime: initialState.startTime,
      phase: 'DETECT',
    };
  }

  /**
   * Process an operator action event.
   * Evaluates ROE compliance → publishes SAPIENT DetectionReport → updates score.
   */
  async processOperatorAction(body: OperatorActionBody): Promise<{
    accepted: boolean;
    roeViolation: boolean;
    scoreDelta: number;
    newPhase: KillChainPhase;
    sapientMsgId: string;
  }> {
    const session = activeSessions.get(body.sessionId);
    if (!session) throw new Error(`Session not found: ${body.sessionId}`);

    const roeViolation = this._evaluateROE(body.action, session);
    if (roeViolation) {
      session.roeViolations.push(`${body.action} at phase ${session.phase}`);
    }

    // Evaluate decision quality via scoring service
    const scoreDelta = this.scoring.evaluateDecision({
      action: body.action,
      phase: session.phase,
      latencyMs: body.latencyMs ?? 5000,
      roeViolation,
    });

    session.score = Math.max(0, Math.min(100, session.score + scoreDelta));
    session.actions.push(body);

    // Advance kill-chain phase
    const newPhase = this._advancePhase(session.phase, body.action);
    session.phase = newPhase;

    // Publish SAPIENT detection report
    const sapientReport = await this.sapient.processDetectionReport({
      sensorId: 'RAKSHAK-RADAR-01',
      sessionId: body.sessionId,
      action: body.action,
      roeViolation,
      phase: newPhase,
    });

    return {
      accepted: !roeViolation,
      roeViolation,
      scoreDelta,
      newPhase,
      sapientMsgId: sapientReport.messageId,
    };
  }

  /** Return current session state for polling endpoint */
  async getSessionState(sessionId: string): Promise<SimulationSessionState | null> {
    return activeSessions.get(sessionId) ?? null;
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private _evaluateROE(action: string, session: SimulationSessionState): boolean {
    // ROE: KINETIC_INTERCEPT only permitted at ENGAGE phase
    if (action === 'KINETIC_INTERCEPT' && session.phase !== 'ENGAGE') return true;
    // ROE: Cannot engage civilian-tagged targets
    if (action.includes('ENGAGE') && session.scenarioId === 'urban_swarm') return false; // simplified
    return false;
  }

  private _advancePhase(current: KillChainPhase, action: string): KillChainPhase {
    const progression: Record<KillChainPhase, KillChainPhase> = {
      DETECT: 'CLASSIFY',
      CLASSIFY: 'TRACK',
      TRACK: 'ENGAGE',
      ENGAGE: 'ASSESS',
      ASSESS: 'ASSESS',
    };
    // Only advance on specific actions
    const advancingActions = ['CLASSIFY_TARGET', 'LOCK_TRACK', 'KINETIC_INTERCEPT', 'RF_JAM', 'ASSESS_KILL'];
    if (advancingActions.includes(action)) return progression[current];
    return current;
  }

  private _generateInitialThreats(scenarioId: string): ThreatPosition[] {
    const base: ThreatPosition[] = [
      { id: 'threat-001', lat: 28.6139, lon: 77.2090, altitudeM: 120, speedMps: 18, type: 'SOLO_DRONE' },
    ];
    if (scenarioId === 'fiber_optic_fpv') {
      base.push({ id: 'threat-002', lat: 28.6142, lon: 77.2095, altitudeM: 30, speedMps: 22, type: 'FPV_FIBER_OPTIC' });
    }
    if (scenarioId === 'swarm_urban') {
      for (let i = 2; i <= 6; i++) {
        base.push({
          id: `threat-00${i}`,
          lat: 28.614 + i * 0.001,
          lon: 77.209 + i * 0.001,
          altitudeM: 80 + i * 10,
          speedMps: 14,
          type: 'SWARM_ELEMENT',
        });
      }
    }
    return base;
  }

  private _generateInitialSensorReadings(): SensorReading[] {
    return [
      { sensor: 'RADAR', confidence: 0.91, snrDb: 18.4, timestamp: new Date() },
      { sensor: 'RF_SPECTRUM', confidence: 0.0, snrDb: -3.2, timestamp: new Date() }, // fiber-optic: no RF
      { sensor: 'EOIR', confidence: 0.74, snrDb: 12.1, timestamp: new Date() },
      { sensor: 'MICRO_DOPPLER', confidence: 0.88, snrDb: 14.7, timestamp: new Date() },
    ];
  }
}
