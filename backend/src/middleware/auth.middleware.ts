/**
 * @file auth.middleware.ts
 * @description JWT-based authentication and role-based access control (RBAC) middleware.
 *
 * Token format: Bearer <JWT>
 * JWT Payload: { sub: traineeId, role: OperatorRole, unit: string, exp: number }
 *
 * Phase 2: Integrate with MoD LDAP/Active Directory via passport-ldapauth.
 * Phase 3: mTLS client certificate verification for field deployment units.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { createHmac, timingSafeEqual } from 'crypto';

export type OperatorRole = 'TRAINEE' | 'INSTRUCTOR' | 'COMMANDER' | 'SYSTEM_ADMIN';

export interface JWTPayload {
  sub: string;
  serviceNumber: string;
  role: OperatorRole;
  unitId: string;
  iat: number;
  exp: number;
}

/** Permission matrix — Phase 2: move to PostgreSQL role_permissions table */
const ROLE_PERMISSIONS: Record<OperatorRole, Set<string>> = {
  TRAINEE: new Set([
    'simulation:start',
    'simulation:action',
    'simulation:state:own',
    'aar:read:own',
  ]),
  INSTRUCTOR: new Set([
    'simulation:start',
    'simulation:action',
    'simulation:state:any',
    'aar:read:any',
    'scenario:configure',
    'trainee:read:unit',
  ]),
  COMMANDER: new Set([
    'aar:read:any',
    'aar:aggregate:unit',
    'trainee:read:unit',
    'scenario:read',
    'report:export',
  ]),
  SYSTEM_ADMIN: new Set(['*']), // wildcard — all permissions
};

/**
 * Verify a request Bearer JWT token.
 * Returns decoded payload or throws on invalid/expired token.
 *
 * Phase 2: Replace with fastify-jwt plugin + RS256 asymmetric signing.
 */
function verifyToken(authHeader: string | undefined): JWTPayload {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('MISSING_TOKEN');
  }

  const token = authHeader.slice(7);
  const [headerB64, payloadB64, sigB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !sigB64) throw new Error('MALFORMED_TOKEN');

  // Phase 2: Verify RS256 signature with public key from env
  const expectedSig = createHmac('sha256', process.env.JWT_SECRET ?? 'rakshak-dev-secret')
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  const sigBuffer = Buffer.from(sigB64);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('INVALID_SIGNATURE');
  }

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as JWTPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('TOKEN_EXPIRED');

  return payload;
}

/**
 * Fastify preHandler middleware for authentication.
 * Attaches `request.user` (JWTPayload) on success.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const payload = verifyToken(request.headers.authorization);
    (request as FastifyRequest & { user: JWTPayload }).user = payload;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AUTH_FAILED';
    await reply.status(401).send({ success: false, error: message });
  }
}

/**
 * Factory: create a permission-checking preHandler for a specific permission.
 * Usage: { preHandler: [authMiddleware, requirePermission('scenario:configure')] }
 */
export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = (request as FastifyRequest & { user?: JWTPayload }).user;
    if (!user) {
      await reply.status(401).send({ success: false, error: 'UNAUTHENTICATED' });
      return;
    }

    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.has('*') && !perms.has(permission)) {
      await reply.status(403).send({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        role: user.role,
      });
    }
  };
}

/** Rate limiting config per role (requests per minute) — Phase 2: Redis sliding window */
export const RATE_LIMITS: Record<OperatorRole, number> = {
  TRAINEE: 120,
  INSTRUCTOR: 300,
  COMMANDER: 200,
  SYSTEM_ADMIN: 1000,
};
