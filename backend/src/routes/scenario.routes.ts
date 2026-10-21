/**
 * R.A.K.S.H.A.K. — Scenario Management Routes
 * ═════════════════════════════════════════════
 * CRUD and procedural-generation endpoints for training scenarios.
 *
 * Routes
 * ──────
 *  GET  /scenarios              — List available scenarios (paginated)
 *  GET  /scenarios/:id          — Fetch full scenario definition
 *  POST /scenarios/generate     — Trigger procedural generation engine
 *  PUT  /scenarios/:id/config   — Instructor-level scenario tuning
 *
 * @module routes/scenario
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// ── Schemas ────────────────────────────────────────────────────────

const GenerateBodySchema = z.object({
  threatProfile: z.enum(['FIXED_WING', 'ROTARY_WING', 'MULTIROTOR', 'SWARM', 'MIXED']),
  difficultyTier: z.number().int().min(1).max(5),
  environmentPreset: z.enum(['URBAN', 'DESERT', 'MOUNTAINOUS', 'COASTAL', 'NIGHT']),
  durationMinutes: z.number().int().min(5).max(60).default(15),
  /** Number of simultaneous hostile tracks */
  maxHostileCount: z.number().int().min(1).max(30).default(5),
  includeElectronicWarfare: z.boolean().default(false),
});

const ConfigUpdateSchema = z.object({
  weatherOverride: z
    .object({
      windSpeedKts: z.number().min(0).max(80),
      visibilityKm: z.number().min(0.1).max(50),
      precipitationType: z.enum(['NONE', 'RAIN', 'FOG', 'DUST']),
    })
    .optional(),
  roeProfile: z.enum(['WEAPONS_FREE', 'WEAPONS_TIGHT', 'WEAPONS_HOLD']).optional(),
  sensorLoadout: z.array(z.string()).optional(),
  /** Instructor note visible only in AAR */
  instructorNote: z.string().max(500).optional(),
});

// ── Types ──────────────────────────────────────────────────────────

interface ScenarioSummary {
  id: string;
  name: string;
  threatProfile: string;
  difficulty: number;
  environment: string;
  estimatedDurationMin: number;
  createdAt: string;
}

interface ScenarioDefinition extends ScenarioSummary {
  hostileWaypoints: Array<{
    trackId: string;
    type: string;
    rcsDbsm: number;
    speedKts: number;
    altitudeFt: number;
    waypoints: Array<{ lat: number; lon: number; altFt: number }>;
  }>;
  sensorPlacements: Array<{
    sensorId: string;
    type: string;
    position: { lat: number; lon: number };
    maxRangeKm: number;
  }>;
  roeConstraints: {
    profile: string;
    engagementZone: { centerLat: number; centerLon: number; radiusKm: number };
    noFlyZones: Array<{ lat: number; lon: number; radiusKm: number }>;
  };
  weatherConfig: {
    windSpeedKts: number;
    windDirectionDeg: number;
    visibilityKm: number;
    precipitation: string;
    temperatureC: number;
  };
}

// ── Mock Data ──────────────────────────────────────────────────────

const MOCK_SCENARIOS: ScenarioSummary[] = [
  {
    id: 'scn-alpha-001',
    name: 'Single Quadcopter Incursion — Urban',
    threatProfile: 'MULTIROTOR',
    difficulty: 1,
    environment: 'URBAN',
    estimatedDurationMin: 10,
    createdAt: '2026-01-15T08:30:00Z',
  },
  {
    id: 'scn-bravo-002',
    name: 'Fixed-Wing ISR Penetration — Desert',
    threatProfile: 'FIXED_WING',
    difficulty: 3,
    environment: 'DESERT',
    estimatedDurationMin: 20,
    createdAt: '2026-02-10T14:00:00Z',
  },
  {
    id: 'scn-charlie-003',
    name: 'Coordinated Swarm Attack — Coastal Installation',
    threatProfile: 'SWARM',
    difficulty: 5,
    environment: 'COASTAL',
    estimatedDurationMin: 30,
    createdAt: '2026-03-22T06:45:00Z',
  },
];

// ── Route Registration ─────────────────────────────────────────────

export async function scenarioRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /scenarios
   * List all available training scenarios.
   * Phase 2: Pagination, filtering by difficulty & threat type
   */
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      total: MOCK_SCENARIOS.length,
      scenarios: MOCK_SCENARIOS,
    });
  });

  /**
   * GET /scenarios/:id
   * Return the full scenario definition including waypoints, sensor
   * placements, ROE constraints, and weather configuration.
   */
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Phase 1: Return a hardcoded full definition for any valid-looking ID
    const definition: ScenarioDefinition = {
      ...MOCK_SCENARIOS[0]!,
      id,
      hostileWaypoints: [
        {
          trackId: 'TRK-H001',
          type: 'DJI_MAVIC_3',
          rcsDbsm: -20,
          speedKts: 35,
          altitudeFt: 400,
          waypoints: [
            { lat: 28.6139, lon: 77.209, altFt: 400 },
            { lat: 28.6145, lon: 77.2105, altFt: 380 },
            { lat: 28.6150, lon: 77.2120, altFt: 350 },
          ],
        },
      ],
      sensorPlacements: [
        {
          sensorId: 'SNS-RADAR-01',
          type: 'X_BAND_AESA',
          position: { lat: 28.6130, lon: 77.2085 },
          maxRangeKm: 5.0,
        },
        {
          sensorId: 'SNS-RF-01',
          type: 'RF_DETECTOR',
          position: { lat: 28.6132, lon: 77.2090 },
          maxRangeKm: 3.0,
        },
      ],
      roeConstraints: {
        profile: 'WEAPONS_TIGHT',
        engagementZone: { centerLat: 28.614, centerLon: 77.21, radiusKm: 2.0 },
        noFlyZones: [{ lat: 28.615, lon: 77.215, radiusKm: 0.5 }],
      },
      weatherConfig: {
        windSpeedKts: 12,
        windDirectionDeg: 225,
        visibilityKm: 8.0,
        precipitation: 'NONE',
        temperatureC: 34,
      },
    };

    return reply.send(definition);
  });

  /**
   * POST /scenarios/generate
   * Trigger the procedural scenario generation engine.
   *
   * Phase 2: Use DDQN-based curriculum learning to adaptively
   *          select threat composition based on trainee weakness profile.
   * Phase 3: Integrate terrain database (SRTM/DTED) for realistic
   *          terrain-following waypoint generation.
   */
  app.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = GenerateBodySchema.parse(request.body);

    // Stub: echo back generation params with a mock scenario ID
    return reply.code(202).send({
      status: 'GENERATING',
      scenarioId: `scn-gen-${Date.now().toString(36)}`,
      params,
      estimatedReadyMs: 2500,
      message: 'Procedural generation queued. Poll GET /scenarios/:id for status.',
    });
  });

  /**
   * PUT /scenarios/:id/config
   * Allows instructors to override scenario parameters
   * (weather, ROE, sensor loadout) before a session begins.
   */
  app.put('/:id/config', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const config = ConfigUpdateSchema.parse(request.body);

    // Phase 2: Persist overrides to simulation_sessions.environment_cfg
    return reply.send({
      scenarioId: id,
      updated: true,
      appliedOverrides: config,
    });
  });
}
