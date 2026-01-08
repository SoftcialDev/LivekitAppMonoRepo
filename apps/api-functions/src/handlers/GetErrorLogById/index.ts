/**
 * @fileoverview GetErrorLogById - Azure Function for retrieving a single API error log
 * @summary Retrieves a single API error log by ID
 * @description HTTP-triggered function that handles single error log retrieval
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth, withErrorHandler, withCallerId, requirePermission, Permission, withPathValidation, ok, badRequest, ServiceContainer, GetErrorLogsApplicationService, GetErrorLogsResponse, getErrorLogByIdSchema, ensureBindings, GetErrorLogByIdParams } from '../../index';

/**
 * HTTP GET /api/error-logs/{id}
 *
 * Returns a single error log by its identifier.
 * Only user with email "shanty" may call this endpoint.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are the authorized user (email: shanty).
 * 2. Validates the error log ID from the path parameter.
 * 3. Retrieves and returns the error log.
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response with the error log, or an error response
 */
const getErrorLogByIdHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.ErrorLogsRead)(ctx);
        await withPathValidation(getErrorLogByIdSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<GetErrorLogsApplicationService>('GetErrorLogsApplicationService');
          const extendedCtx = ensureBindings(ctx);

          const validatedParams = extendedCtx.bindings.validatedParams as GetErrorLogByIdParams;
          const errorLog = await applicationService.getErrorLogById(validatedParams.id);

          if (!errorLog) {
            return badRequest(ctx, 'Error log not found');
          }

          const response = GetErrorLogsResponse.fromLog(errorLog);
          return ok(ctx, response.toSinglePayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal error fetching error log",
    showStackInDev: true,
  }
);

export default getErrorLogByIdHandler;

