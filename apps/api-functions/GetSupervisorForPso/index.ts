import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withQueryValidation } from "../shared/middleware/validate";
import { ok, badRequest } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetSupervisorForPsoRequest } from "../shared/domain/value-objects/GetSupervisorForPsoRequest";
import { GetSupervisorForPsoApplicationService } from "../shared/application/services/GetSupervisorForPsoApplicationService";
import { getSupervisorForPsoSchema } from "../shared/domain/schemas/GetSupervisorForPsoSchema";

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
