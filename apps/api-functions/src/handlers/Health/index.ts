/**
 * @fileoverview Health check endpoint
 * @summary HTTP handler for health check endpoint
 * @description Validates environment variables and optionally tests database connectivity.
 * Kept separate from other modules to avoid import-time failures when env vars are missing.
 */

import type { Context, HttpRequest } from "@azure/functions";
import { HealthCheckDomainService } from '../../domain/services/HealthCheckDomainService';
import { StorageDetailsService } from '../../infrastructure/services/StorageDetailsService';
import { DatabaseHealthCheckService } from '../../infrastructure/services/DatabaseHealthCheckService';
import { HealthStatus } from '../../domain/enums/HealthStatus';
import { HealthCheckResponse } from '../../index';
import { config } from '../../config';

/**
 * Health check endpoint
 * 
 * GET /api/health
 * 
 * Query params:
 * - verbose=true: includes additional diagnostic details (no sensitive values exposed)
 *   - Shows partial Azure Storage variable details (preview, length, base64 validation)
 * - db=false: skips database connectivity test
 * - users=true: includes all users from the database in the response
 * 
 * Responses:
 * - 200: all checks passed
 * - 503: one or more checks failed
 */
export default async function HealthFunction(ctx: Context): Promise<void> {
  const timestamp = new Date().toISOString();

  const req = (ctx.req as HttpRequest | undefined) ?? {} as HttpRequest;
  const query = (req.query ?? {}) as Record<string, unknown>;

  const verbose = String(query.verbose ?? "").toLowerCase() === "true";
  const dbEnabled = String(query.db ?? "true").toLowerCase() !== "false";
  const includeUsers = String(query.users ?? "").toLowerCase() === "true";

  /**
   * Initialize health check services
   */
  const healthCheckDomainService = new HealthCheckDomainService();
  const storageDetailsService = new StorageDetailsService();
  const databaseHealthCheckService = new DatabaseHealthCheckService();

  /**
   * Get storage details if verbose mode is enabled
   */
  const storageDetails = verbose ? storageDetailsService.getStorageDetails() : undefined;

  /**
   * Validate environment variables
   */
  const envCheck = healthCheckDomainService.validateEnvironmentVariables(storageDetails);

  /**
   * Build initial payload with environment check results
   */
  const payload: HealthCheckResponse = {
    status: HealthStatus.OK,
    timestamp,
    checks: {
      env: envCheck
    }
  };

  /**
   * Perform database connectivity check if enabled
   */
  if (dbEnabled) {
    const dbUrl = config.databaseUrl;
    payload.checks.database = dbUrl
      ? await databaseHealthCheckService.checkDatabaseConnectivity(dbUrl, verbose)
      : {
          status: HealthStatus.FAIL,
          message: "DATABASE_URL is missing; database connectivity was not tested."
        };
  }

  /**
   * Include users in response if requested
   */
  if (includeUsers) {
    const dbUrl = config.databaseUrl;
    if (!dbUrl) {
      payload.users = {
        error: "DATABASE_URL is missing"
      };
    } else {
      payload.users = await databaseHealthCheckService.fetchUsers(dbUrl);
    }
  }

  /**
   * Determine overall health status based on all checks
   */
  const overallStatus = healthCheckDomainService.determineOverallStatus(
    payload.checks.env.status,
    payload.checks.database?.status
  );
  payload.status = overallStatus;

  /**
   * Set HTTP response with appropriate status code
   */
  ctx.res = {
    status: overallStatus === HealthStatus.OK ? 200 : 503,
    headers: { "content-type": "application/json" },
    body: payload
  };
}
