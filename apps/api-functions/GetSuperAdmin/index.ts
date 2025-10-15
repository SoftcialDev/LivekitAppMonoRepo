/**
 * @fileoverview GetSuperAdmin - Azure Function for retrieving Super Admin list
 * @summary Handles the retrieval of Super Admin profiles with proper authorization
 * @description This function lists all Super Admin profiles with their user information.
 * Only users with SuperAdmin role can access this endpoint.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { ok } from "../shared/utils/response";
import { SuperAdminApplicationService } from "../shared/application/services/SuperAdminApplicationService";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";

/**
 * Azure Function handler for retrieving Super Admin list.
 * 
 * This function handles the retrieval of Super Admin profiles by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID and validating Super Admin access
 * 3. Delegating to SuperAdminApplicationService for business logic
 * 4. Returning the list of Super Admins
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request
 * @returns Promise that resolves when the Super Admin list is retrieved
 * @throws {ForbiddenError} when caller lacks Super Admin privileges
 * @throws {ServiceError} when Super Admin retrieval fails
 * 
 * @example
 * GET /api/superAdmins
 * Response: { "superAdmins": [{ "id": "uuid", "userId": "uuid", "email": "user@example.com", ... }] }
 */
const getAllSuperAdmins: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<SuperAdminApplicationService>('SuperAdminApplicationService');
        const callerId = ctx.bindings.callerId as string;

        const result = await applicationService.listSuperAdmins(callerId);
        ok(ctx, result.toPayload());
      });
    });
  },
  { genericMessage: "Failed to fetch Super Admins" }
);

export default getAllSuperAdmins;
