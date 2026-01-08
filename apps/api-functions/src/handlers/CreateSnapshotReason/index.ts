/**
 * @fileoverview CreateSnapshotReason - Azure Function for creating snapshot reasons
 * @summary HTTP endpoint for creating new snapshot reasons
 * @description Handles POST requests to create new snapshot reasons
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth, withErrorHandler, withCallerId, requirePermission, Permission, withBodyValidation, ok, ServiceContainer, CreateSnapshotReasonRequest, CreateSnapshotReasonApplicationService, createSnapshotReasonSchema, ensureBindings, CreateSnapshotReasonParams } from '../../index';

const createSnapshotReasonHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.SnapshotReasonsCreate)(ctx);
        await withBodyValidation(createSnapshotReasonSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<CreateSnapshotReasonApplicationService>('CreateSnapshotReasonApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedBody = extendedCtx.bindings.validatedBody as CreateSnapshotReasonParams;
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

