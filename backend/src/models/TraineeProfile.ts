/**
 * @file TraineeProfile.ts
 * @description Trainee operator data model and PostgreSQL schema definition.
 *
 * SQL: CREATE TABLE trainee_profiles (...)
 * Phase 2: Add Redis session cache keyed by service_number for O(1) auth lookups.
 * Phase 3: LDAP/Active Directory integration for MoD identity federation.
 */

/** Certification levels aligned with DSSC progressive training curriculum */
export type CertificationLevel =
  | 'UNQUALIFIED'
  | 'BASIC_C_UAS'
  | 'INTERMEDIATE_C_UAS'
  | 'ADVANCED_C_UAS'
  | 'INSTRUCTOR_CERTIFIED';

export interface TraineeProfile {
  id: string;
  serviceNumber: string;         // MoD service number — unique identifier
  rank: string;                  // e.g., "Lt Col", "Major", "Capt"
  name: string;
  unit: string;                  // e.g., "14 Corps Signal Regiment"
  branch: 'ARMY' | 'NAVY' | 'AIR_FORCE' | 'CIVILIAN';
  email: string;

  // Training metrics
  totalTrainingHours: number;
  sessionsCompleted: number;
  averageScore: number;
  currentCertificationLevel: CertificationLevel;
  lastAssessmentDate: string | null;

  // Scenario history
  scenarioHistory: Array<{
    scenarioId: string;
    sessionId: string;
    score: number;
    grade: string;
    completedAt: string;
  }>;

  // Access control
  role: 'TRAINEE' | 'INSTRUCTOR' | 'COMMANDER';
  unitId: string;

  createdAt: string;
  updatedAt: string;
}

// ── PostgreSQL DDL ───────────────────────────────────────────────────────────
// Phase 2: Run via migration system (Flyway / node-pg-migrate)
//
// CREATE TABLE trainee_profiles (
//   id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   service_number            VARCHAR(20) UNIQUE NOT NULL,
//   rank                      VARCHAR(30) NOT NULL,
//   name                      VARCHAR(100) NOT NULL,
//   unit                      VARCHAR(100) NOT NULL,
//   branch                    VARCHAR(20) NOT NULL CHECK (branch IN ('ARMY','NAVY','AIR_FORCE','CIVILIAN')),
//   email                     VARCHAR(100) UNIQUE NOT NULL,
//   total_training_hours      NUMERIC(6,1) NOT NULL DEFAULT 0,
//   sessions_completed        INTEGER NOT NULL DEFAULT 0,
//   average_score             NUMERIC(5,2) NOT NULL DEFAULT 0,
//   current_certification     VARCHAR(30) NOT NULL DEFAULT 'UNQUALIFIED',
//   last_assessment_date      DATE,
//   role                      VARCHAR(20) NOT NULL DEFAULT 'TRAINEE',
//   unit_id                   UUID NOT NULL,
//   created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
//
// CREATE INDEX idx_trainee_profiles_unit ON trainee_profiles(unit_id);
// CREATE INDEX idx_trainee_profiles_role ON trainee_profiles(role);

/** Mock in-memory store — Phase 2: replace with PostgreSQL queries */
export const mockTrainees: TraineeProfile[] = [
  {
    id: 'trainee-001',
    serviceNumber: 'IC-86432',
    rank: 'Major',
    name: 'Arjun Sharma',
    unit: '14 Corps Signal Regiment',
    branch: 'ARMY',
    email: 'arjun.sharma@dssc.mil.in',
    totalTrainingHours: 24.5,
    sessionsCompleted: 12,
    averageScore: 82,
    currentCertificationLevel: 'INTERMEDIATE_C_UAS',
    lastAssessmentDate: '2026-10-15',
    scenarioHistory: [],
    role: 'TRAINEE',
    unitId: 'unit-alpha-01',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
  },
  {
    id: 'instructor-001',
    serviceNumber: 'IC-72100',
    rank: 'Lt Col',
    name: 'Priya Nair',
    unit: 'DSSC Wellington — C-UAS Cell',
    branch: 'ARMY',
    email: 'priya.nair@dssc.mil.in',
    totalTrainingHours: 218.0,
    sessionsCompleted: 87,
    averageScore: 91,
    currentCertificationLevel: 'INSTRUCTOR_CERTIFIED',
    lastAssessmentDate: '2026-08-01',
    scenarioHistory: [],
    role: 'INSTRUCTOR',
    unitId: 'unit-alpha-01',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];
