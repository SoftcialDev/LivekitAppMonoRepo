import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetPsosBySupervisorRequest } from '../../domain/value-objects/GetPsosBySupervisorRequest';
import { GetPsosBySupervisorApplicationService } from '../../application/services/GetPsosBySupervisorApplicationService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { UserRole } from "@prisma/client";
import { UserNotFoundError } from '../../domain/errors/UserErrors';

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
        await requirePermission(Permission.UsersRead)(ctx);
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();

        const applicationService = serviceContainer.resolve<GetPsosBySupervisorApplicationService>('GetPsosBySupervisorApplicationService');
        const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
        const callerId = ctx.bindings.callerId as string;

        // Get caller's role to determine behavior
        const caller = await userRepository.findByAzureAdObjectId(callerId);
        if (!caller) {
          throw new UserNotFoundError('Caller not found');
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