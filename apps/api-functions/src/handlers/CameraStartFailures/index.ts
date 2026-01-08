/**
 * @fileoverview CameraStartFailures - Azure Function to persist aggregated camera-start failure reports
 * @summary Accepts a single POST only when camera/video start flow fails on the client
 * @description Authenticates caller, validates payload, and stores a compact failure record.
 */

import { Context } from "@azure/functions";
import { withAuth, withErrorHandler, withBodyValidation, withCallerId, requirePermission, Permission, ok, cameraStartFailureSchema, serviceContainer, getCallerAdId, ICameraFailureService, ensureBindings, CameraStartFailureRequest } from '../../index';

const handler = withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    await withCallerId(ctx, async () => {
      await requirePermission(Permission.CameraFailuresCreate)(ctx);
      
      serviceContainer.initialize();

      const failureService = serviceContainer.resolve<ICameraFailureService>(
        "CameraFailureService"
      );

      await withBodyValidation(cameraStartFailureSchema)(ctx, async () => {
        const extendedCtx = ensureBindings(ctx);
        const claims = extendedCtx.bindings.user;
        const userAdId = claims ? getCallerAdId(claims) : undefined;
        const userEmail = claims?.upn ?? claims?.preferred_username ?? undefined;
        const validatedBody = extendedCtx.bindings.validatedBody as CameraStartFailureRequest;

        if (!userAdId) {
          throw new Error('User ID not found in claims');
        }

        await failureService.logStartFailure({
          userAdId,
          userEmail,
          ...validatedBody,
        });

        ok(ctx, { stored: true });
      });
    });
  });
});

export default handler;


