/**
 * @fileoverview UpdateContactManagerStatus - Azure Function for updating Contact Manager status
 * @summary Handles the update of Contact Manager status with proper authorization
 * @description This function allows Contact Managers to update their own status.
 * Only users with ContactManager role can access this endpoint.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withBodyValidation } from '../../middleware/validate';
import { withCallerId } from '../../middleware/callerId';
import { ok } from '../../utils/response';
import { updateContactManagerStatusSchema } from '../../domain/schemas/UpdateContactManagerStatusSchema';
import { UpdateContactManagerStatusRequest } from '../../domain/value-objects/UpdateContactManagerStatusRequest';
import { ContactManagerApplicationService } from '../../application/services/ContactManagerApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';

/**
 * Azure Function handler for updating Contact Manager status.
 * 
 * This function handles the update of Contact Manager status by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID and validating Contact Manager access
 * 3. Validating the request body (status)
 * 4. Delegating to ContactManagerApplicationService for business logic
 * 5. Returning the updated Contact Manager status
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request containing the status update data
 * @returns Promise that resolves when the status is updated
 * @throws {ForbiddenError} when caller lacks Contact Manager privileges
 * @throws {BadRequestError} when request validation fails
 * @throws {ServiceError} when status update fails
 * 
 * @example
 * POST /api/contact-managers/me/status
 * Body: { "status": "Available" }
 * Response: { "id": "uuid", "userId": "uuid", "status": "Available", ... }
 */
const updateMyStatusFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {

    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(updateContactManagerStatusSchema)(ctx, async () => {
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<ContactManagerApplicationService>('ContactManagerApplicationService');
          const request = UpdateContactManagerStatusRequest.fromBody(ctx.bindings.validatedBody);
          const callerId = ctx.bindings.callerId as string;

          const result = await applicationService.updateMyContactManagerStatus(request, callerId);
          ok(ctx, result.toPayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal error updating Contact Manager status",
    showStackInDev: true,
  }
);

export default updateMyStatusFunction;
