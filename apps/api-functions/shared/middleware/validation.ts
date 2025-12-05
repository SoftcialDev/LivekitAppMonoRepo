/**
 * @fileoverview validation - Validation middleware
 * @description Provides reusable validation middleware functions
 */

import { Context } from '@azure/functions';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

/**
 * Creates validation middleware for PSO target
 * @returns Middleware function that validates if target is a PSO
 */
export function requirePSOTarget() {
  const userRepository = new UserRepository();
  
  return async (ctx: Context, targetEmail: string): Promise<void> => {
    const isValidTarget = await userRepository.isPSO(targetEmail);
    
    if (!isValidTarget) {
      throw new Error('Target user not found or not a PSO');
    }
  };
}

/**
 * Creates validation middleware for active user target
 * @returns Middleware function that validates if target user exists and is active
 */
export function requireActiveUserTarget() {
  const userRepository = new UserRepository();
  
  return async (ctx: Context, targetEmail: string): Promise<void> => {
    const user = await userRepository.findByEmail(targetEmail);
    
    if (!user || user.deletedAt) {
      throw new Error('Target user not found or inactive');
    }
  };
}
