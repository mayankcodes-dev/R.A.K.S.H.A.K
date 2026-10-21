/**
 * R.A.K.S.H.A.K. Counter-UAS Training Simulator
 * ═══════════════════════════════════════════════
 * Main server entry point.
 *
 * Initialises the Fastify instance, loads environment config,
 * and starts the HTTP + WebSocket listener.
 *
 * SIH 2026 — PS 26247, Ministry of Defence
 *
 * @module server
 */

import 'dotenv/config';
import pino from 'pino';
import { createApp } from './app.js';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

/** Default port — overridden by environment variable */
const PORT = parseInt(process.env.PORT ?? '3200', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function main(): Promise<void> {
  const app = await createApp({ logger });

  // ── Graceful shutdown ────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully…`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await app.listen({ port: PORT, host: HOST });
    logger.info(
      `🛡️  R.A.K.S.H.A.K. backend listening on http://${HOST}:${PORT}`
    );
    logger.info(
      `   WebSocket endpoint: ws://${HOST}:${PORT}/simulation/ws`
    );
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
