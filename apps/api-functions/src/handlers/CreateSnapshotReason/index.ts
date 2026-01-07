/**
 * @fileoverview CreateSnapshotReason - Azure Function for creating snapshot reasons
 * @summary HTTP endpoint for creating new snapshot reasons
 * @description Handles POST requests to create new snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { withBodyValidation } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { CreateSnapshotReasonRequest } from '../../index';
import { CreateSnapshotReasonApplicationService } from '../../index';
import { createSnapshotReasonSchema } from '../../index';

const createSnapshotReasonHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.SnapshotReasonsCreate)(ctx);
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

