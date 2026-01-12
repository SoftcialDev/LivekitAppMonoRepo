import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../middleware/auth';
import { withErrorHandler } from '../../middleware/errorHandler';
import { withCallerId } from '../../middleware/callerId';
import { withQueryValidation } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permissions';
import { Permission } from '../../domain/enums/Permission';
import { ok } from '../../utils/response';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { GetSupervisorByIdentifierRequest } from '../../domain/value-objects/GetSupervisorByIdentifierRequest';
import { GetSupervisorByIdentifierApplicationService } from '../../application/services/GetSupervisorByIdentifierApplicationService';
import { getSupervisorByIdentifierSchema, GetSupervisorByIdentifierParams } from '../../domain/schemas/GetSupervisorByIdentifierSchema';
import { ensureBindings } from '../../domain/types/ContextBindings';

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
          await requirePermission(Permission.UsersRead)(ctx);
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<GetSupervisorByIdentifierApplicationService>('GetSupervisorByIdentifierApplicationService');
          const extendedCtx = ensureBindings(ctx);
          const callerId = extendedCtx.bindings.callerId as string;

          const validatedQuery = extendedCtx.bindings.validatedQuery as GetSupervisorByIdentifierParams;
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
