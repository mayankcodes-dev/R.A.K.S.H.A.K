/**
 * @file sapient.types.ts
 * @description TypeScript types for NATO SAPIENT v7 protocol messages.
 *   Aligned with BSI Flex 335 v2.0 (2024) — Sensor Autonomy Protocol:
 *   Intelligence, Command and Tasking.
 *
 * Message hierarchy:
 *   SAPIENTMessage (base)
 *   ├── SAPIENTDetectionReport
 *   ├── SAPIENTAlert
 *   ├── SAPIENTStatus
 *   └── SAPIENTTaskCommand
 */

/** Detection classifications aligned with SAPIENT v7 §4.3.2 */
export type DetectionClassification =
  | 'DRONE_SOLO'
  | 'DRONE_SWARM'
  | 'DRONE_FPV_FIBER_OPTIC'
  | 'FIXED_WING_UAS'
  | 'BIRD'
  | 'VEHICLE'
  | 'PERSON'
  | 'CLUTTER'
  | 'UNKNOWN';

/** Sensor node status */
export type SensorStatus = 'ACTIVE' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';

/** Base fields common to all SAPIENT messages */
export interface SAPIENTMessageBase {
  messageId: string;
  messageType: 'DETECTION_REPORT' | 'ALERT' | 'STATUS' | 'TASK_COMMAND';
  protocolVersion: '7.0';
  timestamp: string; // ISO 8601
}

/** Geographic location */
export interface GeoLocation {
  lat: number;
  lon: number;
  altM: number;
}

// ── Detection Report ─────────────────────────────────────────────────────────

/**
 * SAPIENTDetectionReport — primary output of a sensor node.
 * Published to the fusion node for track correlation and alerting.
 */
export interface SAPIENTDetectionReport extends SAPIENTMessageBase {
  messageType: 'DETECTION_REPORT';
  sensorId: string;
  trackId: string;
  location: GeoLocation;
  classification: DetectionClassification;
  confidence: number;          // 0.0 – 1.0
  /** Velocity vector if available */
  velocity?: {
    northMps: number;
    eastMps: number;
    downMps: number;
  };
  /** RCS estimate from radar if available */
  rcsEstimateM2?: number;
  /** RF emission detected (null for fiber-optic FPV) */
  rfFrequencyMhz?: number | null;
  associatedAction?: string;
  sessionContext?: string;
}

// ── Alert ────────────────────────────────────────────────────────────────────

/**
 * SAPIENTAlert — disseminated to operator consoles.
 */
export interface SAPIENTAlert extends SAPIENTMessageBase {
  messageType: 'ALERT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'ROE_VIOLATION';
  description: string;
  targetId?: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

// ── Status ───────────────────────────────────────────────────────────────────

/**
 * SAPIENTStatus — sensor heartbeat.
 */
export interface SAPIENTStatus extends SAPIENTMessageBase {
  messageType: 'STATUS';
  sensorId: string;
  status: SensorStatus;
  sessionId: string;
}

// ── Task Command ─────────────────────────────────────────────────────────────

/**
 * SAPIENTTaskCommand — operator or AI fusion node instructs a sensor.
 * e.g., "SEARCH sector Bravo-7", "TRACK track TRK-001", "STANDBY"
 */
export interface SAPIENTTaskCommand extends SAPIENTMessageBase {
  messageType: 'TASK_COMMAND';
  targetSensorId: string;
  command: 'SEARCH' | 'TRACK' | 'CLASSIFY' | 'STANDBY' | 'RESET';
  sectorId?: string;
  trackId?: string;
  priorityLevel: 1 | 2 | 3; // 1 = highest
}
