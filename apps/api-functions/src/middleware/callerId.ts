/**
 * @fileoverview callerId - Middleware for extracting caller ID from JWT claims
 * @description Provides unified caller ID extraction middleware to avoid inconsistencies
 */

import { Context } from '@azure/functions';
import { getCallerAdId } from '../utils/authHelpers';
import { badRequest } from '../utils/response';
import { logError } from '../utils/logger';
import { extractErrorMessage } from '../utils/error';

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
    const callerId = getCallerAdId(ctx.bindings.user);
    
    if (!callerId) {
      badRequest(ctx, "Cannot determine caller identity");
      return;
    }

    // Attach caller ID to context for downstream handlers
    (ctx as any).bindings = (ctx as any).bindings || {};
    (ctx as any).bindings.callerId = callerId;

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
  return (ctx as any).bindings?.callerId || null;
}
