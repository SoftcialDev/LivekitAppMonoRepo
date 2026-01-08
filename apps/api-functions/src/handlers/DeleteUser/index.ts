/**
 * @fileoverview DeleteUser - Azure Function for user deletion
 * @description Handles user deletion operations with different deletion types
 */

import { AzureFunction, Context } from '@azure/functions';
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withBodyValidation } from '../../middleware/validate';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { UserDeletionRequest } from '../../domain/value-objects/UserDeletionRequest';
import { UserDeletionType } from '../../domain/enums/UserDeletionType';
import { userDeletionSchema } from '../../domain/schemas/UserDeletionSchema';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';
import { handleAnyError } from '../../utils/errorHandler';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { IAuditService } from '../../domain/interfaces/IAuditService';
import { IPresenceService } from '../../domain/interfaces/IPresenceService';
import { UserDeletionApplicationService } from '../../application/services/UserDeletionApplicationService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * Azure Function: DeleteUser
 *
 * **HTTP POST** `/api/DeleteUser`
 * 
 * **Description:**
 * Deletes a user from the system (soft delete):
 * - Removes all Azure AD app roles (revokes access)
 * - Marks user as deleted in database (soft delete)
 * - Sets user offline
 *
 * **Request Body:**
 * ```json
 * {
 *   "userEmail": "user@example.com",
 *   "reason": "Optional reason for deletion"
 * }
 * ```
 *
 * **Response:**
 * ```json
 * {
 *   "success": true,
 *   "userEmail": "user@example.com",
 *   "deletionType": "SOFT_DELETE",
 *   "previousRole": "PSO",
 *   "message": "User soft deleted successfully (Graph roles removed)"
 * }
 * ```
 *
 * **Authorization:**
 * - Requires Admin or SuperAdmin role
 * - Cannot delete users with higher privileges
 *
 * **Error Codes:**
 * - 404006: User not found
 * - 400014: User already deleted
 * - 500006: Graph token failed
 * - 500007: Role removal failed
 * - 500008: Database deletion failed
 * - 403004: Insufficient permissions
 * - 400015: Invalid deletion type
 * - 500009: Service principal not found
 */

const deleteUser: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.UsersDelete)(ctx);
        
        // Initialize service container
        serviceContainer.initialize();

        // Resolve dependencies from container
        const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
        const authorizationService = serviceContainer.resolve<IAuthorizationService>('AuthorizationService');
        const auditService = serviceContainer.resolve<IAuditService>('IAuditService');
        const presenceService = serviceContainer.resolve<IPresenceService>('PresenceService');
        const webPubSubService = serviceContainer.resolve<IWebPubSubService>('WebPubSubService');

        const userDeletionApplicationService = new UserDeletionApplicationService(
          userRepository,
          authorizationService,
          auditService,
          presenceService,
          webPubSubService
        );

        // Validate request body
        await withBodyValidation(userDeletionSchema)(ctx, async () => {
          const extendedCtx = ensureBindings(ctx);
          const { userEmail, reason } = extendedCtx.bindings.validatedBody as { userEmail: string; reason?: string };
          const callerId = extendedCtx.bindings.callerId as string;

          // Create user deletion request (always SOFT_DELETE)
          const request = UserDeletionRequest.create(
            userEmail,
            UserDeletionType.SOFT_DELETE,
            reason
          );

          // Execute user deletion (hierarchy validation is done inside)
          const result = await userDeletionApplicationService.deleteUser(request, callerId);

          // Return success response
          ctx.res = {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              success: result.isSuccess(),
              userEmail: result.userEmail,
              deletionType: result.getDeletionTypeString(),
              previousRole: result.getPreviousRoleString(),
              message: result.getMessage(),
              timestamp: result.timestamp
            }
          };
        });
      });
    });
  }
);

export default deleteUser;
