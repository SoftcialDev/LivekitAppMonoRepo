
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z }                                   from "zod";

import { withAuth }           from "../shared/middleware/auth";
import { withErrorHandler }   from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest, unauthorized }
  from "../shared/utils/response";
import {
  getUserByAzureOid,
  getUserByEmail
} from "../shared/services/userService";

import { getOrCreateChat } from "../shared/services/chatService";

export interface ChatRequest {
  /** The PSO’s email address to chat with. */
  psoEmail: string;
}

/**
 * Azure Function: finds or creates the InContactApp chat between
 * the caller (Supervisor) and the PSO.
 */
const getOrCreateChatFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1) extract bearer token
      const auth = req.headers["authorization"] || "";
      const token = auth.split(" ")[1];
      if (!token) return unauthorized(ctx, "Missing Authorization");

      // 2) resolve caller
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string };
      const oid    = claims?.oid || claims?.sub;
      if (!oid) return unauthorized(ctx, "Missing OID in token");

      const caller = await getUserByAzureOid(oid);
      if (!caller) return unauthorized(ctx, "Caller not found");

      // 3) validate body
      await withBodyValidation(z.object({ psoEmail: z.string().email() }))(ctx, async () => {
        const { psoEmail } = ctx.bindings.validatedBody as ChatRequest;
        const pso = await getUserByEmail(psoEmail.toLowerCase());
        if (!pso) return badRequest(ctx, "PSO user not found");

        // 4) build the topic dynamically
        const topic = `InContactApp – ${caller.fullName} & ${pso.fullName}`;

        // 5) participants array
        const participants = [
          { userId: caller.id, azureAdObjectId: caller.azureAdObjectId },
          { userId: pso.id,    azureAdObjectId: pso.azureAdObjectId    },
        ] as const;

        // 6) find or create
        const chatId = await getOrCreateChat(token, participants, topic);

        // 7) return
        return ok(ctx, { chatId });
      });
    });
  },
  {
    genericMessage: "Internal Server Error in GetOrCreateChat",
    showStackInDev: true,
  }
);

export default getOrCreateChatFunction;
