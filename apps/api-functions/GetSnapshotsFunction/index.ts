import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetSnapshotsRequest } from "../shared/domain/value-objects/GetSnapshotsRequest";
import { GetSnapshotsApplicationService } from "../shared/application/services/GetSnapshotsApplicationService";

/**
 * HTTP GET /api/snapshots
 *
 * Returns all snapshot reports, newest first.
 * Only users with Admin or SuperAdmin roles may call this endpoint.
 *
 * @remarks
 * 1. Authenticates the caller via JWT (On-Behalf-Of).  
 * 2. Extracts caller ID from token.  
 * 3. Authorizes the caller (Admin or SuperAdmin only).  
 * 4. Retrieves all snapshots with supervisor and PSO relations.  
 * 5. Returns `{ reports: SnapshotReport[] }` on success.
 *
 * @param ctx - The Azure Functions execution context.
 * @param req - The incoming HTTP request.
 * @returns A 200 OK response with `{ reports }`, or error response.
 */
const getSnapshotsFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetSnapshotsApplicationService>('GetSnapshotsApplicationService');
        const callerId = ctx.bindings.callerId as string;

        const request = GetSnapshotsRequest.fromCallerId(callerId);
        const response = await applicationService.getSnapshots(callerId, request);

        return ok(ctx, response.toPayload());
      });
    });
  },
  {
    genericMessage: "Internal error fetching snapshots",
    showStackInDev: true,
  }
);

export default getSnapshotsFunction;
