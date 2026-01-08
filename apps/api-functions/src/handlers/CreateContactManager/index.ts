/**
 * @fileoverview CreateContactManager - Azure Function for promoting users to Contact Manager role
 * @summary Handles the creation of Contact Manager profiles with proper authorization
 * @description This function promotes a user to Contact Manager role, including Azure AD app role assignment,
 * database profile creation, and audit logging. Only users with Admin or SuperAdmin roles can perform this action.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withBodyValidation } from '../../middleware/validate';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { createContactManagerSchema } from '../../domain/schemas/CreateContactManagerSchema';
import { CreateContactManagerRequest } from '../../domain/value-objects/CreateContactManagerRequest';
import { ContactManagerApplicationService } from '../../application/services/ContactManagerApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';

/**
 * Azure Function handler for creating Contact Manager profiles.
 * 
 * This function handles the promotion of a user to Contact Manager role by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID and validating admin access
 * 3. Validating the request body (email and status)
 * 4. Delegating to ContactManagerApplicationService for business logic
 * 5. Returning the created Contact Manager profile
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request containing the Contact Manager creation data
 * @returns Promise that resolves when the Contact Manager is created
 * @throws {ForbiddenError} when caller lacks admin privileges
 * @throws {BadRequestError} when request validation fails
 * @throws {ServiceError} when Contact Manager creation fails
 * 
 * @example
 * POST /api/contactManagers
 * Body: { "email": "user@example.com", "status": "Active" }
 * Response: { "id": "uuid", "userId": "uuid", "status": "Active", ... }
 */
const create: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.ContactManagersCreate)(ctx);
        await withBodyValidation(createContactManagerSchema)(ctx, async () => {
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<ContactManagerApplicationService>('ContactManagerApplicationService');
          const request = CreateContactManagerRequest.fromBody(ctx.bindings.validatedBody);
          const callerId = ctx.bindings.callerId as string;

          const result = await applicationService.createContactManager(request, callerId);
          ok(ctx, result.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to add Contact Manager" }
);

export default create;
