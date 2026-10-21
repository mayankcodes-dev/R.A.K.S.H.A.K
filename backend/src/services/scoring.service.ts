/**
 * @file scoring.service.ts
 * @description Kill-chain decision scoring and NLG feedback generation.
 *
 * Scoring model:
 *   score = (accuracy_weight × accuracy) + (speed_weight × speed_factor) − roe_penalty
 *
 * Phase multipliers:
 *   DETECT ×1.0 | CLASSIFY ×1.2 | TRACK ×1.1 | ENGAGE ×1.5 | ASSESS ×0.8
 *
 * Phase 2: Replace NLG stub with fine-tuned Gemma-3B endpoint (military domain
 *          fine-tuning on DAPRA after-action corpus).
 */

import { PHASE_WEIGHTS, ROE_VIOLATION_PENALTIES, GRADE_THRESHOLDS } from '../../../shared/constants/kill-chain';
import type { KillChainPhase } from '../../../shared/constants/kill-chain';

export interface EvaluationInput {
  action: string;
  phase: KillChainPhase;
  latencyMs: number;
  roeViolation: boolean;
}

export interface PhaseScore {
  phase: KillChainPhase;
  score: number;
  latencyMs: number;
  accuracy: number;
  grade: string;
}

export interface DecisionTreeNode {
  phase: KillChainPhase;
  action: string;
  timestamp: number;
  latencyMs: number;
  scoreDelta: number;
  correct: boolean;
  roeViolation: boolean;
}

const SPEED_THRESHOLDS_MS: Record<KillChainPhase, { excellent: number; good: number; acceptable: number }> = {
  DETECT:   { excellent: 3000,  good: 5000,  acceptable: 8000 },
  CLASSIFY: { excellent: 5000,  good: 8000,  acceptable: 12000 },
  TRACK:    { excellent: 2000,  good: 4000,  acceptable: 7000 },
  ENGAGE:   { excellent: 3000,  good: 5000,  acceptable: 9000 },
  ASSESS:   { excellent: 5000,  good: 8000,  acceptable: 15000 },
};

export class ScoringService {
  /**
   * Evaluate a single operator decision and return score delta.
   * Score range: +10 (excellent) to −20 (ROE violation + wrong action).
   */
  evaluateDecision(input: EvaluationInput): number {
    const phaseWeight = PHASE_WEIGHTS[input.phase] ?? 1.0;
    const speedFactor = this._calcSpeedFactor(input.phase, input.latencyMs);
    const accuracyScore = this._calcAccuracy(input.action, input.phase);
    const roePenalty = input.roeViolation ? ROE_VIOLATION_PENALTIES.ENGAGEMENT : 0;

    const raw = (accuracyScore * 0.6 + speedFactor * 0.4) * phaseWeight * 10;
    return Math.round(raw - roePenalty);
  }

  /**
   * Build a decision tree from a sequence of actions for the AAR timeline.
   */
  generateDecisionTree(actions: EvaluationInput[]): DecisionTreeNode[] {
    let timestamp = 0;
    return actions.map((a) => {
      const scoreDelta = this.evaluateDecision(a);
      timestamp += a.latencyMs;
      return {
        phase: a.phase,
        action: a.action,
        timestamp,
        latencyMs: a.latencyMs,
        scoreDelta,
        correct: scoreDelta > 0,
        roeViolation: a.roeViolation,
      };
    });
  }

  /**
   * Compute percentile rank vs historical distribution.
   * Phase 2: query actual historical distribution from PostgreSQL.
   */
  computePercentileRank(overallScore: number): number {
    // Placeholder normal distribution approximation (mean=72, sd=12)
    const z = (overallScore - 72) / 12;
    const percentile = Math.round(50 * (1 + this._erf(z / Math.SQRT2)));
    return Math.max(1, Math.min(99, percentile));
  }

  /**
   * Assign letter grade from overall score using GRADE_THRESHOLDS.
   */
  assignGrade(score: number): string {
    for (const [grade, threshold] of Object.entries(GRADE_THRESHOLDS).sort(([, a], [, b]) => b - a)) {
      if (score >= threshold) return grade;
    }
    return 'F';
  }

  /**
   * Generate a natural-language feedback paragraph for the AAR.
   * Phase 2: Replace with fine-tuned LLM endpoint.
   */
  generateNLGFeedback(score: number, grade: string, roeViolations: string[]): string {
    const performance =
      grade === 'A' ? 'exceptional' :
      grade === 'B' ? 'solid' :
      grade === 'C' ? 'adequate but improvable' : 'below standard';

    const roeText = roeViolations.length === 0
      ? 'ROE compliance was maintained throughout the engagement.'
      : `${roeViolations.length} ROE violation(s) were recorded, indicating gaps in engagement authority awareness.`;

    const speedAdvice =
      score >= 85
        ? 'Reaction times were consistently within optimal thresholds.'
        : 'Target classification latency exceeded recommended thresholds — additional drills on CLASSIFY-phase decision speed are recommended.';

    return (
      `Overall performance was ${performance} with a composite score of ${score}/100 (Grade: ${grade}). ` +
      `${roeText} ${speedAdvice} ` +
      `Continued practice on the fiber-optic FPV scenario is recommended to build muscle memory ` +
      `against RF-silent adversaries. The ENGAGE phase showed the highest variability — ` +
      `focus next session on kinetic engagement timing relative to kill-chain lock confirmation.`
    );
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private _calcSpeedFactor(phase: KillChainPhase, latencyMs: number): number {
    const t = SPEED_THRESHOLDS_MS[phase];
    if (latencyMs <= t.excellent) return 1.0;
    if (latencyMs <= t.good) return 0.75;
    if (latencyMs <= t.acceptable) return 0.5;
    return 0.2;
  }

  private _calcAccuracy(action: string, phase: KillChainPhase): number {
    // Correct action mapping per phase
    const correctActions: Record<KillChainPhase, string[]> = {
      DETECT:   ['RADAR_LOCK', 'DETECT_TARGET'],
      CLASSIFY: ['CLASSIFY_TARGET', 'REQUEST_EOIR'],
      TRACK:    ['LOCK_TRACK', 'TRACK_TARGET'],
      ENGAGE:   ['RF_JAM', 'KINETIC_INTERCEPT', 'GPS_SPOOF', 'ACOUSTIC_DISRUPT'],
      ASSESS:   ['ASSESS_KILL', 'CONFIRM_NEUTRALISED'],
    };
    const validActions = correctActions[phase] ?? [];
    return validActions.includes(action) ? 1.0 : 0.0;
  }

  /** Error function approximation (Abramowitz & Stegun) */
  private _erf(x: number): number {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    const result = 1 - poly * Math.exp(-x * x);
    return x >= 0 ? result : -result;
  }
}
