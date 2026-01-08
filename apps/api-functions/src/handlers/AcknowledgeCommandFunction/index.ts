/**
 * @fileoverview AcknowledgeCommandFunction - Azure Function for acknowledging pending commands
 * @description Allows authenticated PSOs to acknowledge receipt of pending camera commands
 */

import { Context } from "@azure/functions";
import { withErrorHandler } from '../../middleware/errorHandler';
import { withAuth } from '../../middleware/auth';
import { withBodyValidation } from '../../middleware/validate';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { acknowledgeCommandSchema } from '../../domain/schemas/AcknowledgeCommandSchema';
import { AcknowledgeCommandRequest } from '../../domain/value-objects/AcknowledgeCommandRequest';
import { CommandAcknowledgmentApplicationService } from '../../application/services/CommandAcknowledgmentApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';

/**
 * Azure Function: AcknowledgeCommandFunction
 *
 * HTTP POST /api/AcknowledgeCommand
 *
 * Allows the authenticated PSO to acknowledge receipt and processing
 * of one or more pending camera commands. Marks each specified PendingCommand
 * record as acknowledged in the database.
 *
 * Workflow:
 * 1. Validate JWT via `withAuth`, populating `ctx.bindings.user`.
 * 2. Extract caller ID via `withCallerId`, populating `ctx.bindings.callerId`.
 * 3. Validate request body against Zod schema.
 * 4. Create AcknowledgeCommandRequest from validated body.
 * 5. Execute application service to handle business logic.
 * 6. Return `{ updatedCount: number }` indicating how many rows were updated.
 *
 * @param ctx - Azure Function execution context.
 * @returns 200 OK with `{ updatedCount: number }` if successful.
 * @throws 401 Unauthorized if JWT is missing, invalid, or user not authorized.
 * @throws 400 Bad Request if validation or business rules fail.
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    await withCallerId(ctx, async () => {
      await requirePermission(Permission.CommandsAcknowledge)(ctx);
      await withBodyValidation(acknowledgeCommandSchema)(ctx, async () => {
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<CommandAcknowledgmentApplicationService>('CommandAcknowledgmentApplicationService');
        const request = AcknowledgeCommandRequest.fromBody(ctx.bindings.validatedBody);
        const callerId = ctx.bindings.callerId as string;

        const result = await applicationService.acknowledgeCommands(request, callerId);
        ok(ctx, result.toPayload());
      });
    });
  });
});
