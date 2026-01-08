import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { withPathValidation } from '../../middleware/validate';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { DeleteRecordingRequest } from '../../domain/value-objects/DeleteRecordingRequest';
import { DeleteRecordingApplicationService } from '../../application/services/DeleteRecordingApplicationService';
import { deleteRecordingSchema, DeleteRecordingParams } from '../../domain/schemas/DeleteRecordingSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * Azure Function HTTP trigger to delete a recording by id.
 *
 * @route DELETE /api/recordings/{id}
 *
 * Security:
 * - Caller must be authenticated via `withAuth`.
 * - Only users with role SuperAdmin are authorized.
 *
 * Behavior:
 * - Deletes the blob from Azure Blob Storage (when path can be determined).
 * - Deletes the DB row for the session.
 * - Returns a summary indicating blob and DB deletion outcome.
 */
const deleteRecordingFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.RecordingsDelete)(ctx);
        await withPathValidation(deleteRecordingSchema)(ctx, async () => {
          // Initialize service container
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          // Resolve application service
          const applicationService = serviceContainer.resolve<DeleteRecordingApplicationService>('DeleteRecordingApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          // Get validated params from bindings
          const validatedParams = extendedCtx.bindings.validatedParams as DeleteRecordingParams;
          
          // Create request object
          const request = DeleteRecordingRequest.fromParams(validatedParams);

          // Execute deletion
          const response = await applicationService.deleteRecording(callerId, request);

          // Return response
          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  { genericMessage: "Failed to delete recording" }
);

export default deleteRecordingFunction;
