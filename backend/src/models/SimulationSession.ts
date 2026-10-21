/**
 * @file SimulationSession.ts
 * @description Simulation session model — tracks full session lifecycle, action history,
 *   sensor telemetry, and environmental configuration.
 *
 * Phase 2: Persist to PostgreSQL simulation_sessions table.
 *          Partition by (started_at) for query performance.
 */

import type { KillChainPhase } from '../../../shared/constants/kill-chain';

export type SessionPhase = 'BRIEFING' | 'ACTIVE' | 'PAUSED' | 'DEBRIEF' | 'COMPLETED' | 'ABORTED';

export interface EnvironmentConfig {
  timeOfDay: 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';
  visibility: 'CLEAR' | 'HAZE' | 'RAIN' | 'FOG';
  windSpeedKts: number;
  temperatureCelsius: number;
  urbanDensity: 'RURAL' | 'SUBURBAN' | 'URBAN';
  nvgRequired: boolean;
}

export interface ActionEvent {
  id: string;
  sessionId: string;
  timestamp: Date;
  killChainPhase: KillChainPhase;
  action: string;
  latencyMs: number;
  scoreDelta: number;
  roeViolation: boolean;
  sapientMessageId: string | null;
}

export interface SensorDataSnapshot {
  timestamp: Date;
  radar: { detected: boolean; rangeM: number; azimuthDeg: number; snrDb: number };
  rfSpectrum: { frequencyMhz: number | null; power: number; emitting: boolean };
  eoIr: { detected: boolean; confidence: number; thermalContrast: number };
  microDoppler: { dominantFreqHz: number; inferredClass: string };
}

export interface SimulationSession {
  id: string;
  traineeId: string;
  scenarioId: string;
  instructorId: string | null;

  phase: SessionPhase;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;

  killChainPhase: KillChainPhase;
  actions: ActionEvent[];
  sensorSnapshots: SensorDataSnapshot[];
  environmentConfig: EnvironmentConfig;

  finalScore: number | null;
  grade: string | null;

  // SAPIENT telemetry
  sapientSessionId: string;
  sapientMessageCount: number;

  createdAt: Date;
  updatedAt: Date;
}

// ── PostgreSQL DDL ───────────────────────────────────────────────────────────
//
// CREATE TABLE simulation_sessions (
//   id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   trainee_id            UUID NOT NULL REFERENCES trainee_profiles(id),
//   scenario_id           VARCHAR(50) NOT NULL,
//   instructor_id         UUID REFERENCES trainee_profiles(id),
//   phase                 VARCHAR(20) NOT NULL DEFAULT 'BRIEFING',
//   started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   ended_at              TIMESTAMPTZ,
//   duration_seconds      INTEGER,
//   kill_chain_phase      VARCHAR(20) NOT NULL DEFAULT 'DETECT',
//   final_score           NUMERIC(5,2),
//   grade                 CHAR(1),
//   sapient_session_id    VARCHAR(64),
//   sapient_message_count INTEGER NOT NULL DEFAULT 0,
//   environment_config    JSONB NOT NULL DEFAULT '{}',
//   created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
// ) PARTITION BY RANGE (started_at);
//
// CREATE TABLE action_events (
//   id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   session_id          UUID NOT NULL REFERENCES simulation_sessions(id),
//   timestamp           TIMESTAMPTZ NOT NULL,
//   kill_chain_phase    VARCHAR(20) NOT NULL,
//   action              VARCHAR(50) NOT NULL,
//   latency_ms          INTEGER NOT NULL,
//   score_delta         NUMERIC(5,2) NOT NULL,
//   roe_violation       BOOLEAN NOT NULL DEFAULT FALSE,
//   sapient_message_id  VARCHAR(64)
// );
//
// CREATE INDEX idx_sessions_trainee ON simulation_sessions(trainee_id);
// CREATE INDEX idx_action_events_session ON action_events(session_id);
