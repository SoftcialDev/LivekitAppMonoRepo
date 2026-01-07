/**
 * @fileoverview CreateSuperAdmin - Azure Function for promoting users to Super Admin role
 * @summary Handles the creation of Super Admin profiles with proper authorization
 * @description This function promotes a user to Super Admin role, including Azure AD app role assignment,
 * database profile creation, and audit logging. Only users with SuperAdmin role can perform this action.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withBodyValidation } from '../../index';
import { withCallerId } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok } from '../../index';
import { createSuperAdminSchema } from '../../index';
import { CreateSuperAdminRequest } from '../../index';
import { SuperAdminApplicationService } from '../../index';
import { serviceContainer } from '../../index';

/**
 * Azure Function handler for creating Super Admin profiles.
 * 
 * This function handles the promotion of a user to Super Admin role by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID and validating Super Admin access
 * 3. Validating the request body (email)
 * 4. Delegating to SuperAdminApplicationService for business logic
 * 5. Returning the created Super Admin profile
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request containing the Super Admin creation data
 * @returns Promise that resolves when the Super Admin is created
 * @throws {ForbiddenError} when caller lacks Super Admin privileges
 * @throws {BadRequestError} when request validation fails
 * @throws {ServiceError} when Super Admin creation fails
 * 
 * @example
 * POST /api/superAdmins
 * Body: { "email": "user@example.com" }
 * Response: { "id": "uuid", "userId": "uuid", ... }
 */
const create: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.SuperAdminsCreate)(ctx);
        await withBodyValidation(createSuperAdminSchema)(ctx, async () => {
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<SuperAdminApplicationService>('SuperAdminApplicationService');
          const request = CreateSuperAdminRequest.fromBody(ctx.bindings.validatedBody);
          const callerId = ctx.bindings.callerId as string;

          const result = await applicationService.createSuperAdmin(request, callerId);
          ok(ctx, result.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to add Super Admin" }
);

export default create;
