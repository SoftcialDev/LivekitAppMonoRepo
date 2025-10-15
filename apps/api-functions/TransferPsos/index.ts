/**
 * @fileoverview TransferPsos - Azure Function for transferring PSOs between supervisors
 * @summary Reassigns PSOs from one supervisor to another
 * @description HTTP-triggered function that transfers PSOs from the caller to a new supervisor
 */

import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { TransferPsosRequest } from "../shared/domain/value-objects/TransferPsosRequest";
import { TransferPsosApplicationService } from "../shared/application/services/TransferPsosApplicationService";
import { transferPsosSchema } from "../shared/domain/schemas/TransferPsosSchema";

/**
 * HTTP-triggered Azure Function that reassigns ALL PSOs currently
 * reporting to the caller (who must be a Supervisor) to a new supervisor.
 *
 * @remarks
 * - Secured via JWT bearer auth (withAuth).
 * - Caller must have role = "Supervisor".
 * - Expects JSON body: `{ newSupervisorEmail: string }`.
 * - Finds the caller's user record, then finds the target supervisor by email.
 * - Updates all Employee users with `supervisorId = caller.id`
 *   to have `supervisorId = newSupervisor.id`.
 * - Returns 200 with `{ movedCount: number }`.
 * - Returns 400 if request body is invalid or target supervisor not found.
 * - Returns 403 if caller is not a Supervisor.
 *
 * @param ctx - Azure Functions execution context
 * @param req - HTTP request object
 */
const transferPsosHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(transferPsosSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<TransferPsosApplicationService>('TransferPsosApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;
          const request = TransferPsosRequest.fromBody(callerId, validatedBody);

          const response = await applicationService.transferPsos(callerId, request);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in TransferPsos",
    showStackInDev: true,
  }
);

export default transferPsosHandler;
