/**
 * @fileoverview commandMiddleware - Composite middleware for command operations
 * @description Provides combined middleware for command-related operations
 */

import { Context } from '@azure/functions';
import { unauthorized, badRequest } from '../utils/response';
import { requireCommandPermission } from './authorization';
import { requireEmployeeTarget } from './validation';
import { extractCallerId } from '../utils/authHelpers';

/**
 * Composite middleware for command operations
 * Handles authentication, authorization, and target validation
 * @param targetEmail - Email of the target employee
 * @returns Promise that resolves when all validations pass
 */
export async function validateCommandRequest(ctx: Context, targetEmail: string): Promise<void> {
  try {
    // 1. Extract and validate caller ID
    const callerId = extractCallerId(ctx);
    
    // 2. Check command permissions
    await requireCommandPermission()(ctx);
    
    // 3. Validate target employee
    await requireEmployeeTarget()(ctx, targetEmail);
    
  } catch (error: any) {
    if (error.message === 'Cannot determine caller identity') {
      throw unauthorized(ctx, error.message);
    }
    if (error.message === 'Insufficient privileges') {
      throw unauthorized(ctx, error.message);
    }
    if (error.message === 'Target user not found or not an Employee') {
      throw badRequest(ctx, error.message);
    }
    throw error;
  }
}
