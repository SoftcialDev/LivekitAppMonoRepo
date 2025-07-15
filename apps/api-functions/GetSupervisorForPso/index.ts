import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { findSupervisorByIdentifier } from "../shared/services/userService";
import { badRequest, ok } from "../shared/utils/response";

/**
 * HTTP-triggered Azure Function: GetSupervisorForPso
 *
 * Looks up and returns the supervisor for a given PSO (Employee).
 *
 * - Secured via JWT bearer (`withAuth`).
 * - Accepts a query parameter `identifier`:
 *    • PSO’s database UUID (`id`)
 *    • PSO’s Azure AD Object ID (`azureAdObjectId`)
 *    • PSO’s email address (UPN)
 * - Delegates lookup to `findSupervisorByIdentifier`.
 * - Response codes:
 *    - 200 OK + `{ supervisor: {...} }` if a supervisor record is found.
 *    - 200 OK + `{ message: "No supervisor assigned" }` if PSO exists but has no supervisor.
 *    - 400 Bad Request + `{ error: "..."} ` if identifier is missing, PSO not found, or user is not an Employee.
 *
 * @param ctx  Azure Functions execution context
 * @param req  Incoming HTTP request with `req.query.identifier`
 */
const GetSupervisorForPso: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    return withAuth(ctx, async () => {
      const identifier = (req.query.identifier as string)?.trim();
      if (!identifier) {
        return badRequest(ctx, "Missing required query parameter: identifier");
      }

      const result = await findSupervisorByIdentifier(identifier);

      if (typeof result === "string") {
        // PSO exists but has no supervisor
        if (result === "No supervisor assigned") {
          return ok(ctx, { message: result });
        }
        // PSO not found or wrong role
        return badRequest(ctx, { error: result });
      }

      // Supervisor found
      const { id, azureAdObjectId, email, fullName } = result;
      return ok(ctx, {
        supervisor: { id, azureAdObjectId, email, fullName }
      });
    });
  },
  {
    genericMessage: "Internal Server Error in GetSupervisorForPso",
    showStackInDev: true,
  }
);

export default GetSupervisorForPso;
