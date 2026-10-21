/**
 * R.A.K.S.H.A.K. — Application Factory
 * ══════════════════════════════════════
 * Creates and configures the Fastify instance with all plugins,
 * middleware, SAPIENT protocol handlers, and route registrations.
 *
 * @module app
 */

import Fastify, {
  FastifyInstance,
  FastifyServerOptions,
} from 'fastify';
import fastifyWebSocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';

import { authRoutes } from './routes/auth.routes.js';
import { scenarioRoutes } from './routes/scenario.routes.js';
import { simulationRoutes } from './routes/simulation.routes.js';
import { aarRoutes } from './routes/aar.routes.js';
import { initDatabasePool } from './config/database.js';
import { SapientService } from './services/sapient.service.js';

/** Options forwarded from server.ts */
interface AppOptions extends FastifyServerOptions {
  /** Override default JWT secret (falls back to env) */
  jwtSecret?: string;
}

/**
 * Build a fully-configured Fastify application.
 *
 * The factory pattern lets tests create isolated instances without
 * binding to a port.
 */
export async function createApp(
  opts: AppOptions = {}
): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // ── Core Plugins ─────────────────────────────────────────────────
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  await app.register(fastifyRateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
  });

  await app.register(fastifyJwt, {
    secret: opts.jwtSecret ?? process.env.JWT_SECRET ?? 'rakshak-dev-secret-change-me',
    sign: { expiresIn: '8h' },
  });

  // ── WebSocket Support ────────────────────────────────────────────
  await app.register(fastifyWebSocket, {
    options: {
      maxPayload: 1048576, // 1 MiB — sufficient for SAPIENT DetectionReports
    },
  });

  // ── Database ─────────────────────────────────────────────────────
  const dbPool = initDatabasePool();
  app.decorate('db', dbPool);

  // ── SAPIENT Protocol Handler (singleton) ─────────────────────────
  const sapientService = new SapientService();
  app.decorate('sapient', sapientService);

  // Phase 2: Register Redis pub/sub for multi-node SAPIENT message relay
  // Phase 3: Add protobuf binary WS frames alongside JSON fallback

  // ── Route Registration ───────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(scenarioRoutes, { prefix: '/scenarios' });
  await app.register(simulationRoutes, { prefix: '/simulation' });
  await app.register(aarRoutes, { prefix: '/aar' });

  // ── Health Check ─────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    service: 'rakshak-backend',
    version: '0.1.0-alpha',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  return app;
}
