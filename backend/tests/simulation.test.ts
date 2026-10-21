/**
 * @file simulation.test.ts
 * @description Unit tests for the RAKSHAK simulation backend.
 *
 * Test coverage:
 *   1. SimulationController — session lifecycle, ROE evaluation, phase progression
 *   2. PhysicsService — radar equation, RCS values, micro-Doppler classification
 *   3. ScoringService — decision scoring, grade assignment, NLG feedback
 *
 * Phase 2: Add integration tests against PostgreSQL test container.
 * Phase 3: E2E tests via Playwright (frontend → backend WebSocket flow).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationController } from '../src/controllers/simulation.controller';
import { PhysicsService } from '../src/services/physics.service';
import { ScoringService } from '../src/services/scoring.service';

// ── SimulationController ─────────────────────────────────────────────────────

describe('SimulationController', () => {
  let controller: SimulationController;

  beforeEach(() => {
    controller = new SimulationController();
  });

  it('should initialise a session with DETECT phase', async () => {
    const result = await controller.startSession({
      traineeId: 'trainee-001',
      scenarioId: 'solo_drone',
    });

    expect(result.sessionId).toMatch(/^sess-/);
    expect(result.phase).toBe('DETECT');
    expect(result.scenarioId).toBe('solo_drone');
  });

  it('should reject KINETIC_INTERCEPT at DETECT phase as ROE violation', async () => {
    const { sessionId } = await controller.startSession({
      traineeId: 'trainee-001',
      scenarioId: 'solo_drone',
    });

    const result = await controller.processOperatorAction({
      sessionId: sessionId!,
      action: 'KINETIC_INTERCEPT',
      latencyMs: 3000,
    });

    expect(result.roeViolation).toBe(true);
    expect(result.accepted).toBe(false);
  });

  it('should advance phase from DETECT to CLASSIFY on CLASSIFY_TARGET action', async () => {
    const { sessionId } = await controller.startSession({
      traineeId: 'trainee-001',
      scenarioId: 'solo_drone',
    });

    const result = await controller.processOperatorAction({
      sessionId: sessionId!,
      action: 'CLASSIFY_TARGET',
      latencyMs: 4500,
    });

    expect(result.newPhase).toBe('CLASSIFY');
    expect(result.roeViolation).toBe(false);
  });

  it('should return null state for unknown session ID', async () => {
    const state = await controller.getSessionState('nonexistent-id');
    expect(state).toBeNull();
  });

  it('should generate fiber-optic FPV threats for fiber_optic_fpv scenario', async () => {
    const { sessionId } = await controller.startSession({
      traineeId: 'trainee-001',
      scenarioId: 'fiber_optic_fpv',
    });
    const state = await controller.getSessionState(sessionId!);
    expect(state?.threatPositions.some(t => t.type === 'FPV_FIBER_OPTIC')).toBe(true);
  });
});

// ── PhysicsService ───────────────────────────────────────────────────────────

describe('PhysicsService', () => {
  let physics: PhysicsService;

  const baseRadar = {
    transmitPowerW: 1000,
    antennaGainTx: 1000,
    antennaGainRx: 1000,
    frequencyGhz: 10.0,
    noiseFigureDb: 5.0,
    bandwidthMhz: 10,
  };

  beforeEach(() => {
    physics = new PhysicsService();
  });

  it('should return positive SNR at close range', () => {
    const snr = physics.solveRadarEquation(baseRadar, {
      rangeM: 500,
      rcsM2: 0.01,
      radialVelocityMps: 18,
      swerlingModel: 1,
    });
    expect(snr).toBeGreaterThan(0);
  });

  it('should return negative SNR at very long range', () => {
    const snr = physics.solveRadarEquation(baseRadar, {
      rangeM: 50000,
      rcsM2: 0.003,
      radialVelocityMps: 22,
      swerlingModel: 2,
    });
    expect(snr).toBeLessThan(0);
  });

  it('FPV fiber-optic RCS should be smaller than multi-rotor', () => {
    const fpvRcs = physics.calculateRCS('FPV_FIBER_OPTIC');
    const mrRcs = physics.calculateRCS('MULTI_ROTOR');
    expect(fpvRcs).toBeLessThan(mrRcs);
  });

  it('jammingEffectiveness should return immune for fiber-optic FPV', () => {
    const result = physics.calculateJammingEffectiveness({
      radarParams: baseRadar,
      jammerPowerW: 100,
      jammerGain: 100,
      targetRcsM2: 0.003,
      targetType: 'FPV_FIBER_OPTIC',
    });
    expect(result.isFiberOpticImmune).toBe(true);
    expect(result.effectiveRangeM).toBe(0);
  });

  it('micro-Doppler should classify FPV fiber-optic correctly', () => {
    const sig = physics.computeMicroDopplerSignature('FPV_FIBER_OPTIC', 22, 10);
    expect(sig.inferredClass).toBe('FPV_FIBER_OPTIC');
    expect(sig.stftMatrix).toHaveLength(8);
  });
});

// ── ScoringService ───────────────────────────────────────────────────────────

describe('ScoringService', () => {
  let scoring: ScoringService;

  beforeEach(() => {
    scoring = new ScoringService();
  });

  it('should award positive score for correct fast action', () => {
    const delta = scoring.evaluateDecision({
      action: 'DETECT_TARGET',
      phase: 'DETECT',
      latencyMs: 2000,
      roeViolation: false,
    });
    expect(delta).toBeGreaterThan(0);
  });

  it('should award 0 or negative for wrong action', () => {
    const delta = scoring.evaluateDecision({
      action: 'KINETIC_INTERCEPT',
      phase: 'DETECT',
      latencyMs: 2000,
      roeViolation: true,
    });
    expect(delta).toBeLessThanOrEqual(0);
  });

  it('assignGrade should return A for score >= 90', () => {
    expect(scoring.assignGrade(95)).toBe('A');
    expect(scoring.assignGrade(90)).toBe('A');
  });

  it('assignGrade should return F for score < 50', () => {
    expect(scoring.assignGrade(40)).toBe('F');
  });

  it('NLG feedback should mention ROE violations when present', () => {
    const feedback = scoring.generateNLGFeedback(55, 'C', ['KINETIC_INTERCEPT at DETECT phase']);
    expect(feedback).toContain('ROE violation');
  });

  it('NLG feedback should not mention ROE when clean', () => {
    const feedback = scoring.generateNLGFeedback(88, 'B', []);
    expect(feedback).toContain('ROE compliance was maintained');
  });

  it('percentileRank should be in [1, 99]', () => {
    for (const score of [20, 50, 72, 90, 100]) {
      const rank = scoring.computePercentileRank(score);
      expect(rank).toBeGreaterThanOrEqual(1);
      expect(rank).toBeLessThanOrEqual(99);
    }
  });
});
