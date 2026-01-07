/**
 * @fileoverview UpdateSnapshotReason - Azure Function for updating snapshot reasons
 * @summary HTTP endpoint for updating snapshot reasons
 * @description Handles PUT requests to update snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { withBodyValidation } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { UpdateSnapshotReasonApplicationService } from '../../index';
import { updateSnapshotReasonSchema } from '../../index';

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

