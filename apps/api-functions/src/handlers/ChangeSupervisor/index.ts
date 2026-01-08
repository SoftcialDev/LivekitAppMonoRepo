/**
 * @fileoverview ChangeSupervisor - Azure Function for supervisor change handling
 * @description Allows authorized users to change supervisor assignments for PSOs
 */

import { AzureFunction, Context } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withBodyValidation } from '../../middleware/validate';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { SupervisorApplicationService } from '../../application/services/SupervisorApplicationService';
import { SupervisorAssignment } from '../../domain/value-objects/SupervisorAssignment';
import { supervisorAssignmentSchema } from '../../domain/schemas/SupervisorAssignmentSchema';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';
import { handleAnyError } from '../../utils/errorHandler';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { ISupervisorRepository } from '../../domain/interfaces/ISupervisorRepository';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import { ISupervisorManagementService } from '../../domain/interfaces/ISupervisorManagementService';
import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';

/**
 * Azure Function: ChangeSupervisor
 *
 * **HTTP POST** `/api/ChangeSupervisor`
 *
 * Allows Admins and Supervisors to change supervisor assignments for PSOs.
 *
 * @logic
 * 1. Authenticate caller via Azure AD (`withAuth`).
 * 2. Authorize only users with `Admin`, `Supervisor`, or `SuperAdmin` roles.
 * 3. Validate payload `{ userEmails, newSupervisorEmail }`.
 * 4. Verify the supervisor exists and has `Supervisor` role (if provided).
 * 5. Update supervisor assignments for all valid PSOs.
 * 6. Send notifications to affected users.
 *
 * @param ctx Azure Functions execution context.
 */
const changeSupervisor: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.UsersChangeSupervisor)(ctx);
        
        // Initialize service container
        serviceContainer.initialize();

        // Resolve dependencies from container
        const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
        const authorizationService = serviceContainer.resolve<IAuthorizationService>('AuthorizationService');
        const supervisorRepository = serviceContainer.resolve<ISupervisorRepository>('SupervisorRepository');
        const commandMessagingService = serviceContainer.resolve<ICommandMessagingService>('CommandMessagingService');
        const supervisorManagementService = serviceContainer.resolve<ISupervisorManagementService>('SupervisorManagementService');
        const webPubSubService = serviceContainer.resolve<IWebPubSubService>('WebPubSubService');

        const auditService = serviceContainer.resolve<IAuditService>('IAuditService');

        const supervisorApplicationService = new SupervisorApplicationService(
          userRepository,
          authorizationService,
          supervisorRepository,
          commandMessagingService,
          supervisorManagementService,
          auditService,
          webPubSubService
        );

        // Validate request body
        await withBodyValidation(supervisorAssignmentSchema)(ctx, async () => {
          const { userEmails, newSupervisorEmail } = ctx.bindings.validatedBody;
          const callerId = ctx.bindings.callerId as string;

          try {
            // Create supervisor assignment
            const assignment = SupervisorAssignment.fromRequest({ userEmails, newSupervisorEmail });

            // Validate supervisor assignment
            await supervisorApplicationService.validateSupervisorAssignment(assignment);

            // Execute supervisor change
            const result = await supervisorApplicationService.changeSupervisor(assignment);

            ctx.log.info(`ChangeSupervisor → updated ${result.updatedCount} row(s), skipped ${result.skippedCount} row(s).`);
            return ok(ctx, { 
              updatedCount: result.updatedCount,
              skippedCount: result.skippedCount,
              totalProcessed: result.totalProcessed
            });

          } catch (error) {
            return handleAnyError(ctx, error, {
              callerId,
              userEmails,
              newSupervisorEmail
            });
          }
        });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in ChangeSupervisor",
    showStackInDev: true,
  }
);

export default changeSupervisor;
