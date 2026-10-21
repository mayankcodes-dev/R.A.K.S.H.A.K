/**
 * @file operator.types.ts
 * @description Operator profile, role, and permission types.
 *   Shared between frontend portal routing and backend RBAC middleware.
 */

export type OperatorRole = 'TRAINEE' | 'INSTRUCTOR' | 'COMMANDER';

export type CertificationLevel =
  | 'UNQUALIFIED'
  | 'BASIC_C_UAS'
  | 'INTERMEDIATE_C_UAS'
  | 'ADVANCED_C_UAS'
  | 'INSTRUCTOR_CERTIFIED';

export interface OperatorProfile {
  id: string;
  serviceNumber: string;
  rank: string;
  name: string;
  unit: string;
  unitId: string;
  branch: 'ARMY' | 'NAVY' | 'AIR_FORCE' | 'CIVILIAN';
  role: OperatorRole;
  certificationLevel: CertificationLevel;
  totalTrainingHours: number;
  averageScore: number;
  lastLoginAt: string | null;
}

export interface TrainingRecord {
  sessionId: string;
  scenarioId: string;
  scenarioName: string;
  score: number;
  grade: string;
  completedAt: string;
  durationSeconds: number;
}

export interface UnitAssignment {
  unitId: string;
  unitName: string;
  commanderId: string;
  instructorIds: string[];
  traineeIds: string[];
}

/** Permission matrix per role — mirrors backend ROLE_PERMISSIONS */
export const ROLE_PERMISSIONS: Record<OperatorRole, string[]> = {
  TRAINEE: [
    'simulation:start',
    'simulation:action',
    'aar:read:own',
    'profile:read:own',
  ],
  INSTRUCTOR: [
    'simulation:start',
    'simulation:action',
    'aar:read:any',
    'scenario:configure',
    'trainee:read:unit',
    'trainee:assign',
  ],
  COMMANDER: [
    'aar:read:any',
    'aar:aggregate:unit',
    'trainee:read:unit',
    'scenario:read',
    'report:export',
    'unit:manage',
  ],
};

/** Mock operator profiles for frontend portal (Phase 2: from API) */
export const MOCK_OPERATORS: OperatorProfile[] = [
  {
    id: 'op-trainee-001',
    serviceNumber: 'IC-86432',
    rank: 'Major',
    name: 'Arjun Sharma',
    unit: '14 Corps Signal Regiment',
    unitId: 'unit-alpha-01',
    branch: 'ARMY',
    role: 'TRAINEE',
    certificationLevel: 'INTERMEDIATE_C_UAS',
    totalTrainingHours: 24.5,
    averageScore: 82,
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'op-instructor-001',
    serviceNumber: 'IC-72100',
    rank: 'Lt Col',
    name: 'Priya Nair',
    unit: 'DSSC Wellington — C-UAS Cell',
    unitId: 'unit-alpha-01',
    branch: 'ARMY',
    role: 'INSTRUCTOR',
    certificationLevel: 'INSTRUCTOR_CERTIFIED',
    totalTrainingHours: 218,
    averageScore: 91,
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'op-commander-001',
    serviceNumber: 'IC-60011',
    rank: 'Brigadier',
    name: 'Vikram Rao',
    unit: 'Southern Command — C-UAS Division',
    unitId: 'unit-alpha-01',
    branch: 'ARMY',
    role: 'COMMANDER',
    certificationLevel: 'ADVANCED_C_UAS',
    totalTrainingHours: 8,
    averageScore: 88,
    lastLoginAt: new Date().toISOString(),
  },
];
