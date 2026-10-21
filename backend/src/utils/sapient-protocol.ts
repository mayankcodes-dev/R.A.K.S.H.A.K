/**
 * @file sapient-protocol.ts
 * @description NATO SAPIENT v7 protocol utilities.
 *   Factory functions for building, serialising, and validating SAPIENT messages
 *   per BSI Flex 335 v2.0 (2024) specification.
 *
 * Message types implemented:
 *   - DetectionReport (sensor → fusion node)
 *   - Alert           (fusion node → operator console)
 *   - Status          (sensor heartbeat)
 *   - TaskCommand     (tasking node → sensor)
 *
 * Phase 2: Replace JSON serialisation with protobufjs compiled from sapient-v7.proto.
 * Phase 3: DTLS 1.3 encrypted transport for field deployment.
 */

import type {
  SAPIENTDetectionReport,
  SAPIENTAlert,
  SAPIENTStatus,
  DetectionClassification,
} from '../../../shared/types/sapient.types';

// ── Factory functions ────────────────────────────────────────────────────────

export function createDetectionReport(params: {
  messageId: string;
  sensorId: string;
  timestamp: string;
  location: { lat: number; lon: number; altM: number };
  classification: DetectionClassification;
  confidence: number;
  associatedAction?: string;
  sessionContext?: string;
}): SAPIENTDetectionReport {
  return {
    messageId: params.messageId,
    messageType: 'DETECTION_REPORT',
    protocolVersion: '7.0',
    sensorId: params.sensorId,
    timestamp: params.timestamp,
    location: params.location,
    classification: params.classification,
    confidence: params.confidence,
    trackId: `TRK-${params.sensorId}-${Date.now()}`,
    associatedAction: params.associatedAction,
    sessionContext: params.sessionContext,
  };
}

export function createAlert(params: {
  messageId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'ROE_VIOLATION';
  description: string;
  targetId?: string;
  timestamp: string;
}): SAPIENTAlert {
  return {
    messageId: params.messageId,
    messageType: 'ALERT',
    protocolVersion: '7.0',
    severity: params.severity,
    description: params.description,
    targetId: params.targetId,
    timestamp: params.timestamp,
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null,
  };
}

export function createStatusReport(params: {
  messageId: string;
  sensorId: string;
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
  sessionId: string;
  timestamp: string;
}): SAPIENTStatus {
  return {
    messageId: params.messageId,
    messageType: 'STATUS',
    protocolVersion: '7.0',
    sensorId: params.sensorId,
    status: params.status,
    sessionId: params.sessionId,
    timestamp: params.timestamp,
  };
}

// ── Serialisation ────────────────────────────────────────────────────────────

/**
 * Serialise a SAPIENT message to JSON wire format.
 * Phase 2: Replace with protobufjs compiled binary for ~60% size reduction.
 */
export function serializeToProtobuf(
  message: SAPIENTDetectionReport | SAPIENTAlert | SAPIENTStatus
): Buffer {
  // Phase 2: return SapientProto[message.messageType].encode(message).finish()
  return Buffer.from(JSON.stringify(message), 'utf-8');
}

/**
 * Deserialise raw bytes from wire to a SAPIENT message.
 * Phase 2: Use protobufjs decode with compiled schema.
 */
export function deserializeFromProtobuf(
  raw: Buffer
): SAPIENTDetectionReport | SAPIENTAlert | SAPIENTStatus {
  // Phase 2: const decoded = SapientProto.DetectionReport.decode(raw); return decoded;
  return JSON.parse(raw.toString('utf-8'));
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a SAPIENT message against BSI Flex 335 v2.0 required fields.
 * Returns an array of validation errors (empty = valid).
 */
export function validateSapientMessage(
  msg: Partial<SAPIENTDetectionReport>
): string[] {
  const errors: string[] = [];

  if (!msg.messageId) errors.push('messageId is required');
  if (!msg.messageType) errors.push('messageType is required');
  if (msg.protocolVersion !== '7.0') errors.push('protocolVersion must be 7.0');
  if (!msg.sensorId) errors.push('sensorId is required');
  if (!msg.timestamp) errors.push('timestamp is required');
  if (typeof msg.confidence === 'number' && (msg.confidence < 0 || msg.confidence > 1)) {
    errors.push('confidence must be in [0, 1]');
  }

  return errors;
}
