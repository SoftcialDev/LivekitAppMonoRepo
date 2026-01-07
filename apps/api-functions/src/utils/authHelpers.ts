/**
 * @fileoverview authHelpers - Utility functions for authentication
 * @description Provides reusable authentication helper functions
 */

import { Context } from '@azure/functions';
import { unauthorized } from './response';
import type { JwtPayload } from 'jsonwebtoken';
import { CallerIdNotFoundError } from '../domain/errors';

/**
 * Extracts caller ID from JWT claims
 * @param ctx - Azure Functions execution context
 * @returns Caller ID or throws unauthorized error
 */
export function extractCallerId(ctx: Context): string {
  const claims = ctx.bindings.user as JwtPayload;
  const callerId = (claims.oid ?? claims.sub) as string | undefined;
  
  if (!callerId) {
    throw new CallerIdNotFoundError('Cannot determine caller identity');
  }
  
  return callerId;
}

/**
 * Safely extracts caller ID from JWT claims
 * @param ctx - Azure Functions execution context
 * @returns Caller ID or null if not found
 */
export function tryExtractCallerId(ctx: Context): string | null {
  try {
    return extractCallerId(ctx);
  } catch {
    return null;
  }
}

/**
 * Extracts the Azure AD Object ID (oid) or subject (sub) from JWT claims
 * @param claims - The decoded JWT payload
 * @returns The caller's Azure AD Object ID or undefined if not found
 */
export function getCallerAdId(claims: JwtPayload): string | undefined {
  return (claims.oid ?? claims.sub) as string | undefined;
}
