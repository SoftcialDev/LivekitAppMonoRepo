/**
 * @fileoverview ChangeSupervisor - Azure Function for supervisor change handling
 * @description Allows authorized users to change supervisor assignments for PSOs
 */

import { AzureFunction, Context } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withBodyValidation } from '../../index';
import { withCallerId } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok } from '../../index';
import { SupervisorApplicationService } from '../../index';
import { SupervisorAssignment } from '../../index';
import { supervisorAssignmentSchema } from '../../index';
import { serviceContainer } from '../../index';
import { handleAnyError } from '../../index';
import { IUserRepository } from '../../index';
import { IAuthorizationService } from '../../index';
import { ISupervisorRepository } from '../../index';
import { ICommandMessagingService } from '../../index';
import { ISupervisorManagementService } from '../../index';
import { IAuditService } from '../../index';
import { IWebPubSubService } from '../../index';

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
