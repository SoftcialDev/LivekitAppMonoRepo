/**
 * @fileoverview DeleteErrorLogs - Azure Function for deleting API error logs
 * @summary Deletes API error logs (single or batch)
 * @description HTTP-triggered function that handles error log deletion
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { withBodyValidation } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { DeleteErrorLogsApplicationService } from '../../index';
import { DeleteErrorLogsRequest } from '../../index';
import { deleteErrorLogsSchema } from '../../index';

/**
 * HTTP DELETE /api/error-logs
 *
 * Deletes error logs by ID, batch of IDs, or all error logs.
 * Only user with email "shanty" may call this endpoint.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are the authorized user (email: shanty).
 * 2. Accepts request body with `ids` field (single string or array of strings) or `deleteAll: true`.
 * 3. Deletes the specified error log(s) or all error logs.
 * 4. Returns success response.
 *
 * Request body examples:
 * - Single ID: `{ "ids": "abc-123-def" }`
 * - Batch: `{ "ids": ["abc-123-def", "xyz-456-ghi"] }`
 * - Delete All: `{ "deleteAll": true }`
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response, or an error response
 */
const deleteErrorLogsHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.ErrorLogsDelete)(ctx);
        await withBodyValidation(deleteErrorLogsSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<DeleteErrorLogsApplicationService>('DeleteErrorLogsApplicationService');
          const validatedBody = (ctx as any).bindings.validatedBody;
          const request = DeleteErrorLogsRequest.fromBody(validatedBody);

          if (request.deleteAll) {
            await applicationService.deleteAll();
            return ok(ctx, {
              message: 'Successfully deleted all error logs',
              deletedAll: true
            });
          }

          await applicationService.deleteErrorLogs(request.ids);

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

