import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withQueryValidation } from "../shared/middleware/validate";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetPsosBySupervisorRequest } from "../shared/domain/value-objects/GetPsosBySupervisorRequest";
import { GetPsosBySupervisorApplicationService } from "../shared/application/services/GetPsosBySupervisorApplicationService";
import { getPsosBySupervisorSchema } from "../shared/domain/schemas/GetPsosBySupervisorSchema";

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
