/**
 * @fileoverview GetCameraFailures - Azure Function for querying camera failure logs
 * @summary Retrieves all camera failure logs with filtering
 * @description HTTP-triggered function that handles camera failure log queries
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetCameraFailuresApplicationService } from '../../application/services/GetCameraFailuresApplicationService';
import { GetCameraFailuresRequest } from '../../domain/value-objects/GetCameraFailuresRequest';
import { GetCameraFailuresResponse } from '../../domain/value-objects/GetCameraFailuresResponse';  

/**
 * HTTP GET /api/GetCameraFailures
 *
 * Returns all camera failure logs with optional filtering and pagination.
 * Only users with email starting with "shanty.cerdas" may call this endpoint.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they have the required permission (CameraFailuresRead).
 * 2. Supports query parameters for filtering: stage, userEmail, userAdId, startDate, endDate, limit, offset.
 * 3. Returns a paginated list of camera failure logs with total count and pagination metadata.
 * 4. Use limit and offset for pagination: ?limit=100&offset=0 for first page, ?limit=100&offset=100 for second page, etc.
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response with camera failure logs, or an error response
 */
const getCameraFailuresHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.CameraFailuresRead)(ctx);
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetCameraFailuresApplicationService>('GetCameraFailuresApplicationService');

        const query = req.query || {};
        const request = GetCameraFailuresRequest.fromQuery(query);
        const queryParams = request.toQueryParams();
        const { failures, total } = await applicationService.getCameraFailures(queryParams);
        const response = GetCameraFailuresResponse.fromFailures(failures, total, queryParams.limit, queryParams.offset);

        return ok(ctx, response.toPayload());
      });
    });
  },
  {
    genericMessage: "Internal error fetching camera failure logs",
    showStackInDev: true,
  }
);

export default getCameraFailuresHandler;

