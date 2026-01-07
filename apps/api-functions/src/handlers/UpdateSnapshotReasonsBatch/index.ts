/**
 * @fileoverview UpdateSnapshotReasonsBatch - Azure Function for batch updating snapshot reasons
 * @summary HTTP endpoint for batch updating snapshot reasons
 * @description Handles PUT requests to update multiple snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { withBodyValidation } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { UpdateSnapshotReasonsBatchApplicationService } from '../../index';
import { updateSnapshotReasonsBatchSchema } from '../../index';

const updateSnapshotReasonsBatchHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(updateSnapshotReasonsBatchSchema)(ctx, async () => {
          await requirePermission(Permission.SnapshotReasonsUpdate)(ctx);
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

