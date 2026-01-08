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
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withQueryValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { UserQueryRequest } from '../../domain/value-objects/UserQueryRequest';
import { userQuerySchema } from '../../domain/schemas/UserQuerySchema';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';
import { getCallerAdId } from '../../utils/authHelpers';
import { UserQueryApplicationService } from '../../application/services/UserQueryApplicationService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { IUserQueryService } from '../../domain/interfaces/IUserQueryService';
import { CallerIdNotFoundError } from '../../domain/errors/MiddlewareErrors';
import { ensureBindings } from '../../domain/types/ContextBindings';

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
        const extendedCtx = ensureBindings(ctx);
        const { role, page, pageSize } = extendedCtx.bindings.validatedQuery as { role?: string; page?: string; pageSize?: string };
        
        if (!extendedCtx.bindings.user) {
          throw new CallerIdNotFoundError('User not found in request context');
        }
        
        const callerId = getCallerAdId(extendedCtx.bindings.user);
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