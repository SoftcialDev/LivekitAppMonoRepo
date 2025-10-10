/**
 * @fileoverview AuditUtils - Common audit logging utilities
 * @description Provides centralized audit logging functions for application services
 */

import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuditService } from '../interfaces/IAuditService';
import { User } from '../entities/User';

/**
 * Common audit utilities for application services
 */
export class AuditUtils {
  /**
   * Logs an audit entry with proper caller resolution
   * @param auditService - Audit service for logging
   * @param userRepository - User repository for caller lookup
   * @param callerId - Azure AD object ID of the caller
   * @param auditData - Audit entry data
   * @returns Promise that resolves when audit is logged
   * @throws Error if caller is not found
   */
  static async logAuditWithCaller(
    auditService: IAuditService,
    userRepository: IUserRepository,
    callerId: string,
    auditData: {
      entity: string;
      entityId: string;
      action: string;
      dataBefore?: any;
      dataAfter?: any;
    }
  ): Promise<void> {
    // Get caller user from database
    const caller = await userRepository.findByAzureAdObjectId(callerId);
    if (!caller) {
      throw new Error(`Caller not found for Azure AD Object ID: ${callerId}`);
    }

    // Log audit with database ID
    await auditService.logAudit({
      entity: auditData.entity,
      entityId: auditData.entityId,
      action: auditData.action,
      changedById: caller.id, // Use database ID, not Azure AD Object ID
      dataBefore: auditData.dataBefore,
      dataAfter: auditData.dataAfter,
    });
  }

  /**
   * Logs a user creation audit
   * @param auditService - Audit service for logging
   * @param userRepository - User repository for caller lookup
   * @param callerId - Azure AD object ID of the caller
   * @param user - Created user entity
   * @returns Promise that resolves when audit is logged
   */
  static async logUserCreation(
    auditService: IAuditService,
    userRepository: IUserRepository,
    callerId: string,
    user: User
  ): Promise<void> {
    await this.logAuditWithCaller(auditService, userRepository, callerId, {
      entity: 'User',
      entityId: user.id,
      action: 'CREATE',
      dataAfter: user,
    });
  }

  /**
   * Logs a user update audit
   * @param auditService - Audit service for logging
   * @param userRepository - User repository for caller lookup
   * @param callerId - Azure AD object ID of the caller
   * @param userBefore - User entity before update
   * @param userAfter - User entity after update
   * @returns Promise that resolves when audit is logged
   */
  static async logUserUpdate(
    auditService: IAuditService,
    userRepository: IUserRepository,
    callerId: string,
    userBefore: User,
    userAfter: User
  ): Promise<void> {
    await this.logAuditWithCaller(auditService, userRepository, callerId, {
      entity: 'User',
      entityId: userAfter.id,
      action: 'UPDATE',
      dataBefore: userBefore,
      dataAfter: userAfter,
    });
  }

  /**
   * Logs a user deletion audit
   * @param auditService - Audit service for logging
   * @param userRepository - User repository for caller lookup
   * @param callerId - Azure AD object ID of the caller
   * @param user - Deleted user entity
   * @returns Promise that resolves when audit is logged
   */
  static async logUserDeletion(
    auditService: IAuditService,
    userRepository: IUserRepository,
    callerId: string,
    user: User
  ): Promise<void> {
    await this.logAuditWithCaller(auditService, userRepository, callerId, {
      entity: 'User',
      entityId: user.id,
      action: 'DELETE',
      dataBefore: user,
    });
  }

  /**
   * Logs a role change audit
   * @param auditService - Audit service for logging
   * @param userRepository - User repository for caller lookup
   * @param callerId - Azure AD object ID of the caller
   * @param userBefore - User entity before role change
   * @param userAfter - User entity after role change
   * @returns Promise that resolves when audit is logged
   */
  static async logRoleChange(
    auditService: IAuditService,
    userRepository: IUserRepository,
    callerId: string,
    userBefore: User | null,
    userAfter: User
  ): Promise<void> {
    await this.logAuditWithCaller(auditService, userRepository, callerId, {
      entity: 'User',
      entityId: userAfter.id,
      action: 'ROLE_CHANGE',
      dataBefore: userBefore,
      dataAfter: userAfter,
    });
  }

  /**
   * Logs a supervisor change audit
   * @param auditService - Audit service for logging
   * @param userRepository - User repository for caller lookup
   * @param callerId - Azure AD object ID of the caller
   * @param userId - ID of the user whose supervisor changed
   * @param supervisorBefore - Previous supervisor
   * @param supervisorAfter - New supervisor
   * @returns Promise that resolves when audit is logged
   */
  static async logSupervisorChange(
    auditService: IAuditService,
    userRepository: IUserRepository,
    callerId: string,
    userId: string,
    supervisorBefore: string | null,
    supervisorAfter: string | null
  ): Promise<void> {
    await this.logAuditWithCaller(auditService, userRepository, callerId, {
      entity: 'User',
      entityId: userId,
      action: 'SUPERVISOR_CHANGE',
      dataBefore: { supervisorId: supervisorBefore },
      dataAfter: { supervisorId: supervisorAfter },
    });
  }

  /**
   * Logs a command execution audit
   * @param auditService - Audit service for logging
   * @param userRepository - User repository for caller lookup
   * @param callerId - Azure AD object ID of the caller
   * @param command - Command that was executed
   * @param targetUser - Target user email
   * @returns Promise that resolves when audit is logged
   */
  static async logCommandExecution(
    auditService: IAuditService,
    userRepository: IUserRepository,
    callerId: string,
    command: string,
    targetUser: string
  ): Promise<void> {
    await this.logAuditWithCaller(auditService, userRepository, callerId, {
      entity: 'Command',
      entityId: `${command}-${targetUser}`,
      action: 'EXECUTE',
      dataAfter: { command, targetUser },
    });
  }
}
