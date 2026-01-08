/**
 * @fileoverview DeleteSuperAdmin - Azure Function for removing Super Admin role
 * @summary Handles the removal of Super Admin role with proper authorization
 * @description This function removes Super Admin role by changing the user's role to Unassigned,
 * and logging the action. Only users with SuperAdmin role can perform this action.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { deleteSuperAdminSchema } from '../../domain/schemas/DeleteSuperAdminSchema';
import { DeleteSuperAdminRequest } from '../../domain/value-objects/DeleteSuperAdminRequest';
import { SuperAdminApplicationService } from '../../application/services/SuperAdminApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';

/**
 * Azure Function handler for removing Super Admin role.
 * 
 * This function handles the removal of Super Admin role by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID and validating Super Admin access
 * 3. Validating the path parameter (userId)
 * 4. Delegating to SuperAdminApplicationService for business logic
 * 5. Returning success confirmation
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request containing the Super Admin deletion data
 * @returns Promise that resolves when the Super Admin role is removed
 * @throws {ForbiddenError} when caller lacks Super Admin privileges
 * @throws {BadRequestError} when request validation fails
 * @throws {ServiceError} when Super Admin deletion fails
 * 
 * @example
 * DELETE /api/superAdmins/{userId}
 * Response: { "message": "Super Admin role removed successfully" }
 */
const removeHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.SuperAdminsDelete)(ctx);
        
        // Validate path parameter
        const userId = ctx.bindingData.id as string;
        const validationResult = deleteSuperAdminSchema.safeParse({ userId });
        
        if (!validationResult.success) {
          ctx.res = {
            status: 400,
            body: { error: "Invalid user ID format" }
          };
          return;
        }

        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<SuperAdminApplicationService>('SuperAdminApplicationService');
        const request = DeleteSuperAdminRequest.fromPayload({ userId });
        const callerId = ctx.bindings.callerId as string;

        await applicationService.deleteSuperAdmin(request, callerId);
        ok(ctx, { message: "Super Admin role removed successfully" });
      });
    });
  },
  { genericMessage: "Failed to remove Super Admin role" }
);

export default removeHandler;
