/**
 * @fileoverview GetSnapshotReasons - Azure Function for retrieving snapshot reasons
 * @summary HTTP endpoint for getting all active snapshot reasons
 * @description Handles GET requests to retrieve all active snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetSnapshotReasonsApplicationService } from "../shared/application/services/GetSnapshotReasonsApplicationService";

/**
 * HTTP GET /api/GetSnapshotReasons
 *
 * Returns all active snapshot reasons ordered by display order.
 * Requires authentication.
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request
 * @returns A 200 OK response with snapshot reasons, or an error response
 */
const getSnapshotReasonsHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetSnapshotReasonsApplicationService>('GetSnapshotReasonsApplicationService');
        const reasons = await applicationService.getSnapshotReasons();

        return ok(ctx, {
          reasons: reasons.map(r => r.toJSON())
        });
      });
    });
  },
  {
    genericMessage: "Internal error fetching snapshot reasons",
    showStackInDev: true,
  }
);

export default getSnapshotReasonsHandler;

