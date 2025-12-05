/**
 * @fileoverview DeleteSnapshotReason - Azure Function for deleting snapshot reasons
 * @summary HTTP endpoint for soft deleting snapshot reasons
 * @description Handles DELETE requests to soft delete snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { requirePermission } from "../shared/middleware/permissions";
import { Permission } from "../shared/domain/enums/Permission";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { DeleteSnapshotReasonApplicationService } from "../shared/application/services/DeleteSnapshotReasonApplicationService";
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

