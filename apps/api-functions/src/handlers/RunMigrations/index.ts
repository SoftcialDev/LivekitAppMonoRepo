/**
 * @fileoverview RunMigrations - HTTP endpoint for executing database migrations using Prisma
 * @summary Executes Prisma migrations and database seeding with authentication
 * @description HTTP-triggered Azure Function that executes `prisma db push` to apply database schema
 * changes. Runs in a writable temporary directory to avoid read-only filesystem restrictions in Azure Functions.
 * Requires authentication via Azure AD JWT token. Attempts migration without data loss first, then
 * retries with --force-reset if necessary. Automatically seeds default roles, permissions, and snapshot reasons.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { exec } from "child_process";
import { promisify } from "util";
import { join, resolve } from "path";
import { existsSync, mkdirSync, cpSync } from "fs";
import { tmpdir } from "os";
import { withErrorHandler } from '../../middleware/errorHandler';
import { withAuth } from '../../middleware/auth';
import { ok, badRequest } from '../../utils/response';
import { config } from '../../config';
import { seedDefaultSnapshotReasons } from '../../infrastructure/seed/defaultSnapshotReasons';
import { seedDefaultRolesAndPermissions } from '../../infrastructure/seed/defaultRolesAndPermissions';
import { ServiceContainer } from '../../infrastructure/container/ServiceContainer';
import { IErrorLogService } from '../../domain/interfaces/IErrorLogService';
import { ErrorSource } from '../../domain/enums/ErrorSource';
import { ErrorSeverity } from '../../domain/enums/ErrorSeverity';
import { ApplicationServiceOperationError } from '../../domain/errors/ApplicationServiceErrors';
import { extractErrorMessage, extractErrorProperty } from '../../utils/error/ErrorHelpers';
import { ApiEndpoints } from '../../domain/constants/ApiEndpoints';
import { FunctionNames } from '../../domain/constants/FunctionNames';

const execAsync = promisify(exec);

const MIGRATION_TIMEOUT_MS = 300000;

/**
 * Resolves the absolute path to the Prisma schema file
 * @description Attempts multiple path resolution strategies to handle different deployment contexts
 * (local development, Azure Functions, etc.). Tries paths relative to current directory, process
 * working directory, and falls back to a default path if none are found.
 * @returns Absolute path to schema.prisma file
 */
function getPrismaSchemaPath(): string {
  const currentDir = __dirname;
  
  const possiblePaths = [
    resolve(currentDir, "..", "prisma", "schema.prisma"),
    resolve(currentDir, "prisma", "schema.prisma"),
    resolve(process.cwd(), "prisma", "schema.prisma"),
    resolve(process.cwd(), "schema.prisma"), // Fallback for -u 1 copy structure
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return resolve(path);
    }
  }

  return resolve(currentDir, "..", "prisma", "schema.prisma");
}

const PRISMA_SCHEMA_PATH = getPrismaSchemaPath();

/**
 * HTTP-triggered Azure Function for executing database migrations
 * 
 * **HTTP POST** `/api/RunMigrations`
 * 
 * **Workflow:**
 * 1. Authenticates caller via `withAuth` middleware
 * 2. Validates HTTP method (POST only)
 * 3. Prepares Prisma runtime environment in temporary directory
 * 4. Copies Prisma engines to writable location
 * 5. Executes `prisma db push` without data loss first
 * 6. Retries with `--force-reset --accept-data-loss` if necessary
 * 7. Seeds default roles, permissions, and snapshot reasons
 * 8. Logs errors to error log table on failure
 * 
 * **Error Handling:**
 * - 400: Invalid HTTP method or missing DATABASE_URL configuration
 * - 401: Unauthorized (missing or invalid JWT token)
 * - 500: Migration or seeding failure (logged to error log table)
 * 
 * @param ctx - Azure Functions execution context
 * @param req - HTTP request object
 * @returns 200 OK with success message and timestamp on success
 * @throws ApplicationServiceOperationError if migration fails
 */
const runMigrationsHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    ctx.log.info("[RunMigrations] Handler execution started");
    ctx.log.verbose("[RunMigrations] __dirname:", __dirname);
    ctx.log.verbose("[RunMigrations] process.cwd():", process.cwd());
    
    await withAuth(ctx, async () => {
      ctx.log.info("[RunMigrations] Authentication successful");
      
      if (req.method !== "POST") {
        return badRequest(ctx, "Only POST method is allowed");
      }

      if (!config.databaseUrl) {
        throw new ApplicationServiceOperationError("DATABASE_URL is not configured");
      }

      const { migrationCommand: baseCommand, workingDir } = preparePrismaRuntime();
      ctx.log.info(`[RunMigrations] Prisma runtime prepared. Working dir: ${workingDir}`);

      try {
        const prismaEnginesDir = join(tmpdir(), "prisma-engines");
        
        if (!existsSync(prismaEnginesDir)) {
          mkdirSync(prismaEnginesDir, { recursive: true });
        }
        
        const packagedEnginesDir = join(process.cwd(), "node_modules", "@prisma", "engines");
        if (existsSync(packagedEnginesDir)) {
          cpSync(packagedEnginesDir, prismaEnginesDir, { recursive: true });
        }
        
        process.env.PRISMA_ENGINES_TARGET_DIR = prismaEnginesDir;
        process.env.PRISMA_CLI_ALLOW_ENGINE_DOWNLOAD = "1";
        process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL = "1";

        const execOptions = {
          cwd: workingDir,
          env: {
            ...process.env,
            PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
            NODE_PATH: [
              join(workingDir, "node_modules"),
              join(process.cwd(), "node_modules")
            ].join(process.platform === "win32" ? ";" : ":"),
            PRISMA_ENGINES_TARGET_DIR: prismaEnginesDir,
          },
          timeout: MIGRATION_TIMEOUT_MS,
        };

        ctx.log.info("[RunMigrations] Starting migration without data loss");
        let migrationCommand = baseCommand.replace(/--force-reset --accept-data-loss/g, '').trim();
        
        let stdout: string = '';
        let stderr: string = '';
        let migrationSucceeded = false;

        try {
          const result = await execAsync(migrationCommand, execOptions);
          stdout = result.stdout || '';
          stderr = result.stderr || '';
          migrationSucceeded = true;
        } catch (firstAttemptError: unknown) {
          const errorMessage = extractErrorMessage(firstAttemptError);
          const errorStdout = String(extractErrorProperty(firstAttemptError, 'stdout') || '');
          const errorStderr = String(extractErrorProperty(firstAttemptError, 'stderr') || '');
          const errorOutput = errorStdout + errorStderr;
          
          const requiresDataLoss = 
            errorMessage.includes('without a default value') ||
            errorMessage.includes('cannot be executed') ||
            errorMessage.includes('it is not possible') ||
            errorOutput.includes('without a default value') ||
            errorOutput.includes('cannot be executed') ||
            errorOutput.includes('it is not possible') ||
            config.migrationForceReset === "true";
          
          if (requiresDataLoss) {
            ctx.log.warn("[RunMigrations] Migration requires data loss, retrying with --force-reset");
            
            migrationCommand = baseCommand;
            if (!migrationCommand.includes('--force-reset')) {
              migrationCommand = migrationCommand + ' --force-reset --accept-data-loss';
            }
            
            const result = await execAsync(migrationCommand, execOptions);
            stdout = result.stdout || '';
            stderr = result.stderr || '';
            migrationSucceeded = true;
          } else {
            throw firstAttemptError;
          }
        }

        if (!migrationSucceeded) {
          throw new ApplicationServiceOperationError(
            `Migration failed after all attempts. Command: ${migrationCommand}. Stdout: ${stdout}. Stderr: ${stderr}`
          );
        }

        try {
          await seedDefaultRolesAndPermissions();
          await seedDefaultSnapshotReasons();
        } catch (seedError: unknown) {
          ctx.log.error(`[RunMigrations] Seeding error: ${extractErrorMessage(seedError)}`);
          
          try {
            const serviceContainer = ServiceContainer.getInstance();
            serviceContainer.initialize();
            const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
            await errorLogService.logError({
              severity: ErrorSeverity.High,
              source: ErrorSource.Database,
              endpoint: ApiEndpoints.RUN_MIGRATIONS,
              functionName: FunctionNames.RUN_MIGRATIONS,
              error: seedError instanceof Error ? seedError : new Error(String(seedError)),
              context: {
                operation: "seed_roles_permissions_snapshot_reasons",
                migrationCompleted: true,
                errorType: "seed_failure"
              }
            });
          } catch (logError) {
            ctx.log.error(`[RunMigrations] Could not log seeding error: ${extractErrorMessage(logError)}`);
          }
        }

        return ok(ctx, {
          success: true,
          message: "Migrations and seeding completed successfully",
          timestamp: new Date().toISOString()
        });

      } catch (error: unknown) {
        ctx.log.error(`[RunMigrations] Migration error: ${extractErrorMessage(error)}`);

        try {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();
          const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
          await errorLogService.logError({
            severity: ErrorSeverity.Critical,
            source: ErrorSource.Database,
            endpoint: ApiEndpoints.RUN_MIGRATIONS,
            functionName: FunctionNames.RUN_MIGRATIONS,
            error: error instanceof Error ? error : new Error(String(error)),
            context: {
              operation: "database_migration",
              workingDir: workingDir,
              stdout: error && typeof error === "object" && "stdout" in error ? String((error as { stdout?: unknown }).stdout) : undefined,
              stderr: error && typeof error === "object" && "stderr" in error ? String((error as { stderr?: unknown }).stderr) : undefined,
              errorType: "migration_failure"
            }
          });
        } catch (logError) {
          ctx.log.error(`[RunMigrations] Could not log error: ${extractErrorMessage(logError)}`);
        }

        throw error;
      }
    });
  },
  {
    genericMessage: "Migration execution failed",
    showStackInDev: true,
  }
);

export default runMigrationsHandler;

/**
 * Prepares Prisma CLI command and working directory for migration execution
 * @description Locates Prisma CLI in node_modules and constructs the migration command with
 * schema path and database URL. Creates a writable temporary directory for Prisma to use
 * for working files. Uses the same approach as endpoints: passes config.databaseUrl directly
 * via --url parameter instead of relying on environment variables or schema configuration.
 * @returns Object containing the migration command string and working directory path
 * @throws ApplicationServiceOperationError if node_modules or Prisma CLI cannot be found
 */
function preparePrismaRuntime(): { migrationCommand: string; workingDir: string } {
  const runtimeRoot = join(tmpdir(), "prisma-runtime");
  
  const currentDir = __dirname;
  const possibleNodeModulesPaths = [
    join(process.cwd(), "node_modules"),
    join(currentDir, "..", "..", "node_modules"),
    join(currentDir, "..", "node_modules"),
  ];

  let sourceNodeModules: string | null = null;
  for (const path of possibleNodeModulesPaths) {
    if (existsSync(path)) {
      sourceNodeModules = path;
      break;
    }
  }

  if (!sourceNodeModules) {
    throw new ApplicationServiceOperationError(
      `Could not find node_modules directory. Tried: ${possibleNodeModulesPaths.join(", ")}`
    );
  }

  const sourcePrismaBin = join(sourceNodeModules, "prisma", "build", "index.js");
  
  if (!existsSync(sourcePrismaBin)) {
    throw new ApplicationServiceOperationError(
      `Prisma CLI not found at ${sourcePrismaBin}. Make sure Prisma is installed.`
    );
  }

  if (!existsSync(runtimeRoot)) {
    mkdirSync(runtimeRoot, { recursive: true });
  }

  const absoluteSchemaPath = resolve(PRISMA_SCHEMA_PATH);
  
  if (!existsSync(absoluteSchemaPath)) {
    throw new ApplicationServiceOperationError(
      `Prisma schema not found at ${absoluteSchemaPath}`
    );
  }

  const escapedUrl = config.databaseUrl.replace(/"/g, '\\"');
  return {
    migrationCommand: `node "${sourcePrismaBin}" db push --schema "${absoluteSchemaPath}" --url "${escapedUrl}"`,
    workingDir: runtimeRoot,
  };
}
