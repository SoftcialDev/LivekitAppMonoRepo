/**
 * @fileoverview authorization - Authorization middleware
 * @description Provides reusable authorization middleware functions
 */

import { Context } from '@azure/functions';
import { unauthorized } from '../utils/response';
import { AuthorizationService } from '../domain/services/AuthorizationService';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { extractCallerId } from '../utils/authHelpers';

/**
 * Creates authorization middleware for command sending
 * @returns Middleware function that checks if user can send commands
 */
export function requireCommandPermission() {
  const authorizationService = new AuthorizationService(new UserRepository());
  
  return async (ctx: Context): Promise<void> => {
    const callerId = extractCallerId(ctx);
    const isAuthorized = await authorizationService.canSendCommands(callerId);
    
    if (!isAuthorized) {
      throw new Error('Insufficient privileges');
    }
  };
}

/**
 * Creates authorization middleware for user management
 * @returns Middleware function that checks if user can manage users
 */
export function requireUserManagementPermission() {
  const authorizationService = new AuthorizationService(new UserRepository());
  
  return async (ctx: Context): Promise<void> => {
    const callerId = extractCallerId(ctx);
    const isAuthorized = await authorizationService.canManageUsers(callerId);
    
    if (!isAuthorized) {
      throw new Error('Insufficient privileges');
    }
  };
}

/**
 * Creates authorization middleware for admin access
 * @returns Middleware function that checks if user is admin
 */
export function requireAdminAccess() {
  const authorizationService = new AuthorizationService(new UserRepository());
  
  return async (ctx: Context): Promise<void> => {
    // Use the callerId that was already extracted by withCallerId middleware
    const callerId = (ctx as any).bindings?.callerId;
    
    if (!callerId) {
      throw new Error('Caller ID not found in context');
    }
    
    const isAuthorized = await authorizationService.canAccessAdmin(callerId);
    
    if (!isAuthorized) {
      throw new Error('Insufficient privileges');
    }
  };
}
