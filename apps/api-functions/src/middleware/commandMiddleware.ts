/**
 * @fileoverview commandMiddleware - Composite middleware for command operations
 * @description Provides combined middleware for command-related operations
 */

import { Context } from '@azure/functions';
import { requireCommandPermission } from './authorization';
import { requirePSOTarget } from './validation';
import { extractCallerId } from '../utils/authHelpers';
import { mapMiddlewareErrorToResponse } from '../utils';

/**
 * Composite middleware for command operations
 * Handles authentication, authorization, and target validation
 * @param targetEmail - Email of the target PSO
 * @returns Promise that resolves when all validations pass
 */
export async function validateCommandRequest(ctx: Context, targetEmail: string): Promise<void> {
  try {
    // 1. Extract and validate caller ID
    extractCallerId(ctx);
    
    // 2. Check command permissions
    await requireCommandPermission()(ctx);
    
    // 3. Validate target PSO
    await requirePSOTarget()(ctx, targetEmail);
    
  } catch (error: unknown) {
    // Map known middleware errors to HTTP responses
    const handled = mapMiddlewareErrorToResponse(ctx, error);
    if (handled) {
      return; // Response already set, exit
    }
    // Unknown errors are re-thrown for upper-level handling
    throw error;
  }
}
