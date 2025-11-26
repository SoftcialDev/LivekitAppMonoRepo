/**
 * @fileoverview DeleteErrorLogs - Azure Function for deleting API error logs
 * @summary Deletes API error logs (single or batch)
 * @description HTTP-triggered function that handles error log deletion
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { DeleteErrorLogsApplicationService } from "../shared/application/services/DeleteErrorLogsApplicationService";
import { DeleteErrorLogsRequest } from "../shared/domain/value-objects/DeleteErrorLogsRequest";
import { deleteErrorLogsSchema } from "../shared/domain/schemas/DeleteErrorLogsSchema";

/**
 * HTTP DELETE /api/error-logs
 *
 * Deletes error logs by ID or batch of IDs.
 * Only user with email "shanty" may call this endpoint.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are the authorized user (email: shanty).
 * 2. Accepts request body with `ids` field (single string or array of strings).
 * 3. Deletes the specified error log(s).
 * 4. Returns success response.
 *
 * Request body examples:
 * - Single ID: `{ "ids": "abc-123-def" }`
 * - Batch: `{ "ids": ["abc-123-def", "xyz-456-ghi"] }`
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response, or an error response
 */
const deleteErrorLogsHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(deleteErrorLogsSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<DeleteErrorLogsApplicationService>('DeleteErrorLogsApplicationService');
          const user = (ctx as any).bindings.user;
          
          // Extract email from JWT token (try multiple fields)
          const callerEmail = (user?.upn || user?.email || user?.preferred_username || '').toLowerCase();
          
          if (!callerEmail) {
            return badRequest(ctx, 'Email not found in authentication token');
          }

          const validatedBody = (ctx as any).bindings.validatedBody;
          const request = DeleteErrorLogsRequest.fromBody(validatedBody);

          await applicationService.deleteErrorLogs(callerEmail, request.ids);

          return ok(ctx, {
            message: `Successfully deleted ${request.ids.length} error log(s)`,
            deletedIds: request.ids
          });
        });
      });
    });
  },
  {
    genericMessage: "Internal error deleting error logs",
    showStackInDev: true,
  }
);

export default deleteErrorLogsHandler;

