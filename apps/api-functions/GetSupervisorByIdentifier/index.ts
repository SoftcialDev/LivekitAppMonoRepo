import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withCallerId } from "../shared/middleware/callerId";
import { withQueryValidation } from "../shared/middleware/validate";
import { ok, badRequest } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetSupervisorByIdentifierRequest } from "../shared/domain/value-objects/GetSupervisorByIdentifierRequest";
import { GetSupervisorByIdentifierApplicationService } from "../shared/application/services/GetSupervisorByIdentifierApplicationService";
import { getSupervisorByIdentifierSchema } from "../shared/domain/schemas/GetSupervisorByIdentifierSchema";

/**
 * Azure Function: handles supervisor lookup by identifier
 * 
 * @remarks
 * 1. Validates query parameters using Zod schema.  
 * 2. Extracts caller ID from JWT token.  
 * 3. Creates request value object.  
 * 4. Delegates to application service for business logic.  
 * 5. Returns supervisor data or appropriate message.
 *
 * @param context - Azure Functions execution context
 * @param req - HTTP request with query parameters
 */
const GetSupervisorByIdentifier: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withQueryValidation(getSupervisorByIdentifierSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<GetSupervisorByIdentifierApplicationService>('GetSupervisorByIdentifierApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedQuery = (ctx as any).bindings.validatedQuery;
          const request = GetSupervisorByIdentifierRequest.fromQuery(validatedQuery);

          const response = await applicationService.getSupervisorByIdentifier(callerId, request);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in GetSupervisorByIdentifier",
    showStackInDev: true,
  }
);

export default GetSupervisorByIdentifier;
