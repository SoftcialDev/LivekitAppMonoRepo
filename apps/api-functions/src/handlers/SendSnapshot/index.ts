/**
 * @fileoverview SendSnapshot - Azure Function for sending snapshot reports
 * @summary Processes supervisor snapshot reports
 * @description HTTP-triggered function that handles snapshot reports from supervisors
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
import { SendSnapshotRequest } from '../../index';
import { SendSnapshotApplicationService } from '../../index';
import { sendSnapshotSchema } from '../../index';

/**
 * HTTP-triggered Azure Function to process a supervisor's snapshot report.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are a Supervisor.
 * 2. Validates the request body against the schema.
 * 3. Looks up the PSO user by their email address.
 * 4. Decodes the Base64 image and uploads it to blob storage.
 * 5. Persists snapshot metadata in PostgreSQL.
 * 6. Notifies administrators via Teams chat.
 *
 * @param ctx - The Azure Functions execution context
 * @param req - The incoming HTTP request containing snapshot data
 * @returns A 200 OK response with the new `snapshotId`, or an error if validation fails
 */
const sendSnapshotHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(sendSnapshotSchema)(ctx, async () => {
          await requirePermission(Permission.SnapshotsCreate)(ctx);
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<SendSnapshotApplicationService>('SendSnapshotApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;
          const request = SendSnapshotRequest.fromBody(callerId, validatedBody);

          const response = await applicationService.sendSnapshot(callerId, request);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal error processing snapshot",
    showStackInDev: true,
  }
);

export default sendSnapshotHandler;
