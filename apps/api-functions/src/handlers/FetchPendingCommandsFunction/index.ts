/**
 * @fileoverview FetchPendingCommandsFunction - Azure Function for fetching pending commands
 * @summary Handles the retrieval of pending commands for authenticated employees
 * @description This function fetches the most recent un-acknowledged camera command
 * for the authenticated employee, if it hasn't expired. Commands older than 
 * PENDING_COMMAND_TTL_MINUTES (default 5) are treated as expired.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok, noContent } from '../../utils/response';
import { FetchPendingCommandsApplicationService } from '../../application/services/FetchPendingCommandsApplicationService';
import { serviceContainer } from '../../infrastructure/container/ServiceContainer';

/**
 * Azure Function handler for fetching pending commands.
 * 
 * This function handles the retrieval of pending commands by:
 * 1. Authenticating the caller using Azure AD token
 * 2. Extracting caller ID and validating employee access
 * 3. Delegating to FetchPendingCommandsApplicationService for business logic
 * 4. Returning the most recent un-acknowledged command or null
 * 
 * @param ctx - Azure Function context
 * @param req - HTTP request
 * @returns Promise that resolves when the pending commands are fetched
 * @throws {UnauthorizedError} when authentication fails
 * @throws {PendingCommandAccessDeniedError} when user lacks permissions
 * @throws {PendingCommandUserNotFoundError} when user is not found or inactive
 * @throws {PendingCommandFetchError} when fetching commands fails
 * 
 * @example
 * GET /api/FetchPendingCommands
 * Response: { "pending": PendingCommand | null }
 */
const fetchHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.CommandsRead)(ctx);
        serviceContainer.initialize();
        
        const applicationService = serviceContainer.resolve<FetchPendingCommandsApplicationService>('FetchPendingCommandsApplicationService');
        const callerId = ctx.bindings.callerId as string;
        
        const response = await applicationService.fetchPendingCommands(callerId);
        
        // Check if we have a pending command
        if (response.pending) {
          ok(ctx, response.toPayload());
        } else {
          // No pending commands or expired
          noContent(ctx);
        }
      });
    });
  },
  { genericMessage: "Failed to fetch pending commands" }
);

export default fetchHandler;
