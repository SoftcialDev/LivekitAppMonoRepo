import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { withQueryValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetPsosBySupervisorRequest } from '../../domain/value-objects/GetPsosBySupervisorRequest';
import { GetPsosBySupervisorApplicationService } from '../../application/services/GetPsosBySupervisorApplicationService';
import { getPsosBySupervisorSchema, GetPsosBySupervisorParams } from '../../domain/schemas/GetPsosBySupervisorSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

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
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedQuery = extendedCtx.bindings.validatedQuery as GetPsosBySupervisorParams;
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
