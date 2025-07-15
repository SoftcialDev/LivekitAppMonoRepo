import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth }         from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok, badRequest }   from "../shared/utils/response";
import { findSupervisorByIdentifier } from "../shared/services/userService";


/**
 * HTTP-triggered Azure Function that looks up the supervisor for a given PSO.
 *
 * @remarks
 * - Secures the endpoint with JWT bearer auth (withAuth).
 * - Accepts a single query parameter `identifier`, which may be:
 *    • the PSO’s User.id (UUID)
 *    • the PSO’s azureAdObjectId (UUID)
 *    • the PSO’s email (UPN)
 * - Delegates to `findSupervisorByIdentifier` in userService.
 * - Returns 200 with `{ supervisor: { id, azureAdObjectId, email, fullName } }`
 *   if a supervisor is found.
 * - Returns 200 with `{ message: "No supervisor assigned" }` if PSO exists but has no supervisor.
 * - Returns 400 with `{ error: <message> }` if PSO not found or not role=Employee.
 *
 * @param ctx
 *   Azure Function execution context.
 * @param req
 *   The incoming HTTP request, expecting `req.query.identifier`.
 * @returns
 *   A JSON HTTP response as described above.
 */
const GetSupervisorByIdentifier: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    return withAuth(ctx, async () => {
      const identifier = (req.query.identifier as string)?.trim();
      if (!identifier) {
        return badRequest(ctx, "Missing query parameter 'identifier'");
      }

      const result = await findSupervisorByIdentifier(identifier);

      if (typeof result === "string") {
        // If PSO exists but has no supervisor, return 200 with message
        if (result === "No supervisor assigned") {
          return ok(ctx, { message: result });
        }
        // Otherwise, it's an error case
        return badRequest(ctx, result);
      }

      // Supervisor record found
      const { id, azureAdObjectId, email, fullName } = result;
      return ok(ctx, {
        supervisor: { id, azureAdObjectId, email, fullName }
      });
    });
  },
  {
    genericMessage: "Internal Server Error in GetSupervisorByIdentifier",
    showStackInDev: true,
  }
);

export default GetSupervisorByIdentifier;
