/**
 * @fileoverview GetUsersByRole - Azure Function for querying users by role
 * @description Handles HTTP requests to get users filtered by role with pagination
 * 
 * @logic
 * 1. Authenticate caller via Azure AD (`withAuth`).
 * 2. Validate query parameters (`withQueryValidation`).
 * 3. Authorize caller has permission to query users.
 * 4. Query users from database by role (no Graph API).
 * 5. Return paginated results.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withQueryValidation } from "../shared/middleware/validate";
import { UserQueryRequest } from "../shared/domain/value-objects/UserQueryRequest";
import { userQuerySchema } from "../shared/domain/schemas/UserQuerySchema";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { getCallerAdId } from "../shared/utils/authHelpers";
import { UserQueryApplicationService } from "../shared/application/services/UserQueryApplicationService";
import { IUserRepository } from "../shared/domain/interfaces/IUserRepository";
import { IAuthorizationService } from "../shared/domain/interfaces/IAuthorizationService";
import { IUserQueryService } from "../shared/domain/services/UserQueryService";

const getUsersByRole: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      serviceContainer.initialize();

      const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
      const authorizationService = serviceContainer.resolve<IAuthorizationService>('AuthorizationService');
      const userQueryService = serviceContainer.resolve<IUserQueryService>('UserQueryService');

      const userQueryApplicationService = new UserQueryApplicationService(
        userRepository,
        authorizationService,
        userQueryService
      );

      await withQueryValidation(userQuerySchema)(ctx, async () => {
        const { role, page, pageSize } = ctx.bindings.validatedQuery;
        const callerId = getCallerAdId(ctx.bindings.user);
        if (!callerId) {
          throw new Error('Caller ID not found in request context');
        }

        const request = UserQueryRequest.fromQueryString({ role, page, pageSize });
        const result = await userQueryApplicationService.getUsersByRole(request, callerId);

        ctx.res = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: result.toPayload()
        };
      });
    });
  }
);

export default getUsersByRole;