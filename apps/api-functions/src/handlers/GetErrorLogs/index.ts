/**
 * @fileoverview GetErrorLogs - Azure Function for querying API error logs
 * @summary Retrieves all API error logs with filtering
 * @description HTTP-triggered function that handles error log queries
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { badRequest } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetErrorLogsApplicationService } from '../../application/services/GetErrorLogsApplicationService';
import { GetErrorLogsRequest } from '../../domain/value-objects/GetErrorLogsRequest';
import { GetErrorLogsResponse } from '../../domain/value-objects/GetErrorLogsResponse';

/**
 * HTTP GET /api/error-logs
 *
 * Returns all error logs with optional filtering and pagination.
 * Only user with email containing "shanty.cerdas" may call this endpoint.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are the authorized user (email contains "shanty.cerdas").
 * 2. Supports query parameters for filtering: source, severity, endpoint, resolved, startDate, endDate, limit, offset.
 * 3. Returns a paginated list of error logs with total count and pagination metadata.
 * 4. Use limit and offset for pagination: ?limit=100&offset=0 for first page, ?limit=100&offset=100 for second page, etc.
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response with error logs, or an error response
 */
const getErrorLogsHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.ErrorLogsRead)(ctx);
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetErrorLogsApplicationService>('GetErrorLogsApplicationService');

        const query = req.query || {};
        const request = GetErrorLogsRequest.fromQuery(query);
        const queryParams = request.toQueryParams();
        const { logs, total } = await applicationService.getErrorLogs(queryParams);
        const response = GetErrorLogsResponse.fromLogs(logs, total, queryParams.limit, queryParams.offset);

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

