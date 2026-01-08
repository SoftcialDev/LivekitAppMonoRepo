/**
 * @fileoverview callerId - Middleware for extracting caller ID from JWT claims
 * @description Provides unified caller ID extraction middleware to avoid inconsistencies
 */

import { Context } from '@azure/functions';
import { getCallerAdId } from '../utils/authHelpers';
import { badRequest } from '../utils/response';
import { logError } from '../utils/logger';
import { extractErrorMessage } from '../utils/error/ErrorHelpers';
import { ensureBindings, ExtendedContext } from '../domain/types/ContextBindings';

/**
 * Middleware that extracts and validates caller ID from JWT claims
 * Attaches the caller ID to ctx.bindings.callerId for use in handlers
 * 
 * @param ctx - Azure Functions execution context
 * @param next - Next middleware function
 */
export async function withCallerId(ctx: Context, next: () => Promise<void>) {
  try {
    // Extract caller ID from JWT claims
    const extendedCtx = ensureBindings(ctx);
    
    if (!extendedCtx.bindings.user) {
      badRequest(ctx, "Cannot determine caller identity: user not found in context");
      return;
    }
    
    const callerId = getCallerAdId(extendedCtx.bindings.user);
    
    if (!callerId) {
      badRequest(ctx, "Cannot determine caller identity");
      return;
    }

    // Attach caller ID to context for downstream handlers
    extendedCtx.bindings.callerId = callerId;

    // Proceed to next middleware or handler
    await next();
  } catch (error: unknown) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    logError(ctx, errorInstance, { middleware: 'withCallerId' });
    const errorMessage = extractErrorMessage(error);
    badRequest(ctx, `Authentication error: ${errorMessage}`);
  }
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
