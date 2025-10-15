/**
 * @fileoverview SendSnapshot - Azure Function for sending snapshot reports
 * @summary Processes supervisor snapshot reports
 * @description HTTP-triggered function that handles snapshot reports from supervisors
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { SendSnapshotRequest } from "../shared/domain/value-objects/SendSnapshotRequest";
import { SendSnapshotApplicationService } from "../shared/application/services/SendSnapshotApplicationService";
import { sendSnapshotSchema } from "../shared/domain/schemas/SendSnapshotSchema";

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
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<SendSnapshotApplicationService>('SendSnapshotApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;
          const request = SendSnapshotRequest.fromBody(callerId, validatedBody);

          // Extract supervisor name from token claims
          const claims = (ctx as any).bindings.user as { fullName: string };
          const supervisorName = claims.fullName;

          // Extract token for chat notifications
          const token = (req.headers.authorization || "").split(" ")[1];

          const response = await applicationService.sendSnapshot(callerId, request, supervisorName, token);

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
