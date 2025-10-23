/**
 * @fileoverview CameraStartFailures - Azure Function to persist aggregated camera-start failure reports
 * @summary Accepts a single POST only when camera/video start flow fails on the client
 * @description Authenticates caller, validates payload, and stores a compact failure record.
 */

import { Context } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { cameraStartFailureSchema } from "../shared/domain/schemas/CameraStartFailureSchema";
import { serviceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { getCallerAdId } from "../shared/utils/authHelpers";
import { ICameraFailureService } from "../shared/domain/interfaces/ICameraFailureService";

const handler = withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
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

export default handler;


