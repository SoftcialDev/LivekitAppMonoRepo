import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetSnapshotsRequest } from '../../domain/value-objects/GetSnapshotsRequest';
import { GetSnapshotsApplicationService } from '../../application/services/GetSnapshotsApplicationService';

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
        await requirePermission(Permission.SnapshotsRead)(ctx);
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
