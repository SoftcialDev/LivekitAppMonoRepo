import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { withPathValidation } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { DeleteRecordingRequest } from '../../index';
import { DeleteRecordingApplicationService } from '../../index';
import { deleteRecordingSchema } from '../../index';

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
          const callerId = ctx.bindings.callerId as string;

          // Get validated params from bindings
          const validatedParams = (ctx as any).bindings.validatedParams;
          
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
