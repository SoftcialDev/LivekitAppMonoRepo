/**
 * @fileoverview callerId - Middleware for extracting caller ID from JWT claims
 * @description Provides unified caller ID extraction middleware to avoid inconsistencies
 */

import { Context } from '@azure/functions';
import { getCallerAdId } from '../utils/authHelpers';
import { CallerIdNotFoundError } from '../domain/errors';
import { ensureBindings, ExtendedContext } from '../domain/types/ContextBindings';

/**
 * Middleware that extracts and validates caller ID from JWT claims
 * Attaches the caller ID to ctx.bindings.callerId for use in handlers
 * 
 * Throws CallerIdNotFoundError if caller ID cannot be determined.
 * Errors are handled by withErrorHandler middleware wrapper.
 * 
 * @param ctx - Azure Functions execution context
 * @param next - Next middleware function
 * @throws CallerIdNotFoundError if user not found in context or caller ID cannot be extracted
 */
export async function withCallerId(ctx: Context, next: () => Promise<void>): Promise<void> {
  // Extract caller ID from JWT claims
  const extendedCtx = ensureBindings(ctx);
  
  if (!extendedCtx.bindings.user) {
    throw new CallerIdNotFoundError('Cannot determine caller identity: user not found in context');
  }
  
  const callerId = getCallerAdId(extendedCtx.bindings.user);
  
  if (!callerId) {
    throw new CallerIdNotFoundError('Cannot determine caller identity');
  }

  // Attach caller ID to context for downstream handlers
  extendedCtx.bindings.callerId = callerId;

  // Proceed to next middleware or handler
  await next();
}

/**
 * Safely extracts caller ID from context bindings
 * Should be used after withCallerId middleware
 * 
 * @param ctx - Azure Functions execution context
 * @returns Caller ID or null if not found
 */
export function getCallerIdFromContext(ctx: Context): string | null {
  const extendedCtx = ctx as ExtendedContext;
  return extendedCtx.bindings?.callerId || null;
}
