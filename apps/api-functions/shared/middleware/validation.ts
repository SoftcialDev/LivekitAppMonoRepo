/**
 * @fileoverview validation - Validation middleware
 * @description Provides reusable validation middleware functions
 */

import { Context } from '@azure/functions';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

/**
 * Creates validation middleware for employee target
 * @returns Middleware function that validates if target is an employee
 */
export function requireEmployeeTarget() {
  const userRepository = new UserRepository();
  
  return async (ctx: Context, targetEmail: string): Promise<void> => {
    const isValidTarget = await userRepository.isEmployee(targetEmail);
    
    if (!isValidTarget) {
      throw new Error('Target user not found or not an Employee');
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
