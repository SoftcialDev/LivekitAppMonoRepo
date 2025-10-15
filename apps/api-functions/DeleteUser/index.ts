/**
 * @fileoverview DeleteUser - Azure Function for user deletion
 * @description Handles user deletion operations with different deletion types
 */

import { AzureFunction, Context } from '@azure/functions';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { withBodyValidation } from '../shared/middleware/validate';
import { UserDeletionRequest } from '../shared/domain/value-objects/UserDeletionRequest';
import { UserDeletionType } from '../shared/domain/enums/UserDeletionType';
import { userDeletionSchema } from '../shared/domain/schemas/UserDeletionSchema';
import { serviceContainer } from '../shared/infrastructure/container/ServiceContainer';
import { handleAnyError } from '../shared/utils/errorHandler';
import { getCallerAdId } from '../shared/utils/authHelpers';
import { IUserRepository } from '../shared/domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../shared/domain/interfaces/IAuthorizationService';
import { IAuditService } from '../shared/domain/interfaces/IAuditService';
import { IPresenceService } from '../shared/domain/interfaces/IPresenceService';
import { UserDeletionApplicationService } from '../shared/application/services/UserDeletionApplicationService';

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
 *   "previousRole": "Employee",
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
      // Initialize service container
      serviceContainer.initialize();

      // Resolve dependencies from container
      const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
      const authorizationService = serviceContainer.resolve<IAuthorizationService>('AuthorizationService');
      const auditService = serviceContainer.resolve<IAuditService>('IAuditService');
      const presenceService = serviceContainer.resolve<IPresenceService>('PresenceService');

      const userDeletionApplicationService = new UserDeletionApplicationService(
        userRepository,
        authorizationService,
        auditService,
        presenceService
      );

      // Validate request body
      await withBodyValidation(userDeletionSchema)(ctx, async () => {
        const { userEmail, reason } = ctx.bindings.validatedBody;
        const callerId = getCallerAdId(ctx.bindings.user);
        if (!callerId) {
          throw new Error('Caller ID not found in request context');
        }

        // Create user deletion request (always SOFT_DELETE)
        const request = UserDeletionRequest.create(
          userEmail,
          UserDeletionType.SOFT_DELETE,
          reason
        );

        // Execute user deletion
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
  }
);

export default deleteUser;
