/**
 * @fileoverview CameraStartFailures - Azure Function to persist aggregated camera-start failure reports
 * @summary Accepts a single POST only when camera/video start flow fails on the client
 * @description Authenticates caller, validates payload, and stores a compact failure record.
 */

import { Context } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withBodyValidation } from '../../index';
import { withCallerId } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok } from '../../index';
import { cameraStartFailureSchema } from '../../index';
import { serviceContainer } from '../../index';
import { getCallerAdId } from '../../index';
import { ICameraFailureService } from '../../index';

const handler = withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    await withCallerId(ctx, async () => {
      await requirePermission(Permission.CameraFailuresCreate)(ctx);
      
      serviceContainer.initialize();

      const failureService = serviceContainer.resolve<ICameraFailureService>(
        "CameraFailureService"
      );

      await withBodyValidation(cameraStartFailureSchema)(ctx, async () => {
        const claims = (ctx as any).bindings?.user;
        const userAdId = getCallerAdId(claims);
        const userEmail = claims?.upn ?? claims?.preferred_username ?? undefined;

        await failureService.logStartFailure({
          userAdId,
          userEmail,
          ...(ctx as any).bindings.validatedBody,
        });

        ok(ctx, { stored: true });
      });
    });
  });
});

export default handler;


