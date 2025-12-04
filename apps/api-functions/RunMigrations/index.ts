/**
 * @fileoverview HTTP-triggered Azure Function for executing Prisma database schema synchronization.
 * 
 * This function runs Prisma schema synchronization using `prisma db push` in a writable
 * temporary directory to work around Azure Functions' read-only file system restrictions.
 * Can be triggered from CI/CD pipelines when database is in VNet.
 * 
 * SECURITY: This endpoint should be protected with:
 * - Function-level authentication (function key or Azure AD)
 * - IP restrictions in Azure Portal
 * - Only accessible from CI/CD agents or specific IPs
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withAuth } from "../shared/middleware/auth";
import { ok, badRequest } from "../shared/utils/response";
import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { existsSync, mkdirSync, cpSync } from "fs";
import { config } from "../shared/config";
import { seedDefaultSnapshotReasons } from "../shared/infrastructure/seed/defaultSnapshotReasons";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { IErrorLogService } from "../shared/domain/interfaces/IErrorLogService";
import { ErrorSource } from "../shared/domain/enums/ErrorSource";
import { ErrorSeverity } from "../shared/domain/enums/ErrorSeverity";

const execAsync = promisify(exec);

const MIGRATION_TIMEOUT_MS = 300000;

/**
 * Resolves the absolute path to the Prisma schema file.
 * 
 * Attempts multiple path resolution strategies to handle different deployment contexts.
 * 
 * @returns Absolute path to schema.prisma file.
 * @throws {Error} If schema file cannot be located after all resolution attempts.
 */
function getPrismaSchemaPath(): string {
  const currentDir = __dirname;
  
  const possiblePaths = [
    join(currentDir, "..", "prisma", "schema.prisma"),
    join(currentDir, "prisma", "schema.prisma"),
    join(process.cwd(), "prisma", "schema.prisma"),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return join(currentDir, "..", "prisma", "schema.prisma");
}

const PRISMA_SCHEMA_PATH = getPrismaSchemaPath();

/**
 * HTTP POST /api/RunMigrations
 * 
 * Triggers database migrations and seeding from CI/CD pipelines.
 * 
 * Security:
 * - Requires valid Azure AD JWT token in Authorization header (Bearer token)
 * - Token must be issued for the API's client ID
 * - Should be restricted by IP in Azure Portal (optional but recommended)
 * 
 * Usage from CI/CD:
 * ```bash
 * TOKEN=$(az account get-access-token --resource api://<API_CLIENT_ID> --query accessToken -o tsv)
 * curl -X POST \
 *   "https://<function-app>.azurewebsites.net/api/RunMigrations" \
 *   -H "Authorization: Bearer $TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{}'
 * ```
 * 
 * @param ctx - Azure Functions execution context
 * @param req - HTTP request
 */
const runMigrationsHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // Only allow POST requests
      if (req.method !== "POST") {
        return badRequest(ctx, "Only POST method is allowed");
      }

      const { migrationCommand, workingDir } = preparePrismaRuntime();

      try {
        const prismaEnginesDir = "/tmp/prisma-engines";
        
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

        ctx.log.info("[RunMigrations] Starting migration...");

        const { stdout, stderr } = await execAsync(migrationCommand, {
          cwd: workingDir,
          env: {
            ...process.env,
            DATABASE_URL: config.databaseUrl,
            PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
            NODE_PATH: [
              join(workingDir, "node_modules"),
              join(process.cwd(), "node_modules")
            ].join(":"),
            PRISMA_ENGINES_TARGET_DIR: prismaEnginesDir,
          },
          timeout: MIGRATION_TIMEOUT_MS,
        });

        if (stdout) {
          ctx.log.info(`[RunMigrations] ${stdout}`);
        }
        if (stderr) {
          ctx.log.warn(`[RunMigrations] ${stderr}`);
        }

        ctx.log.info(`[RunMigrations] Migration completed successfully`);

        // Run seeding
        try {
          ctx.log.info(`[RunMigrations] Seeding default snapshot reasons...`);
          await seedDefaultSnapshotReasons();
          ctx.log.info(`[RunMigrations] Snapshot reasons seed completed successfully`);
        } catch (seedError: unknown) {
          ctx.log.error(`[RunMigrations] Failed to seed snapshot reasons: ${seedError instanceof Error ? seedError.message : String(seedError)}`);
          if (seedError instanceof Error && seedError.stack) {
            ctx.log.error(`[RunMigrations] Seed error stack: ${seedError.stack}`);
          }
          
          // Log seed error to error table
          try {
            const serviceContainer = ServiceContainer.getInstance();
            serviceContainer.initialize();
            const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
            await errorLogService.logError({
              severity: ErrorSeverity.High,
              source: ErrorSource.Database,
              endpoint: "/api/RunMigrations",
              functionName: "RunMigrations",
              error: seedError instanceof Error ? seedError : new Error(String(seedError)),
              context: {
                operation: "seed_snapshot_reasons",
                migrationCompleted: true,
                errorType: "seed_failure"
              }
            });
            ctx.log.info(`[RunMigrations] Seed error logged to error table`);
          } catch (logError) {
            ctx.log.error(`[RunMigrations] Failed to log seed error to table: ${logError}`);
          }
        }

        return ok(ctx, {
          success: true,
          message: "Migrations and seeding completed successfully",
          timestamp: new Date().toISOString()
        });

      } catch (error: unknown) {
        ctx.log.error(`[RunMigrations] Command failed: ${migrationCommand}`);
        
        if (error instanceof Error) {
          ctx.log.error(`[RunMigrations] ${error.message}`);
          ctx.log.error(`[RunMigrations] Stack: ${error.stack}`);
        } else {
          ctx.log.error(`[RunMigrations] ${String(error)}`);
        }

        if (error && typeof error === "object" && "stdout" in error) {
          ctx.log.error(`[RunMigrations] stdout: ${String((error as any).stdout)}`);
        }
        if (error && typeof error === "object" && "stderr" in error) {
          ctx.log.error(`[RunMigrations] stderr: ${String((error as any).stderr)}`);
        }

        // Log migration error to error table
        try {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();
          const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
          await errorLogService.logError({
            severity: ErrorSeverity.Critical,
            source: ErrorSource.Database,
            endpoint: "/api/RunMigrations",
            functionName: "RunMigrations",
            error: error instanceof Error ? error : new Error(String(error)),
            context: {
              operation: "database_migration",
              migrationCommand: migrationCommand,
              workingDir: workingDir,
              stdout: error && typeof error === "object" && "stdout" in error ? String((error as any).stdout) : undefined,
              stderr: error && typeof error === "object" && "stderr" in error ? String((error as any).stderr) : undefined,
              errorType: "migration_failure"
            }
          });
          ctx.log.info(`[RunMigrations] Migration error logged to error table`);
        } catch (logError) {
          ctx.log.error(`[RunMigrations] Failed to log migration error to table: ${logError}`);
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
 * Prepares a writable Prisma runtime environment in `/tmp/prisma-runtime`.
 * 
 * Copies the Prisma CLI and `@prisma` packages from the read-only deployment
 * directory to a writable temporary directory. This allows Prisma to execute
 * migrations in Azure Functions where the deployment directory is read-only.
 * 
 * @returns Object containing the migration command and working directory path.
 */
function preparePrismaRuntime(): { migrationCommand: string; workingDir: string } {
  const runtimeRoot = "/tmp/prisma-runtime";
  const runtimeNodeModules = join(runtimeRoot, "node_modules");
  const runtimePrismaDir = join(runtimeNodeModules, "prisma");
  const runtimeVendorDir = join(runtimeNodeModules, "@prisma");
  const runtimePrismaBuild = join(runtimePrismaDir, "build", "index.js");

  const sourceNodeModules = join(process.cwd(), "node_modules");
  const sourcePrismaDir = join(sourceNodeModules, "prisma");
  const sourceVendorDir = join(sourceNodeModules, "@prisma");

  if (!existsSync(runtimeRoot)) {
    mkdirSync(runtimeRoot, { recursive: true });
  }

  if (!existsSync(runtimeNodeModules)) {
    mkdirSync(runtimeNodeModules, { recursive: true });
  }

  if (!existsSync(runtimePrismaDir)) {
    mkdirSync(runtimePrismaDir, { recursive: true });
    cpSync(sourcePrismaDir, runtimePrismaDir, { recursive: true });
  }

  if (!existsSync(runtimeVendorDir)) {
    mkdirSync(runtimeVendorDir, { recursive: true });
    cpSync(sourceVendorDir, runtimeVendorDir, { recursive: true });
  }

  // Check if force reset is requested
  const forceReset = process.env.MIGRATION_FORCE_RESET === "true";
  const resetFlag = forceReset ? "--force-reset --accept-data-loss" : "";

  return {
    migrationCommand: `node "${runtimePrismaBuild}" db push --schema "${PRISMA_SCHEMA_PATH}" ${resetFlag}`.trim(),
    workingDir: runtimeRoot,
  };
}

