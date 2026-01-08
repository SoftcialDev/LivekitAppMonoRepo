import { Context } from "@azure/functions";
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { ProcessCommandRequest } from '../../domain/value-objects/ProcessCommandRequest';
import { ProcessCommandApplicationService } from '../../application/services/ProcessCommandApplicationService';
import { processCommandSchema } from '../../domain/schemas/ProcessCommandSchema';

/**
 * Azure Function: ProcessCommand
 *
 * Trigger: Service Bus topic subscription for camera commands.
 *
 * Responsibilities:
 * 1. Deserialize the incoming message as `ProcessCommandMessage`.
 * 2. Look up the corresponding `User` in the database by email.
 * 3. Persist a new `PendingCommand` in case the client was offline.
 * 4. Attempt immediate delivery over Web PubSub if the user is online.
 * 5. Log success or throw to trigger retry/DLQ on failure.
 *
 * This ensures **at-least-once** semantics: every command is recorded
 * and retried until delivered or explicitly dead-lettered.
 *
 * @param context  Azure Functions execution context for logging
 * @param message  Raw Service Bus message payload (unknown until cast)
 */
export default async function processCommand(
  context: Context,
  message: unknown
): Promise<void> {
  context.log.info("ProcessCommand received:", message);

  try {
    // 1) Validate message structure
    const validatedMessage = processCommandSchema.parse(message);
    
    // 2) Get service container singleton
    const serviceContainer = ServiceContainer.getInstance();
    serviceContainer.initialize();

    // 3) Resolve application service
    const applicationService = serviceContainer.resolve<ProcessCommandApplicationService>('ProcessCommandApplicationService');

    // 4) Create request object
    const request = ProcessCommandRequest.fromMessage(validatedMessage);

    // 5) Execute command processing
    const response = await applicationService.processCommand(request);

    context.log.info(
      `Command ${request.command} for ${request.employeeEmail} processed (id=${response.commandId}); delivered=${response.delivered}`
    );
  } catch (err) {
    context.log.error("Error in ProcessCommand:", err);
    // Rethrow so Azure Functions will retry or move to DLQ
    throw err;
  }
}
