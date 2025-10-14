/**
 * @fileoverview ContactManagersForm - Azure Function for contact manager form submissions
 * @description Allows authenticated users to submit contact manager forms with image uploads and chat notifications
 */

import { Context, HttpRequest } from "@azure/functions";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withAuth } from "../shared/middleware/auth";
import { withBodyValidation } from "../shared/middleware/validate";
import { withCallerId } from "../shared/middleware/callerId";
import { ok } from "../shared/utils/response";
import { contactManagerFormSchema } from "../shared/domain/schemas/ContactManagerFormSchema";
import { ContactManagerFormRequest } from "../shared/domain/value-objects/ContactManagerFormRequest";
import { ContactManagerFormApplicationService } from "../shared/application/services/ContactManagerFormApplicationService";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";

/**
 * Azure Function: ContactManagersForm
 *
 * HTTP POST /api/ContactManagersForm
 *
 * Allows authenticated users to submit contact manager forms with image uploads
 * and automatic chat notifications to the Contact Managers group.
 *
 * Workflow:
 * 1. Validate JWT via `withAuth`, populating `ctx.bindings.user`.
 * 2. Extract caller ID via `withCallerId`, populating `ctx.bindings.callerId`.
 * 3. Validate request body against Zod schema.
 * 4. Create ContactManagerFormRequest from validated body.
 * 5. Execute application service to handle business logic.
 * 6. Return `{ formId: string }` indicating the created form ID.
 *
 * @param ctx - Azure Function execution context.
 * @param req - HTTP request object.
 * @returns 200 OK with `{ formId: string }` if successful.
 * @throws 401 Unauthorized if JWT is missing, invalid, or user not authorized.
 * @throws 400 Bad Request if validation or business rules fail.
 */
const contactManagersFormFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(contactManagerFormSchema)(ctx, async () => {
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<ContactManagerFormApplicationService>('ContactManagerFormApplicationService');
          const request = ContactManagerFormRequest.fromBody(ctx.bindings.validatedBody);
          const callerId = ctx.bindings.callerId as string;
          const token = (req.headers.authorization || "").split(" ")[1];

          const result = await applicationService.processForm(request, callerId, token);
          ok(ctx, result.toPayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal error processing contact manager form",
    showStackInDev: true,
  }
);

export default contactManagersFormFunction;
