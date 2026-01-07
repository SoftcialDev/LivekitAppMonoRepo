
import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from '../../index';
import { withErrorHandler } from '../../index';
import { withCallerId } from '../../index';
import { withBodyValidation } from '../../index';
import { ok } from '../../index';
import { ServiceContainer } from '../../index';
import { GetOrCreateChatRequest } from '../../index';
import { GetOrCreateChatApplicationService } from '../../index';
import { getOrCreateChatSchema } from '../../index';

/**
 * Azure Function: finds or creates the InContactApp chat between
 * the caller (Supervisor) and the PSO.
 *
 * @remarks
 * 1. Authenticates the caller via JWT (On-Behalf-Of).  
 * 2. Extracts caller ID from token.  
 * 3. Validates the request body (PSO email).  
 * 4. Authorizes the caller (authenticated users only).  
 * 5. Creates or gets chat between caller and PSO.  
 * 6. Returns `{ chatId: string }` on success.
 *
 * @param ctx - The Azure Functions execution context.
 * @param req - The incoming HTTP request.
 * @returns A 200 OK response with `{ chatId }`, or error response.
 */
const getOrCreateChatFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await withBodyValidation(getOrCreateChatSchema)(ctx, async () => {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();

          const applicationService = serviceContainer.resolve<GetOrCreateChatApplicationService>('GetOrCreateChatApplicationService');
          const callerId = ctx.bindings.callerId as string;

          const validatedBody = (ctx as any).bindings.validatedBody;
          const request = GetOrCreateChatRequest.fromBody(callerId, validatedBody);

          // Extract token for chat operations
          const auth = req.headers["authorization"] || "";
          const token = auth.split(" ")[1];

          const response = await applicationService.getOrCreateChat(callerId, request, token);

          return ok(ctx, response.toPayload());
        });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in GetOrCreateChat",
    showStackInDev: true,
  }
);

export default getOrCreateChatFunction;
