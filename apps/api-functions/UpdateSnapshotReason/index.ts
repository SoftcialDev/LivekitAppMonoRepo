/**
 * @fileoverview UpdateSnapshotReason - Azure Function for updating snapshot reasons
 * @summary HTTP endpoint for updating snapshot reasons
 * @description Handles PUT requests to update snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { UpdateSnapshotReasonApplicationService } from "../shared/application/services/UpdateSnapshotReasonApplicationService";
import { updateSnapshotReasonSchema } from "../shared/domain/schemas/UpdateSnapshotReasonSchema";

const updateSnapshotReasonHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(updateSnapshotReasonSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<UpdateSnapshotReasonApplicationService>('UpdateSnapshotReasonApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;
          const { id, ...updateData } = validatedBody;

          const response = await applicationService.updateSnapshotReason(callerId, id, updateData);

          return ok(ctx, response.toJSON());
        });
      });
    });
  },
  {
    genericMessage: "Internal error updating snapshot reason",
    showStackInDev: true,
  }
);

export default updateSnapshotReasonHandler;

