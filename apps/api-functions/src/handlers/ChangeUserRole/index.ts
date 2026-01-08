/**
 * @fileoverview ChangeUserRole - Azure Function for user role change handling
 * @description Allows authorized users to change user roles and manage user assignments
 */

import { AzureFunction, Context } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withBodyValidation } from '../../middleware/validate';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { UserRoleChangeApplicationService } from '../../application/services/UserRoleChangeApplicationService';
import { UserRoleChangeRequest } from '../../domain/value-objects/UserRoleChangeRequest';
import { userRoleChangeSchema } from '../../domain/schemas/UserRoleChangeSchema';
import { UserRoleChangeSchemaType } from '../../domain/schemas/UserRoleChangeSchema';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';
import { handleAnyError } from '../../utils/errorHandler';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IPresenceService } from '../../domain/interfaces/IPresenceService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { ensureBindings } from '../../domain/types/ContextBindings';

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
        const webPubSubService = serviceContainer.resolve<IWebPubSubService>('WebPubSubService');

        const userRoleChangeApplicationService = new UserRoleChangeApplicationService(
          userRepository,
          authorizationService,
          auditService,
          presenceService,
          webPubSubService
        );

        // Validate request body
        await withBodyValidation(userRoleChangeSchema)(ctx, async () => {
          const extendedCtx = ensureBindings(ctx);
          const validatedBody = extendedCtx.bindings.validatedBody as UserRoleChangeSchemaType;
          const { userEmail, newRole } = validatedBody;
          const callerId = extendedCtx.bindings.callerId as string;

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
