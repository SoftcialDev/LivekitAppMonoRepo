/**
 * @fileoverview GetErrorLogs - Azure Function for querying API error logs
 * @summary Retrieves all API error logs with filtering
 * @description HTTP-triggered function that handles error log queries
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetErrorLogsApplicationService } from "../shared/application/services/GetErrorLogsApplicationService";
import { GetErrorLogsRequest } from "../shared/domain/value-objects/GetErrorLogsRequest";
import { GetErrorLogsResponse } from "../shared/domain/value-objects/GetErrorLogsResponse";

/**
 * HTTP GET /api/error-logs
 *
 * Returns all error logs with optional filtering.
 * Only user with email "shanty" may call this endpoint.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are the authorized user (email: shanty).
 * 2. Supports query parameters for filtering: source, severity, endpoint, resolved, startDate, endDate, limit, offset.
 * 3. Returns a list of error logs matching the criteria.
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response with error logs, or an error response
 */
const getErrorLogsHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetErrorLogsApplicationService>('GetErrorLogsApplicationService');
        const user = (ctx as any).bindings.user;
        const callerEmail = user?.upn || user?.email || '';

        const query = req.query || {};
        const request = GetErrorLogsRequest.fromQuery(query);
        const errorLogs = await applicationService.getErrorLogs(callerEmail, request.toQueryParams());
        const response = GetErrorLogsResponse.fromLogs(errorLogs);

        return ok(ctx, response.toPayload());
      });
    });
  },
  {
    genericMessage: "Internal error fetching error logs",
    showStackInDev: true,
  }
);

export default getErrorLogsHandler;

