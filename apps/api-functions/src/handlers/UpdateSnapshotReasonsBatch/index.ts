/**
 * @fileoverview UpdateSnapshotReasonsBatch - Azure Function for batch updating snapshot reasons
 * @summary HTTP endpoint for batch updating snapshot reasons
 * @description Handles PUT requests to update multiple snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { withBodyValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { UpdateSnapshotReasonsBatchApplicationService } from '../../application/services/UpdateSnapshotReasonsBatchApplicationService';
import { updateSnapshotReasonsBatchSchema, UpdateSnapshotReasonsBatchParams } from '../../domain/schemas/UpdateSnapshotReasonsBatchSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

const updateSnapshotReasonsBatchHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(updateSnapshotReasonsBatchSchema)(ctx, async () => {
          await requirePermission(Permission.SnapshotReasonsUpdate)(ctx);
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<UpdateSnapshotReasonsBatchApplicationService>('UpdateSnapshotReasonsBatchApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedBody = extendedCtx.bindings.validatedBody as UpdateSnapshotReasonsBatchParams;

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

