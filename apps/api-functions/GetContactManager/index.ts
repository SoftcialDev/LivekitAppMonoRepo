/**
 * @fileoverview GetContactManager - Azure Function for retrieving Contact Manager list
 * @summary Handles the retrieval of Contact Manager profiles with proper authorization
 * @description This function lists all Contact Manager profiles with their status and user information.
 * Admin, SuperAdmin, and Employee roles can access this endpoint.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { ok } from "../shared/utils/response";
import { ContactManagerApplicationService } from "../shared/application/services/ContactManagerApplicationService";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";

/**
 * Azure Function handler for retrieving Contact Manager list.
 * 
 * This function handles the retrieval of Contact Manager profiles by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID
 * 3. Delegating to ContactManagerApplicationService for business logic and authorization
 * 4. Returning the list of Contact Managers
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request
 * @returns Promise that resolves when the Contact Manager list is retrieved
 * @throws {ForbiddenError} when caller lacks appropriate privileges
 * @throws {ServiceError} when Contact Manager retrieval fails
 * 
 * @example
 * GET /api/contactManagers
 * Response: { "contactManagers": [{ "id": "uuid", "email": "user@example.com", ... }] }
 */
const getAll: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<ContactManagerApplicationService>('ContactManagerApplicationService');
        const callerId = ctx.bindings.callerId as string;

        const result = await applicationService.listContactManagers(callerId);
        ok(ctx, result.toPayload());
      });
    });
  },
  { genericMessage: "Failed to fetch Contact Managers" }
);

export default getAll;
