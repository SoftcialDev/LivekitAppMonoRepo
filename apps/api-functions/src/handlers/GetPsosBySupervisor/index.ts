import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { withQueryValidation } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { GetPsosBySupervisorRequest } from '../../index';
import { GetPsosBySupervisorApplicationService } from '../../index';
import { getPsosBySupervisorSchema } from '../../index';

/**
 * Azure Function: handles PSOs lookup by supervisor
 * 
 * @remarks
 * 1. Validates query parameters using Zod schema.  
 * 2. Extracts caller ID from JWT token.  
 * 3. Creates request value object.  
 * 4. Delegates to application service for business logic and authorization.  
 * 5. Returns PSOs data with supervisor information.
 *
 * @param context - Azure Functions execution context
 * @param req - HTTP request with query parameters
 */
const GetPsosBySupervisor: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withQueryValidation(getPsosBySupervisorSchema)(ctx, async () => {
          await requirePermission(Permission.UsersRead)(ctx);
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<GetPsosBySupervisorApplicationService>('GetPsosBySupervisorApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedQuery = (ctx as any).bindings.validatedQuery;
          const request = GetPsosBySupervisorRequest.fromQuery(callerId, validatedQuery);

          const response = await applicationService.getPsosBySupervisor(callerId, request);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in GetPsosBySupervisor",
    showStackInDev: true,
  }
);

export default GetPsosBySupervisor;
