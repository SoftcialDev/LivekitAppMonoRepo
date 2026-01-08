/**
 * @fileoverview TransferPsos - Azure Function for transferring PSOs between supervisors
 * @summary Reassigns PSOs from one supervisor to another
 * @description HTTP-triggered function that transfers PSOs from the caller to a new supervisor
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
import { TransferPsosRequest } from '../../domain/value-objects/TransferPsosRequest';
import { TransferPsosApplicationService } from '../../application/services/TransferPsosApplicationService';
import { transferPsosSchema, TransferPsosParams } from '../../domain/schemas/TransferPsosSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * HTTP-triggered Azure Function that reassigns ALL PSOs currently
 * reporting to the caller (who must be a Supervisor) to a new supervisor.
 *
 * @remarks
 * - Secured via JWT bearer auth (withAuth).
 * - Caller must have role = "Supervisor".
 * - Expects JSON body: `{ newSupervisorEmail: string }`.
 * - Finds the caller's user record, then finds the target supervisor by email.
 * - Updates all PSO users with `supervisorId = caller.id`
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
          await requirePermission(Permission.UsersChangeSupervisor)(ctx);
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<TransferPsosApplicationService>('TransferPsosApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedBody = extendedCtx.bindings.validatedBody as TransferPsosParams;
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
