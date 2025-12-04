/**
 * @fileoverview UpdateSnapshotReasonsBatch - Azure Function for batch updating snapshot reasons
 * @summary HTTP endpoint for batch updating snapshot reasons
 * @description Handles PUT requests to update multiple snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { UpdateSnapshotReasonsBatchApplicationService } from "../shared/application/services/UpdateSnapshotReasonsBatchApplicationService";
import { updateSnapshotReasonsBatchSchema } from "../shared/domain/schemas/UpdateSnapshotReasonsBatchSchema";

const updateSnapshotReasonsBatchHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(updateSnapshotReasonsBatchSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<UpdateSnapshotReasonsBatchApplicationService>('UpdateSnapshotReasonsBatchApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;

          await applicationService.updateSnapshotReasonsBatch(callerId, validatedBody.reasons);

          return ok(ctx, { message: 'Snapshot reasons updated successfully' });
        });
      });
    });
  },
  {
    genericMessage: "Internal error updating snapshot reasons",
    showStackInDev: true,
  }
);

export default updateSnapshotReasonsBatchHandler;

