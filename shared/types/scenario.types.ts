/**
 * @fileoverview Scenario type definitions for the RAKSHAK Counter-UAS Training Simulator.
 *
 * These types define the full scenario configuration model, including threat
 * profiles, environment state, rules of engagement, and kill-chain actions.
 * All simulation components consume these types.
 *
 * @module @rakshak/shared/types/scenario
 * @version 0.1.0
 * @see docs/architecture.md — "Scenario Generation Engine"
 */

// ─── Threat Classification ─────────────────────────────────────────────────

/** UAS threat categories per Indian MoD threat taxonomy (2025 revision) */
export enum ThreatCategory {
  /** Consumer-grade quadcopter (DJI Mavic class) */
  COMMERCIAL_QUADCOPTER = 'COMMERCIAL_QUADCOPTER',
  /** Fixed-wing reconnaissance UAV */
  FIXED_WING_RECON = 'FIXED_WING_RECON',
  /** FPV kamikaze / loitering munition */
  FPV_LOITERING = 'FPV_LOITERING',
  /** Coordinated multi-drone swarm (3+ units) */
  SWARM = 'SWARM',
  /** Large MALE/HALE class (for awareness, not engagement) */
  LARGE_UAS = 'LARGE_UAS',
}

/** RF emission profile for electronic detection */
export interface RFSignature {
  /** Primary control-link frequency in MHz (e.g., 2400 for 2.4 GHz) */
  controlFrequency_mhz: number;
  /** Video downlink frequency in MHz (e.g., 5800 for 5.8 GHz) */
  videoFrequency_mhz: number;
  /** RF power in dBm */
  transmitPower_dbm: number;
  /** Whether the drone uses frequency hopping spread spectrum */
  frequencyHopping: boolean;
  /** Fiber-optic guided — no RF emission (e.g., Iranian Shahed-FO variant) */
  fiberOptic: boolean;
}

/**
 * Complete threat profile describing a single adversary UAS.
 * Used by the scenario generator and DDQN adversary agent.
 */
export interface ThreatProfile {
  /** Unique threat identifier within a scenario */
  id: string;
  /** Human-readable name (e.g., "DJI Mavic 3 variant") */
  name: string;
  /** Threat category classification */
  type: ThreatCategory;
  /** RF emission characteristics */
  rfSignature: RFSignature;
  /**
   * Radar Cross Section in square meters.
   * Typical values: 0.01 m² (micro-drone) to 0.5 m² (fixed-wing).
   * @see simulation-engine/physics/radar-equation.ts — calculateRCS()
   */
  rcs_m2: number;
  /** Maximum speed in meters per second */
  speed_mps: number;
  /** Operating altitude in meters AGL */
  altitude_m: number;
  /** Maximum endurance in minutes */
  endurance_min: number;
  /** Payload mass in kilograms (affects manoeuvrability) */
  payload_kg: number;
  /** Whether UAS is fiber-optic guided (immune to RF jamming) */
  fiberOptic: boolean;
  /** Micro-Doppler blade rotation frequency in Hz (for classifier input) */
  bladeFrequency_hz: number;
  /** Number of rotor blades (affects micro-Doppler signature) */
  bladeCount: number;
}

// ─── Environment ────────────────────────────────────────────────────────────

/** Terrain classification for the operating area */
export enum TerrainType {
  DESERT_FLAT = 'DESERT_FLAT',
  URBAN_DENSE = 'URBAN_DENSE',
  MOUNTAINOUS = 'MOUNTAINOUS',
  COASTAL = 'COASTAL',
  FORESTED = 'FORESTED',
  BORDER_POST = 'BORDER_POST',
}

/** Time of day classification affecting sensor performance */
export enum TimeOfDay {
  DAY = 'DAY',
  DUSK = 'DUSK',
  NIGHT = 'NIGHT',
  DAWN = 'DAWN',
}

/**
 * Full environment configuration for a scenario instance.
 * Controls weather, terrain, and time-of-day parameters.
 */
export interface EnvironmentConfig {
  terrain: TerrainType;
  timeOfDay: TimeOfDay;
  /** Visibility in kilometres (degraded by weather) */
  visibility_km: number;
  /** Wind speed at ground level in knots */
  windSpeed_kts: number;
  /** Wind direction in degrees true */
  windDirection_deg: number;
  /** Ambient temperature in °C */
  temperature_c: number;
  /** Whether NVG/thermal is required (auto-set for NIGHT) */
  nvgRequired: boolean;
  /** Ground clutter intensity 0.0–1.0 (higher in urban terrain) */
  clutterIntensity: number;
}

// ─── Rules of Engagement ────────────────────────────────────────────────────

/** Engagement method available to the operator */
export enum EngagementType {
  /** RF jamming of control link */
  RF_JAM = 'RF_JAM',
  /** GPS spoofing to redirect UAS */
  GPS_SPOOF = 'GPS_SPOOF',
  /** Kinetic interception (projectile or net) */
  KINETIC_INTERCEPT = 'KINETIC_INTERCEPT',
  /** High-powered microwave */
  HPM = 'HPM',
  /** Acoustic disruption */
  ACOUSTIC_DISRUPT = 'ACOUSTIC_DISRUPT',
  /** Directed energy (laser) */
  DIRECTED_ENERGY = 'DIRECTED_ENERGY',
}

/**
 * Rules of Engagement constraint applied to the scenario.
 * Violations incur score penalties during AAR.
 */
export interface ROEConstraint {
  /** Unique rule identifier */
  ruleId: string;
  /** Human-readable rule description */
  description: string;
  /** Engagement types permitted under this ROE */
  permittedEngagements: EngagementType[];
  /** Minimum confidence threshold before engagement is authorised (0.0–1.0) */
  minConfidenceToEngage: number;
  /** Maximum altitude (m AGL) for kinetic engagement (airspace deconfliction) */
  maxEngagementAltitude_m: number;
  /** Whether civilian airspace is active (restricts kinetic options) */
  civilianAirspaceActive: boolean;
  /** Penalty multiplier for violating this rule (1.0 = standard) */
  violationPenalty: number;
}

// ─── Kill Chain ─────────────────────────────────────────────────────────────

/** Actions the operator can take at each kill-chain phase */
export interface KillChainAction {
  /** Phase this action belongs to */
  phase: 'DETECT' | 'CLASSIFY' | 'TRACK' | 'ENGAGE' | 'ASSESS';
  /** Action identifier */
  actionId: string;
  /** Human-readable action label */
  label: string;
  /** Time in seconds this action was taken (relative to scenario start) */
  timestamp_s: number;
  /** Whether this action was correct per the scenario's ground truth */
  correct: boolean;
  /** Optional operator notes */
  notes?: string;
}

// ─── Scenario Configuration ─────────────────────────────────────────────────

/** Difficulty presets for scenario generation */
export enum DifficultyLevel {
  TUTORIAL = 'TUTORIAL',
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

/**
 * Root scenario configuration object.
 * Serialized to JSON for storage and replay.
 */
export interface ScenarioConfig {
  /** UUID v4 scenario identifier */
  scenarioId: string;
  /** Human-readable scenario title */
  title: string;
  /** Scenario description and training objectives */
  description: string;
  /** Difficulty level (affects DDQN agent behaviour) */
  difficulty: DifficultyLevel;
  /** Procedural generation seed for reproducibility */
  seed: number;
  /** Maximum scenario duration in seconds */
  duration_s: number;
  /** Environment configuration */
  environment: EnvironmentConfig;
  /** Array of threat profiles (1–N threats) */
  threats: ThreatProfile[];
  /** Active rules of engagement */
  roe: ROEConstraint[];
  /** Available engagement types for the operator */
  availableEngagements: EngagementType[];
  /** Timestamp of scenario creation (ISO 8601) */
  createdAt: string;
  /** Operator ID who initiated the scenario */
  operatorId: string;

  // Phase 2: Multiplayer / instructor-override fields
  // instructorOverrides?: InstructorOverride[];
  // multiplayerConfig?: MultiplayerConfig;
}
