/**
 * @fileoverview ChangeUserRole - Azure Function for user role change handling
 * @description Allows authorized users to change user roles and manage user assignments
 */

import { AzureFunction, Context } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { withCallerId } from "../shared/middleware/callerId";
import { requirePermission } from "../shared/middleware/permissions";
import { Permission } from "../shared/domain/enums/Permission";
import { ok } from "../shared/utils/response";
import { UserRoleChangeApplicationService } from "../shared/application/services/UserRoleChangeApplicationService";
import { UserRoleChangeRequest } from "../shared/domain/value-objects/UserRoleChangeRequest";
import { userRoleChangeSchema } from "../shared/domain/schemas/UserRoleChangeSchema";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { handleAnyError } from "../shared/utils/errorHandler";
import { IUserRepository } from "../shared/domain/interfaces/IUserRepository";
import { IAuthorizationService } from "../shared/domain/interfaces/IAuthorizationService";
import { IAuditService } from "../shared/domain/interfaces/IAuditService";
import { IPresenceService } from "../shared/domain/interfaces/IPresenceService";

/**
 * Azure Function: ChangeUserRole
 *
 * **HTTP POST** `/api/ChangeUserRole`
 *
 * Allows Admins and Supervisors to change user roles and manage user assignments.
 *
 * @logic
 * 1. Authenticate caller via Azure AD (`withAuth`).
 * 2. Authorize only users with `Admin`, `Supervisor`, or `SuperAdmin` roles.
 * 3. Validate payload `{ userEmail, newRole }`.
 * 4. Supervisors can only assign PSO role; Admins can assign any role.
 * 5. Update user role in Microsoft Graph and database.
 * 6. Log audit entry and update presence if needed.
 *
 * @param ctx Azure Functions execution context.
 */
const changeUserRole: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.UsersChangeRole)(ctx);
        
        // Initialize service container
        serviceContainer.initialize();

        // Resolve dependencies from container
        const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
        const authorizationService = serviceContainer.resolve<IAuthorizationService>('AuthorizationService');
        const auditService = serviceContainer.resolve<IAuditService>('IAuditService');
        const presenceService = serviceContainer.resolve<IPresenceService>('PresenceService');

        const userRoleChangeApplicationService = new UserRoleChangeApplicationService(
          userRepository,
          authorizationService,
          auditService,
          presenceService
        );

        // Validate request body
        await withBodyValidation(userRoleChangeSchema)(ctx, async () => {
          const { userEmail, newRole } = ctx.bindings.validatedBody;
          const callerId = ctx.bindings.callerId as string;

          try {
            // Create user role change request
            const request = UserRoleChangeRequest.fromRequest({ userEmail, newRole });

            // Validate request (authorization is done at middleware level, but role hierarchy is validated here)
            await userRoleChangeApplicationService.validateRoleChangeRequest(request, callerId);

            // Execute role change
            const result = await userRoleChangeApplicationService.changeUserRole(request, callerId);

            return ok(ctx, {
              message: result.getSummary(),
              operation: result.getOperationType(),
              userEmail: result.userEmail,
              previousRole: result.previousRole,
              newRole: result.newRole
            });

          } catch (error) {
            return handleAnyError(ctx, error, {
              callerId,
              userEmail,
              newRole
            });
          }
        });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in ChangeUserRole",
    showStackInDev: true,
  }
);

export default changeUserRole;
