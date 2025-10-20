/**
 * @fileoverview SupervisorApplicationService - Application service for supervisor operations
 * @description Handles supervisor authorization, validation, and execution
 */

import { SupervisorAssignment } from '../../domain/value-objects/SupervisorAssignment';
import { SupervisorChangeResult } from '../../domain/value-objects/SupervisorChangeResult';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { ISupervisorRepository } from '../../domain/interfaces/ISupervisorRepository';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import { ISupervisorManagementService } from '../../domain/interfaces/ISupervisorManagementService';
import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { SupervisorError } from '../../domain/errors/DomainError';
import { SupervisorErrorCode } from '../../domain/errors/ErrorCodes';
import { ValidationUtils } from '../../domain/utils/ValidationUtils';
import { AuthorizationUtils } from '../../domain/utils/AuthorizationUtils';
import { SupervisorChangeType } from '../../domain/enums/SupervisorChangeType';

/**
 * Application service for supervisor operations
 */
export class SupervisorApplicationService {
  private userRepository: IUserRepository;
  private authorizationService: IAuthorizationService;
  private supervisorRepository: ISupervisorRepository;
  private commandMessagingService: ICommandMessagingService;
  private supervisorManagementService: ISupervisorManagementService;
  private auditService: IAuditService;
  private webPubSubService: IWebPubSubService;

  /**
   * Creates a new SupervisorApplicationService instance
   * @param userRepository - User repository for data access
   * @param authorizationService - Authorization service for permission checks
   * @param supervisorRepository - Supervisor repository for data access
   * @param commandMessagingService - Messaging service for notifications
   * @param supervisorManagementService - Supervisor management service for business logic
   * @param auditService - Audit service for logging
   * @param webPubSubService - WebPubSub service for broadcasting notifications
   */
  constructor(
    userRepository: IUserRepository,
    authorizationService: IAuthorizationService,
    supervisorRepository: ISupervisorRepository,
    commandMessagingService: ICommandMessagingService,
    supervisorManagementService: ISupervisorManagementService,
    auditService: IAuditService,
    webPubSubService: IWebPubSubService
  ) {
    this.userRepository = userRepository;
    this.authorizationService = authorizationService;
    this.supervisorRepository = supervisorRepository;
    this.commandMessagingService = commandMessagingService;
    this.supervisorManagementService = supervisorManagementService;
    this.auditService = auditService;
    this.webPubSubService = webPubSubService;
  }

  /**
   * Authorizes if a user can change supervisors
   * @param callerId - Azure AD object ID of the caller
   * @throws AuthError if user is not authorized
   */
  async authorizeSupervisorChange(callerId: string): Promise<void> {
    await AuthorizationUtils.validateCanManageUsers(this.authorizationService, callerId);
  }

  /**
   * Validates supervisor assignment request
   * @param assignment - The supervisor assignment to validate
   * @throws ValidationError if assignment is invalid
   */
  async validateSupervisorAssignment(assignment: SupervisorAssignment): Promise<void> {
    // Validate user emails array
    ValidationUtils.validateEmailsArray(assignment.userEmails, 'User emails');

    // Validate supervisor if provided
    if (assignment.newSupervisorEmail) {
      const validatedSupervisorEmail = ValidationUtils.validateEmailFormat(assignment.newSupervisorEmail, 'Supervisor email');
      await ValidationUtils.validateUserIsSupervisor(this.supervisorRepository, validatedSupervisorEmail, 'Supervisor');
    }

    // Validate users can have supervisor changed
    await this.supervisorManagementService.validateUsersForSupervisorChange(assignment.userEmails);
  }

  /**
   * Changes supervisor for multiple users
   * @param assignment - The supervisor assignment operation
   * @returns Promise that resolves to supervisor change result
   * @throws SupervisorError if change fails
   */
  async changeSupervisor(assignment: SupervisorAssignment): Promise<SupervisorChangeResult> {
    try {
      // Execute the supervisor change
      const result = await this.supervisorManagementService.assignSupervisor(
        assignment.userEmails, 
        assignment.newSupervisorEmail
      );

      // Send notifications to affected users
      await this.notifyUsersOfSupervisorChange(assignment);

      return result;
    } catch (error) {
      throw new SupervisorError(
        `Failed to change supervisor: ${(error as Error).message}`,
        SupervisorErrorCode.SUPERVISOR_ASSIGNMENT_FAILED
      );
    }
  }

  /**
   * Notifies users of supervisor change
   * @param assignment - The supervisor assignment operation
   * @returns Promise that resolves when notifications are sent
   */
  private async notifyUsersOfSupervisorChange(assignment: SupervisorAssignment): Promise<void> {
    const supervisor = assignment.newSupervisorEmail 
      ? await this.supervisorRepository.findByEmail(assignment.newSupervisorEmail)
      : null;

    const supervisorName = supervisor ? supervisor.getDisplayName() : null;

    // Notify individual PSOs via command messaging (existing functionality)
    for (const email of assignment.userEmails) {
      try {
        await this.commandMessagingService.sendToGroup(`commands:${email}`, {
          type: SupervisorChangeType.SUPERVISOR_CHANGED,
          newSupervisorName: supervisorName,
          timestamp: assignment.timestamp.toISOString()
        });
      } catch (error) {
        // Log warning but don't fail the operation
        console.warn(`Failed to notify user ${email} of supervisor change:`, error);
      }
    }

    // Broadcast to all users in presence group for UI refresh
    await this.broadcastSupervisorChangeNotification(assignment, supervisorName);
  }

  /**
   * Broadcasts supervisor change notification to all users in presence group
   * @param assignment - The supervisor assignment operation
   * @param supervisorName - The name of the new supervisor
   * @returns Promise that resolves when broadcast is complete
   * @private
   */
  private async broadcastSupervisorChangeNotification(
    assignment: SupervisorAssignment, 
    supervisorName: string | null
  ): Promise<void> {
    try {
      // Get PSO user information for names
      const psoUsers = await Promise.all(
        assignment.userEmails.map(email => this.userRepository.findByEmail(email))
      );
      const psoNames = psoUsers
        .filter(user => user !== null)
        .map((pso: any) => pso.fullName);

      // Get the new supervisor's Azure AD Object ID
      const newSupervisor = assignment.newSupervisorEmail 
        ? await this.supervisorRepository.findByEmail(assignment.newSupervisorEmail)
        : null;
      const newSupervisorId = newSupervisor?.azureAdObjectId;

      await this.webPubSubService.broadcastSupervisorChangeNotification({
        psoEmails: assignment.userEmails,
        oldSupervisorEmail: undefined, // Not available in ChangeSupervisor endpoint
        newSupervisorEmail: assignment.newSupervisorEmail || '',
        newSupervisorId: newSupervisorId,
        psoNames: psoNames,
        newSupervisorName: supervisorName || 'Unknown Supervisor'
      });

      console.log(`📡 [SupervisorApplicationService] Successfully broadcasted supervisor change notification for ${assignment.userEmails.length} PSO(s)`);
    } catch (error) {
      // Log error but don't fail the operation
      console.error(`📡 [SupervisorApplicationService] Failed to broadcast supervisor change notification:`, error);
    }
  }
}
