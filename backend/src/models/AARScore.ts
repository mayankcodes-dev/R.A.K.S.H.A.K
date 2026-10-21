/**
 * @file AARScore.ts
 * @description After-Action Review score model.
 *   Stores granular phase scores, ROE violation log, NLG feedback,
 *   and decision timeline for the post-session debrief UI.
 *
 * Phase 2: Persist to PostgreSQL aar_scores table.
 */

import type { KillChainPhase } from '../../../shared/constants/kill-chain';

export interface PhaseScore {
  phase: KillChainPhase;
  score: number;              // 0–100
  timeSeconds: number | null; // null for continuous phases (TRACK)
  accuracy: number;           // 0.0 – 1.0
  correctActions: string[];
  incorrectActions: string[];
}

export interface ROEViolationEntry {
  timestamp: Date;
  phase: KillChainPhase;
  action: string;
  description: string;
  penaltyPoints: number;
}

export interface DecisionTimelineEntry {
  phase: KillChainPhase;
  action: string;
  timestamp: number;          // ms from session start
  latencyMs: number;
  scoreDelta: number;
  correct: boolean;
  roeViolation: boolean;
  sapientMessageId: string | null;
}

export interface AARScore {
  id: string;
  sessionId: string;
  traineeId: string;
  scenarioId: string;

  // Scores
  overallScore: number;       // 0–100 weighted composite
  grade: string;              // A–F
  percentileRank: number;     // 1–99

  phaseScores: Record<KillChainPhase, PhaseScore>;
  roeViolations: ROEViolationEntry[];
  decisionTimeline: DecisionTimelineEntry[];

  // NLG feedback
  nlgFeedback: string;

  // SAPIENT
  sapientAlertCount: number;
  sapientMessageLog: string[];

  // Session metadata
  totalDurationSeconds: number;
  completedAt: Date;
  createdAt: Date;
}

// ── PostgreSQL DDL ───────────────────────────────────────────────────────────
//
// CREATE TABLE aar_scores (
//   id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   session_id            UUID NOT NULL UNIQUE REFERENCES simulation_sessions(id),
//   trainee_id            UUID NOT NULL REFERENCES trainee_profiles(id),
//   scenario_id           VARCHAR(50) NOT NULL,
//   overall_score         NUMERIC(5,2) NOT NULL,
//   grade                 CHAR(1) NOT NULL,
//   percentile_rank       INTEGER NOT NULL,
//   phase_scores          JSONB NOT NULL DEFAULT '{}',
//   roe_violations        JSONB NOT NULL DEFAULT '[]',
//   decision_timeline     JSONB NOT NULL DEFAULT '[]',
//   nlg_feedback          TEXT,
//   sapient_alert_count   INTEGER NOT NULL DEFAULT 0,
//   total_duration_s      INTEGER NOT NULL,
//   completed_at          TIMESTAMPTZ NOT NULL,
//   created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
//
// CREATE INDEX idx_aar_trainee ON aar_scores(trainee_id, completed_at DESC);
// CREATE INDEX idx_aar_scenario ON aar_scores(scenario_id);
