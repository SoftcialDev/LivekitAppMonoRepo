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
import { HealthCheckResponse } from '../../domain/types/HealthCheckTypes';
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
  // Log immediately to verify function is being called
  console.log('[Health] Function called - starting execution');
  
  try {
    // Use console.log as fallback if ctx.log is not available
    const log = ctx.log?.info || console.log;
    const logError = ctx.log?.error || console.error;
    
    log('[Health] Starting health check');
    const timestamp = new Date().toISOString();

    const req = (ctx.req as HttpRequest | undefined) ?? {} as HttpRequest;
    const query = (req.query ?? {}) as Record<string, unknown>;

    const verbose = String(query.verbose ?? "").toLowerCase() === "true";
    const dbEnabled = String(query.db ?? "true").toLowerCase() !== "false";
    const includeUsers = String(query.users ?? "").toLowerCase() === "true";

    log('[Health] Initializing services');
    /**
     * Initialize health check services
     */
    const healthCheckDomainService = new HealthCheckDomainService();
    const storageDetailsService = new StorageDetailsService();
    const databaseHealthCheckService = new DatabaseHealthCheckService();

    log('[Health] Getting storage details');
    /**
     * Get storage details if verbose mode is enabled
     */
    const storageDetails = verbose ? storageDetailsService.getStorageDetails() : undefined;

    log('[Health] Validating environment variables');
    /**
     * Validate environment variables
     */
    const envCheck = healthCheckDomainService.validateEnvironmentVariables(storageDetails);
    log('[Health] Environment validation complete');

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

    log('[Health] Checking database connectivity');
    /**
     * Perform database connectivity check if enabled
     */
    if (dbEnabled) {
      try {
        const dbUrl = config.databaseUrl;
        payload.checks.database = dbUrl
          ? await databaseHealthCheckService.checkDatabaseConnectivity(dbUrl, verbose)
          : {
              status: HealthStatus.FAIL,
              message: "DATABASE_URL is missing; database connectivity was not tested."
            };
      } catch (err) {
        logError('[Health] Error checking database', err);
        payload.checks.database = {
          status: HealthStatus.FAIL,
          message: `Database check failed: ${err instanceof Error ? err.message : String(err)}`
        };
      }
    }

    log('[Health] Checking users');
    /**
     * Include users in response if requested
     */
    if (includeUsers) {
      try {
        const dbUrl = config.databaseUrl;
        if (!dbUrl) {
          payload.users = {
            error: "DATABASE_URL is missing"
          };
        } else {
          payload.users = await databaseHealthCheckService.fetchUsers(dbUrl);
        }
      } catch (err) {
        logError('[Health] Error fetching users', err);
        payload.users = {
          error: err instanceof Error ? err.message : String(err)
        };
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

    log('[Health] Setting response');
    /**
     * Set HTTP response with appropriate status code
     */
    ctx.res = {
      status: overallStatus === HealthStatus.OK ? 200 : 503,
      headers: { "content-type": "application/json" },
      body: payload
    };
    log('[Health] Health check complete');
  } catch (error) {
    const logError = ctx.log?.error || console.error;
    logError('[Health] Error in health check', error);
    ctx.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: {
        status: HealthStatus.FAIL,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        checks: {
          env: {
            status: HealthStatus.FAIL,
            missingKeys: [],
            error: error instanceof Error ? error.message : String(error)
          }
        }
      }
    };
  }
}
