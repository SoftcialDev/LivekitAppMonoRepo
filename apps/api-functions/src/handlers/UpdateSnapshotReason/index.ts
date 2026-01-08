/**
 * @fileoverview UpdateSnapshotReason - Azure Function for updating snapshot reasons
 * @summary HTTP endpoint for updating snapshot reasons
 * @description Handles PUT requests to update snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth, withErrorHandler, withCallerId, withBodyValidation, ok, ServiceContainer, UpdateSnapshotReasonApplicationService, updateSnapshotReasonSchema, ensureBindings, UpdateSnapshotReasonParams } from '../../index';

const updateSnapshotReasonHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(updateSnapshotReasonSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<UpdateSnapshotReasonApplicationService>('UpdateSnapshotReasonApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedBody = extendedCtx.bindings.validatedBody as UpdateSnapshotReasonParams;
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

