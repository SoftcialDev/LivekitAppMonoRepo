/**
 * @fileoverview DeleteContactManager - Azure Function for removing Contact Manager profiles
 * @summary Handles the deletion of Contact Manager profiles with proper authorization
 * @description This function removes a Contact Manager by changing their role to Unassigned,
 * deleting their profile, and logging the action. Only users with Admin or SuperAdmin roles can perform this action.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { requireAdminAccess } from "../shared/middleware/authorization";
import { ok } from "../shared/utils/response";
import { deleteContactManagerSchema } from "../shared/domain/schemas/DeleteContactManagerSchema";
import { DeleteContactManagerRequest } from "../shared/domain/value-objects/DeleteContactManagerRequest";
import { ContactManagerApplicationService } from "../shared/application/services/ContactManagerApplicationService";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";

/**
 * Azure Function handler for deleting Contact Manager profiles.
 * 
 * This function handles the removal of a Contact Manager by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID and validating admin access
 * 3. Validating the path parameter (profileId)
 * 4. Delegating to ContactManagerApplicationService for business logic
 * 5. Returning success confirmation
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request containing the Contact Manager deletion data
 * @returns Promise that resolves when the Contact Manager is deleted
 * @throws {ForbiddenError} when caller lacks admin privileges
 * @throws {BadRequestError} when request validation fails
 * @throws {ServiceError} when Contact Manager deletion fails
 * 
 * @example
 * DELETE /api/contactManagers/{profileId}
 * Response: { "message": "Contact Manager deleted successfully" }
 */
const removeHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requireAdminAccess()(ctx);
        
        // Validate path parameter
        const profileId = ctx.bindingData.id as string;
        const validationResult = deleteContactManagerSchema.safeParse({ profileId });
        
        if (!validationResult.success) {
          ctx.res = {
            status: 400,
            body: { error: "Invalid profile ID format" }
          };
          return;
        }

        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<ContactManagerApplicationService>('ContactManagerApplicationService');
        const request = DeleteContactManagerRequest.fromPayload({ profileId });
        const callerId = ctx.bindings.callerId as string;

        await applicationService.deleteContactManager(request, callerId);
        ok(ctx, { message: "Contact Manager deleted successfully" });
      });
    });
  },
  { genericMessage: "Failed to delete Contact Manager" }
);

export default removeHandler;
