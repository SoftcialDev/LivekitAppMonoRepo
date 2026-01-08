/**
 * @fileoverview SendSnapshot - Azure Function for sending snapshot reports
 * @summary Processes supervisor snapshot reports
 * @description HTTP-triggered function that handles snapshot reports from supervisors
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
import { SendSnapshotRequest } from '../../domain/value-objects/SendSnapshotRequest';
import { SendSnapshotApplicationService } from '../../application/services/SendSnapshotApplicationService';
import { sendSnapshotSchema, SendSnapshotParams } from '../../domain/schemas/SendSnapshotSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

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
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedBody = extendedCtx.bindings.validatedBody as SendSnapshotParams;
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
