/**
 * @fileoverview RunMigrations - HTTP endpoint for executing database migrations using Prisma
 * @description Executes `prisma db push` in a writable temporary directory to avoid
 * read-only filesystem restrictions in Azure Functions
 * @summary Requires authentication via Azure AD JWT token
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { existsSync, mkdirSync, cpSync } from "fs";
import { withErrorHandler, withAuth, ok, badRequest, config, seedDefaultSnapshotReasons, seedDefaultRolesAndPermissions, ServiceContainer, IErrorLogService, ErrorSource, ErrorSeverity, ApplicationServiceOperationError } from '../../index';

const execAsync = promisify(exec);

const MIGRATION_TIMEOUT_MS = 300000;

/**
 * Gets the absolute path to the schema.prisma file
 * @description Attempts multiple path resolution strategies to handle different
 * deployment contexts (local, Azure Functions, etc.)
 * @returns Absolute path to schema.prisma file
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
 * Executes database migrations and seeding
 * @description Requires valid Azure AD JWT token in Authorization header.
 * Attempts first without data loss, and only uses --force-reset if necessary.
 */
const runMigrationsHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    ctx.log.info("[RunMigrations] Handler execution started");
    ctx.log.verbose("[RunMigrations] __dirname:", __dirname);
    ctx.log.verbose("[RunMigrations] process.cwd():", process.cwd());
    
    try {
      await withAuth(ctx, async () => {
        ctx.log.info("[RunMigrations] Authentication successful");
        
        if (req.method !== "POST") {
          return badRequest(ctx, "Only POST method is allowed");
        }

        const { migrationCommand: baseCommand, workingDir } = preparePrismaRuntime();
        ctx.log.info(`[RunMigrations] Prisma runtime prepared. Working dir: ${workingDir}`);

      try {
        const prismaEnginesDir = "/tmp/prisma-engines";
        
        if (!existsSync(prismaEnginesDir)) {
          mkdirSync(prismaEnginesDir, { recursive: true });
        }
        
        const packagedEnginesDir = join(process.cwd(), "node_modules", "@prisma", "engines");
        if (existsSync(packagedEnginesDir)) {
          cpSync(packagedEnginesDir, prismaEnginesDir, { recursive: true });
        }
        
        /**
         * Configure Prisma engine environment variables for execution
         * These are runtime-specific and must be set in process.env for Prisma CLI
         */
        process.env.PRISMA_ENGINES_TARGET_DIR = prismaEnginesDir;
        process.env.PRISMA_CLI_ALLOW_ENGINE_DOWNLOAD = "1";
        process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL = "1";

        const execOptions = {
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
        } catch (firstAttemptError: any) {
          const errorMessage = firstAttemptError.message || '';
          const errorOutput = (firstAttemptError.stdout || '') + (firstAttemptError.stderr || '');
          
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
          throw new ApplicationServiceOperationError("Migration failed after all attempts");
        }

        try {
          await seedDefaultRolesAndPermissions();
          await seedDefaultSnapshotReasons();
        } catch (seedError: unknown) {
          ctx.log.error(`[RunMigrations] Seeding error: ${seedError instanceof Error ? seedError.message : String(seedError)}`);
          
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
                operation: "seed_roles_permissions_snapshot_reasons",
                migrationCompleted: true,
                errorType: "seed_failure"
              }
            });
          } catch (logError) {
            ctx.log.error(`[RunMigrations] Could not log seeding error: ${logError}`);
          }
        }

        return ok(ctx, {
          success: true,
          message: "Migrations and seeding completed successfully",
          timestamp: new Date().toISOString()
        });

      } catch (error: unknown) {
        ctx.log.error(`[RunMigrations] Migration error: ${error instanceof Error ? error.message : String(error)}`);

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
              workingDir: workingDir,
              stdout: error && typeof error === "object" && "stdout" in error ? String((error as any).stdout) : undefined,
              stderr: error && typeof error === "object" && "stderr" in error ? String((error as any).stderr) : undefined,
              errorType: "migration_failure"
            }
          });
        } catch (logError) {
          ctx.log.error(`[RunMigrations] Could not log error: ${logError}`);
        }

        throw error;
      }
      });
    } catch (outerError: unknown) {
      ctx.log.error(`[RunMigrations] Outer error catch: ${outerError instanceof Error ? outerError.message : String(outerError)}`);
      if (outerError instanceof Error && outerError.stack) {
        ctx.log.error(`[RunMigrations] Stack trace: ${outerError.stack}`);
      }
      throw outerError;
    }
  },
  {
    genericMessage: "Migration execution failed",
    showStackInDev: true,
  }
);

export default runMigrationsHandler;

/**
 * Prepares a writable Prisma runtime environment in `/tmp/prisma-runtime`
 * @description Copies Prisma CLI and `@prisma` packages from read-only deployment
 * directory to a writable temporary directory. This allows executing migrations
 * in Azure Functions where the deployment directory is read-only.
 * @returns Object containing migration command and working directory path
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

  return {
    migrationCommand: `node "${runtimePrismaBuild}" db push --schema "${PRISMA_SCHEMA_PATH}"`,
    workingDir: runtimeRoot,
  };
}

