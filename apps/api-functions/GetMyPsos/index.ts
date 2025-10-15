import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetPsosBySupervisorRequest } from "../shared/domain/value-objects/GetPsosBySupervisorRequest";
import { GetPsosBySupervisorApplicationService } from "../shared/application/services/GetPsosBySupervisorApplicationService";
import { IUserRepository } from "../shared/domain/interfaces/IUserRepository";
import { UserRole } from "@prisma/client";

/**
 * Azure Function: GetMyPsos
 * 
 * Returns PSOs assigned to the current user (supervisor).
 * For supervisors: returns only their assigned PSOs
 * For admins: returns all PSOs
 * 
 * @remarks
 * 1. Extracts caller ID from JWT token.  
 * 2. Creates request value object without supervisorId (uses caller's own PSOs).  
 * 3. Delegates to application service for business logic and authorization.  
 * 4. Returns PSOs data with supervisor information.
 *
 * @param context - Azure Functions execution context
 * @param req - HTTP request
 */
const GetMyPsos: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetPsosBySupervisorApplicationService>('GetPsosBySupervisorApplicationService');
        const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
        const callerId = ctx.bindings.callerId as string;

        // Get caller's role to determine behavior
        const caller = await userRepository.findByAzureAdObjectId(callerId);
        if (!caller) {
          throw new Error('Caller not found');
        }

        let request: GetPsosBySupervisorRequest;

        if (caller.role === UserRole.Admin || caller.role === UserRole.SuperAdmin) {
          // Admins and SuperAdmins see all PSOs (no supervisorId filter)
          request = new GetPsosBySupervisorRequest(callerId, undefined);
        } else {
          // Supervisors see only their assigned PSOs
          request = new GetPsosBySupervisorRequest(callerId, callerId);
        }

        const response = await applicationService.getPsosBySupervisor(callerId, request);

        return ok(ctx, response.toPayload());
      });
    });
  },
  {
    genericMessage: "Internal Server Error in GetMyPsos",
    showStackInDev: true,
  }
);

export default GetMyPsos;