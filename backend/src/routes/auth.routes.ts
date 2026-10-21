/**
 * R.A.K.S.H.A.K. — Authentication Routes
 * ════════════════════════════════════════
 * Operator-token-based authentication for the training simulator.
 *
 * Routes
 * ──────
 *  POST /auth/login           — Exchange credentials for JWT
 *  GET  /auth/verify           — Validate current JWT and return claims
 *  POST /auth/register-trainee — Enrol a new trainee (INSTRUCTOR+ only)
 *
 * @module routes/auth
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// ── Request Schemas ────────────────────────────────────────────────

const LoginBodySchema = z.object({
  serviceNumber: z.string().min(4).max(20),
  /** Operator token issued by the unit admin — NOT a password */
  operatorToken: z.string().min(8),
});

const RegisterBodySchema = z.object({
  serviceNumber: z.string().min(4).max(20),
  rank: z.string(),
  name: z.string().min(2).max(120),
  unit: z.string().min(2).max(80),
  role: z.enum(['TRAINEE', 'INSTRUCTOR', 'COMMANDER']).default('TRAINEE'),
});

// ── Response Types ─────────────────────────────────────────────────

interface AuthTokenPayload {
  sub: string;          // trainee_profiles.id
  serviceNumber: string;
  role: 'TRAINEE' | 'INSTRUCTOR' | 'COMMANDER';
  unit: string;
  iat: number;
  exp: number;
}

interface LoginResponse {
  token: string;
  expiresIn: string;
  profile: {
    id: string;
    serviceNumber: string;
    rank: string;
    name: string;
    unit: string;
    certificationLevel: string;
  };
}

// ── Route Registration ─────────────────────────────────────────────

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /auth/login
   * Authenticate via service number + operator token.
   *
   * In production the operator token is a pre-shared HMAC key
   * rotated monthly by the unit's IT cell.
   */
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = LoginBodySchema.parse(request.body);

    // Phase 1: Stub — accept any well-formed token for demo
    // Phase 2: Verify operatorToken against trainee_profiles.operator_token_hash
    // Phase 3: Integrate with MoD Single Sign-On (SSO) via SAML 2.0

    const stubProfile = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      serviceNumber: body.serviceNumber,
      rank: 'Captain',
      name: 'Demo Operator',
      unit: 'Air Defence Regt',
      certificationLevel: 'INTERMEDIATE',
    };

    const token = app.jwt.sign({
      sub: stubProfile.id,
      serviceNumber: stubProfile.serviceNumber,
      role: 'TRAINEE' as const,
      unit: stubProfile.unit,
    } satisfies Partial<AuthTokenPayload>);

    const response: LoginResponse = {
      token,
      expiresIn: '8h',
      profile: stubProfile,
    };

    return reply.code(200).send(response);
  });

  /**
   * GET /auth/verify
   * Validate the JWT in the Authorization header and return decoded claims.
   */
  app.get('/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = await request.jwtVerify<AuthTokenPayload>();
      return reply.send({ valid: true, claims: decoded });
    } catch {
      return reply.code(401).send({ valid: false, error: 'Invalid or expired token' });
    }
  });

  /**
   * POST /auth/register-trainee
   * Enrol a new trainee into the system.
   * Requires INSTRUCTOR or COMMANDER role.
   */
  app.post(
    '/register-trainee',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = RegisterBodySchema.parse(request.body);

      // Phase 1: Stub — return mock registration confirmation
      // Phase 2: INSERT into trainee_profiles, generate operator token
      // Phase 3: Push enrolment event to audit log & notify unit CO

      return reply.code(201).send({
        success: true,
        traineeId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        serviceNumber: body.serviceNumber,
        message: `Trainee ${body.name} (${body.rank}) registered successfully`,
      });
    }
  );
}
