/**
 * @fileoverview RunMigrations - Timer-triggered Azure Function for Prisma database migrations
 * @summary Executes Prisma migrations on schedule and application startup
 * @description Timer-triggered function that runs Prisma migrations using `prisma migrate deploy`.
 * Configured via function.json to execute daily at midnight UTC and on Function App startup.
 * Uses explicit schema path resolution to handle different deployment environments.
 */

import { Context, Timer } from "@azure/functions";
import { exec } from "child_process";
import { promisify } from "util";
import { join, dirname } from "path";
import { existsSync, mkdirSync, cpSync } from "fs";
import { config } from "../shared/config";

const execAsync = promisify(exec);

/**
 * Migration execution timeout in milliseconds (5 minutes)
 */
const MIGRATION_TIMEOUT_MS = 300000;

/**
 * Resolves the absolute path to the Prisma schema file.
 * Attempts multiple path resolution strategies to handle different deployment contexts:
 * - Compiled output locations in Azure Functions
 * - Local development directory structure
 * - Working directory fallbacks
 * 
 * @returns Absolute path to schema.prisma file
 * @throws If schema file cannot be located after all resolution attempts
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
 * Executes Prisma database migrations using the Prisma CLI.
 * 
 * Runs `prisma migrate deploy` which applies pending migrations to the database
 * without generating new migration files. This is the recommended approach for
 * production deployments.
 * 
 * The function:
 * - Resolves the Prisma schema path dynamically
 * - Executes migrations with a 5-minute timeout
 * - Sets DATABASE_URL from application configuration
 * - Logs execution details and results
 * - Re-throws errors to mark function execution as failed
 * 
 * @param ctx - Azure Functions execution context for logging and execution metadata
 * @param PrismaMigrationTrigger - Timer trigger binding containing schedule information
 * @throws {Error} If migration command execution fails or times out
 * 
 * @example
 * Timer configuration in function.json:
 * ```json
 * {
 *   "schedule": "0 0 0 * * *",
 *   "runOnStartup": true
 * }
 * ```
 */
export default async function runMigrations(
  ctx: Context,
  PrismaMigrationTrigger: Timer
): Promise<void> {
  const { migrationCommand, workingDir } = preparePrismaRuntime();
  ctx.log.info(`[RunMigrations] Starting migration with schema at: ${PRISMA_SCHEMA_PATH}`);
  ctx.log.info(`[RunMigrations] Working directory: ${workingDir}`);
  ctx.log.info(`[RunMigrations] Command: ${migrationCommand}`);

  try {
    const schemaDir = dirname(PRISMA_SCHEMA_PATH);
    const prismaEnginesDir = "/tmp/prisma-engines";
    if (!existsSync(prismaEnginesDir)) {
      mkdirSync(prismaEnginesDir, { recursive: true });
    }
    const packagedEnginesDir = join(process.cwd(), "node_modules", "@prisma", "engines");
    if (existsSync(packagedEnginesDir)) {
      cpSync(packagedEnginesDir, prismaEnginesDir, { recursive: true });
    }
    
    ctx.log.info(`[RunMigrations] Node version: ${process.version}`);
    ctx.log.info(`[RunMigrations] Working directory: ${workingDir}`);
    ctx.log.info(`[RunMigrations] Schema directory: ${schemaDir}`);
    
    process.env.PRISMA_ENGINES_TARGET_DIR = prismaEnginesDir;
    process.env.PRISMA_CLI_ALLOW_ENGINE_DOWNLOAD = "1";
    process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL = "1";

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

    ctx.log.info("[RunMigrations] Migration completed successfully");
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

    throw error;
  }
}

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
    migrationCommand: `node "${runtimePrismaBuild}" migrate deploy --schema "${PRISMA_SCHEMA_PATH}"`,
    workingDir: runtimeRoot,
  };
}

