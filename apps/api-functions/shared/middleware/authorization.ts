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
 * Creates authorization middleware for admin and super admin access only
 * @returns Middleware function that checks if user is admin or super admin
 */
export function requireAdminOrSuperAdminAccess() {
  const authorizationService = new AuthorizationService(new UserRepository());
  
  return async (ctx: Context): Promise<void> => {
    const callerId = extractCallerId(ctx);
    const isAuthorized = await authorizationService.isAdminOrSuperAdmin(callerId);
    
    if (!isAuthorized) {
      throw new Error('Insufficient privileges - Admin or SuperAdmin role required');
    }
  };
}

export function requireSuperAdminAccess() {
  const authorizationService = new AuthorizationService(new UserRepository());
  
  return async (ctx: Context): Promise<void> => {
    const callerId = extractCallerId(ctx);
    const isAuthorized = await authorizationService.isSuperAdmin(callerId);
    
    if (!isAuthorized) {
      throw new Error('Insufficient privileges - SuperAdmin role required');
    }
  };
}

