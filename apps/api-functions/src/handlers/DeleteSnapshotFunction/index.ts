import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { withPathValidation } from '../../middleware/validate';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { DeleteSnapshotRequest } from '../../domain/value-objects/DeleteSnapshotRequest';
import { DeleteSnapshotApplicationService } from '../../application/services/DeleteSnapshotApplicationService';
import { deleteSnapshotSchema, DeleteSnapshotParams } from '../../domain/schemas/DeleteSnapshotSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * HTTP DELETE /api/snapshots/{id}
 *
 * Deletes a single snapshot report by its ID.
 * Only users with Admin or SuperAdmin roles may call this endpoint.
 *
 * @remarks
 * 1. Authenticates the caller via JWT (On-Behalf-Of).  
 * 2. Extracts caller ID from token.  
 * 3. Validates the `id` route parameter.  
 * 4. Authorizes the caller (Admin or SuperAdmin only).  
 * 5. Deletes the snapshot and optionally its blob.  
 * 6. Returns `{ deletedId: string, message: string }` on success.
 *
 * @param ctx - The Azure Functions execution context.
 * @param req - The incoming HTTP request.
 * @returns A 200 OK response with `{ deletedId, message }`, or error response.
 */
const deleteSnapshotFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.SnapshotsDelete)(ctx);
        await withPathValidation(deleteSnapshotSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<DeleteSnapshotApplicationService>('DeleteSnapshotApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedParams = extendedCtx.bindings.validatedParams as DeleteSnapshotParams;
          const request = DeleteSnapshotRequest.fromParams(callerId, validatedParams);

          const response = await applicationService.deleteSnapshot(callerId, request);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal error deleting snapshot",
    showStackInDev: true,
  }
);

export default deleteSnapshotFunction;
