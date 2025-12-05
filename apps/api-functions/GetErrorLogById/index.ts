/**
 * @fileoverview GetErrorLogById - Azure Function for retrieving a single API error log
 * @summary Retrieves a single API error log by ID
 * @description HTTP-triggered function that handles single error log retrieval
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { requirePermission } from "../shared/middleware/permissions";
import { Permission } from "../shared/domain/enums/Permission";
import { withPathValidation } from "../shared/middleware/validate";
import { ok, badRequest } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetErrorLogsApplicationService } from "../shared/application/services/GetErrorLogsApplicationService";
import { GetErrorLogsResponse } from "../shared/domain/value-objects/GetErrorLogsResponse";
import { getErrorLogByIdSchema } from "../shared/domain/schemas/GetErrorLogByIdSchema";

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

          const validatedParams = (ctx as any).bindings.validatedParams;
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

