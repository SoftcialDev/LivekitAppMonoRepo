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
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withQueryValidation } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { UserQueryRequest } from '../../index';
import { userQuerySchema } from '../../index';
import { serviceContainer } from '../../index';
import { getCallerAdId } from '../../index';
import { UserQueryApplicationService } from '../../index';
import { IUserRepository } from '../../index';
import { IAuthorizationService } from '../../index';
import { IUserQueryService } from '../../index';
import { CallerIdNotFoundError } from '../../index';

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
        await requirePermission(Permission.UsersRead)(ctx);
        const { role, page, pageSize } = ctx.bindings.validatedQuery;
        const callerId = getCallerAdId(ctx.bindings.user);
        if (!callerId) {
          throw new CallerIdNotFoundError('Caller ID not found in request context');
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