/**
 * @fileoverview ChangeSupervisor - Azure Function for supervisor change handling
 * @description Allows authorized users to change supervisor assignments for employees
 */

import { AzureFunction, Context } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { SupervisorApplicationService } from "../shared/application/services/SupervisorApplicationService";
import { SupervisorAssignment } from "../shared/domain/value-objects/SupervisorAssignment";
import { supervisorAssignmentSchema } from "../shared/domain/schemas/SupervisorAssignmentSchema";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { handleAnyError } from "../shared/utils/errorHandler";
import { getCallerAdId } from "../shared/utils/authHelpers";
import { IUserRepository } from "../shared/domain/interfaces/IUserRepository";
import { IAuthorizationService } from "../shared/domain/interfaces/IAuthorizationService";
import { ISupervisorRepository } from "../shared/domain/interfaces/ISupervisorRepository";
import { ICommandMessagingService } from "../shared/domain/interfaces/ICommandMessagingService";
import { ISupervisorManagementService } from "../shared/domain/interfaces/ISupervisorManagementService";
import { IAuditService } from "../shared/domain/interfaces/IAuditService";
import { IWebPubSubService } from "../shared/domain/interfaces/IWebPubSubService";

/**
 * Azure Function: ChangeSupervisor
 *
 * **HTTP POST** `/api/ChangeSupervisor`
 *
 * Allows Admins and Supervisors to change supervisor assignments for employees.
 *
 * @logic
 * 1. Authenticate caller via Azure AD (`withAuth`).
 * 2. Authorize only users with `Admin`, `Supervisor`, or `SuperAdmin` roles.
 * 3. Validate payload `{ userEmails, newSupervisorEmail }`.
 * 4. Verify the supervisor exists and has `Supervisor` role (if provided).
 * 5. Update supervisor assignments for all valid employees.
 * 6. Send notifications to affected users.
 *
 * @param ctx Azure Functions execution context.
 */
const changeSupervisor: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    await withAuth(ctx, async () => {
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
        const claims = ctx.bindings.user;
        const callerId = getCallerAdId(claims);

        if (!callerId) {
          return handleAnyError(ctx, new Error("Cannot determine caller identity"), { userEmails, newSupervisorEmail });
        }

        try {
          // Create supervisor assignment
          const assignment = SupervisorAssignment.fromRequest({ userEmails, newSupervisorEmail });

          // Authorize caller
          await supervisorApplicationService.authorizeSupervisorChange(callerId);

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
  },
  {
    genericMessage: "Internal Server Error in ChangeSupervisor",
    showStackInDev: true,
  }
);

export default changeSupervisor;
