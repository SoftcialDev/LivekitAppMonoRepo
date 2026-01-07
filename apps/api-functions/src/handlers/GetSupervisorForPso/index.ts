import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { withQueryValidation } from '../../index';
import { requirePermission } from '../../index';
import { Permission } from '../../index';
import { ok, badRequest } from '../../index';
import { ServiceContainer } from '../../index';
import { GetSupervisorForPsoRequest } from '../../index';
import { GetSupervisorForPsoApplicationService } from '../../index';
import { getSupervisorForPsoSchema } from '../../index';

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
          const callerId = ctx.bindings.callerId as string;

          const validatedQuery = (ctx as any).bindings.validatedQuery;
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
