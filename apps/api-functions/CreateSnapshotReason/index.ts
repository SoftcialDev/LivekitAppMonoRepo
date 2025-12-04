/**
 * @fileoverview CreateSnapshotReason - Azure Function for creating snapshot reasons
 * @summary HTTP endpoint for creating new snapshot reasons
 * @description Handles POST requests to create new snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { CreateSnapshotReasonRequest } from "../shared/domain/value-objects/CreateSnapshotReasonRequest";
import { CreateSnapshotReasonApplicationService } from "../shared/application/services/CreateSnapshotReasonApplicationService";
import { createSnapshotReasonSchema } from "../shared/domain/schemas/CreateSnapshotReasonSchema";

const createSnapshotReasonHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(createSnapshotReasonSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<CreateSnapshotReasonApplicationService>('CreateSnapshotReasonApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;
          const request = CreateSnapshotReasonRequest.fromBody(validatedBody);

          const response = await applicationService.createSnapshotReason(callerId, request);

          return ok(ctx, response.toJSON());
        });
      });
    });
  },
  {
    genericMessage: "Internal error creating snapshot reason",
    showStackInDev: true,
  }
);

export default createSnapshotReasonHandler;

