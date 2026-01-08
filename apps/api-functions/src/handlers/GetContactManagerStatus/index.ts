/**
 * @fileoverview GetContactManagerStatus - Azure Function for retrieving Contact Manager status
 * @summary Handles the retrieval of current Contact Manager status with proper authorization
 * @description This function returns the current Contact Manager's status and profile information.
 * Only users with ContactManager role can access this endpoint.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ContactManagerApplicationService } from '../../application/services/ContactManagerApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';

/**
 * Azure Function handler for retrieving Contact Manager status.
 * 
 * This function handles the retrieval of Contact Manager status by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID
 * 3. Delegating to ContactManagerApplicationService for business logic and authorization
 * 4. Returning the Contact Manager status
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request
 * @returns Promise that resolves when the Contact Manager status is retrieved
 * @throws {ForbiddenError} when caller lacks Contact Manager privileges
 * @throws {NotFoundError} when Contact Manager profile is not found
 * @throws {ServiceError} when Contact Manager status retrieval fails
 * 
 * @example
 * GET /api/contactManagers/status
 * Response: { "id": "uuid", "userId": "uuid", "email": "user@example.com", "status": "Available", ... }
 */
const getMyStatusFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {

    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.ContactManagersRead)(ctx);
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<ContactManagerApplicationService>('ContactManagerApplicationService');
        const callerId = ctx.bindings.callerId as string;

        const result = await applicationService.getMyContactManagerStatus(callerId);
        ok(ctx, result.toPayload());
      });
    });
  },
  {
    genericMessage: "Internal error fetching Contact Manager status",
    showStackInDev: true,
  }
);

export default getMyStatusFunction;
