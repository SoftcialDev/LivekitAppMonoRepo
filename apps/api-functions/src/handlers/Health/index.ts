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
import { HealthCheckResponse, type HealthCheckUser } from '../../domain/types/HealthCheckTypes';
import { config } from '../../config';
import { unknownToString } from '../../utils/stringHelpers';

/**
 * List of allowed environment variables that can be retrieved via query parameter
 */
const ALLOWED_ENV_VARS = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'AZURE_AD_API_IDENTIFIER_URI',
  'SERVICE_PRINCIPAL_OBJECT_ID'
] as const;

/**
 * Parses query parameters from HTTP request
 * @param query - Query parameters object
 * @returns Parsed query parameters
 */
function parseQueryParams(query: Record<string, unknown>): {
  verbose: boolean;
  dbEnabled: boolean;
  includeUsers: boolean;
  envVars: string[];
} {
  const verboseStr = unknownToString(query.verbose, '');
  const dbStr = unknownToString(query.db, 'true');
  const usersStr = unknownToString(query.users, '');
  const envVarsStr = unknownToString(query.envVars, '');
  
  // Parse envVars as comma-separated list, filter to only allowed vars
  const envVars = envVarsStr
    .split(',')
    .map(v => v.trim().toUpperCase())
    .filter(v => v && ALLOWED_ENV_VARS.includes(v as typeof ALLOWED_ENV_VARS[number]));
  
  return {
    verbose: verboseStr.toLowerCase() === "true",
    dbEnabled: dbStr.toLowerCase() !== "false",
    includeUsers: usersStr.toLowerCase() === "true",
    envVars,
  };
}

/**
 * Performs database connectivity check
 * @param databaseHealthCheckService - Database health check service
 * @param verbose - Whether to include verbose details
 * @param logError - Error logging function
 * @returns Database check result or undefined if disabled
 */
async function performDatabaseCheck(
  databaseHealthCheckService: DatabaseHealthCheckService,
  verbose: boolean,
  logError: (...args: unknown[]) => void
): Promise<{ status: HealthStatus; message: string } | undefined> {
  try {
    const dbUrl = config.databaseUrl;
    return dbUrl
      ? await databaseHealthCheckService.checkDatabaseConnectivity(dbUrl, verbose)
      : {
          status: HealthStatus.FAIL,
          message: "DATABASE_URL is missing; database connectivity was not tested."
        };
  } catch (err) {
    logError('[Health] Error checking database', err);
    return {
      status: HealthStatus.FAIL,
      message: `Database check failed: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}

/**
 * Fetches users for health check response
 * @param databaseHealthCheckService - Database health check service
 * @param logError - Error logging function
 * @returns Users array or error object
 */
async function fetchUsersForHealthCheck(
  databaseHealthCheckService: DatabaseHealthCheckService,
  logError: (...args: unknown[]) => void
): Promise<HealthCheckUser[] | { error: string }> {
  try {
    const dbUrl = config.databaseUrl;
    if (dbUrl) {
      const result = await databaseHealthCheckService.fetchUsers(dbUrl);
      if ('error' in result) {
        return result;
      }
      return result;
    }
    return {
      error: "DATABASE_URL is missing"
    };
  } catch (err) {
    logError('[Health] Error fetching users', err);
    return {
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Creates error response body
 * @param error - Error that occurred
 * @returns Error response body
 */
function createErrorResponse(error: unknown): {
  status: HealthStatus;
  timestamp: string;
  error: string;
  checks: {
    env: {
      status: HealthStatus;
      missingKeys: unknown[];
      error: string;
    };
  };
} {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    status: HealthStatus.FAIL,
    timestamp: new Date().toISOString(),
    error: errorMessage,
    checks: {
      env: {
        status: HealthStatus.FAIL,
        missingKeys: [],
        error: errorMessage
      }
    }
  };
}

/**
 * Gets environment variable values for requested variables
 * @param envVars - Array of environment variable names to retrieve
 * @returns Object mapping variable names to their values
 */
function getEnvironmentVariables(envVars: string[]): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  
  const configMap: Record<string, string | undefined> = {
    'AZURE_TENANT_ID': config.azureTenantId,
    'AZURE_CLIENT_ID': config.azureClientId,
    'AZURE_AD_API_IDENTIFIER_URI': config.azureAdApiIdentifierUri,
    'SERVICE_PRINCIPAL_OBJECT_ID': config.servicePrincipalObjectId,
  };
  
  envVars.forEach(varName => {
    result[varName] = configMap[varName];
  });
  
  return result;
}

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
 * - envVars=AZURE_TENANT_ID,AZURE_CLIENT_ID,...: returns full values for specified environment variables
 *   Allowed variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_AD_API_IDENTIFIER_URI, SERVICE_PRINCIPAL_OBJECT_ID
 * 
 * Responses:
 * - 200: all checks passed
 * - 503: one or more checks failed
 */
export default async function HealthFunction(ctx: Context): Promise<void> {
  // Log immediately to verify function is being called
  console.log('[Health] Function called - starting execution');
  
  try {
    const log = ctx.log?.info || console.log;
    const logError = ctx.log?.error || console.error;
    
    log('[Health] Starting health check');
    const timestamp = new Date().toISOString();

    const req = (ctx.req ?? {}) as HttpRequest;
    const query = (req.query ?? {}) as Record<string, unknown>;
    const { verbose, dbEnabled, includeUsers, envVars } = parseQueryParams(query);

    log('[Health] Initializing services');
    const healthCheckDomainService = new HealthCheckDomainService();
    const storageDetailsService = new StorageDetailsService();
    const databaseHealthCheckService = new DatabaseHealthCheckService();

    log('[Health] Getting storage details');
    const storageDetails = verbose ? storageDetailsService.getStorageDetails() : undefined;

    log('[Health] Validating environment variables');
    const envCheck = healthCheckDomainService.validateEnvironmentVariables(storageDetails);
    log('[Health] Environment validation complete');

    const payload: HealthCheckResponse = {
      status: HealthStatus.OK,
      timestamp,
      checks: {
        env: envCheck
      }
    };

    // Add environment variables if requested
    if (envVars.length > 0) {
      log('[Health] Getting requested environment variables');
      payload.environmentVariables = getEnvironmentVariables(envVars);
    }

    log('[Health] Checking database connectivity');
    if (dbEnabled) {
      payload.checks.database = await performDatabaseCheck(databaseHealthCheckService, verbose, logError);
    }

    log('[Health] Checking users');
    if (includeUsers) {
      payload.users = await fetchUsersForHealthCheck(databaseHealthCheckService, logError);
    }

    const overallStatus = healthCheckDomainService.determineOverallStatus(
      payload.checks.env.status,
      payload.checks.database?.status
    );
    payload.status = overallStatus;

    log('[Health] Setting response');
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
      body: createErrorResponse(error)
    };
  }
}
