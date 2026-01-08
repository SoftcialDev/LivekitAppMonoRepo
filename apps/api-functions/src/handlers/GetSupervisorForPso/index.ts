import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { withQueryValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok, badRequest } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetSupervisorForPsoRequest } from '../../domain/value-objects/GetSupervisorForPsoRequest';
import { GetSupervisorForPsoApplicationService } from '../../application/services/GetSupervisorForPsoApplicationService';
import { getSupervisorForPsoSchema, GetSupervisorForPsoParams } from '../../domain/schemas/GetSupervisorForPsoSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

/**
 * Azure Function: handles supervisor lookup by PSO identifier
 * 
 * @remarks
 * 1. Validates query parameters using Zod schema.  
 * 2. Extracts caller ID from JWT token.  
 * 3. Creates request value object.  
 * 4. Delegates to application service for business logic and authorization.  
 * 5. Returns supervisor information or appropriate error message.
 *
 * @param context - Azure Functions execution context
 * @param req - HTTP request with query parameters
 */
const GetSupervisorForPso: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withQueryValidation(getSupervisorForPsoSchema)(ctx, async () => {
          await requirePermission(Permission.UsersRead)(ctx);
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<GetSupervisorForPsoApplicationService>('GetSupervisorForPsoApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedQuery = extendedCtx.bindings.validatedQuery as GetSupervisorForPsoParams;
          const request = GetSupervisorForPsoRequest.fromQuery(validatedQuery);

          const response = await applicationService.getSupervisorForPso(callerId, request);

          const payload = response.toPayload();
          
          // Handle different response types
          if (payload.error) {
            return badRequest(ctx, payload);
          }
          
          return ok(ctx, payload);
        });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in GetSupervisorForPso",
    showStackInDev: true,
  }
);

export default GetSupervisorForPso;
