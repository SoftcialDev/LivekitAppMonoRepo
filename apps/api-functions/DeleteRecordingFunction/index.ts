import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withPathValidation } from "../shared/middleware/pathValidation";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { DeleteRecordingRequest } from "../shared/domain/value-objects/DeleteRecordingRequest";
import { DeleteRecordingApplicationService } from "../shared/application/services/DeleteRecordingApplicationService";
import { deleteRecordingSchema } from "../shared/domain/schemas/DeleteRecordingSchema";

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
        await withPathValidation(ctx, deleteRecordingSchema, async (validatedParams) => {
          // Initialize service container
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          // Resolve application service
          const applicationService = serviceContainer.resolve<DeleteRecordingApplicationService>('DeleteRecordingApplicationService');
          const callerId = ctx.bindings.callerId as string;

          // Create request object
          const request = DeleteRecordingRequest.fromParams(validatedParams as unknown as { id: string });

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
