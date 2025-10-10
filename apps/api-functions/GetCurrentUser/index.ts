/**
 * @fileoverview GetCurrentUser - Azure Function for getting current user information
 * @description Returns the current authenticated user's information from the database
 */

import { AzureFunction, Context } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { getCallerAdId } from "../shared/utils/authHelpers";
import { IUserRepository } from "../shared/domain/interfaces/IUserRepository";
import { UserSummary } from "../shared/domain/entities/UserSummary";

/**
 * Azure Function: GetCurrentUser
 *
 * **HTTP GET** `/api/GetCurrentUser`
 *
 * Returns the current authenticated user's information from the database.
 * This endpoint is used by the frontend to get user roles and information
 * instead of relying on Azure AD token roles.
 *
 * **Response:**
 * ```json
 * {
 *   "azureAdObjectId": "12345678-1234-1234-1234-123456789012",
 *   "email": "user@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "role": "Admin",
 *   "supervisorAdId": "87654321-4321-4321-4321-210987654321",
 *   "supervisorName": "Jane Smith"
 * }
 * ```
 *
 * **Authorization:**
 * - Requires valid Azure AD token
 * - Returns user information from database
 *
 * **Error Codes:**
 * - 401: Unauthorized (invalid token)
 * - 404: User not found in database
 * - 500: Internal server error
 */

const getCurrentUser: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    await withAuth(ctx, async () => {
      // Initialize service container
      serviceContainer.initialize();

      // Resolve dependencies from container
      const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');

      // Get caller ID from token
      const callerId = getCallerAdId(ctx.bindings.user);
      if (!callerId) {
        throw new Error('Caller ID not found in request context');
      }

      try {
        // Get user from database
        const user = await userRepository.findByAzureAdObjectId(callerId);
        
        if (!user) {
          ctx.res = {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: { error: 'User not found in database' }
          };
          return;
        }

        // Convert to UserSummary for consistent response format
        const userSummary = UserSummary.fromPrismaUser({
          azureAdObjectId: user.azureAdObjectId,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          supervisor: null // User entity doesn't include supervisor by default
        });

        // Return user information
        ctx.res = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            azureAdObjectId: userSummary.azureAdObjectId,
            email: userSummary.email,
            firstName: userSummary.firstName,
            lastName: userSummary.lastName,
            role: userSummary.role,
            supervisorAdId: userSummary.supervisorAdId,
            supervisorName: userSummary.supervisorName
          }
        };

      } catch (error) {
        ctx.log.error('GetCurrentUser failed:', error);
        ctx.res = {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Internal server error' }
        };
      }
    });
  }
);

export default getCurrentUser;
