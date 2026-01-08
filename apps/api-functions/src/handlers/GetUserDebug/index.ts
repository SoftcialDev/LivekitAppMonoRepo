/**
 * @fileoverview GetUserDebug - Azure Function for getting comprehensive user debug information
 * @summary Returns complete user information including roles, permissions, and profiles
 * @description This endpoint provides comprehensive debugging information about a user,
 * including their basic information, role assignments, effective permissions, Contact Manager
 * profile (if applicable), and supervisor information. Only SuperAdmin users can access this endpoint.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { withQueryValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetUserDebugApplicationService } from '../../application/services/GetUserDebugApplicationService';
import { GetUserDebugRequest } from '../../domain/value-objects/GetUserDebugRequest';
import { getUserDebugSchema, GetUserDebugQuery } from '../../domain/schemas/GetUserDebugSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * Azure Function: GetUserDebug
 *
 * **HTTP GET** `/api/GetUserDebug?userIdentifier={email|azureAdObjectId}`
 *
 * Returns comprehensive debug information about a user including:
 * - User basic information (id, email, fullName, role, etc.)
 * - Role assignments (RBAC roles)
 * - Effective permissions (union of all role permissions)
 * - Contact Manager profile (if user is a Contact Manager)
 * - Supervisor information (if user has a supervisor)
 *
 * **Authorization:**
 * - Requires valid Azure AD token
 * - Requires SuperAdmin role
 *
 * **Query Parameters:**
 * - `userIdentifier` (required): User email or Azure AD Object ID
 *
 * **Response:**
 * ```json
 * {
 *   "user": {
 *     "id": "...",
 *     "azureAdObjectId": "...",
 *     "email": "...",
 *     "fullName": "...",
 *     "role": "ContactManager",
 *     ...
 *   },
 *   "roles": [
 *     {
 *       "roleId": "...",
 *       "roleName": "Contact Manager",
 *       "assignedAt": "..."
 *     }
 *   ],
 *   "permissions": [
 *     {
 *       "code": "streaming_status:read",
 *       "name": "Read streaming status",
 *       "resource": "streaming_status",
 *       "action": "read"
 *     }
 *   ],
 *   "contactManagerProfile": {
 *     "id": "...",
 *     "status": "Available",
 *     ...
 *   },
 *   "supervisor": null
 * }
 * ```
 *
 * **Error Codes:**
 * - 400: Bad request (missing userIdentifier)
 * - 401: Unauthorized (invalid token)
 * - 403: Forbidden (not SuperAdmin)
 * - 404: Not found (user not found)
 * - 500: Internal server error
 */

const getUserDebug: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withQueryValidation(getUserDebugSchema)(ctx, async () => {
          await requirePermission(Permission.SuperAdminsRead)(ctx);
          
          serviceContainer.initialize();

          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;
          const validatedQuery = extendedCtx.bindings.validatedQuery as GetUserDebugQuery;

          const applicationService = serviceContainer.resolve<GetUserDebugApplicationService>(
            'GetUserDebugApplicationService'
          );

          const request = GetUserDebugRequest.fromIdentifier(validatedQuery.userIdentifier);
          const response = await applicationService.getUserDebug(request);

          ok(ctx, response.toPayload());
        });
      });
    });
  },
  {
    genericMessage: 'Failed to get user debug information'
  }
);

export default getUserDebug;

