/**
 * @fileoverview GetCurrentUser - Azure Function for getting current user information
 * @description Returns the current authenticated user's information from the database
 */

import { AzureFunction, Context } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { getCallerAdId } from "../shared/utils/authHelpers";
import { GetCurrentUserApplicationService } from "../shared/application/services/GetCurrentUserApplicationService";
import { GetCurrentUserRequest } from "../shared/domain/value-objects/GetCurrentUserRequest";

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

      // Resolve application service from container
      const applicationService = serviceContainer.resolve<GetCurrentUserApplicationService>(
        'GetCurrentUserApplicationService'
      );

      // Get caller ID from token
      const callerId = getCallerAdId(ctx.bindings.user);
      if (!callerId) {
        throw new Error('Caller ID not found in request context');
      }

      // Create request object
      const request = GetCurrentUserRequest.fromCallerId(callerId);

      // Get JWT payload for user information
      const jwtPayload = ctx.bindings.user;

      // Execute application service
      const response = await applicationService.getCurrentUser(request, jwtPayload);

      // Log if user was auto-created
      if (response.isNewUser) {
        ctx.log.info(`New user auto-created: ${response.email} with role ${response.role}`);
      }

      // Return user information
      ctx.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: response.toPayload()
      };
    });
  }
);

export default getCurrentUser;
