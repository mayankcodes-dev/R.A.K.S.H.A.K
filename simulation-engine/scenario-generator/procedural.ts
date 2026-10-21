/**
 * @file procedural.ts
 * @description Procedural scenario generator for RAKSHAK training missions.
 *   Produces deterministic, seed-based environment + threat configurations
 *   so instructors can reproduce any exact scenario variant by ID.
 *
 * Phase 2: Extend with machine-learned threat distributions derived from
 *          DRDO incident databases (restricted API).
 */

import type { ScenarioConfig, ThreatProfile, EnvironmentConfig } from '../../shared/types/scenario.types';

/** Seeded pseudo-random — deterministic for reproducible scenarios */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export interface ProceduralConfig {
  /** Integer seed — same seed produces identical scenario */
  seed: number;
  /** Base scenario template to extend */
  baseScenarioId: 'solo_drone' | 'fiber_optic_fpv' | 'swarm_urban';
  /** Difficulty modifier 0.5–2.0 */
  difficultyMultiplier: number;
  /** Instructor overrides (optional) */
  overrides?: Partial<ScenarioConfig>;
}

/**
 * Generate a fully-specified scenario configuration from a seed.
 * Used by the instructor portal for custom drill creation.
 */
export function generateProcedural(config: ProceduralConfig): ScenarioConfig {
  const rng = seededRandom(config.seed);
  const dm = config.difficultyMultiplier;

  const environment = generateEnvironment(rng, dm);
  const threats = generateThreats(config.baseScenarioId, rng, dm);

  const base: ScenarioConfig = {
    id: `proc-${config.seed}-${config.baseScenarioId}`,
    name: `[GEN] Scenario ${config.seed}`,
    subtitle: `Procedural variant of ${config.baseScenarioId}`,
    difficulty: dm > 1.5 ? 'EXPERT' : dm > 1.0 ? 'HARD' : 'MEDIUM',
    baseScenarioId: config.baseScenarioId,
    threats,
    environment,
    roeConstraints: [
      { rule: 'NO_KINETIC_BEFORE_TRACK', penalty: 20 },
      { rule: 'NO_ENGAGE_CIVILIAN_ZONE', penalty: 50 },
    ],
    maxDurationSeconds: Math.round(180 / dm),
    seed: config.seed,
  };

  return { ...base, ...(config.overrides ?? {}) };
}

function generateEnvironment(rng: () => number, dm: number): EnvironmentConfig {
  const visibilities: EnvironmentConfig['visibility'][] = ['CLEAR', 'HAZE', 'RAIN', 'FOG'];
  const times: EnvironmentConfig['timeOfDay'][] = ['DAWN', 'DAY', 'DUSK', 'NIGHT'];

  const visIndex = dm > 1.5 ? Math.floor(rng() * 4) : Math.floor(rng() * 2);

  return {
    timeOfDay: times[Math.floor(rng() * (dm > 1.2 ? 4 : 2))],
    visibility: visibilities[visIndex],
    windSpeedKts: Math.round(rng() * 25 * dm),
    temperatureCelsius: Math.round(15 + rng() * 25),
    urbanDensity: dm > 1.5 ? 'URBAN' : dm > 1.0 ? 'SUBURBAN' : 'RURAL',
    nvgRequired: dm > 1.3 && rng() > 0.5,
  };
}

function generateThreats(
  baseId: string,
  rng: () => number,
  dm: number
): ThreatProfile[] {
  const threatCount = baseId === 'swarm_urban' ? Math.round(3 + rng() * 4 * dm) : 1;

  return Array.from({ length: threatCount }, (_, i) => ({
    id: `threat-${String(i + 1).padStart(3, '0')}`,
    type: baseId === 'fiber_optic_fpv' ? 'FPV_FIBER_OPTIC' : 'MULTI_ROTOR',
    rfSignature: baseId === 'fiber_optic_fpv' ? null : `2.4GHz-${Math.round(rng() * 100)}mW`,
    rcsM2: baseId === 'fiber_optic_fpv' ? 0.003 : 0.01,
    speedMps: Math.round(12 + rng() * 15 * dm),
    altitudeM: Math.round(30 + rng() * 200),
    fiberOptic: baseId === 'fiber_optic_fpv',
    waypointCount: Math.round(3 + rng() * 5),
  }));
}

/**
 * Generate a thumbnail description of a procedural scenario for the instructor UI.
 */
export function describeScenario(config: ScenarioConfig): string {
  const threatSummary = config.threats
    .map(t => `${t.type} @${t.altitudeM}m`)
    .join(', ');
  return (
    `${config.environment.timeOfDay} · ${config.environment.visibility} · ` +
    `${config.environment.urbanDensity} · Threats: [${threatSummary}]`
  );
}
