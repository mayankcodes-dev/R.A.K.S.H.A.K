/**
 * @file simulation.routes.ts
 * @description Simulation session routes — start, action ingestion, state polling,
 *   and real-time WebSocket sync using SAPIENT v7 event bus.
 *
 * Phase 2: Replace in-memory session store with PostgreSQL + Redis pub/sub.
 * Phase 3: Enable cross-region session replication for distributed training ops.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SimulationController } from '../controllers/simulation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import type {
  StartSessionBody,
  OperatorActionBody,
  SessionStateParams,
} from '../../shared/types/scenario.types';

export async function simulationRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new SimulationController();

  /**
   * POST /simulation/start
   * Initialise a new training session for a given scenario and trainee.
   */
  fastify.post<{ Body: StartSessionBody }>(
    '/simulation/start',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Body: StartSessionBody }>, reply: FastifyReply) => {
      try {
        const session = await controller.startSession(request.body);
        return reply.status(201).send({
          success: true,
          data: session,
          message: 'Simulation session initialised',
        });
      } catch (err) {
        request.log.error(err, 'Failed to start simulation session');
        return reply.status(500).send({ success: false, error: 'SESSION_INIT_FAILED' });
      }
    }
  );

  /**
   * POST /simulation/action
   * Ingest an operator action event and evaluate ROE compliance.
   * SAPIENT DetectionReport is published to the event bus on each engagement action.
   */
  fastify.post<{ Body: OperatorActionBody }>(
    '/simulation/action',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Body: OperatorActionBody }>, reply: FastifyReply) => {
      try {
        const result = await controller.processOperatorAction(request.body);
        return reply.status(200).send({ success: true, data: result });
      } catch (err) {
        request.log.error(err, 'Failed to process operator action');
        return reply.status(500).send({ success: false, error: 'ACTION_PROCESSING_FAILED' });
      }
    }
  );

  /**
   * GET /simulation/:sessionId/state
   * Poll current session state — threat positions, sensor readings, kill-chain phase.
   * For real-time delivery, use the WebSocket endpoint below.
   */
  fastify.get<{ Params: SessionStateParams }>(
    '/simulation/:sessionId/state',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: SessionStateParams }>, reply: FastifyReply) => {
      try {
        const state = await controller.getSessionState(request.params.sessionId);
        if (!state) return reply.status(404).send({ success: false, error: 'SESSION_NOT_FOUND' });
        return reply.status(200).send({ success: true, data: state });
      } catch (err) {
        request.log.error(err, 'Failed to fetch session state');
        return reply.status(500).send({ success: false, error: 'STATE_FETCH_FAILED' });
      }
    }
  );

  /**
   * WebSocket /simulation/ws
   * Bi-directional real-time channel.
   * Server → Client: SAPIENT_DETECTION, THREAT_UPDATE, PHASE_CHANGE, TIMER_TICK
   * Client → Server: OPERATOR_ACTION, PING
   *
   * Phase 2: Migrate to Redis pub/sub for horizontal scalability.
   */
  fastify.get(
    '/simulation/ws',
    { websocket: true, preHandler: [authMiddleware] },
    (socket, request) => {
      request.log.info('WebSocket session opened');

      socket.on('message', async (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'PING') {
            socket.send(JSON.stringify({ type: 'PONG', ts: Date.now() }));
            return;
          }
          if (msg.type === 'OPERATOR_ACTION') {
            const result = await controller.processOperatorAction(msg.payload);
            socket.send(JSON.stringify({ type: 'ACTION_ACK', data: result }));
          }
        } catch {
          socket.send(JSON.stringify({ type: 'ERROR', code: 'PARSE_ERROR' }));
        }
      });

      socket.on('close', () => {
        request.log.info('WebSocket session closed');
      });
    }
  );
}
