/**
 * @fileoverview GetSnapshotReasons - Azure Function for retrieving snapshot reasons
 * @summary HTTP endpoint for getting all active snapshot reasons
 * @description Handles GET requests to retrieve all active snapshot reasons
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { requirePermission } from "../shared/middleware/permissions";
import { Permission } from "../shared/domain/enums/Permission";
import { ok } from "../shared/utils/response";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { GetSnapshotReasonsApplicationService } from "../shared/application/services/GetSnapshotReasonsApplicationService";
import { IErrorLogService } from "../shared/domain/interfaces/IErrorLogService";
import { ErrorSource } from "../shared/domain/enums/ErrorSource";
import { ErrorSeverity } from "../shared/domain/enums/ErrorSeverity";

/**
 * HTTP GET /api/GetSnapshotReasons
 *
 * Returns all active snapshot reasons ordered by display order.
 * Requires authentication.
 *
 * @param ctx - The Azure Functions execution context
 * @returns A 200 OK response with snapshot reasons, or an error response
 */
const getSnapshotReasonsHandler: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    // Log request details BEFORE withAuth to see what we're receiving
    const req = ctx.req as HttpRequest | undefined;
    ctx.log.info("[GetSnapshotReasons] Handler called", {
      hasCtxReq: !!ctx.req,
      hasReq: !!req,
      hasHeaders: !!req?.headers,
      headerKeys: req?.headers ? Object.keys(req.headers) : [],
      authorizationHeader: req?.headers ? (req.headers["authorization"] || req.headers["Authorization"] || "NOT_FOUND") : "NO_REQ",
      method: req?.method,
      url: req?.url,
      query: req?.query,
    });

    await withAuth(ctx, async () => {
      await requirePermission(Permission.SnapshotReasonsRead)(ctx);
      const serviceContainer = ServiceContainer.getInstance();
      serviceContainer.initialize();

      const applicationService = serviceContainer.resolve<GetSnapshotReasonsApplicationService>('GetSnapshotReasonsApplicationService');
      const reasons = await applicationService.getSnapshotReasons();

      return ok(ctx, {
        reasons: reasons.map(r => r.toJSON())
      });
    });

    // If auth failed (withAuth sets ctx.res.status = 401), log to error table
    if (ctx.res?.status === 401) {
      ctx.log.warn("[GetSnapshotReasons] Auth failed - logging to error table");
      try {
        const serviceContainer = ServiceContainer.getInstance();
        serviceContainer.initialize();
        const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
        await errorLogService.logError({
          severity: ErrorSeverity.Medium,
          source: ErrorSource.Authentication,
          endpoint: "/api/GetSnapshotReasons",
          functionName: "GetSnapshotReasons",
          error: new Error("Authentication failed: Missing or invalid Authorization header"),
          context: {
            hasCtxReq: !!ctx.req,
            hasReq: !!req,
            hasHeaders: !!req?.headers,
            headerKeys: req?.headers ? Object.keys(req.headers) : [],
            authorizationHeader: req?.headers ? (req.headers["authorization"] || req.headers["Authorization"] || "NOT_FOUND") : "NO_REQ",
            method: req?.method,
            url: req?.url,
            query: req?.query,
          },
          httpStatusCode: 401,
        });
        ctx.log.info("[GetSnapshotReasons] Auth failure logged to error table");
      } catch (logError) {
        ctx.log.error("[GetSnapshotReasons] Failed to log auth error to table", logError);
      }
    }
  },
  {
    genericMessage: "Internal error fetching snapshot reasons",
    showStackInDev: true,
  }
);

export default getSnapshotReasonsHandler;

