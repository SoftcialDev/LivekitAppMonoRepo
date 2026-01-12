/**
 * @fileoverview CamaraCommand - Azure Function for camera command handling
 * @description Allows authorized users to send START/STOP commands to employees
 */

import { Context } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withBodyValidation } from '../../middleware/validate';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { CommandApplicationService } from '../../application/services/CommandApplicationService';
import { Command } from '../../domain/value-objects/Command';
import { MessagingChannel } from '../../domain/enums/MessagingChannel';
import { commandRequestSchema } from '../../domain/schemas/CommandRequestSchema';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IAuthorizationService } from '../../domain/interfaces/IAuthorizationService';
import { ICommandMessagingService } from '../../domain/interfaces/ICommandMessagingService';
import { IWebPubSubService } from '../../domain/interfaces/IWebPubSubService';
import { handleAnyError } from '../../utils/errorHandler';

/**
 * Azure Function: CamaraCommand
 *
 * **HTTP POST** `/api/CamaraCommand`
 *
 * Allows Admins and Supervisors to start or stop a PSO's camera stream.
 *
 * @logic
 * 1. Authenticate caller via Azure AD (`withAuth`).
 * 2. Authorize only users with `Admin` or `Supervisor` roles.
 * 3. Validate payload `{ command, employeeEmail }`.
 * 4. Verify the target exists and has role `PSO`.
 * 5. Attempt **immediate** broadcast over Web PubSub:
 *    - If it succeeds, respond `{ sentVia: "ws" }`.
 *    - If it fails, catch the error, log a warning, and fall back.
 * 6. On fallback, enqueue the command to Service Bus via `sendAdminCommand()`:
 *    - If enqueue succeeds, respond `{ sentVia: "bus" }`.
 *    - If enqueue fails, return **400 Bad Request**.
 *
 * This ensures low-latency delivery when possible, with durable
 * fallback for reliability.
 *
 * @param ctx Azure Functions execution context.
 */
export default withErrorHandler(async (ctx: Context) => {
  await withAuth(ctx, async () => {
    await withCallerId(ctx, async () => {
      await requirePermission(Permission.CommandsSend)(ctx);
      
      // Initialize service container
      serviceContainer.initialize();

      // Resolve dependencies from container
      const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
      const authorizationService = serviceContainer.resolve<IAuthorizationService>('AuthorizationService');
      const commandMessagingService = serviceContainer.resolve<ICommandMessagingService>('CommandMessagingService');
      const webPubSubService = serviceContainer.resolve<IWebPubSubService>('WebPubSubService');
      const commandApplicationService = new CommandApplicationService(
        userRepository,
        authorizationService,
        commandMessagingService,
        webPubSubService
      );

      // Validate request body
      await withBodyValidation(commandRequestSchema)(ctx, async () => {
        const { command: commandType, employeeEmail, reason } = ctx.bindings.validatedBody;
        const callerId = ctx.bindings.callerId as string;

        try {
          // Validate target PSO
          await commandApplicationService.validateTargetPSO(employeeEmail);

          // Create and send command
          const command = Command.fromRequest({ command: commandType, employeeEmail, reason });
          const result = await commandApplicationService.sendCameraCommand(command);

          const channelName = result.sentVia === MessagingChannel.WebSocket ? "WebSocket" : "Service Bus";
          return ok(ctx, {
            message: `Command "${commandType}" sent to ${employeeEmail} via ${channelName}`,
            sentVia: result.sentVia
          });

        } catch (error) {
          return handleAnyError(ctx, error, {
            callerId,
            employeeEmail,
            command: commandType
          });
        }
      });
    });
  });
});
