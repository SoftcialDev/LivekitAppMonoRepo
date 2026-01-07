/**
 * @fileoverview ResolveErrorLog - Azure Function for resolving API error logs
 * @summary Marks an API error log as resolved
 * @description HTTP-triggered function that handles error log resolution
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { withPathValidation } from '../../index';
import { ok, badRequest } from '../../index';
import { ServiceContainer } from '../../index';
import { GetErrorLogsApplicationService } from '../../index';
import { getErrorLogByIdSchema } from '../../index';

/**
 * HTTP PATCH /api/error-logs/{id}/resolve
 *
 * Marks an error log as resolved.
 * Only user with email "shanty" may call this endpoint.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are the authorized user (email: shanty).
 * 2. Validates the error log ID from the path parameter.
 * 3. Marks the error log as resolved with the caller's ID.
 * 4. Returns success response.
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response, or an error response
 */
const resolveErrorLogHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.ErrorLogsResolve)(ctx);
        await withPathValidation(getErrorLogByIdSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetErrorLogsApplicationService>('GetErrorLogsApplicationService');
        const callerId = ctx.bindings.callerId as string;

          const validatedParams = (ctx as any).bindings.validatedParams;
          await applicationService.markAsResolved(validatedParams.id, callerId);

          return ok(ctx, { message: 'Error log marked as resolved' });
        });
      });
    });
  },
  {
    genericMessage: "Internal error resolving error log",
    showStackInDev: true,
  }
);

export default resolveErrorLogHandler;

