/**
 * @file decision-tree.ts
 * @description Kill-chain decision tree scorer for the RAKSHAK AAR module.
 *   Evaluates operator decisions at each kill-chain phase for accuracy, speed,
 *   and ROE compliance. Produces an overall score + letter grade.
 *
 * Kill-chain phases: DETECT → CLASSIFY → TRACK → ENGAGE → ASSESS
 * Phase weights: 1.0 → 1.2 → 1.1 → 1.5 → 0.8
 *
 * Phase 2: Probabilistic Bayesian decision tree replacing rule-based evaluator.
 */

export type KillChainPhase = 'DETECT' | 'CLASSIFY' | 'TRACK' | 'ENGAGE' | 'ASSESS';

export const PHASE_WEIGHT: Record<KillChainPhase, number> = {
  DETECT:   1.0,
  CLASSIFY: 1.2,
  TRACK:    1.1,
  ENGAGE:   1.5,
  ASSESS:   0.8,
};

export const TIME_THRESHOLDS_SECONDS: Record<KillChainPhase, {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}> = {
  DETECT:   { excellent: 3,  good: 5,  acceptable: 8,  poor: 12 },
  CLASSIFY: { excellent: 5,  good: 8,  acceptable: 12, poor: 18 },
  TRACK:    { excellent: 2,  good: 4,  acceptable: 7,  poor: 10 },
  ENGAGE:   { excellent: 3,  good: 5,  acceptable: 9,  poor: 14 },
  ASSESS:   { excellent: 5,  good: 8,  acceptable: 15, poor: 25 },
};

export const GRADE_THRESHOLDS: Record<string, number> = {
  A: 90,
  B: 75,
  C: 60,
  D: 50,
  F: 0,
};

export const ROE_VIOLATION_PENALTIES: Record<string, number> = {
  KINETIC_BEFORE_TRACK: 25,
  ENGAGE_CIVILIAN_ZONE: 50,
  ENGAGEMENT_WITHOUT_AUTH: 30,
  ENGAGEMENT: 20,
};

export interface PhaseEvaluation {
  phase: KillChainPhase;
  action: string;
  decisionTimeSeconds: number;
  accuracyScore: number;       // 0–100 (correct action = 100, wrong = 0)
  speedScore: number;          // 0–100
  roeViolation: boolean;
  roePenalty: number;
  weightedScore: number;
}

/**
 * Evaluate operator performance at a single kill-chain phase.
 */
export function evaluatePhase(params: {
  phase: KillChainPhase;
  action: string;
  decisionTimeSeconds: number;
  roeViolation: boolean;
}): PhaseEvaluation {
  const accuracy = _isCorrectAction(params.action, params.phase) ? 100 : 0;
  const speedScore = _speedScore(params.phase, params.decisionTimeSeconds);
  const roePenalty = params.roeViolation ? ROE_VIOLATION_PENALTIES.ENGAGEMENT : 0;
  const raw = accuracy * 0.6 + speedScore * 0.4;
  const weightedScore = Math.max(0, raw * PHASE_WEIGHT[params.phase] - roePenalty);

  return {
    phase: params.phase,
    action: params.action,
    decisionTimeSeconds: params.decisionTimeSeconds,
    accuracyScore: accuracy,
    speedScore,
    roeViolation: params.roeViolation,
    roePenalty,
    weightedScore,
  };
}

/**
 * Compute composite score from all phase evaluations.
 */
export function calculateOverallScore(phases: PhaseEvaluation[]): number {
  if (phases.length === 0) return 0;
  const totalWeight = phases.reduce((s, p) => s + PHASE_WEIGHT[p.phase], 0);
  const weightedSum = phases.reduce((s, p) => s + p.weightedScore, 0);
  return Math.round(Math.min(100, weightedSum / totalWeight));
}

/**
 * Assign letter grade from composite score.
 */
export function calculateTimeToDecision(events: Array<{ timestamp: number }>): number {
  if (events.length < 2) return 0;
  return (events[events.length - 1].timestamp - events[0].timestamp) / 1000;
}

/**
 * Generate letter grade from overall score.
 */
export function generateOverallGrade(score: number): string {
  for (const [grade, threshold] of Object.entries(GRADE_THRESHOLDS).sort(([, a], [, b]) => b - a)) {
    if (score >= threshold) return grade;
  }
  return 'F';
}

/**
 * Apply ROE violation penalty — reduces score for unlawful engagements.
 */
export function penalizeROEViolation(score: number, violationType: string): number {
  const penalty = ROE_VIOLATION_PENALTIES[violationType] ?? ROE_VIOLATION_PENALTIES.ENGAGEMENT;
  return Math.max(0, score - penalty);
}

// ── Private helpers ────────────────────────────────────────────────────────

const CORRECT_ACTIONS: Record<KillChainPhase, string[]> = {
  DETECT:   ['DETECT_TARGET', 'RADAR_LOCK'],
  CLASSIFY: ['CLASSIFY_TARGET', 'REQUEST_EOIR', 'CLASSIFY_FPV'],
  TRACK:    ['LOCK_TRACK', 'TRACK_TARGET', 'HANDOFF_TRACK'],
  ENGAGE:   ['RF_JAM', 'KINETIC_INTERCEPT', 'GPS_SPOOF', 'ACOUSTIC_DISRUPT'],
  ASSESS:   ['ASSESS_KILL', 'CONFIRM_NEUTRALISED', 'REQUEST_BDA'],
};

function _isCorrectAction(action: string, phase: KillChainPhase): boolean {
  return CORRECT_ACTIONS[phase].includes(action);
}

function _speedScore(phase: KillChainPhase, timeS: number): number {
  const t = TIME_THRESHOLDS_SECONDS[phase];
  if (timeS <= t.excellent) return 100;
  if (timeS <= t.good)      return 80;
  if (timeS <= t.acceptable) return 55;
  if (timeS <= t.poor)      return 30;
  return 10;
}
