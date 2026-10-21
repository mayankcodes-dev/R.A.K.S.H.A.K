/**
 * R.A.K.S.H.A.K. — PostgreSQL Database Configuration
 * ════════════════════════════════════════════════════
 * Manages the connection pool and exposes helpers for
 * the five core tables that underpin the training simulator.
 *
 * Tables
 * ──────
 *  trainee_profiles    — Service personnel enrolled in the system
 *  simulation_sessions — Individual training runs (one per scenario attempt)
 *  aar_scores          — After-Action Review scoring per session
 *  action_events       — Granular operator actions within a session
 *  sapient_logs        — Archived SAPIENT v7 DetectionReports for replay
 *
 * @module config/database
 */

import pg from 'pg';

const { Pool } = pg;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  /** Maximum number of clients in the pool */
  max: number;
  /** Milliseconds before an idle client is closed */
  idleTimeoutMillis: number;
  /** Milliseconds to wait for a connection from the pool */
  connectionTimeoutMillis: number;
}

/**
 * Reads database configuration from environment variables
 * with sensible development defaults.
 */
function loadConfig(): DatabaseConfig {
  return {
    host: process.env.PGHOST ?? 'localhost',
    port: parseInt(process.env.PGPORT ?? '5432', 10),
    database: process.env.PGDATABASE ?? 'rakshak_dev',
    user: process.env.PGUSER ?? 'rakshak',
    password: process.env.PGPASSWORD ?? 'rakshak_local',
    max: parseInt(process.env.PG_POOL_MAX ?? '20', 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  };
}

// Phase 2: Fine-tune pool sizing based on expected concurrent trainees
//   - Target: 50 concurrent sessions × ~3 queries/sec = ~150 QPS
//   - PgBouncer transaction-mode pooling in production
//   - Statement-level prepared statement caching

// Phase 3: Read replicas for AAR aggregate queries
//   - Separate read pool pointed at streaming replica
//   - Connection routing middleware based on request type

/**
 * Initialise and return the shared PostgreSQL connection pool.
 */
export function initDatabasePool(): pg.Pool {
  const config = loadConfig();
  const pool = new Pool(config);

  pool.on('error', (err: Error) => {
    console.error('[DB] Unexpected pool error:', err.message);
    // Phase 2: Push to structured logger + Sentry
  });

  pool.on('connect', () => {
    // Phase 2: Increment Prometheus gauge rakshak_db_connections_active
  });

  return pool;
}

// ════════════════════════════════════════════════════════════════════
// DDL — Table Definitions (executed by db:migrate script)
// ════════════════════════════════════════════════════════════════════

export const SCHEMA_SQL = `
-- R.A.K.S.H.A.K. Schema v0.1
-- Generated for SIH 2026, PS 26247

CREATE TABLE IF NOT EXISTS trainee_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_number           VARCHAR(20) UNIQUE NOT NULL,
  rank                     VARCHAR(30) NOT NULL,
  name                     VARCHAR(120) NOT NULL,
  unit                     VARCHAR(80) NOT NULL,
  training_hours           REAL DEFAULT 0,
  current_certification    VARCHAR(10) DEFAULT 'BASIC',
  last_assessment_date     TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS simulation_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id        UUID REFERENCES trainee_profiles(id) ON DELETE CASCADE,
  scenario_id       VARCHAR(40) NOT NULL,
  phase             VARCHAR(12) NOT NULL DEFAULT 'BRIEFING'
                    CHECK (phase IN ('BRIEFING','ACTIVE','DEBRIEF')),
  environment_cfg   JSONB NOT NULL DEFAULT '{}',
  start_time        TIMESTAMPTZ DEFAULT now(),
  end_time          TIMESTAMPTZ,
  score             REAL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aar_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID UNIQUE REFERENCES simulation_sessions(id),
  overall_score     REAL NOT NULL,
  detection_score   REAL,
  classification_score REAL,
  tracking_score    REAL,
  engagement_score  REAL,
  assessment_score  REAL,
  roe_violations    JSONB DEFAULT '[]',
  decision_timeline JSONB DEFAULT '[]',
  nlg_feedback      TEXT,
  grade             CHAR(1) CHECK (grade IN ('A','B','C','D','F')),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  timestamp   TIMESTAMPTZ DEFAULT now(),
  action_type VARCHAR(40) NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  result      JSONB,
  latency_ms  REAL
);

CREATE TABLE IF NOT EXISTS sapient_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  message_type     VARCHAR(30) NOT NULL,
  message_id       VARCHAR(60) NOT NULL,
  sensor_id        VARCHAR(60) NOT NULL,
  payload_proto    BYTEA,
  payload_json     JSONB,
  received_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_trainee ON simulation_sessions(trainee_id);
CREATE INDEX idx_actions_session  ON action_events(session_id, timestamp);
CREATE INDEX idx_sapient_session  ON sapient_logs(session_id, received_at);
`;
