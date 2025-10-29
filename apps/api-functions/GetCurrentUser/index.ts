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
 * **Auto-provisioning:**
 * If the user doesn't exist in the database, they will be automatically created
 * with the Employee role using information from their Azure AD JWT token.
 *
 * **Response:**
 * ```json
 * {
 *   "azureAdObjectId": "12345678-1234-1234-1234-123456789012",
 *   "email": "user@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "role": "Employee",
 *   "supervisorAdId": "87654321-4321-4321-4321-210987654321",
 *   "supervisorName": "Jane Smith"
 * }
 * ```
 *
 * **Authorization:**
 * - Requires valid Azure AD token
 * - Returns user information from database
 * - Creates new user with Employee role if not exists
 *
 * **Error Codes:**
 * - 400: Bad request (email not found in token)
 * - 401: Unauthorized (invalid token)
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
        let user = await userRepository.findByAzureAdObjectId(callerId);
        
        // If user doesn't exist, create them automatically with Employee role
        if (!user) {
          ctx.log.info(`User ${callerId} not found in database, creating new user with Employee role`);
          
          // Extract user information from JWT token
          const jwtPayload = ctx.bindings.user;
          const email = (jwtPayload.upn || jwtPayload.email || jwtPayload.preferred_username) as string;
          const fullName = (jwtPayload.name || email.split('@')[0]) as string;
          
          if (!email) {
            ctx.log.error('Cannot create user: email not found in JWT token');
            ctx.res = {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
              body: { error: 'User email not found in authentication token' }
            };
            return;
          }

          // Create new user with Employee role (using Prisma enum from @prisma/client)
          const { UserRole } = await import('@prisma/client');
          user = await userRepository.upsertUser({
            email,
            azureAdObjectId: callerId,
            fullName,
            role: UserRole.Employee
          });
          
          ctx.log.info(`New user created: ${email} with role Employee`);
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
