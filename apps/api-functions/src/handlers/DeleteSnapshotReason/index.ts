/**
 * @fileoverview DeleteSnapshotReason - Azure Function for deleting snapshot reasons
 * @summary HTTP endpoint for soft deleting snapshot reasons
 * @description Handles DELETE requests to soft delete snapshot reasons
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
import { DeleteSnapshotReasonApplicationService } from '../../index';
import { z } from "zod";

const deleteSchema = z.object({
  id: z.string().uuid("Invalid reason ID format")
});

const deleteSnapshotReasonHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.SnapshotReasonsDelete)(ctx);
        await withBodyValidation(deleteSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<DeleteSnapshotReasonApplicationService>('DeleteSnapshotReasonApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;

          await applicationService.deleteSnapshotReason(callerId, validatedBody.id);

          return ok(ctx, { message: 'Snapshot reason deleted successfully' });
        });
      });
    });
  },
  {
    genericMessage: "Internal error deleting snapshot reason",
    showStackInDev: true,
  }
);

export default deleteSnapshotReasonHandler;

