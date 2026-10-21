/**
 * @file kill-chain.ts
 * @description Kill-chain constants shared across frontend and backend.
 *   Defines phase order, weights, time thresholds, ROE penalties, and grade thresholds.
 *
 * Kill-chain model based on NATO Standardisation Agreement (STANAG) 3430
 * — Counter-UAS Engagement Authority Framework.
 */

export type KillChainPhase = 'DETECT' | 'CLASSIFY' | 'TRACK' | 'ENGAGE' | 'ASSESS';

/** Ordered kill-chain sequence */
export const KILL_CHAIN_PHASES: KillChainPhase[] = [
  'DETECT',
  'CLASSIFY',
  'TRACK',
  'ENGAGE',
  'ASSESS',
];

/** Phase display names for UI */
export const PHASE_LABELS: Record<KillChainPhase, string> = {
  DETECT:   'Detect',
  CLASSIFY: 'Classify',
  TRACK:    'Track',
  ENGAGE:   'Engage',
  ASSESS:   'Assess',
};

/**
 * Scoring weight per phase.
 * ENGAGE is highest (critical decision point with ROE implications).
 */
export const PHASE_WEIGHTS: Record<KillChainPhase, number> = {
  DETECT:   1.0,
  CLASSIFY: 1.2,
  TRACK:    1.1,
  ENGAGE:   1.5,
  ASSESS:   0.8,
};

/** Decision latency thresholds per phase (seconds) */
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

/** ROE violation penalty points per violation type */
export const ROE_VIOLATION_PENALTIES: Record<string, number> = {
  KINETIC_BEFORE_TRACK:       25,
  ENGAGE_CIVILIAN_ZONE:       50,
  ENGAGEMENT_WITHOUT_AUTH:    30,
  ENGAGEMENT:                 20, // Generic engagement ROE violation
  COLLATERAL_DAMAGE:          40,
};

/** Grade thresholds — letter grade from composite score 0–100 */
export const GRADE_THRESHOLDS: Record<string, number> = {
  A: 90,
  B: 75,
  C: 60,
  D: 50,
  F: 0,
};

/** Available engagement types per C-UAS doctrine */
export type EngagementType =
  | 'RF_JAM'           // Radiofrequency jamming — ineffective vs fiber-optic FPV
  | 'GPS_SPOOF'        // GPS signal spoofing — ineffective vs fiber-optic FPV
  | 'KINETIC_INTERCEPT'// Hard-kill physical intercept (DRDO D4, SMASH 2000)
  | 'ACOUSTIC_DISRUPT' // High-power acoustic disruptor (short range)
  | 'LASER_DEFEAT';    // Directed energy (Phase 3 — DURGA system)

export const ENGAGEMENT_TYPES: EngagementType[] = [
  'RF_JAM',
  'GPS_SPOOF',
  'KINETIC_INTERCEPT',
  'ACOUSTIC_DISRUPT',
  'LASER_DEFEAT',
];

/** Which engagement types are effective against fiber-optic FPV */
export const FIBER_OPTIC_EFFECTIVE_COUNTERMEASURES: EngagementType[] = [
  'KINETIC_INTERCEPT',
  'ACOUSTIC_DISRUPT',
  'LASER_DEFEAT',
];

/** Phase hex colors for UI indicators */
export const PHASE_COLORS: Record<KillChainPhase, string> = {
  DETECT:   '#3399ff',
  CLASSIFY: '#ffaa00',
  TRACK:    '#ff6600',
  ENGAGE:   '#ff2244',
  ASSESS:   '#00ff41',
};
