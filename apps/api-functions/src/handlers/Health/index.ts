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
import { HealthCheckResponse, type HealthCheckUser, type EnvironmentVariableDetails } from '../../domain/types/HealthCheckTypes';
import { config } from '../../config';
import { unknownToString } from '../../utils/stringHelpers';
import { tryExtractCallerId } from '../../utils/authHelpers';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

/**
 * Primeras 13 variables de ambiente que pueden mostrarse completas si es super admin
 * Estas corresponden a las primeras 13 en local.settings.json
 */
const ALLOWED_FULL_VALUE_VARS = new Set([
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'AZURE_TENANT_ID',
  'AzureWebJobsDashboard',
  'AzureWebJobsStorage',
  'AZURE_STORAGE_ACCOUNT',
  'AZURE_STORAGE_KEY',
  'AZURE_STORAGE_CONNECTION_STRING',
  'DATABASE_URL',
  'FUNCTIONS_EXTENSION_VERSION',
  'FUNCTIONS_WORKER_RUNTIME',
  'LIVEKIT_API_KEY',
  'LIVEKIT_API_SECRET'
]);

/**
 * Creates a partial value for sensitive data (shows first half)
 * @param value - Full value to mask
 * @returns Partial value showing first half
 */
function createPartialValue(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '****';
  
  const halfLength = Math.floor(value.length / 2);
  const firstHalf = value.substring(0, halfLength);
  return `${firstHalf}...`;
}

/**
 * Gets all environment variables from process.env
 * @param requestedVar - Optional variable name requested via query param
 * @param isSuperAdmin - Whether the user is a super admin
 * @returns Record of all environment variables with their details
 */
function getAllEnvironmentVariables(
  requestedVar?: string,
  isSuperAdmin: boolean = false
): Record<string, EnvironmentVariableDetails> {
  const allVars: Record<string, EnvironmentVariableDetails> = {};
  
  // Iterate over all environment variables
  for (const [key, value] of Object.entries(process.env)) {
    const exists = value !== undefined && value !== null;
    const isAllowedVar = ALLOWED_FULL_VALUE_VARS.has(key);
    const isRequested = requestedVar && key === requestedVar;
    
    // Determine if we should show full value
    const showFullValue = isSuperAdmin && isRequested && isAllowedVar;
    
    allVars[key] = {
      name: key,
      exists,
      length: value?.length,
      isRequestedVar: isRequested || false,
      ...(showFullValue ? { value } : {}),
      ...(exists && !showFullValue ? { partialValue: createPartialValue(value || '') } : {})
    };
  }
  
  return allVars;
}

/**
 * Parses query parameters from HTTP request
 * @param query - Query parameters object
 * @returns Parsed query parameters
 */
function parseQueryParams(query: Record<string, unknown>): {
  verbose: boolean;
  dbEnabled: boolean;
  includeUsers: boolean;
  envVar?: string;
} {
  const verboseStr = unknownToString(query.verbose, '');
  const dbStr = unknownToString(query.db, 'true');
  const usersStr = unknownToString(query.users, '');
  const envVarStr = unknownToString(query.envVar, '');
  
  return {
    verbose: verboseStr.toLowerCase() === "true",
    dbEnabled: dbStr.toLowerCase() !== "false",
    includeUsers: usersStr.toLowerCase() === "true",
    envVar: envVarStr || undefined,
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
 * Health check endpoint
 * 
 * GET /api/health
 * 
 * Query params:
 * - verbose=true: includes additional diagnostic details (no sensitive values exposed)
 *   - Shows partial Azure Storage variable details (preview, length, base64 validation)
 * - db=false: skips database connectivity test
 * - users=true: includes all users from the database in the response
 * - envVar=VAR_NAME: if user is super admin, returns full value for requested variable (must be one of first 13 env vars)
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
    const { verbose, dbEnabled, includeUsers, envVar } = parseQueryParams(query);

    // Check if user is super admin (safely, may fail if not authenticated)
    let isSuperAdmin = false;
    try {
      const callerId = tryExtractCallerId(ctx);
      if (callerId) {
        const authorizationService = new AuthorizationService(new UserRepository());
        isSuperAdmin = await authorizationService.isSuperAdmin(callerId);
        log(`[Health] User authentication check: isSuperAdmin=${isSuperAdmin}`);
      }
    } catch (err) {
      log('[Health] Could not verify super admin status (may not be authenticated)', err);
      isSuperAdmin = false;
    }

    log('[Health] Initializing services');
    const healthCheckDomainService = new HealthCheckDomainService();
    const storageDetailsService = new StorageDetailsService();
    const databaseHealthCheckService = new DatabaseHealthCheckService();

    log('[Health] Getting storage details');
    const storageDetails = verbose ? storageDetailsService.getStorageDetails() : undefined;

    log('[Health] Validating environment variables');
    const envCheck = healthCheckDomainService.validateEnvironmentVariables(storageDetails);
    
    // Get all environment variables (including Azure auto-created ones)
    log('[Health] Collecting all environment variables');
    const allEnvVars = getAllEnvironmentVariables(envVar, isSuperAdmin);
    envCheck.allEnvironmentVariables = allEnvVars;
    envCheck.requestedVariable = envVar;
    envCheck.isSuperAdmin = isSuperAdmin;
    
    log('[Health] Environment validation complete');

    const payload: HealthCheckResponse = {
      status: HealthStatus.OK,
      timestamp,
      checks: {
        env: envCheck
      }
    };

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
