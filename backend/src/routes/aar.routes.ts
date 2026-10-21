/**
 * @file aar.routes.ts
 * @description After-Action Review (AAR) routes.
 *   Provides per-session score breakdown, trainee history, and unit-wide aggregates.
 *   NLG feedback stubs are powered by scoring.service → Phase 2 will integrate
 *   a fine-tuned LLM endpoint for qualitative feedback generation.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ScoringService } from '../services/scoring.service';
import { authMiddleware } from '../middleware/auth.middleware';

const scoring = new ScoringService();

/** Mock AAR store — replace with DB queries in Phase 2 */
const mockAARStore: Record<string, object> = {};

export async function aarRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /aar/:sessionId
   * Retrieve full AAR report for a completed session including:
   * - Phase scores (Detect → Classify → Track → Engage → Assess)
   * - ROE violations with timestamps
   * - Decision timeline with latency metrics
   * - NLG qualitative feedback paragraph
   */
  fastify.get<{ Params: { sessionId: string } }>(
    '/aar/:sessionId',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) => {
      const { sessionId } = request.params;

      // Phase 2: SELECT * FROM aar_scores WHERE session_id = $1
      const mockReport = {
        sessionId,
        overallScore: 84,
        grade: 'B',
        percentileRank: 72,
        phaseScores: {
          detection: { score: 91, timeSeconds: 4.2, accuracy: 0.95 },
          classification: { score: 88, timeSeconds: 6.1, accuracy: 0.91 },
          tracking: { score: 79, timeSeconds: null, accuracy: 0.82 },
          engagement: { score: 76, timeSeconds: 3.8, accuracy: 0.78 },
          assessment: { score: 88, timeSeconds: 8.0, accuracy: 0.93 },
        },
        roeViolations: [],
        decisionTimeline: [
          { phase: 'DETECT', action: 'Radar lock acquired', ts: 1000, latencyMs: 4200 },
          { phase: 'CLASSIFY', action: 'Target classified: FIBER-OPTIC-FPV', ts: 6000, latencyMs: 6100 },
          { phase: 'ENGAGE', action: 'KINETIC_INTERCEPT authorised', ts: 9800, latencyMs: 3800 },
        ],
        nlgFeedback: scoring.generateNLGFeedback(84, 'B', []),
        sapientAlertCount: 3,
        totalDurationSeconds: 128,
        scenarioId: 'fiber_optic_fpv',
        completedAt: new Date().toISOString(),
      };

      return reply.status(200).send({ success: true, data: mockReport });
    }
  );

  /**
   * GET /aar/trainee/:traineeId/history
   * Return last 20 AAR entries for a specific trainee with trend data.
   */
  fastify.get<{ Params: { traineeId: string } }>(
    '/aar/trainee/:traineeId/history',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: { traineeId: string } }>, reply: FastifyReply) => {
      const { traineeId } = request.params;

      const history = Array.from({ length: 8 }, (_, i) => ({
        sessionId: `sess-${traineeId}-${i + 1}`,
        scenarioId: ['solo_drone', 'fiber_optic_fpv', 'swarm_urban'][i % 3],
        overallScore: Math.floor(60 + Math.random() * 35),
        grade: ['C', 'B', 'A', 'B', 'B', 'A', 'A', 'A'][i],
        completedAt: new Date(Date.now() - i * 86_400_000).toISOString(),
      }));

      return reply.status(200).send({ success: true, data: history, total: history.length });
    }
  );

  /**
   * GET /aar/unit/:unitId/aggregate
   * Commander dashboard — unit-wide performance metrics and training gap analysis.
   */
  fastify.get<{ Params: { unitId: string } }>(
    '/aar/unit/:unitId/aggregate',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest<{ Params: { unitId: string } }>, reply: FastifyReply) => {
      const { unitId } = request.params;

      const aggregate = {
        unitId,
        unitName: 'Alpha Training Squadron',
        totalSessions: 142,
        activeTrainees: 28,
        averageScore: 79.4,
        gradeDistribution: { A: 41, B: 62, C: 29, D: 8, F: 2 },
        weakestPhase: 'ENGAGEMENT',
        strongestPhase: 'DETECTION',
        certifiedCount: 19,
        pendingCertification: 9,
        scenarioCompletionRate: {
          solo_drone: 0.98,
          fiber_optic_fpv: 0.61,
          swarm_urban: 0.43,
        },
        trainingGaps: [
          'Fiber-optic FPV engagement latency above 5s for 43% of trainees',
          'ROE violation rate in swarm scenarios: 18% (target <5%)',
          '9 trainees have not completed fiber_optic_fpv scenario',
        ],
        reportGeneratedAt: new Date().toISOString(),
      };

      return reply.status(200).send({ success: true, data: aggregate });
    }
  );
}
