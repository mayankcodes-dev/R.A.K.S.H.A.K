/**
 * @file sapient.service.ts
 * @description SAPIENT v7 Protocol Service — Real-time Sensor Data Fusion & Alert Dissemination.
 *
 * Implements NATO SAPIENT (Sensor Autonomy Protocol – Intelligence, Command and Tasking)
 * Milestone 7 interface specification (BSI Flex 335 v2.0, 2024).
 *
 * Sensor registry supports: Radar (primary), EO/IR (secondary), RF-Spectrum,
 * Micro-Doppler, and acoustic arrays.
 *
 * Phase 2: Full Protobuf serialisation using sapient-v7.proto schema.
 * Phase 3: Federated multi-node SAPIENT mesh with DRDO D4 integration.
 */

import { createDetectionReport, createAlert, serializeToProtobuf } from '../../utils/sapient-protocol';
import type {
  SAPIENTDetectionReport,
  SAPIENTAlert,
  SAPIENTStatus,
  DetectionClassification,
} from '../../../shared/types/sapient.types';

interface SensorRegistryEntry {
  sensorId: string;
  type: 'RADAR' | 'EOIR' | 'RF_SPECTRUM' | 'ACOUSTIC' | 'MICRO_DOPPLER';
  locationLat: number;
  locationLon: number;
  maxRangeM: number;
  isActive: boolean;
  lastHeartbeat: Date;
}

// Static sensor registry — Phase 2: pull from PostgreSQL sensor_configs table
const SENSOR_REGISTRY: SensorRegistryEntry[] = [
  {
    sensorId: 'RAKSHAK-RADAR-01',
    type: 'RADAR',
    locationLat: 28.6139,
    locationLon: 77.2090,
    maxRangeM: 8000,
    isActive: true,
    lastHeartbeat: new Date(),
  },
  {
    sensorId: 'RAKSHAK-EOIR-01',
    type: 'EOIR',
    locationLat: 28.6140,
    locationLon: 77.2091,
    maxRangeM: 3000,
    isActive: true,
    lastHeartbeat: new Date(),
  },
  {
    sensorId: 'RAKSHAK-RF-01',
    type: 'RF_SPECTRUM',
    locationLat: 28.6138,
    locationLon: 77.2089,
    maxRangeM: 5000,
    isActive: true,
    lastHeartbeat: new Date(),
  },
];

export class SapientService {
  private messageCounter = 0;

  /**
   * Process an incoming detection report payload and broadcast to connected nodes.
   * Validates BSI Flex 335 schema compliance before dissemination.
   */
  async processDetectionReport(payload: {
    sensorId: string;
    sessionId: string;
    action: string;
    roeViolation: boolean;
    phase: string;
  }): Promise<{ messageId: string; accepted: boolean }> {
    const messageId = this._nextMessageId();

    const report: SAPIENTDetectionReport = createDetectionReport({
      messageId,
      sensorId: payload.sensorId,
      timestamp: new Date().toISOString(),
      location: { lat: 28.6139, lon: 77.209, altM: 120 },
      classification: this._inferClassification(payload.action),
      confidence: 0.91,
      associatedAction: payload.action,
      sessionContext: payload.sessionId,
    });

    const valid = this.validateSchemaCompliance(report);
    if (!valid) {
      throw new Error(`SAPIENT schema validation failed for message ${messageId}`);
    }

    // Phase 2: publish to SAPIENT event bus via Redis pub/sub
    // await redis.publish('sapient:detection', serializeToProtobuf(report));

    return { messageId, accepted: true };
  }

  /**
   * Format and broadcast an alert to all connected operator consoles.
   * Alert severity: INFO | WARNING | CRITICAL | ROE_VIOLATION
   */
  async formatAlertMessage(params: {
    severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'ROE_VIOLATION';
    description: string;
    targetId?: string;
    sessionId: string;
  }): Promise<SAPIENTAlert> {
    const alert = createAlert({
      messageId: this._nextMessageId(),
      severity: params.severity,
      description: params.description,
      targetId: params.targetId,
      timestamp: new Date().toISOString(),
    });

    // Phase 2: await redis.publish('sapient:alert', JSON.stringify(alert));
    return alert;
  }

  /**
   * Publish sensor node status heartbeat.
   * Phase 2: persist to sapient_logs table for audit trail.
   */
  async publishStatus(params: {
    sensorId: string;
    status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
    sessionId: string;
    timestamp: string;
  }): Promise<SAPIENTStatus> {
    const sensorEntry = SENSOR_REGISTRY.find(s => s.sensorId === params.sensorId);
    if (sensorEntry) sensorEntry.lastHeartbeat = new Date();

    return {
      sensorId: params.sensorId,
      status: params.status,
      sessionId: params.sessionId,
      timestamp: params.timestamp,
      messageId: this._nextMessageId(),
    };
  }

  /**
   * Validate that a report conforms to BSI Flex 335 v2.0 SAPIENT schema.
   * Phase 2: validate against compiled Protobuf descriptor from sapient-v7.proto.
   */
  validateSchemaCompliance(report: SAPIENTDetectionReport): boolean {
    if (!report.messageId || !report.sensorId || !report.timestamp) return false;
    if (typeof report.confidence !== 'number' || report.confidence < 0 || report.confidence > 1) return false;
    if (!report.location?.lat || !report.location?.lon) return false;
    return true;
  }

  /** List all registered sensors and their current status */
  getSensorRegistry(): SensorRegistryEntry[] {
    return SENSOR_REGISTRY;
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private _nextMessageId(): string {
    return `SAPIENT-${Date.now()}-${String(++this.messageCounter).padStart(4, '0')}`;
  }

  private _inferClassification(action: string): DetectionClassification {
    if (action.includes('FIBER') || action.includes('FPV')) return 'DRONE_FPV_FIBER_OPTIC';
    if (action.includes('SWARM')) return 'DRONE_SWARM';
    if (action.includes('BIRD') || action.includes('CLUTTER')) return 'CLUTTER';
    return 'DRONE_SOLO';
  }
}
